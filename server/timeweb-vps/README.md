# Timeweb App Platform: сайт и уведомления

Этот вариант запускает сайт и обработчик записок в одном изолированном Docker-контейнере. Заявки не сохраняются на диск или в базу: после проверки они отправляются в Telegram и на почту.

Контейнер предназначен только для нового отдельного App Platform-сервиса храма. Его нельзя устанавливать на существующие серверы, базы данных или приложения аккаунта.

Основной путь развертывания: тип `Docker` -> `Dockerfile`, регион Москва, минимальная отдельная конфигурация. App Platform собирает корневой `Dockerfile`, выдает технический домен и SSL, после чего к приложению подключается домен храма.

## Что требуется на сервере

- Docker Engine с Compose;
- Nginx или Caddy для HTTPS;
- свободный локальный порт `127.0.0.1:8088`;
- доступ исходящих соединений к Telegram Bot API и SMTP;
- DNS-записи корневого домена и `www`, направленные на сервер.

Перед установкой на сервер с другими production-сервисами обязательно проверьте занятые порты, текущую конфигурацию reverse proxy, свободную память и резервные копии.

## Конфигурация

```bash
cp server/timeweb-vps/.env.example server/timeweb-vps/.env
chmod 600 server/timeweb-vps/.env
```

В `.env` заполните:

- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_CHAT_ID`;
- параметры российского SMTP-сервиса;
- адрес получателя `MAIL_TO`;
- разрешенные адреса сайта в `ALLOWED_ORIGIN`.

Файл `.env` исключен из Git и Docker build context.

## Запуск

```bash
docker compose -f docker-compose.timeweb.yml up -d --build
docker compose -f docker-compose.timeweb.yml ps
curl http://127.0.0.1:8088/health
```

Ожидаемый ответ healthcheck:

```json
{"ok":true}
```

## Nginx

Пример server-блока после проверки существующей конфигурации:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai www.xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После применения конфигурации выпустите Let's Encrypt для обоих имен домена. DNS нужно переключать только после успешной проверки контейнера через локальный порт.

## Обновление

```bash
git pull --ff-only
docker compose -f docker-compose.timeweb.yml up -d --build
```

## Проверка записки

Отправьте тестовую записку через сайт и убедитесь, что:

- `/api/notify` вернул `200`;
- сообщение появилось в закрытой Telegram-группе;
- письмо дошло на `MAIL_TO`;
- в сообщении указано, что оплату по СБП нужно сверить вручную.
