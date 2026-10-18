"""
LatticeForge - Pareto Front Engine
Implements:
  - Pareto dominance check
  - Pareto frontier computation for any set of configurations
  - Config selection via weighted L2 distance from ideal point
  - Frontier storage and retrieval (per concept)
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import List, Dict, Set, Tuple, Optional

from models import Configuration, ParetoFrontier, FormalConcept

DATA_DIR = Path(__file__).parent / "data"
FRONTS_FILE = DATA_DIR / "pareto_fronts.json"


# ---------------------------------------------------------------------------
# Dominance logic
# ---------------------------------------------------------------------------

def dominates(a: Configuration, b: Configuration) -> bool:
    """
    Returns True if config `a` Pareto-dominates `b`:
      a is at least as good as b on all objectives, strictly better on ≥1.
    Objectives: quality (maximise), latency_ms (minimise), cost_per_query (minimise).
    """
    q_ok  = a.quality        >= b.quality
    l_ok  = a.latency_ms     <= b.latency_ms
    c_ok  = a.cost_per_query <= b.cost_per_query

    q_better = a.quality        > b.quality
    l_better = a.latency_ms     < b.latency_ms
    c_better = a.cost_per_query < b.cost_per_query

    return (q_ok and l_ok and c_ok) and (q_better or l_better or c_better)


def compute_pareto_front(configs: List[Configuration]) -> List[Configuration]:
    """Return only the non-dominated configurations."""
    front: List[Configuration] = []
    for candidate in configs:
        dominated = False
        for other in configs:
            if other.id != candidate.id and dominates(other, candidate):
                dominated = True
                break
        if not dominated:
            candidate.is_pareto_optimal = True
            front.append(candidate)
        else:
            candidate.is_pareto_optimal = False
    return front


# ---------------------------------------------------------------------------
# Normalisation & selection
# ---------------------------------------------------------------------------

def _normalize(configs: List[Configuration]) -> List[Tuple[float, float, float]]:
    """Normalise (quality, latency, cost) to [0,1] per dimension."""
    if not configs:
        return []

    qs = [c.quality for c in configs]
    ls = [c.latency_ms for c in configs]
    cs = [c.cost_per_query for c in configs]

    q_min, q_max = min(qs), max(qs)
    l_min, l_max = min(ls), max(ls)
    c_min, c_max = min(cs), max(cs)

    def norm(v, lo, hi):
        return (v - lo) / (hi - lo) if hi != lo else 0.5

    return [
        (norm(c.quality, q_min, q_max),
         norm(c.latency_ms, l_min, l_max),
         norm(c.cost_per_query, c_min, c_max))
        for c in configs
    ]


def select_from_frontier(
    frontier: List[Configuration],
    weights: Dict[str, float]  # {"quality": 0.5, "latency": 0.3, "cost": 0.2}
) -> Optional[Configuration]:
    """
    Select the configuration on the Pareto frontier closest to the ideal point
    (quality=1, latency=0, cost=0) using weighted Euclidean distance.
    """
    if not frontier:
        return None

    w_q = weights.get("quality", 0.4)
    w_l = weights.get("latency", 0.3)
    w_c = weights.get("cost",    0.3)

    normalized = _normalize(frontier)
    best_idx, best_dist = 0, float("inf")

    for i, (q_n, l_n, c_n) in enumerate(normalized):
        # Ideal: quality=1 (so error = 1-q_n), latency=0 (error=l_n), cost=0 (error=c_n)
        dist = math.sqrt(
            w_q * (1 - q_n) ** 2 +
            w_l * l_n       ** 2 +
            w_c * c_n       ** 2
        )
        if dist < best_dist:
            best_dist = dist
            best_idx = i

    return frontier[best_idx]


# ---------------------------------------------------------------------------
# Config library
# ---------------------------------------------------------------------------

def load_config_library() -> Dict[str, List[Configuration]]:
    """Load the pre-built configuration pools from JSON."""
    with open(FRONTS_FILE, "r") as f:
        data = json.load(f)

    result: Dict[str, List[Configuration]] = {}
    for pool_name, cfgs in data.get("concept_configurations", {}).items():
        result[pool_name] = [Configuration(**c) for c in cfgs]
    return result


def pool_signatures(library: Optional[Dict[str, List[Configuration]]] = None) -> Dict[str, Set[str]]:
    """
    Derive a capability signature (union of tool-chain attributes) for every
    configuration pool. This is what links the FCA lattice to the Pareto pools:
    a concept's intent is matched against these signatures.
    """
    library = library or load_config_library()
    signatures: Dict[str, Set[str]] = {}
    for pool_name, cfgs in library.items():
        attrs: Set[str] = set()
        for cfg in cfgs:
            attrs.update(cfg.tool_chain)
        signatures[pool_name] = attrs
    return signatures


def select_pool_for_intent(
    intent: Set[str],
    library: Optional[Dict[str, List[Configuration]]] = None,
) -> str:
    """
    Pick the configuration pool whose capability signature best covers the
    concept's intent (attributes). Ties fall back to the 'default' pool.

    This replaces the old concept-id suffix hack, so pool selection is now
    driven by the actual required capabilities rather than an arbitrary hash
    character. Ties prefer the more specific (smaller) signature, then default.
    """
    library = library or load_config_library()
    signatures = pool_signatures(library)

    best_pool, best_score, best_size = "default", 0, float("inf")
    for pool_name, sig in signatures.items():
        score = len(intent & sig)
        if score > best_score or (score == best_score and score > 0 and len(sig) < best_size):
            best_score, best_size, best_pool = score, len(sig), pool_name
    return best_pool if best_score > 0 else "default"


def get_pareto_frontier_for_concept(
    concept_id: str,
    concept: Optional[FormalConcept] = None,
    requested_attributes: Optional[Set[str]] = None,
) -> ParetoFrontier:
    """
    Get (or compute) the Pareto frontier for a specific formal concept.
    The pool is chosen from the requested capabilities when supplied (precise),
    otherwise from the concept's intent (FCA-based). Pass `concept` when it is
    already known to avoid recomputing the lattice.
    """
    library = load_config_library()

    if concept is None:
        try:
            from fca_engine import load_formal_context, compute_concept_lattice, get_concept_by_id
            concept = get_concept_by_id(concept_id, compute_concept_lattice(load_formal_context()))
        except Exception:
            concept = None

    if requested_attributes is not None:
        capability_set = set(requested_attributes)
    else:
        capability_set = set(concept.intent) if concept is not None else set()
    pool_key = select_pool_for_intent(capability_set, library)

    configs = library.get(pool_key, library["default"])
    front   = compute_pareto_front(configs)
    front_ids = [c.id for c in front]

    return ParetoFrontier(
        concept_id=concept_id,
        configurations=configs,
        pareto_front=front_ids,
        pool=pool_key,
    )


def get_pareto_frontier_for_pool(pool: str) -> ParetoFrontier:
    """Get the Pareto frontier for an explicitly named configuration pool."""
    library = load_config_library()
    configs = library.get(pool, library.get("default", []))
    front   = compute_pareto_front(configs)
    return ParetoFrontier(
        concept_id=pool,
        configurations=configs,
        pareto_front=[c.id for c in front],
        pool=pool,
    )


def get_all_configurations_for_pool(pool: str = "default") -> List[Configuration]:
    library = load_config_library()
    return library.get(pool, library.get("default", []))


def pareto_frontier_to_dict(pf: ParetoFrontier) -> dict:
    return {
        "concept_id": pf.concept_id,
        "pool": pf.pool,
        "configurations": [c.model_dump() for c in pf.configurations],
        "pareto_front": pf.pareto_front,
        "pareto_configs": [c.model_dump() for c in pf.configurations if c.id in pf.pareto_front]
    }
