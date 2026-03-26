from fastapi import APIRouter, Depends
from pydantic import BaseModel

from admin.auth import verify_token
from admin.db import get_connection

admin_router = APIRouter(prefix="/admin", dependencies=[Depends(verify_token)])
public_router = APIRouter()


class PracticeUpdate(BaseModel):
    is_enabled: bool


@admin_router.get("/analytics")
async def get_analytics():
    conn = get_connection()

    run_endpoints = ("/run-beginner", "/run-researcher", "/run-engineer")
    placeholders = ",".join(["?"] * len(run_endpoints))

    total_runs = conn.execute(
        f"SELECT COUNT(*) as cnt FROM admin_logs WHERE endpoint IN ({placeholders})",
        run_endpoints,
    ).fetchone()["cnt"]

    total_visits = conn.execute(
        "SELECT COUNT(*) as cnt FROM practice_visits"
    ).fetchone()["cnt"]

    runs_by_practice = {
        row["practice_id"]: row["count"]
        for row in conn.execute(
            f"SELECT practice_id, COUNT(*) as count FROM admin_logs "
            f"WHERE practice_id IS NOT NULL AND endpoint IN ({placeholders}) "
            f"GROUP BY practice_id",
            run_endpoints,
        ).fetchall()
    }

    visits_by_practice = {
        row["practice_id"]: row["count"]
        for row in conn.execute(
            "SELECT practice_id, COUNT(*) as count FROM practice_visits "
            "GROUP BY practice_id"
        ).fetchall()
    }

    errors_by_practice = {
        row["practice_id"]: row["errors"]
        for row in conn.execute(
            f"SELECT practice_id, "
            f"SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors "
            f"FROM admin_logs "
            f"WHERE practice_id IS NOT NULL AND endpoint IN ({placeholders}) "
            f"GROUP BY practice_id",
            run_endpoints,
        ).fetchall()
    }

    avg_run_time_ms = {
        row["practice_id"]: row["avg_ms"]
        for row in conn.execute(
            f"SELECT practice_id, ROUND(AVG(response_time_ms), 2) as avg_ms "
            f"FROM admin_logs "
            f"WHERE practice_id IS NOT NULL AND endpoint IN ({placeholders}) "
            f"GROUP BY practice_id",
            run_endpoints,
        ).fetchall()
    }

    practice_status = {
        row["practice_id"]: bool(row["is_enabled"])
        for row in conn.execute(
            "SELECT practice_id, is_enabled FROM practice_settings"
        ).fetchall()
    }

    rows = conn.execute(
        f"SELECT date(timestamp) as date, practice_id, COUNT(*) as count "
        f"FROM admin_logs "
        f"WHERE practice_id IS NOT NULL AND endpoint IN ({placeholders}) "
        f"AND timestamp >= datetime('now', '-30 days') "
        f"GROUP BY date(timestamp), practice_id "
        f"ORDER BY date(timestamp)",
        run_endpoints,
    ).fetchall()

    by_day_map = {}
    for r in rows:
        day = r["date"]
        pid = r["practice_id"]
        cnt = r["count"]
        if day not in by_day_map:
            by_day_map[day] = {"date": day, "total_runs": 0, "practices": {}}
        by_day_map[day]["total_runs"] += cnt
        by_day_map[day]["practices"][pid] = cnt

    by_day = [by_day_map[k] for k in sorted(by_day_map.keys())]

    conn.close()

    return {
        "total_runs": total_runs,
        "total_visits": total_visits,
        "runs_by_practice": runs_by_practice,
        "visits_by_practice": visits_by_practice,
        "errors_by_practice": errors_by_practice,
        "practice_status": practice_status,
        "by_day": by_day,
        "avg_run_time_ms": avg_run_time_ms,
    }


@admin_router.get("/practices")
async def get_practices():
    conn = get_connection()
    rows = conn.execute(
        "SELECT practice_id, is_enabled FROM practice_settings"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@admin_router.patch("/practices/{practice_id}")
async def update_practice(practice_id: str, body: PracticeUpdate):
    is_enabled = 1 if body.is_enabled else 0
    conn = get_connection()
    conn.execute(
        "INSERT INTO practice_settings (practice_id, is_enabled) VALUES (?, ?) "
        "ON CONFLICT(practice_id) DO UPDATE SET is_enabled = ?",
        (practice_id, is_enabled, is_enabled),
    )
    conn.commit()
    conn.close()
    return {"practice_id": practice_id, "is_enabled": bool(is_enabled)}


@public_router.get("/practices/status")
async def get_practice_status():
    conn = get_connection()
    rows = conn.execute(
        "SELECT practice_id, is_enabled FROM practice_settings"
    ).fetchall()
    conn.close()
    return {row["practice_id"]: bool(row["is_enabled"]) for row in rows}


class PracticeVisit(BaseModel):
    practice_id: str


@public_router.post("/track/practice-visit")
async def track_practice_visit(body: PracticeVisit):
    conn = get_connection()
    last = conn.execute(
        "SELECT timestamp FROM practice_visits WHERE practice_id = ? "
        "ORDER BY id DESC LIMIT 1",
        (body.practice_id,),
    ).fetchone()

    should_insert = True
    if last:
        diff = conn.execute(
            "SELECT (julianday('now') - julianday(?)) * 86400.0 as diff_seconds",
            (last["timestamp"],),
        ).fetchone()
        if diff and diff["diff_seconds"] is not None and diff["diff_seconds"] < 0.8:
            should_insert = False

    if should_insert:
        conn.execute(
            "INSERT INTO practice_visits (practice_id) VALUES (?)",
            (body.practice_id,),
        )
    conn.commit()
    conn.close()
    return {"ok": True}
