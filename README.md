# Сайт храма Благовещения Пресвятой Богородицы

Актуальный сайт для предпросмотра и подготовки запуска:

- GitHub Pages: `https://pehal16.github.io/hram-blagoveshcheniya-gorlovka/`
- Timeweb S3 technical preview: `https://blago-gorlovka-site.website.twcstorage.ru/`
- Planned production domain: `https://www.благовещение-горловка.рф/`
- Целевая схема запуска: недорогой отдельный российский PHP-хостинг для статического сайта и одного обработчика Telegram. Timeweb App Platform за 510 ₽/мес не заказываем. Существующие серверы аккаунта не используются, S3 остается техническим предпросмотром.
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
- Основной RF-backend для Telegram: `server/timeweb-notify`.
- Docker-backend `server/timeweb-vps` сохранен как запасной вариант на будущее.
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

## Дорогой Docker-вариант отложен

Контейнер из корневого `Dockerfile` рабочий, но Timeweb App Platform для текущей нагрузки избыточен.

Минимальная конфигурация App Platform на 10.07.2026 стоит `510 ₽/мес`. Заказ не оформлен.

Для локальной проверки или отдельного нового VPS остается Compose-конфигурация:

```powershell
docker compose -f docker-compose.timeweb.yml up -d --build
```

В Compose-контейнер слушает только `127.0.0.1:8088`; в App Platform внешний домен и SSL настраивает платформа. Подробная инструкция находится в `server/timeweb-vps/README.md`.

## Основной дешевый PHP-вариант

Сайт не хранит токен Telegram. Для боевого запуска на обычном российском PHP-хостинге нужно собрать единый архив:

```powershell
npm run package:timeweb-hosting
```

Архив будет здесь:

```text
output/timeweb-hosting-site.zip
```

Его содержимое нужно загрузить в корень сайта на PHP-хостинге. Endpoint для заявок будет:

```text
VITE_ORDER_ENDPOINT=https://www.благовещение-горловка.рф/api/notify.php
```

После загрузки нужно создать на хостинге `api/config.php` из `api/config.example.php` и заполнить только токен Telegram. Заявки будут уходить в закрытую группу Telegram; почта, VK и база данных для первого запуска отключены.

Для временного полного маршрута на Vercel endpoint будет:

```text
https://<vercel-domain>/api/notify
```

Для дешевого боевого запуска см. `server/timeweb-notify/README.md`. Docker-инструкция в `server/timeweb-vps/README.md` сохранена только как запасной вариант.
