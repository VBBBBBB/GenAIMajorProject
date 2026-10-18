"""
LatticeForge - FastAPI Backend
All REST API endpoints for:
  - Formal context & concept lattice
  - Pareto frontier queries
  - Runtime routing (Groq-powered)
  - Self-refactoring operations
  - Telemetry
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure backend directory is on path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import List

load_dotenv()

from models import TaskRequest, ToolUpdateRequest
from fca_engine import (
    load_formal_context, save_formal_context, compute_concept_lattice,
    find_concept_for_attributes,
    lattice_to_dict, galois_closure_from_attrs
)
from pareto_engine import (
    get_pareto_frontier_for_concept, get_pareto_frontier_for_pool,
    pareto_frontier_to_dict,
    compute_pareto_front, get_all_configurations_for_pool, select_from_frontier
)
from router import route_and_execute, extract_attributes
from self_refactor import (
    add_tool, remove_tool, check_redundancy, detect_gap,
    run_maintenance_cycle, recompute_pareto_fronts
)
import telemetry

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="LatticeForge API",
    description="Pareto-Optimal Agent Capability Refactoring via Formal Concept Analysis",
    version="1.0.0",
)

# Allowed origins: comma-separated via env, defaulting to the local dev origins.
# (A wildcard origin cannot be combined with credentials, so we list explicitly.)
_cors_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
)
ALLOWED_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the built frontend (Vite `dist`) if it exists. During development the
# app is served by the Vite dev server, so nothing is mounted here.
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIST)), name="static")
    if (FRONTEND_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.get("/")
async def serve_frontend():
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {"message": "LatticeForge API running. Visit /docs for API documentation."}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "groq_model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "groq_key_set": bool(os.getenv("GROQ_API_KEY")),
    }


# ---------------------------------------------------------------------------
# Phase 1: Formal Context & Concept Lattice
# ---------------------------------------------------------------------------

@app.get("/api/context")
async def get_context():
    """Return the current formal context (tasks × attributes matrix)."""
    ctx = load_formal_context()
    return ctx.model_dump()


@app.post("/api/context/update-cell")
async def update_context_cell(task: str, attribute: str, value: int):
    """Toggle a single cell in the formal context matrix."""
    ctx = load_formal_context()
    if task not in ctx.tasks:
        raise HTTPException(404, f"Task '{task}' not found")
    if attribute not in ctx.attributes:
        raise HTTPException(404, f"Attribute '{attribute}' not found")
    idx = ctx.attributes.index(attribute)
    row = ctx.incidence.get(task, [0] * len(ctx.attributes))
    row[idx] = 1 if value else 0
    ctx.incidence[task] = row
    save_formal_context(ctx)
    return {"status": "updated", "task": task, "attribute": attribute, "value": value}


@app.get("/api/lattice")
async def get_lattice():
    """Compute and return the complete concept lattice."""
    ctx     = load_formal_context()
    lattice = compute_concept_lattice(ctx)
    return lattice_to_dict(lattice)


@app.post("/api/lattice/galois-closure")
async def galois_closure(attributes: List[str]):
    """Given a set of attributes, compute the Galois closure and find the exact formal concept."""
    ctx     = load_formal_context()
    lattice = compute_concept_lattice(ctx)
    attr_set = set(attributes) & set(ctx.attributes)

    if not attr_set:
        raise HTTPException(400, "No valid attributes provided")

    extent, intent = galois_closure_from_attrs(attr_set, ctx)
    concept = find_concept_for_attributes(attr_set, lattice)

    return {
        "query_attributes":  sorted(attributes),
        "valid_attributes":  sorted(attr_set),
        "galois_extent":     sorted(extent),
        "galois_intent":     sorted(intent),
        "matched_concept":   concept.model_dump() if concept else None,
        "gap_detected":      concept is None,
    }


# ---------------------------------------------------------------------------
# Phase 2: Pareto Frontier
# ---------------------------------------------------------------------------

@app.get("/api/pareto/{concept_id}")
async def get_pareto_for_concept(concept_id: str):
    """Get the Pareto frontier for a specific formal concept."""
    pf = get_pareto_frontier_for_concept(concept_id)
    return pareto_frontier_to_dict(pf)


@app.get("/api/pareto/pool/{pool}")
async def get_pool_configs(pool: str = "default"):
    """Return all configurations in a pool with Pareto dominance computed."""
    configs = get_all_configurations_for_pool(pool)
    front   = compute_pareto_front(configs)
    front_ids = {c.id for c in front}
    return {
        "pool": pool,
        "configurations": [c.model_dump() for c in configs],
        "pareto_front_ids": list(front_ids),
        "pareto_size": len(front),
    }


@app.post("/api/pareto/select")
async def select_config(
    concept_id: str,
    weight_quality: float = 0.4,
    weight_latency: float = 0.3,
    weight_cost:    float = 0.3,
):
    """Select the best configuration on the Pareto frontier given priority weights."""
    pf     = get_pareto_frontier_for_concept(concept_id)
    front  = [c for c in pf.configurations if c.id in pf.pareto_front]
    weights = {
        "quality": weight_quality,
        "latency": weight_latency,
        "cost":    weight_cost,
    }
    selected = select_from_frontier(front, weights)
    return {
        "concept_id":  concept_id,
        "pool":        pf.pool,
        "weights":     weights,
        "selected":    selected.model_dump() if selected else None,
        "front_size":  len(front),
    }


@app.post("/api/pareto/select-pool")
async def select_config_from_pool(
    pool: str = "default",
    weight_quality: float = 0.4,
    weight_latency: float = 0.3,
    weight_cost:    float = 0.3,
):
    """Select the best configuration from an explicitly named pool's Pareto frontier."""
    pf     = get_pareto_frontier_for_pool(pool)
    front  = [c for c in pf.configurations if c.id in pf.pareto_front]
    weights = {
        "quality": weight_quality,
        "latency": weight_latency,
        "cost":    weight_cost,
    }
    selected = select_from_frontier(front, weights)
    return {
        "pool":       pf.pool,
        "weights":    weights,
        "selected":   selected.model_dump() if selected else None,
        "front_size": len(front),
    }


