# PHP Notify: Telegram-only launch

Этот endpoint нужен для недорогого российского маршрута уведомлений без Yandex Cloud, Vercel, базы данных и почтового сервиса.

Схема для запуска:

- API-поддомен `api.благовещение-горловка.рф` добавлен на обычный российский PHP-хостинг;
- `notify.php` лежит рядом с сайтом в папке `api`;
- GitHub Pages отправляет заявки на `https://api.благовещение-горловка.рф/api/notify.php`;
- `notify.php` отправляет полный текст записки в закрытую группу Telegram;
- почта, VK и база данных сейчас не используются.

## Что важно

Timeweb S3 не исполняет PHP и не подходит как единственный боевой хостинг для формы. Домен можно оставить зарегистрированным в Timeweb, а DNS направить на выбранный PHP-хостинг после проверки сайта на техническом домене.

Секреты нельзя хранить в React-сайте или в S3. Они должны быть только в `config.php` на PHP-хостинге:

- `telegram_bot_token`;
- `telegram_chat_id`.

## Установка на обычный PHP-хостинг

### В панели хостинга

1. Создать отдельный аккаунт храма на российском хостинге с PHP 8.2 или новее и бесплатным SSL.
2. Добавить технический сайт или поддомен `api.благовещение-горловка.рф`.
3. Загрузить `api/notify.php` и `api/config.example.php` в корень API-сайта.
4. Создать `api/config.php`, заполнить токен бота и ID закрытой Telegram-группы.
5. В Timeweb направить `api` на этот PHP-хостинг и выпустить бесплатный SSL.
6. Проверить endpoint и отправить тестовую записку с GitHub Pages.

### Файлы

Готовый локальный архив всего сайта после подготовки:

```text
output/timeweb-hosting-site.zip
```

Внутри архива:

- собранный frontend;
- `api/notify.php`;
- `api/config.example.php`.

Содержимое архива нужно загрузить в корень сайта. Затем на хостинге скопировать `api/config.example.php` в `api/config.php` и заполнить реальные значения.

После загрузки открыть endpoint:

```text
https://api.благовещение-горловка.рф/api/notify.php
```

Собрать архив можно так:

```powershell
npm run package:timeweb-hosting
```

## Конфигурация

Для первого запуска нужен только Telegram:

```php
return [
    'allowed_origins' => [
        'https://blago-gorlovka-site.website.twcstorage.ru',
        'https://www.благовещение-горловка.рф',
        'https://www.xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai',
    ],
    'dry_run' => false,
    'telegram_bot_token' => '0000000000:token',
    'telegram_chat_id' => '-5589930019',
    'send_full_to_telegram' => true,
    'mail_transport' => 'disabled',
];
```

## Проверка

Тестовая команда после загрузки на хостинг:

```powershell
$body = Get-Content .\server\yandex-notify\sample-note.json -Raw
Invoke-WebRequest -Method POST `
  -Uri "https://api.благовещение-горловка.рф/api/notify.php" `
  -ContentType "application/json" `
  -Body $body
```

Успешный ответ:

```json
{"ok":true,"delivered":["telegram"]}
```
