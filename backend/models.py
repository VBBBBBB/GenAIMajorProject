"""
LatticeForge - Data Models (Pydantic)
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Tuple, Any


# ---------------------------------------------------------------------------
# Formal Concept Analysis
# ---------------------------------------------------------------------------

class FormalContext(BaseModel):
    tasks: List[str]
    attributes: List[str]
    attribute_labels: Dict[str, str]
    incidence: Dict[str, List[int]]  # task -> binary attribute vector


class FormalConcept(BaseModel):
    id: str
    extent: List[str]   # set of tasks (objects)
    intent: List[str]   # set of attributes
    level: int = 0      # depth in Hasse diagram


class ConceptLattice(BaseModel):
    concepts: List[FormalConcept]
    edges: List[Tuple[str, str]]  # (parent_id, child_id) — Hasse diagram edges
    top_concept_id: str
    bottom_concept_id: str


# ---------------------------------------------------------------------------
# Pareto Frontier
# ---------------------------------------------------------------------------

class Configuration(BaseModel):
    id: str
    name: str
    model: str
    prompt_style: str
    tool_chain: List[str]
    quality: float   = Field(ge=0, le=1)
    latency_ms: float
    cost_per_query: float
    is_pareto_optimal: bool = True


class ParetoFrontier(BaseModel):
    concept_id: str
    configurations: List[Configuration]
    pareto_front: List[str]   # ids of non-dominated configs
    pool: Optional[str] = None  # configuration pool selected from the concept intent


# ---------------------------------------------------------------------------
# Runtime Router
# ---------------------------------------------------------------------------

class TaskRequest(BaseModel):
    task_description: str
    priority_quality: float = Field(default=0.4, ge=0, le=1)
    priority_latency: float = Field(default=0.3, ge=0, le=1)
    priority_cost: float    = Field(default=0.3, ge=0, le=1)
    user_tier: str = "standard"   # "standard" | "premium" | "bulk"
    urgency: str   = "normal"     # "low" | "normal" | "high" | "critical"


class RoutingResult(BaseModel):
    task_description: str
    extracted_attributes: List[str]
    matched_concept: FormalConcept
    selected_configuration: Configuration
    priority_weights: Dict[str, float]
    reasoning: str
    execution_result: Optional[str] = None
    latency_ms: float = 0.0
    cost_estimate: float = 0.0


# ---------------------------------------------------------------------------
# Self-Refactoring
# ---------------------------------------------------------------------------

class ToolUpdateRequest(BaseModel):
    action: str             # "add" | "remove"
    tool_name: str
    tool_label: str
    affected_tasks: List[str] = []


class RedundancyReport(BaseModel):
    tool: str
    is_redundant: bool
    subsumed_by: List[str]
    explanation: str


class GapReport(BaseModel):
    attribute_set: List[str]
    has_covering_concept: bool
    nearest_concept_id: Optional[str] = None
    missing_attributes: List[str] = []
    recommendation: str


# ---------------------------------------------------------------------------
# Telemetry
# ---------------------------------------------------------------------------

class TelemetryEntry(BaseModel):
    execution_id: str
    task_description: str
    concept_id: str
    config_id: str
    measured_quality: float
    actual_latency_ms: float
    billed_cost: float
    timestamp: str


class TelemetrySummary(BaseModel):
    total_executions: int
    avg_quality: float
    avg_latency_ms: float
    avg_cost: float
    concept_distribution: Dict[str, int]
    config_distribution: Dict[str, int]
    recent_entries: List[TelemetryEntry]
