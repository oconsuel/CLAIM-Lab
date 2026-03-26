#!/usr/bin/env python3
"""
Собирает результаты 30 параллельных запусков практикума `trick-the-ai`
и сохраняет JSON с top-5 классами по каждому пользователю.

Использование:
  set -a && source perf/test.env && set +a
  python3 perf/collect_trick_ai_results.py
"""

from __future__ import annotations

import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from urllib import error, request


BASE_URL = os.environ.get("BASE_URL", "https://ai.philippovich.ru").rstrip("/")
IMAGE_B64 = os.environ.get("IMAGE_B64", "")
USERS = int(os.environ.get("USERS", "30"))
TIMEOUT_SECONDS = int(os.environ.get("REQUEST_TIMEOUT", "120"))
OUTPUT_JSON = os.environ.get(
    "OUTPUT_JSON", "perf/trick_the_ai_30_results.json"
)


def call_once(user_id: int) -> dict:
    payload = {
        "practice_id": "trick-the-ai",
        "params": {"image_b64": IMAGE_B64},
    }
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url=f"{BASE_URL}/api/run-beginner",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    started = time.time()
    try:
        with request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            body_raw = resp.read().decode("utf-8")
            status_code = resp.getcode()
    except error.HTTPError as exc:
        return {
            "user_id": user_id,
            "ok": False,
            "http_status": exc.code,
            "duration_ms": round((time.time() - started) * 1000, 2),
            "error": f"HTTPError: {exc}",
            "metric": None,
            "top5": [],
        }
    except Exception as exc:
        return {
            "user_id": user_id,
            "ok": False,
            "http_status": None,
            "duration_ms": round((time.time() - started) * 1000, 2),
            "error": f"RequestError: {exc}",
            "metric": None,
            "top5": [],
        }

    try:
        body = json.loads(body_raw)
    except Exception:
        return {
            "user_id": user_id,
            "ok": False,
            "http_status": status_code,
            "duration_ms": round((time.time() - started) * 1000, 2),
            "error": "Invalid JSON in response",
            "metric": None,
            "top5": [],
        }

    recognition = body.get("recognition") or {}
    top5 = recognition.get("top5") or []

    simplified_top5 = [
        {
            "label": item.get("label"),
            "label_en": item.get("label_en"),
            "score": item.get("score"),
        }
        for item in top5[:5]
    ]

    return {
        "user_id": user_id,
        "ok": status_code == 200 and len(simplified_top5) > 0,
        "http_status": status_code,
        "duration_ms": round((time.time() - started) * 1000, 2),
        "error": None,
        "metric": body.get("metric"),
        "message": body.get("message"),
        "top1_label": recognition.get("top1_label"),
        "top1_score": recognition.get("top1_score"),
        "top5": simplified_top5,
    }


def main() -> None:
    if not IMAGE_B64:
        raise SystemExit(
            "IMAGE_B64 пустой. Заполните perf/test.env и экспортируйте переменные."
        )

    started = time.time()
    results = []

    with ThreadPoolExecutor(max_workers=USERS) as executor:
        futures = [executor.submit(call_once, i + 1) for i in range(USERS)]
        for fut in as_completed(futures):
            results.append(fut.result())

    results.sort(key=lambda x: x["user_id"])
    ok_count = sum(1 for r in results if r["ok"])
    fail_count = len(results) - ok_count

    report = {
        "meta": {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "base_url": BASE_URL,
            "users": USERS,
            "timeout_seconds": TIMEOUT_SECONDS,
            "elapsed_ms": round((time.time() - started) * 1000, 2),
            "success_count": ok_count,
            "fail_count": fail_count,
        },
        "results": results,
    }

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Готово. Отчёт сохранён: {OUTPUT_JSON}")
    print(f"Успешно: {ok_count}, ошибок: {fail_count}")


if __name__ == "__main__":
    main()
