# Aion Visualization — Core Revamp Execution Blueprint (Deep Analysis + Full Upgrade Plan)

## 1) Executive intent

This blueprint addresses the core concern directly: the current product has many assets, but they are fragmented, uneven in pedagogy, and not enforced by a canonical consistency system. The plan below is **not cosmetic polish**. It is an architecture + content + interaction + governance transformation designed to deliver:

- major learning gains (not just visual novelty),
- route-to-route consistency (content, UX, UI, semantics),
- premium-quality visualizations tied to chapter understanding,
- measurable accessibility/performance reliability,
- and a migration path that keeps shipping velocity.

---

## 2) Deep diagnosis of the current webapp

## 2.1 Evidence-based structural diagnosis

### A. Triple chapter stacks create permanent drift risk
There are three complete chapter sets for all 14 chapters:
- `chapters/chapter-1..14.html`
- `chapters/standard/chapter-1..14.html`
- `chapters/enhanced/chapter-1..14.html`

This means every narrative/content or UX fix has three potential update surfaces.

### B. Template and implementation diverge
`chapters/chapter-template.html` encodes one structure (overview, key concepts, related concepts, related chapters), while enhanced chapter pages use bespoke sectioning and inline styles. This is a direct consistency failure source.

### C. Canonical graph exists but is under-leveraged
`src/data/aion-graph/` already has strong seeds (`chapters.json`, `concepts.json`, `symbols.json`, `edges.json`) but no strict schema validation layer, relation taxonomy governance, or build-time contract checks to guarantee usage across all chapter/content surfaces.

## 2.2 Learning design diagnosis

### A. Visualization-first instead of learning-loop-first
Current pages often present visualizations as “look at this” modules rather than structured learning objects with:
1. objective,
2. interaction instruction,
3. insight checkpoints,
4. and exit synthesis.

### B. Inconsistent chapter pedagogy
Different chapter families use different section structures (e.g., `Overview/Key Concepts` vs `Introduction/Reflection` vs bespoke narrative blocks), reducing transfer and cognitive predictability for users.

### C. Weak cross-concept progression model
Even with concept graph data, most chapter reading journeys do not operationalize prerequisites, concept confidence, or recommended concept revisits.

## 2.3 UX/UI diagnosis

### A. Navigation semantics vary by route family
Navigation patterns differ across routes and chapter variants, creating context loss.

### B. Design system discipline is incomplete
There are tokenized assets and strong visuals, but pages still contain route-specific inline styles and layout logic that bypass reusable contracts.

### C. Visual language is not always semantically meaningful
High-effort visuals exist, but motion/diagram semantics are not consistently tied to Jungian meaning states (opposition/integration/transformation/cycle).

## 2.4 Accessibility and performance governance diagnosis

### A. Audit docs exist but hard gates are missing
There are audit artifacts, but production-level CI gates for chapter contract coverage, keyboard interaction parity, reduced-motion parity, and perf budgets are not yet hard-blocking.

### B. Fallback strategy is uneven
Some visual modules have graceful fallback messaging, others are still experience-degrading when graphics/performance constraints appear.

---

## 3) Definition of “100% consistency” for this product

Consistency is complete only when **all** these are true:

1. **Content consistency**
   - one canonical definition per concept ID,
   - one canonical chapter thesis per chapter ID,
   - one relation description per relation type.

2. **Structural consistency**
   - every chapter uses identical shell slots:
     `header → why it matters → core terms → primary viz → concept checks → synthesis → reflection → next links`.

3. **Interaction consistency**
   - all visualizations implement the same control grammar:
     `learn objective`, `how to interact`, `checkpoint`, `summary`, `reset`, `help`.

4. **Visual consistency**
   - all UI uses design tokens + component primitives (no route hacks).

5. **Accessibility consistency**
   - keyboard-first operation for all controls,
   - reduced-motion equivalent paths,
   - WCAG AA contrast/focus standards everywhere.

6. **Performance consistency**
   - each route and visualization must pass declared budgets with fallback mode when budget cannot be met.

---

## 4) Target architecture (core-level)

## 4.1 Canonical knowledge core (single source of truth)

Create: `src/data/aion-core/`

- `chapters.schema.json`
- `concepts.schema.json`
- `symbols.schema.json`
- `relationships.schema.json`
- `learning-objects.schema.json`

Add a build step:
- validates all JSON,
- enforces referential integrity,
- generates normalized runtime artifacts:
  - `dist/data/chapter-map.json`
  - `dist/data/concept-map.json`
  - `dist/data/relation-taxonomy.json`

### Mandatory relation taxonomy v1
- `contains`, `develops`, `contrasts_with`, `depends_on`, `symbolizes`, `transforms_into`, `culminates_in`

No ad hoc relation strings outside taxonomy.

## 4.2 Unified chapter engine

Create: `src/features/chapter-engine/`

- `ChapterShell.js`
- `ChapterSectionRegistry.js`
- `ChapterProgressModel.js`
- `chapter-shell.css`

