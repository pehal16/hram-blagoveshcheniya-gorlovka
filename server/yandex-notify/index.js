const nodemailer = require('nodemailer')

const VK_API_VERSION = process.env.VK_API_VERSION || '5.199'

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
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

  if (flow === 'donation') {
    const donorName = cleanText(payload.donorName, 100) || 'не указано'
    const full = [
      `Пожертвование ${orderId}`,
      '',
      'Статус: ожидает оплаты по СБП',
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
      messenger: full,
    }
  }

  const names = normalizeNames(payload.names)
  const serviceTitle = cleanText(payload.serviceTitle, 120)
  const noteKind = cleanText(payload.noteKind, 60)
  const giverName = cleanText(payload.giverName, 100)
  const contact = cleanText(payload.contact, 140) || 'не указан'
  const minimumAmount = cleanAmount(payload.minimumAmount)
  const namesBlock = names.map((name) => `- ${name}`).join('\n')

  const full = [
    `Записка ${orderId}`,
    '',
    'Статус: ожидает оплаты по СБП',
    `Вид: ${serviceTitle}`,
    `Тип: ${noteKind}`,
    `Имен: ${names.length}`,
    `Минимальное пожертвование: ${minimumAmount} руб.`,
    `Указанная сумма: ${amount} руб.`,
    `Подающий: ${giverName}`,
    `Контакт: ${contact}`,
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
    'Статус: ожидает оплаты',
    'Полный текст записки отправлен на почту.',
  ].join('\n')

  return {
    subject: `Записка ${orderId}`,
    full,
    messenger: process.env.SEND_FULL_TO_MESSENGERS === 'true' ? full : summary,
  }
}

async function sendEmail(subject, message) {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO']
  const hasConfig = required.every((key) => process.env[key])

  if (!hasConfig) {
    return { channel: 'email', skipped: true }
  }

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
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return { channel: 'telegram', skipped: true }
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Telegram failed with ${response.status}`)
  }

  return { channel: 'telegram', skipped: false }
}

async function sendVk(message) {
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

module.exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {})
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  let payload

  try {
    payload = parseBody(event)
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' })
  }

  if (payload.website) {
    return json(200, { ok: true, ignored: true })
  }

  const validation = validatePayload(payload)

  if (!validation.ok) {
    return json(400, { ok: false, error: validation.error })
  }

  const messages = formatMessages(payload)
  const jobs = [
    sendEmail(messages.subject, messages.full),
    sendTelegram(messages.messenger),
    sendVk(messages.messenger),
  ]

  const settled = await Promise.allSettled(jobs)
  const results = settled.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : { channel: 'unknown', skipped: false, error: result.reason.message },
  )
  const delivered = results.filter((result) => !result.skipped && !result.error)

  if (!delivered.length) {
    return json(502, {
      ok: false,
      error: 'No notification channel delivered the message',
      results,
    })
  }

  return json(200, {
    ok: true,
    delivered: delivered.map((result) => result.channel),
    results,
  })
}
