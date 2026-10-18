"""
LatticeForge - Formal Concept Analysis Engine
Implements:
  - Formal context loading
  - Concept lattice construction
  - Galois closure computation
  - Hasse diagram edge derivation
  - Lattice export for visualization
"""
from __future__ import annotations

import json
import hashlib
from pathlib import Path
from itertools import combinations
from typing import List, Dict, Set, Tuple, Optional

from models import FormalContext, FormalConcept, ConceptLattice

DATA_DIR = Path(__file__).parent / "data"


# ---------------------------------------------------------------------------
# Context loading
# ---------------------------------------------------------------------------

def load_formal_context(path: Path = DATA_DIR / "formal_context.json") -> FormalContext:
    with open(path, "r") as f:
        data = json.load(f)
    return FormalContext(**data)


def save_formal_context(ctx: FormalContext, path: Path = DATA_DIR / "formal_context.json"):
    with open(path, "w") as f:
        json.dump(ctx.model_dump(), f, indent=2)


# ---------------------------------------------------------------------------
# Derivation operators (Galois connection)
# ---------------------------------------------------------------------------

def tasks_to_attributes(tasks: Set[str], ctx: FormalContext) -> Set[str]:
    """A' — attributes shared by ALL tasks in A."""
    attrs = set(ctx.attributes)
    for task in tasks:
        row = ctx.incidence.get(task, [])
        task_attrs = {ctx.attributes[i] for i, v in enumerate(row) if v == 1}
        attrs &= task_attrs
    return attrs


def attributes_to_tasks(attrs: Set[str], ctx: FormalContext) -> Set[str]:
    """B' — tasks that possess ALL attributes in B."""
    result = set()
    for task in ctx.tasks:
        row = ctx.incidence.get(task, [])
        task_attrs = {ctx.attributes[i] for i, v in enumerate(row) if v == 1}
        if attrs.issubset(task_attrs):
            result.add(task)
    return result


def galois_closure_from_attrs(attrs: Set[str], ctx: FormalContext) -> Tuple[Set[str], Set[str]]:
    """
    Given attribute set B, compute the Galois closure (A, B''):
      1. B' = tasks with all attrs in B
      2. B'' = attributes shared by all tasks in B'
    Returns (extent, intent) — the smallest formal concept containing B.
    """
    extent = attributes_to_tasks(attrs, ctx)
    intent = tasks_to_attributes(extent, ctx)
    return extent, intent


def galois_closure_from_tasks(tasks: Set[str], ctx: FormalContext) -> Tuple[Set[str], Set[str]]:
    """
    Given task set A, compute the Galois closure (A'', A'):
      1. A' = attributes shared by all tasks in A
      2. A'' = tasks with all attributes in A'
    """
    intent = tasks_to_attributes(tasks, ctx)
    extent = attributes_to_tasks(intent, ctx)
    return extent, intent


# ---------------------------------------------------------------------------
# Concept ID
# ---------------------------------------------------------------------------

def concept_id(extent: Set[str], intent: Set[str]) -> str:
    key = "|".join(sorted(extent)) + "||" + "|".join(sorted(intent))
    return "C" + hashlib.md5(key.encode()).hexdigest()[:8].upper()


# ---------------------------------------------------------------------------
# Concept lattice construction (naïve enumeration for small contexts)
# ---------------------------------------------------------------------------

def compute_concept_lattice(ctx: FormalContext) -> ConceptLattice:
    """
    Enumerate all formal concepts by closing every power-set of tasks.
    For 20 tasks this is up to 2^20 iterations — we use the attribute
    power-set approach instead (15 attributes → 32768 closures max, pruned quickly).
    """
    concepts_dict: Dict[str, FormalConcept] = {}

    # Enumerate all subsets of attributes
    attrs = ctx.attributes
    n = len(attrs)

    # Always add top concept (all tasks, shared attrs) and bottom concept (no tasks, all attrs)
    # Top: close the empty attribute set
    top_extent, top_intent = galois_closure_from_attrs(set(), ctx)
    top_id = concept_id(top_extent, top_intent)
    concepts_dict[top_id] = FormalConcept(
        id=top_id,
        extent=sorted(top_extent),
        intent=sorted(top_intent),
        level=0
    )

    # Enumerate subsets of size 1..n
    for size in range(1, n + 1):
        for subset in combinations(attrs, size):
            attr_set = set(subset)
            extent, intent = galois_closure_from_attrs(attr_set, ctx)
            cid = concept_id(extent, intent)
            if cid not in concepts_dict:
                concepts_dict[cid] = FormalConcept(
                    id=cid,
                    extent=sorted(extent),
                    intent=sorted(intent),
                    level=len(intent)
                )

    # Bottom concept: close all attributes
    bot_extent, bot_intent = galois_closure_from_attrs(set(attrs), ctx)
    bot_id = concept_id(bot_extent, bot_intent)
    if bot_id not in concepts_dict:
        concepts_dict[bot_id] = FormalConcept(
            id=bot_id,
            extent=sorted(bot_extent),
            intent=sorted(bot_intent),
            level=len(bot_intent)
        )

    concepts = list(concepts_dict.values())

    # Compute Hasse diagram edges (direct cover relations)
    # (A1,B1) is a LOWER neighbour of (A2,B2) iff A1 ⊆ A2 and there is no (A3,B3) with A1 ⊆ A3 ⊊ A2
    edges: List[Tuple[str, str]] = _compute_hasse_edges(concepts)

    # Assign levels via BFS from top
    _assign_levels(concepts, edges, top_id)

    # Find bottom concept
    bottom_id = min(concepts, key=lambda c: len(c.extent)).id

    return ConceptLattice(
        concepts=concepts,
        edges=edges,
        top_concept_id=top_id,
        bottom_concept_id=bottom_id
    )


