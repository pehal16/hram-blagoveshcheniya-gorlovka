# Project context: Church site

This file is the durable context for future Codex sessions. Read it before changing the site.

## Current state

- Site folder: `C:\Users\АМ\Documents\Сайт Церкви\site`
- Stack: React + Vite + TypeScript + lucide-react.
- Hosting preview: GitHub Pages.
- Target launch hosting: a new, separate Timeweb service dedicated only to the church site, serving the frontend and `/api/notify` from one origin. Never use any pre-existing server or application in the account.
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
- Current production notification endpoint: `https://site-livid-mu-36.vercel.app/api/notify`.
- GitHub Pages uses the repository variable `VITE_ORDER_ENDPOINT=https://site-livid-mu-36.vercel.app/api/notify`.
- Local Vite testing uses ignored `.env.local` with the same `VITE_ORDER_ENDPOINT`; restart `npm run dev` after changing it.
- Backend templates live in `server/timeweb-notify` for the RF PHP route and `server/yandex-notify` for the older Yandex/Vercel-compatible route.
- Full note text goes to email by default.
- Telegram can receive full note text in the closed responsible group with `SEND_FULL_TO_TELEGRAM=true`.
- VK is not required for the current launch. Telegram + email are enough.
- Public Telegram contact shown on the site: `https://t.me/BlagoVhram`.
- Public Rutube contact shown on the site: `https://rutube.ru/channel/76042079/`.
- Public MAX chat shown on the site: `https://max.ru/join/yIcHJONjEc1WNkPHuV8VyW0LTcyRKoS82R6BjwyvDD4`.
- Public phone shown on the site: `+7 949 469 5683`.
- Public address shown on the site: `г. Горловка, ж/м «Строитель», ул. Ленина, 190`.
- This public Telegram link is not enough for notification delivery; Telegram notifications still need `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- Service Telegram bot: `@BlagoVhramBot`.
- Closed Telegram group for note delivery: `Записки храма`, `TELEGRAM_CHAT_ID=-5589930019`.
- With the current SBP QR link, bank payment confirmation is manual. The frontend sends a note after the visitor marks payment as completed.
- Vercel-compatible endpoint wrapper: `api/notify.js`, backed by `server/yandex-notify`.
- Vercel `ALLOWED_ORIGIN` must include the public GitHub Pages origin plus local testing origins `http://127.0.0.1:5173` and `http://localhost:5173`.
- Verified on 2026-07-08: the live GitHub Pages form and the local Vite form send notes to Vercel, Vercel returns `200`, and Telegram receives the test notes.
- Requisites added on 2026-07-09 from `Карточка организации.pdf` and `Выписка по счёту.pdf`: INN `9312001415`, KPP `931201001`, OGRNIP `1229300023127`, account `40703 810 6 0930 0008066`, bank `ПАО "Банк ПСБ" г. Ярославль`, BIK `044525555`, correspondent account `30101 810 4 0000 0000555`, legal address `284637, Россия, ДНР, г. Горловка, пр-кт Ленина, д. 190`.
- Current deployment candidate: `Dockerfile.timeweb` + `docker-compose.timeweb.yml` + `server/timeweb-vps/server.mjs`. It builds the frontend with `VITE_ORDER_ENDPOINT=/api/notify`, serves the site, and sends notes to Telegram and email without storing submissions.
- Existing servers, databases, applications, domains, and production services in the Timeweb account are outside this project's scope. Do not inspect their credentials or configuration and never deploy the church site to them.
- For a dedicated VPS route, the container is bound to `127.0.0.1:8088` and must be exposed through its own Nginx/Caddy virtual host. For App Platform, use the same container through the Docker deployment type.

## Current RF hosting state, 2026-07-09

- Domain purchased in Timeweb for 1 year: `благовещение-горловка.рф` (`xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai`), request id `6685859`, domain id `23448381`, expiration `2027-07-09`.
- Domain DNS is now delegated to Timeweb NS.
- Timeweb S3 bucket created for the static site: `blago-gorlovka-site`, bucket id `528553`, project id `2547234`, location `ru-1`, static website enabled with `index.html`.
- Current Timeweb technical URL is live: `https://blago-gorlovka-site.website.twcstorage.ru/`.
- `www.благовещение-горловка.рф` was successfully bound to Timeweb S3 and SSL was issued, but Timeweb S3 custom domains serve direct object paths only; the root `/` returns 403 instead of the static website `index.html`.
- Because of that S3 limitation, do not use S3 as the production domain host. Serve production from the isolated Timeweb VPS container, or use classic Timeweb PHP hosting as fallback. Keep S3 only as a technical preview/reserve.
- Yandex Cloud route is paused because the account has debt. `yc` 1.18.0 is installed locally at `C:\Users\АМ\yandex-cloud\bin\yc.exe`, but Yandex is not the current launch path.
- Until the Timeweb VPS container is deployed and DNS is switched, the public frontend may still point to the temporary Vercel notification endpoint. Do not treat Vercel as the final RF launch route.
- Verified locally on 2026-07-10: production build succeeds, `/health` returns `200`, `/api/notify` accepts a sample note and reports Telegram+email delivery in `DRY_RUN`, the real form reaches its success state, desktop/mobile rendering is nonblank, and browser console has no errors or warnings.

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
