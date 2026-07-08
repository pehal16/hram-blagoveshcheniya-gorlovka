const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.error('Set TELEGRAM_BOT_TOKEN first.')
  process.exit(1)
}

async function main() {
  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
  const data = await response.json()

  if (!data.ok) {
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  const chats = new Map()

  for (const update of data.result) {
    const message = update.message || update.channel_post || update.edited_message
    const chat = message?.chat

    if (!chat?.id) {
      continue
    }

    chats.set(chat.id, {
      id: chat.id,
      type: chat.type,
      title: chat.title || chat.username || `${chat.first_name || ''} ${chat.last_name || ''}`.trim(),
    })
  }

  if (!chats.size) {
    console.log('No chats found. Add the bot to the group and send any message there, then run again.')
    return
  }

  console.log('Found Telegram chats:')
  for (const chat of chats.values()) {
    console.log(`${chat.id}\t${chat.type}\t${chat.title || '(without title)'}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
