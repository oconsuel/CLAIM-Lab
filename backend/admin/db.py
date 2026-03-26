import os
import sqlite3

DEFAULT_DB_PATH = os.path.join(
    os.path.dirname(__file__), "logs", "admin_logs.db"
)
DB_PATH = os.environ.get("ADMIN_DB_PATH", DEFAULT_DB_PATH)


def get_connection() -> sqlite3.Connection:
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            practice_id TEXT,
            endpoint TEXT NOT NULL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now')),
            response_time_ms REAL,
            status_code INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS practice_visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            practice_id TEXT NOT NULL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS practice_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            practice_id TEXT UNIQUE NOT NULL,
            is_enabled INTEGER NOT NULL DEFAULT 1
        )
    """)
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON admin_logs(timestamp)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_logs_practice ON admin_logs(practice_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_visits_timestamp ON practice_visits(timestamp)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_visits_practice ON practice_visits(practice_id)"
    )
    conn.commit()
    conn.close()
