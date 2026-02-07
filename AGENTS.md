# AGENTS.md — Aion Visualization Core Development Guide

## Mission
Transform Aion Visualization into a world-class, conceptually rigorous, visually stunning, interactive learning platform for Carl Jung’s *Aion*.

Every contribution must improve at least one of:
1. Conceptual understanding of *Aion*
2. Coherence of narrative/content organization
3. Interaction depth and delight
4. Visual quality and consistency
5. Performance, accessibility, and reliability

## Non-negotiable Product Principles
- **Scholarly integrity first**: never distort Jung’s ideas for visual novelty.
- **Meaningful interactivity**: interactions must teach, not just decorate.
- **System-level consistency**: typography, spacing, motion, component behavior, data language, and chapter structure must be unified.
- **Performance-aware beauty**: premium visuals must still run on average devices.
- **Accessibility as baseline**: keyboard, screen reader, reduced-motion and high-contrast support required.

## Architecture Direction (Core)
- Use modular feature architecture in `src/features/*`.
- Treat chapter pages as narrative containers; move reusable logic/visual engines into shared modules.
- Centralize shared data and avoid duplicate hardcoded chapter/concept maps across files.
- Build around one canonical Aion knowledge model:
  - chapter graph
  - concept graph
  - symbol graph
  - relationship taxonomy

## Mandatory Consistency Rules
- Same concept label/definition/related-links everywhere.
- Same chapter shell layout across all chapters (header, thesis, key concepts, visualization module, synthesis, next links).
- Same interaction semantics across all visualization modules.
- Same navigation model on every route (global shell + local context).
- No page-specific CSS/JS hacks when a reusable token/component pattern can solve it.

## UX & Learning Design Requirements
- Support three user paths:
  1) Guided linear reading
  2) Non-linear concept exploration
  3) Thematic curated tours
- Each chapter must include:
  - Why this chapter matters
  - Core terms with definitions
  - Interactive concept checks
  - Cross-links to related chapters/concepts/symbols
  - Reflection prompt
- Each visualization must include:
  - Learning objective
  - Interaction instructions
  - Insight checkpoints
  - Exit summary (what changed in understanding)

## Visual & Motion System Requirements
- Define and use design tokens (color, typography, spacing, radius, shadows, timing, easing).
- Implement a semantic motion grammar:
  - opposition, integration, transformation, cyclical return.
- Respect `prefers-reduced-motion`; supply non-motion equivalents.
- Maintain cinematic quality while preserving legibility and focus.

## Performance & Reliability Constraints
- Establish route budgets (LCP, TBT, CLS, JS KB, texture memory, FPS).
- Lazy-load heavy modules and defer WebGL until user intent is clear.
- Explicitly dispose WebGL resources and long-lived listeners.
- Every visualization must have a graceful fallback mode.

## Accessibility Requirements
- Full keyboard operability (including visualization controls).
- ARIA and landmark structure on all core routes.
- Contrast ratios and focus visibility must pass WCAG AA.
- Critical information cannot depend only on color, hover, or motion.

## Content Governance
- Keep canonical glossary and term taxonomy in one source of truth.
- Add source anchors for concept claims (chapter/section references).
- Use an editorial QA checklist before merging concept/content changes.

## Delivery Workflow
- For any major feature proposal, include:
  - architectural impact
  - consistency impact
  - accessibility/performance impact
  - migration plan
  - success metrics
- Prefer incremental migration with compatibility layers over big-bang rewrites.

## PR Checklist
- [ ] Improves core learning experience (not cosmetic only)
- [ ] Follows unified architecture and data model
- [ ] Preserves/raises consistency across content + UI + interactions
- [ ] Meets accessibility and reduced-motion requirements
- [ ] Meets performance budgets or includes mitigation plan
- [ ] Includes tests and/or validation updates