Every chapter route consumes one renderer + chapter data payload.
No handcrafted chapter-level structural HTML after migration.

## 4.3 Visualization module contract

Create: `src/features/viz-platform/`

- `VizModuleContract.ts`
- `VizLifecycleManager.js`
- `VizLearningOverlay.js`
- `VizFallbackPanel.js`

Required module methods:
- `init(context)`
- `mount(el)`
- `setMode(mode)`
- `getCheckpointState()`
- `summarizeLearning()`
- `dispose()`

## 4.4 Consistency enforcement system

Create: `scripts/consistency/`

- `check-chapter-shell-coverage.js`
- `check-term-canonicality.js`
- `check-relation-taxonomy.js`
- `check-component-contract-usage.js`
- `check-reduced-motion-parity.js`

All run in CI; failing any check blocks merge.

---

## 5) Full product IA redesign (three learning paths)

## 5.1 Route model

- `/experience` → onboarding + path chooser
- `/journey/chapter/:id` → guided linear reading
- `/atlas` → concept/symbol graph exploration
- `/tours/:tourId` → curated thematic pathways
- `/glossary` → canonical terms + source anchors
- `/synthesis` → reflection workspace + integration maps

## 5.2 Path-specific UX contracts

### Guided linear reading
- chapter progression + prerequisites shown,
- “why this matters now” at top,
- explicit transition meaning between chapters.

### Non-linear exploration
- entry by concept/symbol/theme,
- filterable relation layers,
- pin-and-compare concept cards.

### Curated tours
- 8–15 minute thematic modules,
- onboarding context,
- short comprehension checks,
- finish summary + suggested next tour.

---

## 6) Chapter shell specification (single standard)

Every chapter must include these 8 mandatory blocks (exact order):

1. **Chapter Header**
   - number, title, thesis, estimated time.
2. **Why This Chapter Matters**
   - plain-language significance.
3. **Core Terms**
   - canonical definitions from glossary source.
4. **Primary Visualization Module**
   - learning objective + instructions + interaction.
5. **Insight Checkpoints**
   - 2–4 micro checks tied to objective.
6. **Symbol/Relationship Panel**
   - linked symbols + relation notes.
7. **Synthesis Summary**
   - what changed in understanding.
8. **Reflection + Next Links**
   - prompt + related chapters/concepts/tours.

Hard rule: chapter is invalid if any block missing.

---

## 7) Visualization overhaul plan (fundamental, module-by-module)

## 7.1 Fish Symbol Timeline
Upgrade into a 3-lane meaning engine:
- historical lane,
- symbolic lane,
- psychological lane.

Add:
- era compare mode,
- relation overlays to chapter arguments,
- confidence/ambiguity tags for interpretations.

## 7.2 Shadow Integration
Convert to staged transformation pedagogy:
- stage 1 confrontation,
- stage 2 differentiation,
- stage 3 integration.

Add:
- checkpoint prompts at each stage,
- reduced-motion interaction mode,
- explicit “mistaken integration” warnings.

## 7.3 Anima/Animus Constellation
Transform into a relation laboratory:
- typed edge filters,
- chapter-context snapshots,
- “path to Self” guided narratives.

## 7.4 Gnostic Cosmology Map
Convert to doctrinal-psychological dual map:
- layer toggles,
- term anchors,
- chapter crosslinks,
- progressive disclosure explanations.

## 7.5 Alchemical Lab
Refactor into operation pedagogy:
- nigredo/albedo/rubedo sequencing,
- operation semantics tied to psyche changes,
- reversible process replay.

## 7.6 Aion Clock
Evolve into macro-cycle interpretation workspace:
- multi-scale time controls,
- chapter-linked transitions,
- interpretive certainty/contestation indicators.

---

## 8) Visual system + motion grammar implementation plan

## 8.1 Design token hardening
Create canonical token namespaces:
- `--color-*` (semantic roles only)
- `--type-*` (role scale, not page scale)
- `--space-*`, `--radius-*`, `--shadow-*`
- `--motion-duration-*`, `--motion-ease-*`

## 8.2 Motion semantics (must carry meaning)

- **Opposition**: counter-directional motion + tension curves.
- **Integration**: convergent trajectories + stabilization easing.
- **Transformation**: staged morph with state labels.
- **Cyclical return**: orbital repetition + period markers.

All motion requires reduced-motion equivalent interactions.

---

## 9) Accessibility + performance hard gates

## 9.1 Accessibility gates (CI + manual)
- no keyboard trap,
- all controls reachable and labeled,
- no critical info only via color/motion,
- focus states always visible,
- skip links + landmarks required.

## 9.2 Performance route budgets

Desktop (target):
- LCP < 2.2s
- TBT < 150ms
- CLS < 0.08

Mobile (target):
- LCP < 3.0s
- TBT < 220ms
- CLS < 0.1