def _compute_hasse_edges(concepts: List[FormalConcept]) -> List[Tuple[str, str]]:
    """
    Compute cover relations for the Hasse diagram.
    (parent, child): parent.extent ⊃ child.extent (parent is more general).
    """
    # Index by id
    by_id = {c.id: set(c.extent) for c in concepts}
    ids = [c.id for c in concepts]
    edges = []

    for i, cid in enumerate(ids):
        ext_i = by_id[cid]
        # Find all concepts that are strict subsets
        strict_sub = [jid for jid in ids if jid != cid and by_id[jid] < ext_i]
        # Keep only maximal strict subsets (direct lower neighbours)
        maximal = []
        for jid in strict_sub:
            if not any(by_id[jid] < by_id[kid] for kid in strict_sub if kid != jid):
                maximal.append(jid)
        for jid in maximal:
            edges.append((cid, jid))   # parent -> child

    return edges


def _assign_levels(concepts: List[FormalConcept], edges: List[Tuple[str, str]], top_id: str):
    """BFS from top to assign level (depth) to each concept."""
    level_map: Dict[str, int] = {top_id: 0}
    queue = [top_id]
    child_map: Dict[str, List[str]] = {c.id: [] for c in concepts}
    for parent, child in edges:
        child_map[parent].append(child)

    visited = {top_id}
    while queue:
        current = queue.pop(0)
        for child in child_map.get(current, []):
            if child not in visited:
                level_map[child] = level_map[current] + 1
                visited.add(child)
                queue.append(child)

    for c in concepts:
        if c.id in level_map:
            c.level = level_map[c.id]


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

def find_concept_for_attributes(attr_set: Set[str], lattice: ConceptLattice) -> Optional[FormalConcept]:
    """
    Galois-closure navigation: given required attributes B, return the unique
    concept (B'', B') whose intent is the *smallest* superset of B.

    Equivalently, among all concepts whose intent contains B, pick the one with
    the LARGEST extent: as the intent grows the extent shrinks, so the maximal
    extent corresponds to the minimal intent superset (the closure B'').
    NOTE: selecting the *smallest* extent would always return the all-attribute
    concept (empty extent), which would make routing/gap-detection degenerate.
    """
    candidates = [
        c for c in lattice.concepts
        if attr_set.issubset(set(c.intent))
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda c: len(c.extent))


def get_concept_by_id(cid: str, lattice: ConceptLattice) -> Optional[FormalConcept]:
    for c in lattice.concepts:
        if c.id == cid:
            return c
    return None


def check_attribute_gap(attr_set: Set[str], lattice: ConceptLattice) -> bool:
    """
    True if no existing object (task) realises this attribute set, i.e. the
    Galois closure has an empty extent (a genuine capability gap).
    """
    concept = find_concept_for_attributes(attr_set, lattice)
    return concept is None or len(concept.extent) == 0


def get_task_attributes(task: str, ctx: FormalContext) -> Set[str]:
    row = ctx.incidence.get(task, [])
    return {ctx.attributes[i] for i, v in enumerate(row) if v == 1}


def lattice_to_dict(lattice: ConceptLattice) -> dict:
    """Serialize lattice for JSON API response."""
    return {
        "concepts": [c.model_dump() for c in lattice.concepts],
        "edges": lattice.edges,
        "top_concept_id": lattice.top_concept_id,
        "bottom_concept_id": lattice.bottom_concept_id,
        "stats": {
            "num_concepts": len(lattice.concepts),
            "num_edges": len(lattice.edges),
        }
    }
