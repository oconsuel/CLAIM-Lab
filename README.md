# CLAIM Lab — Практики по ИИ

Веб-приложение с каталогом интерактивных практик по искусственному интеллекту.

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
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── pages/
│   │   ├── data/
│   │   └── api.js
│   └── Dockerfile
├── backend/
│   ├── main.py
│   ├── practices/
│   │   ├── base.py
│   │   ├── dataset.py
│   │   ├── image_generation.py
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

- `backend/.env` (не коммитится)
- **HF_TOKEN** — обязателен для практики «Обмани ИИ» (Hugging Face Inference API)