Visualization runtime:
- median FPS >= 45 on baseline device,
- memory budget defined per viz,
- explicit `dispose()` resource verification.

---

## 10) 6-phase migration roadmap (extensive, implementation-ready)

## Phase 0 — Forensic baseline (1 week)
Deliverables:
- current-state consistency matrix,
- chapter-shell gap report,
- visualization contract gap report,
- accessibility/performance baseline snapshots.

Exit criteria:
- all gaps documented with IDs and owners.

## Phase 1 — Core infrastructure (2–3 weeks)
Deliverables:
- `aion-core` schemas + validators,
- relation taxonomy,
- consistency scripts in CI,
- design token hardening pass.

Exit criteria:
- CI blocks invalid data/contracts.

## Phase 2 — Chapter engine migration (3–4 weeks)
Deliverables:
- chapter shell renderer,
- migrate chapters 1, 2, 10, 14 (pilot + edge cases),
- implement checkpoint and synthesis blocks.

Exit criteria:
- migrated chapters pass all shell/accessibility/perf gates.

## Phase 3 — Visualization platform migration (4–5 weeks)
Deliverables:
- viz contract adoption by all 6 core modules,
- learning overlay + fallback panel integration,
- reduced-motion parity in each module.

Exit criteria:
- every module exposes lifecycle + learning summary APIs.

## Phase 4 — Atlas + tours (3–4 weeks)
Deliverables:
- atlas exploration route,
- first 5 curated tours,
- concept mastery progression model.

Exit criteria:
- users can traverse all three learning paths coherently.

## Phase 5 — Hardening + launch (2–3 weeks)
Deliverables:
- full regression matrix,
- perf optimization cycle,
- editorial/source-anchor QA,
- launch readiness report.

Exit criteria:
- all quality gates green across supported browsers.

---

## 11) Detailed backlog by epic (starter set)

## Epic A: Knowledge Core
- A1: Define JSON schemas for all entities.
- A2: Build validator CLI (`npm run validate:aion-core`).
- A3: Add broken-reference and duplicate-label checks.
- A4: Generate normalized runtime maps.

## Epic B: Chapter Consistency
- B1: Implement `ChapterShell` + slot registry.
- B2: Replace per-page structural HTML with config-driven rendering.
- B3: Add chapter contract tests for all 14 chapters.
- B4: Remove deprecated parallel chapter routes after migration freeze.

## Epic C: Visualization Platform
- C1: Formalize contract and adapters.
- C2: Add objective/instruction/checkpoint/summary overlay.
- C3: Add fallback mode and WebGL disposal verification.
- C4: Add keyboard control map parity.

## Epic D: UX/Navigation
- D1: Unified app shell + path switcher.
- D2: Persistent chapter/concept context rail.
- D3: Guided-to-atlas transition continuity patterns.
- D4: Global glossary drawer.

## Epic E: Content Governance
- E1: Canonical glossary editorial workflow.
- E2: Source anchors by concept claim.
- E3: Concept drift linter.
- E4: Release editorial checklist.

## Epic F: Quality Gates
- F1: Accessibility checks in CI.
- F2: Perf budget checks in CI.
- F3: Visual regression for shell + modules.
- F4: Interaction regression suite (keyboard, reduced motion).

---

## 12) Metrics and success criteria (non-negotiable)

## 12.1 Learning metrics
- checkpoint correctness uplift,
- chapter-to-chapter retention,
- concept mastery progression rate.

## 12.2 Consistency metrics
- shell compliance = 100%,
- canonical term mismatch = 0,
- relation taxonomy violations = 0.

## 12.3 Experience metrics
- completion rate in each path mode,
- interaction depth per visualization,
- reduced-motion user completion parity.

## 12.4 Reliability metrics
- release with zero P1 accessibility defects,
- perf budget pass rate >= 95%,
- visualization crash rate near zero.

---

## 13) Governance model for sustained quality

- Weekly architecture review (schema + contracts + migration).
- Weekly editorial review (concept correctness + anchor verification).
- Biweekly quality board (a11y/perf/regression trends).
- Release requires signed checklist from:
  - product,
  - editorial,
  - engineering,
  - accessibility/performance QA.

---

## 14) Immediate next actions (first 10 working days)

1. Generate automated consistency report across all chapter variants.
2. Freeze creation of new page-specific chapter structures.
3. Define canonical chapter shell schema and relation taxonomy.
4. Migrate 2 chapters end-to-end to prove engine approach.
5. Wrap 1 visualization with full learning overlay contract.
6. Add CI checks for shell coverage + canonical terms.
7. Publish baseline KPI dashboard (learning + consistency + perf + a11y).
8. Approve deprecation plan for duplicate chapter stacks.

---

## 15) Final directive

If a change does not improve learning clarity, consistency, accessibility/performance reliability, or conceptual integrity, it does not qualify as revamp work.

The project should now execute as a **systemic educational platform build**, not a page-by-page visual patch cycle.
