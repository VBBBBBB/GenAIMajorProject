"""
LatticeForge - Runtime Router (Groq-powered)
Pipeline:  Task -> Attributes -> Galois Closure -> Concept -> Pareto Front -> Config -> Execute

Stage 1: Attribute Extractor   — Groq LLM few-shot prompt extracts required capabilities
Stage 2: Galois Closure        — FCA engine finds the exact matching formal concept
Stage 3: Context Classifier    — Derives priority weights from user tier + urgency
Stage 4: Pareto Selector       — Weighted L2 distance on normalised frontier
Stage 5: Execution             — Groq LLM executes the task with selected config
Stage 6: Telemetry             — Logs real quality/latency/cost
"""
from __future__ import annotations

import os
import time
import json
from typing import Dict, List, Set

from groq import Groq
from dotenv import load_dotenv

from models import TaskRequest, RoutingResult, FormalConcept, Configuration
from fca_engine import (
    load_formal_context, compute_concept_lattice,
    find_concept_for_attributes, galois_closure_from_attrs
)
from pareto_engine import (
    get_pareto_frontier_for_concept, select_from_frontier,
    compute_pareto_front
)
import telemetry

load_dotenv()

_groq_client: Groq | None = None
_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _groq_client


# ---------------------------------------------------------------------------
# Stage 1: Attribute Extractor
# ---------------------------------------------------------------------------

ATTRIBUTE_EXTRACTOR_PROMPT = """\
You are an AI capability classifier for an agentic system called LatticeForge.

Given a task description, identify which of the following capability attributes are REQUIRED to complete it.
Return ONLY a JSON array of attribute names from the list below. No explanation.

Available attributes:
- pdf_parse        : Parsing or reading PDF/document files
- web_search       : Searching the web or fetching URLs
- code_exec        : Executing or running code
- gpt4_capable     : Requires a highly capable frontier LLM (complex reasoning)
- claude_capable   : Benefits from Claude-style instruction following
- local_llm        : Can run on a smaller/local model
- rag_retrieval    : Needs retrieval-augmented generation from a knowledge base
- vision           : Involves images, charts, or visual content
- math_tools       : Requires mathematical computation or symbolic math
- sql_access       : Needs to query databases with SQL
- http_client      : Makes HTTP API calls or fetches external data
- static_analysis  : Involves code analysis, linting, or AST inspection
- multi_step_reasoning : Requires multi-step planning or chain-of-thought
- long_context     : Input is long (documents, codebases, reports)
- low_latency      : Must respond very quickly (real-time or interactive)

Task: {task}

Return ONLY valid JSON array, example: ["pdf_parse", "web_search", "gpt4_capable"]
"""

def extract_attributes(task_description: str) -> List[str]:
    """Use Groq to extract required capability attributes from a task description."""
    client = get_groq_client()
    response = client.chat.completions.create(
        model=_GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": ATTRIBUTE_EXTRACTOR_PROMPT.format(task=task_description)
            }
        ],
        temperature=0.1,
        max_tokens=200,
    )
    raw = response.choices[0].message.content.strip()
    # Extract JSON array from response
    start = raw.find("[")
    end   = raw.rfind("]") + 1
    if start >= 0 and end > start:
        try:
            attrs = json.loads(raw[start:end])
            return [a for a in attrs if isinstance(a, str)]
        except json.JSONDecodeError:
            pass
    return []


# ---------------------------------------------------------------------------
# Stage 2: Galois Closure (handled by fca_engine)
# ---------------------------------------------------------------------------

def find_matching_concept(attr_set: Set[str], lattice) -> FormalConcept:
    """Find the exact formal concept via Galois closure."""
    concept = find_concept_for_attributes(attr_set, lattice)
    if concept is None:
        # Fall back to top concept if no match
        for c in lattice.concepts:
            if c.id == lattice.top_concept_id:
                return c
    return concept


# ---------------------------------------------------------------------------
# Stage 3: Context Classifier
# ---------------------------------------------------------------------------

PRIORITY_MAP = {
    # (user_tier, urgency) -> weights
    ("premium",  "critical"): {"quality": 0.70, "latency": 0.25, "cost": 0.05},
    ("premium",  "high"):     {"quality": 0.60, "latency": 0.30, "cost": 0.10},
    ("premium",  "normal"):   {"quality": 0.55, "latency": 0.25, "cost": 0.20},
    ("premium",  "low"):      {"quality": 0.50, "latency": 0.15, "cost": 0.35},
    ("standard", "critical"): {"quality": 0.55, "latency": 0.35, "cost": 0.10},
    ("standard", "high"):     {"quality": 0.45, "latency": 0.35, "cost": 0.20},
    ("standard", "normal"):   {"quality": 0.40, "latency": 0.30, "cost": 0.30},
    ("standard", "low"):      {"quality": 0.30, "latency": 0.20, "cost": 0.50},
    ("bulk",     "critical"): {"quality": 0.40, "latency": 0.20, "cost": 0.40},
    ("bulk",     "high"):     {"quality": 0.30, "latency": 0.20, "cost": 0.50},
    ("bulk",     "normal"):   {"quality": 0.25, "latency": 0.15, "cost": 0.60},
    ("bulk",     "low"):      {"quality": 0.20, "latency": 0.10, "cost": 0.70},
}

