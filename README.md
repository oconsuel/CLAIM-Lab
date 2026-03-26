# CLAIM Lab — Практикумы по ИИ

Веб-приложение с каталогом интерактивных практикумов по искусственному интеллекту.

## Стек

- **Frontend:** React (Vite) + Tailwind CSS + Recharts + Monaco Editor
- **Backend:** FastAPI + scikit-learn + NumPy + Pillow
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
│   │   ├── pages/         # Каталог, страница практикума
│   │   ├── data/          # Описания практикумов (JS)
│   │   └── api.js         # API клиент
│   └── Dockerfile
├── backend/               # FastAPI сервер
│   ├── main.py            # Эндпоинты API
│   ├── admin/             # Админ-панель (JWT, аналитика, guard, middleware)
│   │   └── logs/          # SQLite логи админ-аналитики
│   ├── practices/         # Логика каждого практикума
│   │   ├── base.py        # Базовый класс + песочница
│   │   ├── dataset.py     # Загрузка данных
│   │   ├── spam_classifier.py
│   │   ├── image_recognition.py
│   │   ├── sentiment_analysis.py
│   │   ├── data_compression.py
│   │   ├── image_representation.py
│   │   ├── image_generation.py
│   │   ├── recommender_system.py
│   │   └── trick_the_ai.py
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## Практикумы

| # | Название | Описание |
|---|----------|----------|
| 1 | Генерация изображений | Диффузионная модель создаёт цифру из шума — шаг за шагом |
| 2 | Обмани ИИ | Загрузите изображение, распознайте его через ИИ и изучите XAI-объяснения |

## Документация API

Описание всех публичных и административных эндпоинтов вынесено в файл `API.md`.

## Переменные окружения

- **HF_TOKEN** — обязателен для практикума «Обмани ИИ» (Hugging Face Inference API)
- **ADMIN_USERNAME** — логин администратора
- **ADMIN_PASSWORD** — пароль администратора
- **JWT_SECRET** — секрет подписи JWT
- **ADMIN_DB_PATH** — путь до SQLite-файла аналитики (по умолчанию `backend/admin/logs/admin_logs.db`)