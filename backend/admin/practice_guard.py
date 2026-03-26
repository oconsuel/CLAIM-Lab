import json
import re

from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from admin.db import get_connection

PRACTICE_PATH_RE = re.compile(r"/practices/([^/]+)")
RUN_ENDPOINTS = ("/run-beginner", "/run-researcher", "/run-engineer")
SKIP_PATHS = ("/admin", "/health", "/docs", "/openapi", "/practices/status")


class PracticeGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if any(path.startswith(p) for p in SKIP_PATHS):
            return await call_next(request)

        practice_id: Optional[str] = None

        match = PRACTICE_PATH_RE.search(path)
        if match and match.group(1) != "status":
            practice_id = match.group(1)

        if not practice_id and request.method == "POST" and path.startswith(RUN_ENDPOINTS):
            try:
                body = await request.body()
                practice_id = json.loads(body).get("practice_id")
            except Exception:
                pass

        if practice_id:
            try:
                conn = get_connection()
                row = conn.execute(
                    "SELECT is_enabled FROM practice_settings WHERE practice_id = ?",
                    (practice_id,),
                ).fetchone()
                conn.close()
                if row and not row["is_enabled"]:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Практикум недоступен"},
                    )
            except Exception:
                pass

        return await call_next(request)
