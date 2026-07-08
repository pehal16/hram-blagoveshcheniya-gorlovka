# Deploy endpoint for note notifications

The site is ready to send paid-claimed notes to a backend endpoint. The Vercel-compatible wrapper is:

`api/notify.js`

It calls the shared notification function from:

`server/yandex-notify`

## Required runtime environment variables

```text
TELEGRAM_BOT_TOKEN=<bot token from BotFather>
TELEGRAM_CHAT_ID=-5589930019
SEND_FULL_TO_TELEGRAM=true
SEND_FULL_TO_VK=false
ALLOWED_ORIGIN=https://pehal16.github.io,https://site-livid-mu-36.vercel.app,http://127.0.0.1:5173,http://localhost:5173
DRY_RUN=false
```

Optional email/VK variables can be added later from `server/yandex-notify/.env.example`.

## Vercel route

After deploying to Vercel, the endpoint is:

```text
https://<vercel-domain>/api/notify
```

Then add this repository variable in GitHub:

```powershell
gh variable set VITE_ORDER_ENDPOINT --repo pehal16/hram-blagoveshcheniya-gorlovka --body "https://<vercel-domain>/api/notify"
```

Push or rerun GitHub Pages after setting the variable.

For local Vite testing, keep this non-secret file:

```text
.env.local
VITE_ORDER_ENDPOINT=https://site-livid-mu-36.vercel.app/api/notify
```

Restart `npm run dev` after creating or changing `.env.local`, because Vite reads env variables when the dev server starts.

## Notes

Do not commit `TELEGRAM_BOT_TOKEN` to Git. Store it only in the hosting provider environment variables.

The current SBP QR payment is manually checked. The frontend sends the note after the visitor marks payment as completed.
