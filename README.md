# CLAIM Lab — Практики по ИИ

Веб-приложение с каталогом интерактивных практик по искусственному интеллекту.

## Стек

- **Frontend:** React (Vite) + Tailwind CSS + Recharts + Monaco Editor
- **Backend:** FastAPI + scikit-learn + NumPy
- **Деплой:** Docker Compose + Nginx

## Быстрый старт (разработка)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend запустится на `http://localhost:5173` с проксированием API на порт 8000.

## Запуск через Docker

```bash
docker compose up --build
```

Приложение будет доступно на `http://localhost`.

## Структура проекта

```
CLAIM-Lab/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # UI компоненты (режимы, графики)
│   │   │   └── ui/        # Базовые UI-компоненты (Heading, Text, Button)
│   │   ├── pages/         # Каталог, страница практики
│   │   ├── data/          # Описания практик (JS)
│   │   └── api.js         # API клиент
│   └── Dockerfile
├── backend/               # FastAPI сервер
│   ├── main.py            # Эндпоинты API
│   ├── practices/         # Логика каждой практики
│   │   ├── base.py        # Базовый класс + песочница
│   │   ├── dataset.py     # Загрузка данных (Digits, Spam и др.)
│   │   └── image_generation.py
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## Практики

**В текущей версии доступна:**

| # | Название | Направление |
|---|---------|-------------|
| 1 | Генерация изображений | Generative |

*Другие практики (классификация спама, распознавание изображений, анализ тональности и др.) — в разработке.*

## Режимы

- **Начинающий** — ползунки параметров, автоматический запуск модели, 1 метрика + график
- **Начинающий исследователь** — выбор модели, настройка параметров, таблица сравнения запусков
- **Начинающий инженер** — Monaco Editor с шаблоном кода, безопасное выполнение на backend

## API

```
POST /run-beginner    — запуск режима «Начинающий»
POST /run-researcher  — запуск режима «Начинающий исследователь»
POST /run-engineer    — запуск кода в песочнице (в разработке)
GET  /health          — проверка статуса
GET  /practices/image-generation/dataset-samples?digit=N — примеры цифр из датасета
```

## Ограничения безопасности

- Запрещён импорт `os`, `subprocess`, `socket` и др.
- Таймаут выполнения: 10 секунд
- Ограничение памяти контейнера: 2 ГБ
- Размер запроса: до 2 МБ
