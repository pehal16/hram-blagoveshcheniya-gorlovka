# Переезд на Timeweb + Yandex Cloud

Целевая схема:

- Timeweb: домен, DNS, SSL, почта и статические файлы сайта из `dist`.
- Yandex Cloud Functions: закрытый backend `/notify`, где хранятся токены Telegram/VK и SMTP-пароли.
- Оплата: пока СБП-ссылка `https://qr.nspk.ru/BS1A0047BC591PLI8SR9GDOSN5OGQ77S`, сверка вручную.

## Почему так

React-сайт можно безопасно держать на обычном хостинге: там нет секретов. А отправку в Telegram, VK и почту нельзя делать из браузера, поэтому она остается в серверной функции.

## Стоимость

- Timeweb: базовый хостинг от 180 руб./мес, 10 дней теста, SSL, DNS и почта входят в тариф. При оплате за год Timeweb указывает подарок доменов `.RU/.РФ`.
- Домен: если не брать подарок по акции, ориентир от 200 руб./год за регистрацию и около 399 руб./год за продление `.RU/.РФ` по текущей странице Timeweb.
- Yandex Cloud Functions: для наших объемов должен оставаться в бесплатном/копеечном serverless-лимите. Обязательно включить бюджет и уведомления, чтобы исключить сюрпризы.

## Что сделать в Timeweb

1. Купить или включить тест виртуального хостинга.
2. Подключить домен или временный технический домен.
3. Включить бесплатный SSL.
4. Создать почтовый ящик, например `zapiski@домен`.
5. Получить SMTP-данные ящика для Yandex Cloud:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `MAIL_FROM`
   - `MAIL_TO`

## Что сделать в Yandex Cloud

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

## Сборка сайта для Timeweb

Когда Yandex endpoint готов:

```powershell
.\scripts\prepare-timeweb.ps1 -ExpectedEndpoint "https://functions.yandexcloud.net/<function_id>"
```

Скрипт:

- соберет сайт через `npm run build`;
- проверит, какой endpoint попал в JS;
- создаст архив `output\timeweb-site.zip`.

На Timeweb нужно загрузить содержимое архива в корень сайта, обычно `public_html` или папку выбранного домена. Важно загрузить именно содержимое `dist`, а не папку `dist` целиком.

## Проверка после загрузки

1. Открыть сайт по домену.
2. Подать тестовую записку.
3. Убедиться, что на сайте появилось `Записка отправлена на проверку`.
4. Проверить закрытую Telegram-группу `Записки храма`.
5. Проверить почту, если SMTP уже подключен.
6. Проверить, что СБП QR открывается.

## Временная схема

До боевого переезда можно оставить GitHub Pages + Vercel как рабочий предпросмотр. После проверки Yandex Cloud Function и Timeweb:

1. Пересобираем Timeweb-архив с Yandex endpoint.
2. Загружаем на Timeweb.
3. Проверяем домен.
4. Только после этого отключаем/не используем Vercel endpoint.
