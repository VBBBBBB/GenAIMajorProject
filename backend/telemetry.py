"""
LatticeForge - Telemetry Engine
Logs every execution to SQLite and provides aggregated statistics.
"""
from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict

from models import TelemetryEntry, TelemetrySummary

DATA_DIR = Path(__file__).parent / "data"
DB_PATH  = DATA_DIR / "telemetry.db"


# ---------------------------------------------------------------------------
# DB initialisation
# ---------------------------------------------------------------------------

def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS executions (
            execution_id    TEXT PRIMARY KEY,
            task_description TEXT,
            concept_id      TEXT,
            config_id       TEXT,
            measured_quality REAL,
            actual_latency_ms REAL,
            billed_cost     REAL,
            timestamp       TEXT
        )
    """)
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------

def log_execution(
    task_description: str,
    concept_id: str,
    config_id: str,
    measured_quality: float,
    actual_latency_ms: float,
    billed_cost: float,
) -> TelemetryEntry:
    init_db()
    entry = TelemetryEntry(
        execution_id     = str(uuid.uuid4()),
        task_description = task_description,
        concept_id       = concept_id,
        config_id        = config_id,
        measured_quality = round(measured_quality, 4),
        actual_latency_ms= round(actual_latency_ms, 2),
        billed_cost      = round(billed_cost, 6),
        timestamp        = datetime.now(timezone.utc).isoformat(),
    )
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO executions VALUES (?,?,?,?,?,?,?,?)",
        (
            entry.execution_id, entry.task_description, entry.concept_id,
            entry.config_id,    entry.measured_quality,  entry.actual_latency_ms,
            entry.billed_cost,  entry.timestamp,
        )
    )
    conn.commit()
    conn.close()
    return entry


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

def get_all_entries() -> List[TelemetryEntry]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT * FROM executions ORDER BY timestamp DESC"
    ).fetchall()
    conn.close()
    return [
        TelemetryEntry(
            execution_id=r[0], task_description=r[1], concept_id=r[2],
            config_id=r[3], measured_quality=r[4], actual_latency_ms=r[5],
            billed_cost=r[6], timestamp=r[7]
        )
        for r in rows
    ]


def get_summary() -> TelemetrySummary:
    entries = get_all_entries()
    if not entries:
        return TelemetrySummary(
            total_executions=0, avg_quality=0.0, avg_latency_ms=0.0,
            avg_cost=0.0, concept_distribution={}, config_distribution={},
            recent_entries=[]
        )

    total = len(entries)
    avg_q = sum(e.measured_quality   for e in entries) / total
    avg_l = sum(e.actual_latency_ms  for e in entries) / total
    avg_c = sum(e.billed_cost        for e in entries) / total

    concept_dist: Dict[str, int] = {}
    config_dist:  Dict[str, int] = {}
    for e in entries:
        concept_dist[e.concept_id] = concept_dist.get(e.concept_id, 0) + 1
        config_dist[e.config_id]   = config_dist.get(e.config_id,   0) + 1

    return TelemetrySummary(
        total_executions   = total,
        avg_quality        = round(avg_q, 4),
        avg_latency_ms     = round(avg_l, 2),
        avg_cost           = round(avg_c, 6),
        concept_distribution = concept_dist,
        config_distribution  = config_dist,
        recent_entries       = entries[:20],
    )


def get_concept_perf(concept_id: str) -> Dict:
    """Return per-config performance stats for a given concept."""
    entries = [e for e in get_all_entries() if e.concept_id == concept_id]
    if not entries:
        return {}
    stats: Dict[str, Dict] = {}
    for e in entries:
        if e.config_id not in stats:
            stats[e.config_id] = {"quality": [], "latency": [], "cost": [], "count": 0}
        stats[e.config_id]["quality"].append(e.measured_quality)
        stats[e.config_id]["latency"].append(e.actual_latency_ms)
        stats[e.config_id]["cost"].append(e.billed_cost)
        stats[e.config_id]["count"] += 1

    result = {}
    for cid, d in stats.items():
        n = d["count"]
        result[cid] = {
            "count": n,
            "avg_quality":  sum(d["quality"])  / n,
            "avg_latency":  sum(d["latency"])  / n,
            "avg_cost":     sum(d["cost"])      / n,
        }
    return result
