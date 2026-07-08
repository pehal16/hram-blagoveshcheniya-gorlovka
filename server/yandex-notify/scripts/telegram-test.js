const token = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID

if (!token || !chatId) {
  console.error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID first.')
  process.exit(1)
}

async function main() {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: 'Тестовое сообщение с сайта храма. Если вы видите его, Telegram-бот настроен.',
      disable_web_page_preview: true,
    }),
  })
  const data = await response.json()

  if (!data.ok) {
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('Telegram test message sent.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
