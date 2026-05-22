import sqlite3
import json
import requests
import schedule
import threading
import time
from datetime import datetime
from flask import Flask, request, jsonify, render_template


app = Flask(__name__)


DB_NAME = "endpoints.db"
INTERVALS = {
    "1": 1,
    "5": 5,
    "10": 10,
    "24": 24
}


def get_db():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        last_checked TEXT,
        last_status TEXT DEFAULT 'never',
        change_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(endpoint_id) REFERENCES endpoints(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint_id INTEGER NOT NULL,
        change_type TEXT NOT NULL,
        detail TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(endpoint_id) REFERENCES endpoints(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS check_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(endpoint_id) REFERENCES endpoints(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        interval_hours INTEGER NOT NULL,
        language TEXT NOT NULL DEFAULT 'sk'
    )
    """)

    cur.execute("PRAGMA table_info(settings)")
    columns = [row[1] for row in cur.fetchall()]
    if "language" not in columns:
        cur.execute("ALTER TABLE settings ADD COLUMN language TEXT NOT NULL DEFAULT 'sk'")

    cur.execute("SELECT * FROM settings WHERE id = 1")
    if cur.fetchone() is None:
        cur.execute("INSERT INTO settings (id, interval_hours, language) VALUES (1, 1, 'sk')")

    conn.commit()
    conn.close()


def fetch_openapi(url):
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    return response.json()


def make_diff(old_data, new_data):
    result = []

    old_paths = old_data.get("paths", {}) if isinstance(old_data, dict) else {}
    new_paths = new_data.get("paths", {}) if isinstance(new_data, dict) else {}

    for path in new_paths:
        if path not in old_paths:
            result.append({
                "change_type": "endpoint_added",
                "detail": f"Pridaný endpoint {path}",
                "old_value": "",
                "new_value": path
            })

    for path in old_paths:
        if path not in new_paths:
            result.append({
                "change_type": "endpoint_removed",
                "detail": f"Odstránený endpoint {path}",
                "old_value": path,
                "new_value": ""
            })

    for path in old_paths:
        if path in new_paths:
            old_methods = old_paths[path]
            new_methods = new_paths[path]

            for method in new_methods:
                if method not in old_methods:
                    result.append({
                        "change_type": "method_added",
                        "detail": f"Pridaná metóda {method.upper()} na {path}",
                        "old_value": "",
                        "new_value": method.upper()
                    })

            for method in old_methods:
                if method not in new_methods:
                    result.append({
                        "change_type": "method_removed",
                        "detail": f"Odstránená metóda {method.upper()} z {path}",
                        "old_value": method.upper(),
                        "new_value": ""
                    })

    return result


def log_check(endpoint_id, status, message):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO check_logs (endpoint_id, status, message, created_at)
        VALUES (?, ?, ?, ?)
    """, (endpoint_id, status, message, datetime.now().strftime("%d-%m-%Y %H:%M:%S")))
    conn.commit()
    conn.close()


def run_check(endpoint_id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM endpoints WHERE id = ?", (endpoint_id,))
    endpoint = cur.fetchone()
    if not endpoint:
        conn.close()
        return False, "Endpoint neexistuje"

    try:
        new_data = fetch_openapi(endpoint["url"])
        new_json = json.dumps(new_data, sort_keys=True)
        now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

        cur.execute("""
            SELECT * FROM snapshots
            WHERE endpoint_id = ?
            ORDER BY id DESC
            LIMIT 1
        """, (endpoint_id,))
        last_snapshot = cur.fetchone()

        # Prvý snapshot – nastavíme last_status na "ok"
        if last_snapshot is None:
            cur.execute("""
                INSERT INTO snapshots (endpoint_id, content, created_at)
                VALUES (?, ?, ?)
            """, (endpoint_id, new_json, now))

            cur.execute("""
                UPDATE endpoints
                SET last_checked = ?, last_status = ?
                WHERE id = ?
            """, (now, "ok", endpoint_id))

            conn.commit()
            conn.close()
            log_check(endpoint_id, "ok", "Prvý snapshot uložený")
            return True, "Prvý snapshot uložený"

        # Porovnanie s posledným snapshotom
        old_data = json.loads(last_snapshot["content"])
        diffs = make_diff(old_data, new_data)

        if diffs:
            # Uložíme nový snapshot
            cur.execute("""
                INSERT INTO snapshots (endpoint_id, content, created_at)
                VALUES (?, ?, ?)
            """, (endpoint_id, new_json, now))

            # Uložíme jednotlivé zmeny
            for item in diffs:
                cur.execute("""
                    INSERT INTO changes (endpoint_id, change_type, detail, old_value, new_value, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    endpoint_id,
                    item["change_type"],
                    item["detail"],
                    item["old_value"],
                    item["new_value"],
                    now
                ))

            # Aktualizujeme endpoint – last_status sa nastaví na "changed"
            cur.execute("""
                UPDATE endpoints
                SET last_checked = ?, last_status = ?, change_count = change_count + ?
                WHERE id = ?
            """, (now, "changed", len(diffs), endpoint_id))

            conn.commit()
            conn.close()
            log_check(endpoint_id, "changed", f"Počet zmien: {len(diffs)}")
            return True, f"Nájdené zmeny: {len(diffs)}"

        # Žiadne zmeny – aktualizujeme iba last_checked, last_status necháme pôvodný
        cur.execute("""
            UPDATE endpoints
            SET last_checked = ?
            WHERE id = ?
        """, (now, endpoint_id))

        conn.commit()
        conn.close()
        log_check(endpoint_id, "no_change", "Žiadne zmeny")
        return True, "Žiadne zmeny"

    except Exception as e:
        # Pri chybe nastavíme last_status na "error"
        cur.execute("""
            UPDATE endpoints
            SET last_checked = ?, last_status = ?
            WHERE id = ?
        """, (datetime.now().strftime("%d-%m-%Y %H:%M:%S"), "error", endpoint_id))
        conn.commit()
        conn.close()
        log_check(endpoint_id, "error", str(e))
        return False, str(e)


def run_all_checks():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM endpoints")
    rows = cur.fetchall()
    conn.close()

    for row in rows:
        run_check(row["id"])


def get_saved_interval():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT interval_hours FROM settings WHERE id = 1")
    row = cur.fetchone()
    conn.close()
    return row["interval_hours"] if row else 1


def get_saved_language():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT language FROM settings WHERE id = 1")
    row = cur.fetchone()
    conn.close()
    return row["language"] if row else "sk"


def reset_scheduler(hours):
    schedule.clear("api-checks")
    schedule.every(hours).hours.do(run_all_checks).tag("api-checks")


def scheduler_worker():
    while True:
        schedule.run_pending()
        time.sleep(1)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/settings", methods=["GET"])
def api_get_settings():
    return jsonify({
        "interval_hours": get_saved_interval(),
        "language": get_saved_language()
    })


@app.route("/api/settings", methods=["POST"])
def api_set_settings():
    data = request.get_json(silent=True) or {}
    interval_id = str(data.get("interval_id", "1"))
    language = str(data.get("language", "sk")).lower()

    if interval_id not in INTERVALS:
        return jsonify({"error": "Neplatný interval"}), 400
    if language not in ["sk", "en"]:
        return jsonify({"error": "Neplatný jazyk"}), 400

    hours = INTERVALS[interval_id]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE settings SET interval_hours = ?, language = ? WHERE id = 1", (hours, language))
    conn.commit()
    conn.close()

    reset_scheduler(hours)
    return jsonify({"interval_hours": hours, "language": language})


@app.route("/api/endpoints", methods=["GET"])
def api_get_endpoints():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, url, last_checked, last_status, change_count, created_at
        FROM endpoints
        ORDER BY id DESC
    """)
    rows = cur.fetchall()
    conn.close()

    return jsonify([{
        "id": row["id"],
        "name": row["name"],
        "url": row["url"],
        "last_checked": row["last_checked"],
        "last_status": row["last_status"],
        "change_count": row["change_count"],
        "created_at": row["created_at"]
    } for row in rows])


@app.route("/api/endpoints", methods=["POST"])
def api_create_endpoint():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    url = (data.get("url") or "").strip()

    if not name or not url:
        return jsonify({"error": "Názov a URL sú povinné"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO endpoints (name, url, created_at)
        VALUES (?, ?, ?)
    """, (name, url, datetime.now().strftime("%d-%m-%Y %H:%M:%S")))
    endpoint_id = cur.lastrowid
    conn.commit()
    conn.close()

    # spusti prvú kontrolu v background threade, aby neblokovala request
    threading.Thread(
        target=run_check, args=(endpoint_id,), daemon=True
    ).start()

    return jsonify({
        "id": endpoint_id,
        "message": "Endpoint pridaný, prvá kontrola prebieha"
    }), 201


@app.route("/api/endpoints/<int:endpoint_id>", methods=["DELETE"])
def api_delete_endpoint(endpoint_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM changes WHERE endpoint_id = ?", (endpoint_id,))
    cur.execute("DELETE FROM check_logs WHERE endpoint_id = ?", (endpoint_id,))
    cur.execute("DELETE FROM snapshots WHERE endpoint_id = ?", (endpoint_id,))
    cur.execute("DELETE FROM endpoints WHERE id = ?", (endpoint_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Endpoint zmazaný"})


@app.route("/api/check/<int:endpoint_id>", methods=["POST"])
def api_manual_check(endpoint_id):
    ok, message = run_check(endpoint_id)
    if ok:
        return jsonify({"message": message})
    return jsonify({"error": message}), 500


@app.route("/api/changes/<int:endpoint_id>", methods=["GET"])
def api_get_changes(endpoint_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, change_type, detail, old_value, new_value, created_at
        FROM changes
        WHERE endpoint_id = ?
        ORDER BY id DESC
    """, (endpoint_id,))
    rows = cur.fetchall()
    conn.close()

    return jsonify([{
        "id": row["id"],
        "change_type": row["change_type"],
        "detail": row["detail"],
        "old_value": row["old_value"],
        "new_value": row["new_value"],
        "created_at": row["created_at"]
    } for row in rows])


@app.route("/api/logs/<int:endpoint_id>", methods=["GET"])
def api_get_logs(endpoint_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, status, message, created_at
        FROM check_logs
        WHERE endpoint_id = ?
        ORDER BY id DESC
    """, (endpoint_id,))
    rows = cur.fetchall()
    conn.close()

    return jsonify([{
        "id": row["id"],
        "status": row["status"],
        "message": row["message"],
        "created_at": row["created_at"]
    } for row in rows])


if __name__ == "__main__":
    init_db()
    reset_scheduler(get_saved_interval())
    thread = threading.Thread(target=scheduler_worker, daemon=True)
    thread.start()
    app.run(host="127.0.0.1", port=5000, debug=True)