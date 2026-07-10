# Сайт храма Благовещения Пресвятой Богородицы

Актуальный сайт для предпросмотра и подготовки запуска:

- GitHub Pages: `https://pehal16.github.io/hram-blagoveshcheniya-gorlovka/`
- Timeweb S3 technical preview: `https://blago-gorlovka-site.website.twcstorage.ru/`
- Planned production domain: `https://www.благовещение-горловка.рф/`
- Целевая схема запуска: новый отдельный сервис Timeweb только для храма, с изолированным контейнером сайта и уведомлений. Существующие серверы аккаунта не используются. Обычный Timeweb PHP-хостинг остается запасным вариантом, S3 - техническим предпросмотром.
- Основная оплата на текущем этапе: QR СБП `https://qr.nspk.ru/BS1A0047BC591PLI8SR9GDOSN5OGQ77S`
- Robokassa пока не используется.
- Записки отправляются ответственным после отметки пользователем оплаты по СБП.
- Контакты на сайте: адрес `г. Горловка, ж/м «Строитель», ул. Ленина, 190`, телефон `+7 949 469 5683`, Telegram, Rutube и MAX.

## Что уже есть

- Подача записок с расчетом минимального пожертвования.
- Пожертвования с быстрыми суммами.
- Реальный QR-код СБП в `public/sbp-qr.svg`.
- Реквизиты организации из PDF заказчика.
- Раздел обработки данных и ссылки на него из согласий в формах.
- Готовность frontend к отправке заявок на backend через `VITE_ORDER_ENDPOINT`.
- Основной RF-backend для почты и Telegram: `server/timeweb-vps`.
- Запасной PHP-backend для обычного хостинга: `server/timeweb-notify`.
- Старый Node-backend для Vercel/Yandex сохранен в `server/yandex-notify` как запасной вариант.
- Telegram-бот настраивается через закрытую группу ответственных.

## Запуск разработки

```powershell
npm install
npm run dev
```

## Проверка перед публикацией

```powershell
npm run lint
npm run build
```

## Запуск на Timeweb VPS

Основной production-вариант собирает frontend и backend в один контейнер. Токен Telegram и пароль почты хранятся только в серверном `.env`.

```powershell
docker compose -f docker-compose.timeweb.yml up -d --build
```

Контейнер слушает только `127.0.0.1:8088`; публичный HTTPS-доступ должен идти через Nginx или Caddy. Подробная инструкция находится в `server/timeweb-vps/README.md`.

## Запасной PHP-вариант

Сайт не хранит токены Telegram и пароль почты. Для боевого запуска на Timeweb нужно собрать единый архив:

```powershell
npm run package:timeweb-hosting
```

Архив будет здесь:

```text
output/timeweb-hosting-site.zip
```

Его содержимое нужно загрузить в корень сайта на Timeweb-хостинге. Endpoint для заявок будет:

```text
VITE_ORDER_ENDPOINT=https://www.благовещение-горловка.рф/api/notify.php
```

После загрузки нужно создать на хостинге `api/config.php` из `api/config.example.php` и заполнить секреты Telegram/почты. После этого заявки будут уходить в PHP-скрипт, а он разошлет их на почту и в Telegram.

Для временного полного маршрута на Vercel endpoint будет:

```text
https://<vercel-domain>/api/notify
```

Для боевого переезда на РФ-инфраструктуру см. `server/timeweb-vps/README.md`. Для обычного PHP-хостинга см. `server/timeweb-notify/README.md`.
