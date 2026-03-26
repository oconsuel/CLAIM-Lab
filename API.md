# API

## Публичные эндпоинты

- `POST /run-beginner` — запуск практикума в режиме «Начинающий».
- `POST /run-researcher` — запуск практикума в режиме «Начинающий исследователь».
- `POST /run-engineer` — раздел в разработке (возвращает статус disabled).
- `GET /health` — проверка состояния сервиса.
- `GET /practices/image-generation/dataset-samples?digit=N` — примеры цифр для практикума генерации.
- `GET /practices/status` — публичные статусы видимости практикумов (`{practice_id: is_enabled}`).
- `POST /track/practice-visit` — событие посещения страницы практикума.

## Административные эндпоинты

Для всех эндпоинтов `/admin/*` требуется заголовок:

- `Authorization: Bearer <jwt_token>`

Список эндпоинтов:

- `POST /admin/login` — вход в админ-панель, возвращает JWT.
- `GET /admin/analytics` — агрегированная аналитика по запускам/посещениям/ошибкам.
- `GET /admin/practices` — текущие настройки видимости практикумов.
- `PATCH /admin/practices/{practice_id}` — изменить видимость практикума.

## Правила блокировки отключенных практикумов

Если практикум отключен в настройках:

- любой `POST` на `/run-beginner` или `/run-researcher` с этим `practice_id` возвращает `403`;
- любой GET-маршрут вида `/practices/{practice_id}/*` возвращает `403`;
- тело ответа: `{"detail":"Практикум недоступен"}`.
