# CLAIM Lab — Практики по ИИ

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
│   │   ├── pages/         # Каталог, страница практики
│   │   ├── data/          # Описания практик (JS)
│   │   └── api.js         # API клиент
│   └── Dockerfile
├── backend/               # FastAPI сервер
│   ├── main.py            # Эндпоинты API
│   ├── practices/         # Логика каждой практики
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

## Практики

| # | Название | Описание |
|---|----------|----------|
| 1 | Генерация изображений | Диффузионная модель создаёт цифру из шума — шаг за шагом |
| 2 | Обмани ИИ | Загрузите изображение, распознайте его через ИИ и изучите XAI-объяснения |

## API

```
POST /run-beginner          — режим «Начинающий»
POST /run-researcher        — режим «Начинающий исследователь»
GET  /health                — статус
GET  /practices/image-generation/dataset-samples?digit=N — примеры цифр
```

## Переменные окружения

- **HF_TOKEN** — обязателен для практики «Обмани ИИ» (Hugging Face Inference API)