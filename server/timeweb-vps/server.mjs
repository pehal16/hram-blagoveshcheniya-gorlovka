import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

const port = Number(process.env.PORT || 8080)
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist')
const maxBodyBytes = 256 * 1024
const rateLimitWindowMs = 15 * 60 * 1000
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 20)
const rateLimits = new Map()

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function cleanText(value, maxLength = 500) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function cleanAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 && amount <= 1_000_000
    ? Math.round(amount)
    : 0
}

function normalizeNames(value) {
  if (!Array.isArray(value)) return []
  return value.map((name) => cleanText(name, 80)).filter(Boolean).slice(0, 200)
}

function allowedOrigins() {
  return String(process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function isOriginAllowed(origin) {
  const allowed = allowedOrigins()
  return !origin || allowed.length === 0 || allowed.includes(origin)
}

function setSecurityHeaders(response) {
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'SAMEORIGIN')
}

function sendJson(response, statusCode, payload, origin = '') {
  setSecurityHeaders(response)
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  if (origin && isOriginAllowed(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
  }
  response.end(JSON.stringify(payload))
}

function clientAddress(request) {
  const forwarded = cleanText(request.headers['x-forwarded-for'], 200)
  return forwarded.split(',')[0]?.trim() || request.socket.remoteAddress || 'unknown'
}

function exceedsRateLimit(request) {
  const now = Date.now()
  const address = clientAddress(request)
  const current = rateLimits.get(address)

  if (!current || current.resetAt <= now) {
    rateLimits.set(address, { count: 1, resetAt: now + rateLimitWindowMs })
    return false
  }

  current.count += 1
  return current.count > rateLimitMax
}

async function readJson(request) {
  let size = 0
  const chunks = []

  for await (const chunk of request) {
    size += chunk.length
    if (size > maxBodyBytes) throw new Error('PAYLOAD_TOO_LARGE')
    chunks.push(chunk)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function validatePayload(payload) {
  const flow = cleanText(payload.flow, 20)
  const orderId = cleanText(payload.orderId, 40)
  const amount = cleanAmount(payload.amount)

  if (!orderId || !amount || !['note', 'donation'].includes(flow)) {
    return { ok: false, error: 'Некорректные данные заявки' }
  }

  if (flow === 'note') {
    if (!normalizeNames(payload.names).length || !cleanText(payload.giverName, 100)) {
      return { ok: false, error: 'Не заполнены обязательные поля записки' }
    }
  }

  return { ok: true }
}

function paymentStatus(payload) {
  return payload.status === 'paid_claimed' || payload.paymentClaimed === true
    ? 'Посетитель отметил оплату по СБП. Поступление необходимо проверить вручную.'
    : 'Ожидает оплаты по СБП.'
}

function formatMessage(payload) {
  const orderId = cleanText(payload.orderId, 40)
  const amount = cleanAmount(payload.amount)
  const sourceUrl = cleanText(payload.sourceUrl, 300)
  const paymentUrl = cleanText(payload.paymentUrl, 300)

  if (payload.flow === 'donation') {
    const donorName = cleanText(payload.donorName, 100) || 'не указано'
    const full = [
      `Пожертвование ${orderId}`,
      '',
      `Статус: ${paymentStatus(payload)}`,
      `Сумма: ${amount} руб.`,
      `Имя жертвователя: ${donorName}`,
      sourceUrl ? `Страница: ${sourceUrl}` : '',
      paymentUrl ? `Оплата: ${paymentUrl}` : '',
    ].filter(Boolean).join('\n')
    return { subject: `Пожертвование ${orderId}`, full }
  }

  const names = normalizeNames(payload.names)
  const namesBlock = names.map((name) => `- ${name}`).join('\n')
  const full = [
    `Записка ${orderId}`,
    '',
    `Статус: ${paymentStatus(payload)}`,
    `Вид: ${cleanText(payload.serviceTitle, 120)}`,
    `Тип: ${cleanText(payload.noteKind, 60)}`,
    `Имен: ${names.length}`,
    `Минимальное пожертвование: ${cleanAmount(payload.minimumAmount)} руб.`,
    `Указанная сумма: ${amount} руб.`,
    `Подающий: ${cleanText(payload.giverName, 100)}`,
    `Контакт: ${cleanText(payload.contact, 140) || 'не указан'}`,
    cleanText(payload.paymentClaimedAt, 80)
      ? `Отметка оплаты: ${cleanText(payload.paymentClaimedAt, 80)}`
      : '',
    '',
    'Имена:',
    namesBlock,
    '',
    sourceUrl ? `Страница: ${sourceUrl}` : '',
    paymentUrl ? `Оплата: ${paymentUrl}` : '',
  ].filter(Boolean).join('\n')

  return { subject: `Записка ${orderId}`, full }
}

function splitTelegramMessage(message, maxLength = 3900) {
  if (message.length <= maxLength) return [message]

  const parts = []
  let current = ''
  for (const line of message.split('\n')) {
    const next = current ? `${current}\n${line}` : line
    if (next.length > maxLength && current) {
      parts.push(current)
      current = line
    } else {
      current = next
    }
  }
  if (current) parts.push(current)
  return parts
}

async function sendTelegram(message) {
  if (process.env.DRY_RUN === 'true') {
    return { channel: 'telegram', skipped: false, dryRun: true }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return { channel: 'telegram', skipped: true }

  const parts = splitTelegramMessage(message)
  for (const [index, part] of parts.entries()) {
    const text = parts.length > 1 ? `${part}\n\nЧасть ${index + 1}/${parts.length}` : part
    const result = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    })
    if (!result.ok) throw new Error(`Telegram returned ${result.status}`)
  }

  return { channel: 'telegram', skipped: false }
}

async function sendEmail(subject, message) {
  if (process.env.DRY_RUN === 'true') {
    return { channel: 'email', skipped: false, dryRun: true }
  }

  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO']
  if (!required.every((key) => process.env[key])) {
    return { channel: 'email', skipped: true }
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: process.env.MAIL_TO,
    subject,
    text: message,
  })

  return { channel: 'email', skipped: false }
}

async function deliver(channel, operation) {
  try {
    return await operation()
  } catch (error) {
    console.error(`${channel} delivery failed`, error instanceof Error ? error.message : error)
    return { channel, skipped: false, error: 'Ошибка доставки' }
  }
}

async function handleNotify(request, response) {
  const origin = cleanText(request.headers.origin, 300)
  if (!isOriginAllowed(origin)) return sendJson(response, 403, { ok: false, error: 'Origin запрещен' }, origin)

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (origin) response.setHeader('Access-Control-Allow-Origin', origin)
    return response.end()
  }

  if (request.method !== 'POST') return sendJson(response, 405, { ok: false, error: 'Метод запрещен' }, origin)
  if (exceedsRateLimit(request)) return sendJson(response, 429, { ok: false, error: 'Слишком много запросов' }, origin)

  let payload
  try {
    payload = await readJson(request)
  } catch (error) {
    const status = error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400
    return sendJson(response, status, { ok: false, error: 'Некорректный JSON' }, origin)
  }

  if (payload.website) return sendJson(response, 200, { ok: true, ignored: true }, origin)

  const validation = validatePayload(payload)
  if (!validation.ok) return sendJson(response, 400, validation, origin)

  const message = formatMessage(payload)
  const results = await Promise.all([
    deliver('telegram', () => sendTelegram(message.full)),
    deliver('email', () => sendEmail(message.subject, message.full)),
  ])
  const delivered = results.filter((result) => !result.skipped && !result.error)

  if (!delivered.length) {
    return sendJson(response, 502, { ok: false, error: 'Каналы уведомлений не настроены' }, origin)
  }

  return sendJson(response, 200, {
    ok: true,
    delivered: delivered.map((result) => result.channel),
  }, origin)
}

async function serveStatic(request, response) {
  const url = new URL(request.url || '/', 'http://localhost')
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/') pathname = '/index.html'

  let filePath = path.resolve(distDir, `.${pathname}`)
  if (!filePath.startsWith(`${distDir}${path.sep}`)) {
    response.statusCode = 403
    return response.end('Forbidden')
  }

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) throw new Error('NOT_FILE')
  } catch {
    filePath = path.join(distDir, 'index.html')
  }

  setSecurityHeaders(response)
  const extension = path.extname(filePath).toLowerCase()
  response.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream')
  response.setHeader(
    'Cache-Control',
    filePath.endsWith('index.html')
      ? 'no-cache'
      : filePath.includes(`${path.sep}assets${path.sep}`)
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
  )
  createReadStream(filePath).pipe(response)
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname
    if (pathname === '/health') return sendJson(response, 200, { ok: true })
    if (pathname === '/api/notify') return await handleNotify(request, response)
    if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
      return sendJson(response, 405, { ok: false, error: 'Метод запрещен' })
    }
    return await serveStatic(request, response)
  } catch (error) {
    console.error('Request failed', error instanceof Error ? error.message : error)
    return sendJson(response, 500, { ok: false, error: 'Внутренняя ошибка' })
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Church site is listening on port ${port}`)
})
