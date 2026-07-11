# Project context: Church site

This file is the durable context for future Codex sessions. Read it before changing the site.

## Current state

- Site folder: `C:\Users\АМ\Documents\Сайт Церкви\site`
- Stack: React + Vite + TypeScript + lucide-react.
- Hosting preview: GitHub Pages.
- Target launch hosting: a separate low-cost Russian shared PHP hosting account serving the static frontend and `api/notify.php`. Never use any pre-existing server or application in the Timeweb account.
- Repository: `https://github.com/pehal16/hram-blagoveshcheniya-gorlovka`
- Live preview: `https://pehal16.github.io/hram-blagoveshcheniya-gorlovka/`
- Vite uses `base: './'` so assets work on GitHub Pages subpaths.
- The current design is the modern calm redesign, not the first rough version.

## Authoritative launch decision, 2026-07-11

## Verified production state, 2026-07-12

- The public domain `https://благовещение-горловка.рф/` serves the current frontend from SprintHost over HTTPS.
- The production frontend now uses the same-origin endpoint `/api/notify.php`; the old Vercel endpoint is no longer used by the SprintHost build.
- `api/config.php` on SprintHost contains the Telegram configuration and remains outside the repository.
- End-to-end test passed on 2026-07-12: the live form created order `Z-260711-4287`, returned `Записка отправлена на проверку`, and the PHP endpoint confirmed Telegram delivery. Browser console had no errors or warnings.
- The first-launch notification route is therefore: public site -> SprintHost PHP -> closed Telegram group. Payment remains manual SBP reconciliation.

- The production infrastructure must use Russian hosting services only.
- The domain remains registered and paid in Timeweb through 2027-07-09.
- Production hosting is SprintHost shared PHP hosting on the Russian server `vali`.
- The frontend and `api/notify.php` are deployed together on the same SprintHost site. The frontend endpoint is the same-origin path `/api/notify.php`.
- GitHub remains the source-code repository and backup history. GitHub Pages is a preview only and is not the production host.
- Vercel, Cloudflare, Yandex Cloud, Timeweb S3, and Timeweb App Platform are not part of the production request route.
- Timeweb NS was changed on 2026-07-11 to SprintHost NS; public DNS now resolves to SprintHost.
- SprintHost Free is suitable only for staging. The verified minimum production tariff is `X-1`: 190 RUB/month or 149 RUB/month when paid annually (1,788 RUB/year), with PHP, SSL, and 30-day backups.
- Telegram is the only notification channel for the first launch. The site does not store note submissions in a database.
- The current SBP link does not provide automatic payment confirmation. A visitor marks payment as completed, the note is delivered to Telegram, and the responsible person verifies the bank receipt manually.
- Before production, rotate the Telegram bot token in BotFather because the old token was exposed in chat. Enter the new token only in SprintHost `api/config.php`; never send it in chat or commit it.
- SprintHost accepted and created the main site `благовещение-горловка.рф`; its document root is `/domains/xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai/public_html`.
- The current frontend build, `api/notify.php`, a token-free `api/config.php`, and Apache access guards were uploaded to that document root on 2026-07-11. Remote FTP listings confirmed all expected files.
- After owner verification, DNS resolves to SprintHost (`ns1.sprinthost.ru`, `ns2.sprinthost.ru`, `ns3.sprinthost.net`, `ns4.sprinthost.net`) and the deployed frontend serves successfully.
- HTTP `/api/notify.php` is executing PHP correctly: GET returns `405 Method Not Allowed`, and an invalid JSON POST returns `400 Invalid order payload`.
- The user paid for and activated SprintHost `X-1` on 2026-07-11. The free Let's Encrypt Wildcard switch is enabled for the main domain.
- The SprintHost technical domain returns `403` while account owner data is unfilled. SprintHost's official setup guide requires real owner details; the user must enter those details personally in the hosting profile.
- HTTPS is verified externally: the site returns `200 OK` and `https://.../api/notify.php` returns the expected JSON `405`. Telegram delivery still requires a newly rotated bot token entered directly into the server-side config.

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
- Historical preview notification endpoint: `https://site-livid-mu-36.vercel.app/api/notify` (not used by the current SprintHost production build).
- GitHub Pages uses the repository variable `VITE_ORDER_ENDPOINT=https://site-livid-mu-36.vercel.app/api/notify`.
- Local Vite testing uses ignored `.env.local` with the same `VITE_ORDER_ENDPOINT`; restart `npm run dev` after changing it.
- Backend templates live in `server/timeweb-notify` for the RF PHP route and `server/yandex-notify` for the older Yandex/Vercel-compatible route.
- Full note text goes only to the closed Telegram group for the first launch.
- Email, VK, and database storage are disabled for the first launch.
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
- Current deployment candidate: `server/timeweb-notify/notify.php` packaged with the Vite build by `npm run package:timeweb-hosting`. It sends notes to Telegram without storing submissions. The root Dockerfile and `server/timeweb-vps` are retained only as a future fallback.
- Existing servers, databases, applications, domains, and production services in the Timeweb account are outside this project's scope. Do not inspect their credentials or configuration and never deploy the church site to them.
- Timeweb App Platform at `510 RUB/month` was rejected on 2026-07-10 as unnecessarily expensive. Its order was never submitted.
- Separate Timeweb project created on 2026-07-10: `Храм Благовещения`, project id `2707257`, description `Сайт и уведомления Благовещенского храма`.
- Only church-owned resources were transferred into that project: domain `благовещение-горловка.рф` and S3 bucket `blago-gorlovka-site`. Other account services were not selected or changed.
- Do not submit the previously prepared App Platform order. The launch target is shared PHP hosting with Telegram only.
- Timeweb currently displays an infrastructure incident banner saying new cloud services are temporarily unavailable. The Order button is enabled, but creation may fail until the incident is resolved.

