# Animation Grammar for Aion Visualizations

This document defines shared motion semantics so chapter navigation, concept graphs, and visualization engines communicate the **same psychological meaning**.

## Core semantic motions

### 1) Opposition (repel / split)
- **Meaning:** psychic tension, contradiction, active differentiation.
- **Primary kinematics:** divergent vectors, increased distance, angular displacement, abrupt easing.
- **Visual signatures:** split trajectories, mirrored offsets, brief jitter, edge stretching.
- **Default easing/duration:** `cubic-bezier(0.2, 0.8, 0.2, 1)` / `280-520ms`.
- **Reduced-motion equivalent:** no travel animation; instant separation into distinct zones, contrast bump (outline/color/state tags).

### 2) Integration (merge / harmonize)
- **Meaning:** reconciliation, synthesis, incorporation into larger structure.
- **Primary kinematics:** convergent vectors, centroid pull, velocity damping.
- **Visual signatures:** blending, opacity equalization, synchronized phase.
- **Default easing/duration:** `cubic-bezier(0.16, 1, 0.3, 1)` / `420-900ms`.
- **Reduced-motion equivalent:** direct layout convergence + unified styling/state badge (`integrated`).

### 3) Inflation / Deflation
- **Meaning:** expansion of psychic identification (inflation) or contraction/humbling/containment (deflation).
- **Primary kinematics:** radial scaling and field pressure.
- **Visual signatures:**
  - Inflation: outward drift, scale up, luminance increase.
  - Deflation: inward collapse, scale down, grounded opacity.
- **Default easing/duration:** `ease-out` / `300-700ms`.
- **Reduced-motion equivalent:** stepwise size/state change without interpolation; maintain hierarchy with spacing and labels.

### 4) Cyclical Return
- **Meaning:** recurrence, repetition with transformation, return to archetypal motif.
- **Primary kinematics:** closed-loop paths, orbital movement, phase reset.
- **Visual signatures:** circular/spiral trajectories, loop closure markers.
- **Default easing/duration:** `linear` or gentle `ease-in-out` / loop `1200-4000ms`.
- **Reduced-motion equivalent:** discrete sequence states (`phase-1` -> `phase-2` -> `phase-3` -> `phase-1`) and highlighted recurrence indicators.

## Concept graph relation -> motion behavior map

Use this map in D3/Canvas/WebGL renderers to keep relation semantics consistent.

| Relation type | Semantic motion | Engine behavior | Reduced-motion behavior |
|---|---|---|---|
| `opposes` | Opposition | Pairwise repel force, mirrored split vectors, high spring tension | Fixed opposite placement, no tween |
| `relates-to`, `related-to` | Integration (light) | Soft attraction and alignment | Direct adjacency + shared accent |
| `integrates-into` | Integration (strong) | Source converges into target centroid; velocity damping | Snap into cluster + `integrated` state |
| `develops-toward`, `guides-to`, `achieved-through` | Integration (directional) | Directed easing toward target with low overshoot | Step progression states |
| `requires`, `supports`, `resolved-by` | Deflation -> Integration | Constraint compression then settle | Two-step layout/state update |
| `manifests-as`, `expresses-as` | Inflation | Emanation pulse from source to target | Toggle expanded node state |
| `symbolized-by`, `structured-as`, `represents` | Cyclical Return | Orbital/looped drift around anchor | Static ring ordering + phase labels |
| `completed-by`, `culminates-in` | Cyclical Return -> Integration | Loop closure then merge emphasis | Mark closure, then grouped state |
| `aspect-of` | Deflation | Sub-node contracts into parent frame | Parent-child nesting without tween |
| `enacts` | Inflation (directional) | Forward thrust with trailing decay | Direct position shift + active marker |

## Chapter transition choreography rules

Use chapter-to-chapter navigation semantics as narrative motion:

- **Forward chapter (`n -> n+1`):** Integration.
- **Backward chapter (`n -> n-1`):** Deflation.
- **Large jump (`|delta| >= 3`):** Inflation (outward context shift) then Integration.
- **Wrap (`14 -> 1` or index reset):** Cyclical Return.
- **Antagonistic chapter pairs (configured):** Opposition.

## Implementation notes

- Emit semantic intent as data (`semantic`, `relationType`, `phase`) before animating.
- Renderers should resolve intent into platform-specific primitives (CSS, WAAPI, D3 transitions, or WebGL shader params).
- Always support `prefers-reduced-motion: reduce` with equivalent **meaning-preserving state changes**, not semantic deletion.
