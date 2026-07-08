# Project context: Church site

This file is the durable context for future Codex sessions. Read it before changing the site.

## Current state

- Site folder: `C:\Users\АМ\Documents\Сайт Церкви\site`
- Stack: React + Vite + TypeScript + lucide-react.
- Hosting preview: GitHub Pages.
- Repository: `https://github.com/pehal16/hram-blagoveshcheniya-gorlovka`
- Live preview: `https://pehal16.github.io/hram-blagoveshcheniya-gorlovka/`
- Vite uses `base: './'` so assets work on GitHub Pages subpaths.
- The current design is the modern calm redesign, not the first rough version.

## Product brief

The site is for `ХРАМ БЛАГОВЕЩЕНИЯ ПРЕСВЯТОЙ БОГОРОДИЦЫ` with the subtitle `в Горловке`.

Main actions:

- `Подать записку`
- `Пожертвовать`

The site should feel Orthodox, warm, restrained, modern, and trustworthy. Avoid loud landing-page behavior, decorative clutter, and aggressive sales language.

## Visual source

- Original icon screenshot: `C:\Users\АМ\Downloads\Telegram Desktop\IMG_9451.PNG`
- Cropped web asset: `public/annunciation.png`
- Header identity uses the Annunciation icon and blue church styling.

## Notes pricing and rules

- Liturgy: health/repose, 350 RUB per sheet up to 10 names.
- Thanksgiving moleben: one sheet, 300 RUB per sheet up to 10 names. It is served every Sunday.
- Sorokoust: health/repose, 650 RUB per name.
- Panikhida: one sheet, 300 RUB per sheet up to 10 names.

Rules to preserve in UX:

- Names must be in genitive case.
- Use church names received in Baptism.
- No surnames, patronymics, titles, or comments.
- One name per line.
- The minimum payment is calculated automatically.
- A visitor may pay more, but not less than the calculated minimum.

## Donations

- Quick amounts: 100, 300, 500, 1000 RUB.
- Custom amount is allowed.
- Donation CTA text: `Пожертвовать`.
- Keep the flow simple and avoid requiring email unless needed for a payment provider or receipt.

## Payments plan

Robokassa is postponed. The current launch path uses the provided SBP QR link.

Current payment option:

- User-provided SBP QR link: `https://qr.nspk.ru/BS1A0047BC591PLI8SR9GDOSN5OGQ77S`
- Local QR asset: `public/sbp-qr.svg`
- Payment is checked manually.

Notification plan:

- Frontend posts orders to `VITE_ORDER_ENDPOINT`.
- Backend template lives in `server/yandex-notify`.
- Full note text goes to email by default.
- Telegram can receive full note text in the closed responsible group with `SEND_FULL_TO_TELEGRAM=true`.
- VK receives a short notification by default unless `SEND_FULL_TO_VK=true`.
- Public Telegram contact shown on the site: `https://t.me/BlagoVhram`.
- This public Telegram link is not enough for notification delivery; Telegram notifications still need `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- With the current SBP QR link, bank payment confirmation is manual. The frontend sends a note after the visitor marks payment as completed.
- Vercel-compatible endpoint wrapper: `api/notify.js`, backed by `server/yandex-notify`.

If Robokassa is resumed later, review:

- `C:\Users\АМ\Documents\Сайт Церкви\ROBOKASSA_интеграция.md`
- Merchant account data.
- ResultURL, SuccessURL, FailURL.
- Signature passwords.
- Fiscalization and receipt requirements.

## Development workflow

Use this folder for code changes:

`C:\Users\АМ\Documents\Сайт Церкви\site`

Common commands:

```powershell
npm run lint
npm run build
npm run dev
```

Before finalizing deployable changes:

1. Check `git status`.
2. Run lint and build.
3. Verify the page visually with Playwright or the in-app browser.
4. Commit and push.
5. Watch GitHub Actions and test the live preview.

## Do not lose

- `public/annunciation.png`
- `src/App.tsx`
- `src/App.css`
- `.github/workflows/pages.yml`
- `vite.config.ts` with `base: './'`

Do not replace the site with a fresh template. Continue from the current implementation.