# ---------------------------------------------------------------------------
# Phase 3: Runtime Router
# ---------------------------------------------------------------------------

@app.post("/api/route")
async def route_task(request: TaskRequest):
    """
    Full LatticeForge routing pipeline:
    Task -> Groq Attribute Extraction -> Galois Closure -> Concept ->
    Pareto Selection -> Config -> Groq Execution -> Telemetry
    """
    try:
        result = route_and_execute(request)
        return result.model_dump()
    except Exception as e:
        raise HTTPException(500, f"Routing failed: {str(e)}")


@app.post("/api/route/extract-attributes")
async def extract_task_attributes(task_description: str):
    """Use Groq to extract required capability attributes from a task description."""
    try:
        ctx   = load_formal_context()
        attrs = extract_attributes(task_description)
        valid = [a for a in attrs if a in ctx.attributes]
        unknown = [a for a in attrs if a not in ctx.attributes]
        return {
            "task": task_description,
            "extracted_attributes": attrs,
            "valid_attributes": valid,
            "unknown_attributes": unknown,
        }
    except Exception as e:
        raise HTTPException(500, f"Attribute extraction failed: {str(e)}")


# ---------------------------------------------------------------------------
# Phase 4: Self-Refactoring
# ---------------------------------------------------------------------------

@app.post("/api/refactor/add-tool")
async def api_add_tool(request: ToolUpdateRequest):
    return add_tool(request)


@app.post("/api/refactor/remove-tool")
async def api_remove_tool(request: ToolUpdateRequest):
    return remove_tool(request)


@app.get("/api/refactor/redundancy/{tool_name}")
async def api_check_redundancy(tool_name: str):
    report = check_redundancy(tool_name)
    return report.model_dump()


@app.post("/api/refactor/gap-detection")
async def api_detect_gap(attributes: List[str]):
    report = detect_gap(attributes)
    return report.model_dump()


@app.post("/api/refactor/recompute-pareto")
async def api_recompute_pareto(background_tasks: BackgroundTasks):
    """Trigger nightly Pareto front recomputation from telemetry."""
    background_tasks.add_task(recompute_pareto_fronts)
    return {"status": "triggered", "message": "Pareto recomputation started in background."}


@app.post("/api/refactor/maintenance-cycle")
async def api_maintenance_cycle():
    """Run full self-refactoring maintenance cycle."""
    return run_maintenance_cycle()


@app.get("/api/benchmark/random")
async def run_benchmark():
    """Run a random comparison task between Vector Search and LatticeForge."""
    try:
        from prove_it import run_random_benchmark_task
        return run_random_benchmark_task()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# 5. Telemetry Endpoints
# ==============================================================================

@app.get("/api/telemetry")
async def get_telemetry():
    summary = telemetry.get_summary()
    return summary.model_dump()


@app.get("/api/telemetry/entries")
async def get_telemetry_entries(limit: int = 50):
    entries = telemetry.get_all_entries()
    return {
        "total": len(entries),
        "entries": [e.model_dump() for e in entries[:limit]],
    }


@app.get("/api/telemetry/concept/{concept_id}")
async def get_concept_telemetry(concept_id: str):
    return telemetry.get_concept_perf(concept_id)
