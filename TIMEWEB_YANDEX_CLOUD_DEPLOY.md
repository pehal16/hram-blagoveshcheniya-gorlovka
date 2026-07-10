# Переезд на Timeweb

> Статус на 2026-07-10: Yandex Cloud не используется, а обычный PHP-хостинг оставлен запасным вариантом.
> Актуальный RF-маршрут запуска: изолированный контейнер на Timeweb VPS.
> Смотри `server/timeweb-vps/README.md`.

Описанная ниже схема PHP-хостинга остается запасной:

- Timeweb: домен, DNS, SSL, почта, статические файлы сайта и PHP endpoint `/api/notify.php`.
- Timeweb S3: только технический предпросмотр/резерв, потому что кастомный домен S3 не отдает `index.html` на корне `/`.
- Yandex Cloud Functions: не используется сейчас.
- Оплата: пока СБП-ссылка `https://qr.nspk.ru/BS1A0047BC591PLI8SR9GDOSN5OGQ77S`, сверка вручную.

## Почему так

React-сайт можно безопасно держать на обычном хостинге: там нет секретов. А отправку в Telegram и почту нельзя делать из браузера, поэтому она выполняется в `api/notify.php`, где на хостинге лежит закрытый `api/config.php`.

## Стоимость

- Timeweb: базовый хостинг от 180 руб./мес, 10 дней теста, SSL, DNS и почта входят в тариф. При оплате за год Timeweb указывает подарок доменов `.RU/.РФ`.
- Домен: если не брать подарок по акции, ориентир от 200 руб./год за регистрацию и около 399 руб./год за продление `.RU/.РФ` по текущей странице Timeweb.

## Что сделать в Timeweb

1. Купить или включить тест виртуального хостинга.
2. Подключить домен или временный технический домен.
3. Включить бесплатный SSL.
4. Создать почтовый ящик, например `zapiski@домен`.
5. Получить SMTP-данные ящика для `api/config.php`:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `MAIL_FROM`
   - `MAIL_TO`

## Сборка сайта для Timeweb

```powershell
npm run package:timeweb-hosting
```

Скрипт:

- соберет сайт через `npm run build`;
- встроит endpoint `https://www.благовещение-горловка.рф/api/notify.php`;
- добавит `api/notify.php` и `api/config.example.php`;
- создаст архив `output\timeweb-hosting-site.zip`.

На Timeweb нужно загрузить содержимое архива в корень сайта, обычно `public_html` или папку выбранного домена. Затем создать `api/config.php` из `api/config.example.php` и заполнить реальные значения.

## Старый запасной маршрут через Yandex Cloud

1. Создать платежный аккаунт и cloud/folder.
2. Установить Yandex Cloud CLI `yc`.
3. Выполнить:

```powershell
yc init
```

4. Подготовить файл переменных окружения:

```powershell
Copy-Item server\yandex-notify\yandex-cloud.env.example server\yandex-notify\yandex-cloud.env
```

5. Заполнить `server\yandex-notify\yandex-cloud.env` реальными значениями. Этот файл нельзя коммитить.

Обязательные значения:

```text
ALLOWED_ORIGIN=https://ваш-домен.ru,https://www.ваш-домен.ru,http://127.0.0.1:5173,http://localhost:5173
TELEGRAM_BOT_TOKEN=<токен бота>
TELEGRAM_CHAT_ID=-5589930019
SEND_FULL_TO_TELEGRAM=true
DRY_RUN=false
```

6. Развернуть функцию:

```powershell
.\server\yandex-notify\deploy-yandex-cloud.ps1
```

Скрипт выведет endpoint вида:

```text
https://functions.yandexcloud.net/<function_id>
```

Это и будет новый `VITE_ORDER_ENDPOINT`.

Секретный `yandex-cloud.env` не попадает в ZIP функции. Скрипт упаковывает только `index.js`, `package.json` и `package-lock.json`; Yandex Cloud Functions установит production-зависимости при создании версии.

## Проверка после загрузки

1. Открыть сайт по домену.
2. Подать тестовую записку.
3. Убедиться, что на сайте появилось `Записка отправлена на проверку`.
4. Проверить закрытую Telegram-группу `Записки храма`.
5. Проверить почту, если SMTP уже подключен.
6. Проверить, что СБП QR открывается.

## Временная схема

До боевого переезда можно оставить GitHub Pages + Vercel как рабочий предпросмотр. После проверки Timeweb-хостинга:

1. Собираем `output\timeweb-hosting-site.zip`.
2. Загружаем на Timeweb.
3. Проверяем домен.
4. Только после этого отключаем/не используем Vercel endpoint.
