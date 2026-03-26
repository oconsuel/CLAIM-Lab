# Нагрузочный тест: «Обмани ИИ» (30 пользователей)

В этой папке находится сценарий нагрузочного теста для продакшена по практикуму `trick-the-ai`.

## Цель

Запустить ровно одну итерацию для 30 одновременных пользователей и понять, выдерживает ли прод пик.

## Что нужно заранее

1. На машине запуска установлен `k6`.
2. Прод уже развернут и доступен.
3. Есть реальное изображение для теста (желательно, чтобы результаты были ближе к реальности).

## 1) Подготовка входных данных

Используйте файл `perf/test.env` (см. шаблон `perf/test.env.example`) и заполните:

```env
BASE_URL=https://ai.philippovich.ru
IMAGE_B64=<base64_строка_изображения_без_переносов>
```

Как получить `IMAGE_B64`:

- Linux:
  ```bash
  base64 -w 0 ./cat.jpg
  ```
- macOS:
  ```bash
  base64 ./cat.jpg | tr -d '\n'
  ```

## 2) Запуск одной итерации на 30 пользователей

```bash
set -a
source perf/test.env
set +a
k6 run perf/trick_the_ai_30users.js
```

Что делает сценарий:

- стартуют 30 виртуальных пользователей одновременно;
- каждый пользователь отправляет ровно 1 `POST` на `/api/run-beginner`;
- `practice_id = trick-the-ai`;
- всего 30 запросов.

## 3) Критерии прохождения (рекомендуемые)

Считайте запуск успешным, если выполнены все условия:

- `http_req_failed < 5%`
- `p95(http_req_duration) < 60s`
- `p99(http_req_duration) < 90s`
- в логах бэкенда нет устойчивой серии 5xx.

Эти пороги уже зашиты в `k6`-сценарий.

## 4) Наблюдение за продом во время теста

Параллельно на сервере:

```bash
cd /var/www/lab
docker-compose logs -f backend
```

Опционально следите за ресурсами контейнера:

```bash
docker stats claim-lab-backend
```

## 5) Проверка метрик в SQLite после теста

```bash
cd /var/www/lab
docker-compose exec backend python - <<'PY'
import sqlite3
conn = sqlite3.connect('/data/logs/admin_logs.db')
conn.row_factory = sqlite3.Row
row = conn.execute("""
SELECT
  COUNT(*) as runs,
  ROUND(AVG(response_time_ms), 2) as avg_ms,
  ROUND(MAX(response_time_ms), 2) as max_ms,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
FROM admin_logs
WHERE practice_id='trick-the-ai'
  AND endpoint IN ('/run-beginner','/run-researcher','/run-engineer')
  AND timestamp >= datetime('now', '-10 minutes')
""").fetchone()
print(dict(row))
conn.close()
PY
```

## 6) Как интерпретировать результат

- Если пороги пройдены и UX приемлемый — текущая конфигурация, вероятно, достаточна для такого пика.
- Если растут ошибки/время ответа — узкое место обычно внешний HF inference и повторные попытки.
- В таком случае стоит рассмотреть dedicated endpoint, очередь запросов или уменьшение числа внешних вызовов на один запуск.

## 7) Проверка качества ответов HF (JSON по 30 пользователям)

Если нужно убедиться, что это не просто `200 OK`, а реально пришли top-5 классов:

1. Экспортируйте переменные из `perf/test.env`:

```bash
set -a
source perf/test.env
set +a
```

2. Запустите сборщик результатов:

```bash
python3 perf/collect_trick_ai_results.py
```

3. Файл с результатами будет сохранён в:

```text
perf/trick_the_ai_30_results.json
```

В JSON для каждого пользователя есть:
- `http_status`
- `metric`
- `top1_label`, `top1_score`
- `top5` (до 5 классов с вероятностями)
- `ok` (true/false)

Можно менять параметры через env:
- `USERS` (по умолчанию 30)
- `REQUEST_TIMEOUT` (по умолчанию 120)
- `OUTPUT_JSON` (по умолчанию `perf/trick_the_ai_30_results.json`)