## Cheapest launch decision, 2026-07-10

- Email is postponed. Notes must be delivered only to the closed Telegram group.
- The production launch uses SprintHost `X-1`: 190 RUB/month, paid and active on 2026-07-11, with PHP, SSL, and 30-day backups.
- HostiMan Free is a zero-cost alternative, but activation requires a photo of an identity document, registration of another RU/RF domain with that provider, or an 80 RUB/month payment. Treat it as a temporary/testing option, not the preferred production launch.
- The domain remains registered at Timeweb. Test on the hosting technical domain before changing DNS.
- Production package: `output/timeweb-hosting-site.zip`; despite the historical filename, it works on a normal PHP hosting account.
- `scripts/package-timeweb-hosting.ps1` defaults to the relative endpoint `/api/notify.php` so the same build works on a technical domain and on `благовещение-горловка.рф`.

## SprintHost launch state, 2026-07-11

- SprintHost account login: `pehal`.
- FTP server: `141.8.192.182`.
- FTP user: `pehal`.
- Do not store the FTP password or Telegram bot token in the repo.
- Main domain/folder: `благовещение-горловка.рф`, `/domains/xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai/public_html`.
- Uploaded the current PHP-hosting package to the main domain folder with `api/notify.php`, a token-free `api/config.php`, and `api/.htaccess`. No Telegram secret is stored in the repository or deployment archive.
- The technical-domain `403` is not the production health check; the paid main domain is serving correctly over HTTPS.
- Timeweb domain NS was changed via API to SprintHost NS; Timeweb API reported `task_status=done` and public DNS now reflects the change.
- SprintHost has accepted and created the main domain site. HTTPS and the PHP route are now externally verified.
- Completed launch verification on 2026-07-12: the Telegram-configured SprintHost API received and delivered a live test note from the public domain.

## Current RF hosting state, 2026-07-09

- Domain purchased in Timeweb for 1 year: `благовещение-горловка.рф` (`xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai`), request id `6685859`, domain id `23448381`, expiration `2027-07-09`.
- Domain DNS was originally delegated to Timeweb NS; on 2026-07-10 it was switched in Timeweb API to SprintHost NS for the shared-hosting launch attempt, but public DNS had not propagated yet at the time of the last check.
- Timeweb S3 bucket created for the static site: `blago-gorlovka-site`, bucket id `528553`, project id `2547234`, location `ru-1`, static website enabled with `index.html`.
- Current Timeweb technical URL is live: `https://blago-gorlovka-site.website.twcstorage.ru/`.
- `www.благовещение-горловка.рф` was successfully bound to Timeweb S3 and SSL was issued, but Timeweb S3 custom domains serve direct object paths only; the root `/` returns 403 instead of the static website `index.html`.
- Because of that S3 limitation, do not use S3 as the production domain host. Serve production from the separate Timeweb App Platform Docker service, or use classic Timeweb PHP hosting as fallback. Keep S3 only as a technical preview/reserve.
- Yandex Cloud route is paused because the account has debt. `yc` 1.18.0 is installed locally at `C:\Users\АМ\yandex-cloud\bin\yc.exe`, but Yandex is not the current launch path.
- Until the Timeweb App Platform service is deployed and DNS is switched, the public frontend may still point to the temporary Vercel notification endpoint. Do not treat Vercel as the final RF launch route.
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
