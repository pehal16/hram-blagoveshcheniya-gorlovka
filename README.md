# Сайт храма Благовещения Пресвятой Богородицы

Актуальный сайт для предпросмотра и подготовки запуска:

- GitHub Pages: `https://pehal16.github.io/hram-blagoveshcheniya-gorlovka/`
- Основная оплата на текущем этапе: QR СБП `https://qr.nspk.ru/BS1A0047BC591PLI8SR9GDOSN5OGQ77S`
- Robokassa пока не используется.
- Записки отправляются ответственным после отметки пользователем оплаты по СБП.

## Что уже есть

- Подача записок с расчетом минимального пожертвования.
- Пожертвования с быстрыми суммами.
- Реальный QR-код СБП в `public/sbp-qr.svg`.
- Готовность frontend к отправке заявок на backend через `VITE_ORDER_ENDPOINT`.
- Шаблон backend для почты, Telegram и VK: `server/yandex-notify`.
- Telegram-бот настраивается через `server/yandex-notify` и закрытую группу ответственных.

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

## Уведомления

Сайт не хранит токены Telegram/VK и пароль почты. Для отправки записок нужно развернуть серверную функцию из `server/yandex-notify` и указать ее URL в переменной сборки:

```text
VITE_ORDER_ENDPOINT=https://example.ru/notify
```

После этого заявки будут уходить в endpoint, а функция разошлет их на почту, в Telegram и VK.

Для временного полного маршрута на Vercel endpoint будет:

```text
https://<vercel-domain>/api/notify
```
