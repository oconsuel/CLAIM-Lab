import json
import re
import time

from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from admin.db import get_connection

PRACTICE_PATH_RE = re.compile(r"/practices/([^/]+)")
RUN_ENDPOINTS = ("/run-beginner", "/run-researcher", "/run-engineer")
SKIP_PREFIXES = ("/admin", "/health", "/docs", "/openapi", "/track")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if any(path.startswith(p) for p in SKIP_PREFIXES):
            return await call_next(request)

        start = time.time()
        practice_id = self._extract_practice_id_sync(request)

        if not practice_id and request.method == "POST" and path.startswith(RUN_ENDPOINTS):
            try:
                body = await request.body()
                practice_id = json.loads(body).get("practice_id")
            except Exception:
                pass

        response = await call_next(request)
        elapsed_ms = round((time.time() - start) * 1000, 2)

        try:
            conn = get_connection()
            conn.execute(
                "INSERT INTO admin_logs (practice_id, endpoint, response_time_ms, status_code) VALUES (?, ?, ?, ?)",
                (practice_id, path, elapsed_ms, response.status_code),
            )
            conn.commit()
            conn.close()
        except Exception:
            pass

        return response

    @staticmethod
    def _extract_practice_id_sync(request: Request) -> Optional[str]:
        pid = request.query_params.get("practice") or request.query_params.get(
            "practice_id"
        )
        if pid:
            return pid
        match = PRACTICE_PATH_RE.search(request.url.path)
        if match and match.group(1) != "status":
            return match.group(1)
        return None