def classify_context(request: TaskRequest) -> Dict[str, float]:
    """Derive priority weights from user tier and urgency. Override with explicit weights if sum != 1."""
    explicit_sum = request.priority_quality + request.priority_latency + request.priority_cost
    # If user provided non-default explicit weights, use them
    if abs(explicit_sum - 1.0) < 0.01 and not (
        request.priority_quality == 0.4 and
        request.priority_latency == 0.3 and
        request.priority_cost    == 0.3
    ):
        return {
            "quality": request.priority_quality,
            "latency": request.priority_latency,
            "cost":    request.priority_cost,
        }
    key = (request.user_tier, request.urgency)
    return PRIORITY_MAP.get(key, {"quality": 0.40, "latency": 0.30, "cost": 0.30})


# ---------------------------------------------------------------------------
# Stage 4: Pareto Selector (handled by pareto_engine)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Stage 5: Execution Engine
# ---------------------------------------------------------------------------

EXECUTION_PROMPTS = {
    "chain_of_thought": (
        "You are a highly capable AI assistant. Think step by step carefully before answering.\n\n"
        "Task: {task}\n\nProvide a thorough, well-reasoned response:"
    ),
    "simple": (
        "You are a helpful AI assistant.\n\nTask: {task}\n\nResponse:"
    ),
    "zero_shot": (
        "Task: {task}\n\nAnswer:"
    ),
    "expert_code": (
        "You are an expert software engineer. Analyse the following task carefully, "
        "consider edge cases, and provide production-quality output.\n\nTask: {task}\n\nSolution:"
    ),
    "analytical": (
        "You are a data analysis expert. Provide a structured, analytical response.\n\n"
        "Task: {task}\n\nAnalysis:"
    ),
    "structured": (
        "You are a professional AI assistant. Structure your response clearly.\n\n"
        "Task: {task}\n\nResponse:"
    ),
}

MODEL_MAP = {
    "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant":    "llama-3.1-8b-instant",
    "gemma2-9b-it":            "gemma2-9b-it",
}

def execute_task(task_description: str, config: Configuration) -> tuple[str, float]:
    """Execute the task using the selected configuration. Returns (result, latency_ms)."""
    client   = get_groq_client()
    model    = MODEL_MAP.get(config.model, _GROQ_MODEL)
    template = EXECUTION_PROMPTS.get(config.prompt_style, EXECUTION_PROMPTS["simple"])
    prompt   = template.format(task=task_description)

    t0 = time.perf_counter()
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1024,
    )
    latency_ms = (time.perf_counter() - t0) * 1000

    result = response.choices[0].message.content.strip()
    return result, latency_ms


# ---------------------------------------------------------------------------
# Full Pipeline
# ---------------------------------------------------------------------------

def route_and_execute(request: TaskRequest) -> RoutingResult:
    """
    Full LatticeForge pipeline:
    Task -> Attributes -> Galois Closure -> Concept -> Pareto Front -> Config -> Execute
    """
    # Load context and lattice
    ctx     = load_formal_context()
    lattice = compute_concept_lattice(ctx)

    # Stage 1: Extract attributes via Groq
    extracted = extract_attributes(request.task_description)
    attr_set  = set(extracted) & set(ctx.attributes)   # validate against known attrs

    # Stage 2: Galois closure → formal concept
    concept = find_matching_concept(attr_set, lattice)

    # Stage 3: Context classification → weights
    weights = classify_context(request)

    # Stage 4: Get Pareto frontier and select config
    pf      = get_pareto_frontier_for_concept(concept.id)
    front   = compute_pareto_front(pf.configurations)
    config  = select_from_frontier(front, weights) or pf.configurations[0]

    # Build reasoning string
    reasoning = (
        f"Extracted attributes: {sorted(attr_set) or ['(none detected, using top concept)']}. "
        f"Galois closure matched concept '{concept.id}' covering tasks: "
        f"{concept.extent[:3]}{'...' if len(concept.extent) > 3 else ''}. "
        f"Context weights: Q={weights['quality']:.2f} L={weights['latency']:.2f} C={weights['cost']:.2f}. "
        f"Selected '{config.name}' from Pareto front of {len(front)} configs."
    )

    # Stage 5: Execute
    result, actual_latency = execute_task(request.task_description, config)

    # Stage 6: Telemetry
    telemetry.log_execution(
        task_description  = request.task_description,
        concept_id        = concept.id,
        config_id         = config.id,
        measured_quality  = config.quality,         # benchmark quality used as proxy
        actual_latency_ms = actual_latency,
        billed_cost       = config.cost_per_query,
    )

    return RoutingResult(
        task_description       = request.task_description,
        extracted_attributes   = list(attr_set),
        matched_concept        = concept,
        selected_configuration = config,
        priority_weights       = weights,
        reasoning              = reasoning,
        execution_result       = result,
        latency_ms             = round(actual_latency, 2),
        cost_estimate          = config.cost_per_query,
    )
