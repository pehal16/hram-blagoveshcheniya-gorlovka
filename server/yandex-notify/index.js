const VK_API_VERSION = process.env.VK_API_VERSION || '5.199'

function envFlag(name) {
  return process.env[name] === 'true'
}

function getHeader(event, name) {
  const headers = event.headers || {}
  const lowerName = name.toLowerCase()
  const match = Object.keys(headers).find((key) => key.toLowerCase() === lowerName)

  return match ? headers[match] : ''
}

function getMethod(event) {
  return event.httpMethod || event.requestContext?.http?.method || 'GET'
}

function getAllowedOrigins() {
  return String(process.env.ALLOWED_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function isOriginAllowed(origin) {
  const allowedOrigins = getAllowedOrigins()

  if (!origin || allowedOrigins.includes('*')) {
    return true
  }

  return allowedOrigins.includes(origin)
}

function getCorsOrigin(origin) {
  const allowedOrigins = getAllowedOrigins()

  if (origin && allowedOrigins.includes(origin)) {
    return origin
  }

  return allowedOrigins[0] || '*'
}

function json(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': getCorsOrigin(origin),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    },
    body: JSON.stringify(body),
  }
}

function parseBody(event) {
  if (!event.body) {
    return {}
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body

  return JSON.parse(rawBody)
}

function cleanText(value, maxLength = 500) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function cleanAmount(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
    return 0
  }

  return Math.round(amount)
}

function normalizeNames(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((name) => cleanText(name, 80)).filter(Boolean).slice(0, 200)
}

function formatPaymentStatus(payload) {
  const status = cleanText(payload.status, 40)

  if (status === 'paid_claimed' || payload.paymentClaimed === true) {
    return 'Посетитель отметил оплату по СБП. Проверьте поступление на счете вручную.'
  }

  return 'Ожидает оплаты по СБП'
}

function validatePayload(payload) {
  const flow = cleanText(payload.flow, 20)
  const orderId = cleanText(payload.orderId, 40)
  const amount = cleanAmount(payload.amount)

  if (!orderId || !amount || (flow !== 'note' && flow !== 'donation')) {
    return { ok: false, error: 'Invalid order payload' }
  }

  if (flow === 'note') {
    const names = normalizeNames(payload.names)
    const giverName = cleanText(payload.giverName, 100)

    if (!names.length || !giverName) {
      return { ok: false, error: 'Invalid note payload' }
    }
  }

  return { ok: true }
}

function formatMessages(payload) {
  const flow = cleanText(payload.flow, 20)
  const orderId = cleanText(payload.orderId, 40)
  const amount = cleanAmount(payload.amount)
  const sourceUrl = cleanText(payload.sourceUrl, 300)
  const paymentUrl = cleanText(payload.paymentUrl, 300)
  const paymentStatus = formatPaymentStatus(payload)

  if (flow === 'donation') {
    const donorName = cleanText(payload.donorName, 100) || 'не указано'
    const full = [
      `Пожертвование ${orderId}`,
      '',
      `Статус: ${paymentStatus}`,
      `Сумма: ${amount} руб.`,
      `Имя жертвователя: ${donorName}`,
      sourceUrl ? `Страница: ${sourceUrl}` : '',
      paymentUrl ? `Оплата: ${paymentUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    return {
      subject: `Пожертвование ${orderId}`,
      full,
      telegram: full,
      vk: full,
    }
  }

  const names = normalizeNames(payload.names)
  const serviceTitle = cleanText(payload.serviceTitle, 120)
  const noteKind = cleanText(payload.noteKind, 60)
  const giverName = cleanText(payload.giverName, 100)
  const contact = cleanText(payload.contact, 140) || 'не указан'
  const minimumAmount = cleanAmount(payload.minimumAmount)
  const paymentClaimedAt = cleanText(payload.paymentClaimedAt, 80)
  const namesBlock = names.map((name) => `- ${name}`).join('\n')

  const full = [
    `Записка ${orderId}`,
    '',
    `Статус: ${paymentStatus}`,
    `Вид: ${serviceTitle}`,
    `Тип: ${noteKind}`,
    `Имен: ${names.length}`,
    `Минимальное пожертвование: ${minimumAmount} руб.`,
    `Указанная сумма: ${amount} руб.`,
    `Подающий: ${giverName}`,
    `Контакт: ${contact}`,
    paymentClaimedAt ? `Отметка оплаты: ${paymentClaimedAt}` : '',
    '',
    'Имена:',
    namesBlock,
    '',
    sourceUrl ? `Страница: ${sourceUrl}` : '',
    paymentUrl ? `Оплата: ${paymentUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const summary = [
    `Новая записка ${orderId}`,
    `${serviceTitle}, ${noteKind}`,
    `Имен: ${names.length}`,
    `Сумма: ${amount} руб.`,
    `Статус: ${paymentStatus}`,
    'Полный текст записки отправлен на почту.',
  ].join('\n')

  return {
    subject: `Записка ${orderId}`,
    full,
    telegram: envFlag('SEND_FULL_TO_TELEGRAM') || envFlag('SEND_FULL_TO_MESSENGERS') ? full : summary,
    vk: envFlag('SEND_FULL_TO_VK') || envFlag('SEND_FULL_TO_MESSENGERS') ? full : summary,
  }
}

function splitLongMessage(message, maxLength = 3900) {
  if (message.length <= maxLength) {
    return [message]
  }

  const chunks = []
  const lines = message.split('\n')
  let current = ''

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line

    if (next.length > maxLength) {
      if (current) {
        chunks.push(current)
      }
      current = line
    } else {
      current = next
    }
  }

  if (current) {
    chunks.push(current)
  }

  return chunks
}

async function sendEmail(subject, message) {
  if (process.env.DRY_RUN === 'true') {
    return { channel: 'email', skipped: false, dryRun: true }
  }

  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO']
  const hasConfig = required.every((key) => process.env[key])

  if (!hasConfig) {
    return { channel: 'email', skipped: true }
  }

  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: process.env.MAIL_TO,
    subject,
    text: message,
  })

  return { channel: 'email', skipped: false }
}

async function sendTelegram(message) {
  if (process.env.DRY_RUN === 'true') {
    return { channel: 'telegram', skipped: false, dryRun: true }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return { channel: 'telegram', skipped: true }
  }

  const parts = splitLongMessage(message)

  for (const [index, part] of parts.entries()) {
    const text = parts.length > 1 ? `${part}\n\nЧасть ${index + 1}/${parts.length}` : part
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram failed with ${response.status}`)
    }
  }

  return { channel: 'telegram', skipped: false, parts: parts.length }
}

async function sendVk(message) {
  if (process.env.DRY_RUN === 'true') {
    return { channel: 'vk', skipped: false, dryRun: true }
  }

  const token = process.env.VK_GROUP_TOKEN
  const peerId = process.env.VK_PEER_ID

  if (!token || !peerId) {
    return { channel: 'vk', skipped: true }
  }

  const params = new URLSearchParams({
    access_token: token,
    v: VK_API_VERSION,
    peer_id: peerId,
    random_id: String(Date.now()),
    message,
  })

  const response = await fetch('https://api.vk.com/method/messages.send', {
    method: 'POST',
    body: params,
  })
  const data = await response.json()

  if (data.error) {
    throw new Error(`VK failed: ${data.error.error_msg}`)
  }

  return { channel: 'vk', skipped: false }
}

async function runChannel(channel, task) {
  try {
    return await task()
  } catch (error) {
    return {
      channel,
      skipped: false,
      error: error instanceof Error ? error.message : 'Unknown channel error',
    }
  }
}

module.exports.handler = async function handler(event) {
  const origin = getHeader(event, 'origin')
  const method = getMethod(event)

  if (!isOriginAllowed(origin)) {
    return json(403, { ok: false, error: 'Origin is not allowed' }, origin)
  }

  if (method === 'OPTIONS') {
    return json(204, {}, origin)
  }

  if (method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' }, origin)
  }

  let payload

  try {
    payload = parseBody(event)
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' }, origin)
  }

  if (payload.website) {
    return json(200, { ok: true, ignored: true }, origin)
  }

  const validation = validatePayload(payload)

  if (!validation.ok) {
    return json(400, { ok: false, error: validation.error }, origin)
  }

  const messages = formatMessages(payload)
  const jobs = [
    runChannel('email', () => sendEmail(messages.subject, messages.full)),
    runChannel('telegram', () => sendTelegram(messages.telegram)),
    runChannel('vk', () => sendVk(messages.vk)),
  ]

  const results = await Promise.all(jobs)
  const delivered = results.filter((result) => !result.skipped && !result.error)

  if (!delivered.length) {
    return json(502, {
      ok: false,
      error: 'No notification channel delivered the message',
      results,
    }, origin)
  }

  return json(200, {
    ok: true,
    delivered: delivered.map((result) => result.channel),
    results,
  }, origin)
}
