# Timeweb PHP Notify

Этот endpoint нужен для российского маршрута уведомлений без Yandex Cloud и Vercel.

Схема для запуска:

- сайт лежит на обычном PHP-хостинге Timeweb;
- `notify.php` лежит рядом с сайтом в папке `api`;
- сайт отправляет заявки на `https://www.благовещение-горловка.рф/api/notify.php`;
- `notify.php` отправляет полный текст записки в Telegram и на почту;
- VK сейчас не используется.

## Что важно

Timeweb S3 не исполняет PHP и не подходит как единственный боевой хостинг для формы. Красивый домен лучше обслуживать с обычного Timeweb PHP-хостинга, а S3 оставить как технический предпросмотр/резерв.

Секреты нельзя хранить в React-сайте или в S3. Они должны быть только в `config.php` на PHP-хостинге:

- `telegram_bot_token`;
- `telegram_chat_id`;
- `smtp_user`;
- `smtp_pass`;
- `mail_to`.

## Установка на Timeweb

### В панели Timeweb

1. Открыть Timeweb hosting panel: `https://hosting.timeweb.ru`.
2. Купить или включить тестовый виртуальный хостинг на минимальном тарифе `Year`.
3. В разделе `Сайты` создать новый сайт/директорию, например `blagoveshchenie-gorlovka`.
4. Привязать домен `www.благовещение-горловка.рф` к этой директории.
5. В настройках сайта включить PHP 8.3 или 8.4.
6. Включить бесплатный SSL для домена, когда DNS начнет работать.

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
https://www.благовещение-горловка.рф/api/notify.php
```

Собрать архив можно так:

```powershell
npm run package:timeweb-hosting
```

## Если нужен API Timeweb

Обычный виртуальный хостинг Timeweb управляется через отдельный Public API `https://api.timeweb.ru`, но для него нужны логин хостинг-аккаунта, пароль и `appkey`, который выдает поддержка Timeweb. Текущий Timeweb Cloud JWT для S3/доменов не подходит для покупки и настройки классического виртуального хостинга.

## Конфигурация

Минимально нужны Telegram и почта:

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
    'mail_transport' => 'smtp',
    'smtp_host' => 'smtp.timeweb.ru',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',
    'smtp_user' => 'zapiski@домен',
    'smtp_pass' => 'пароль',
    'mail_from' => 'zapiski@домен',
    'mail_to' => 'куда_получать@домен',
];
```

Если SMTP еще не готов, можно временно поставить:

```php
'mail_transport' => 'mail',
```

Но для боевого запуска лучше SMTP-ящик на домене.

## Проверка

Тестовая команда после загрузки на хостинг:

```powershell
$body = Get-Content .\server\yandex-notify\sample-note.json -Raw
Invoke-WebRequest -Method POST `
  -Uri "https://www.благовещение-горловка.рф/api/notify.php" `
  -ContentType "application/json" `
  -Body $body
```

Успешный ответ:

```json
{"ok":true,"delivered":["email","telegram"]}
```
