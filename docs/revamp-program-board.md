# Aion Revamp Program Board

## Purpose
This board governs the migration of Aion Visualization into a unified, canonical, and measurable platform delivery program.

## Program Cadence and Governance

### Weekly Governance Reviews
A recurring weekly review is required throughout all phases.

| Review | Required Participants | Focus | Inputs | Outputs |
|---|---|---|---|---|
| Architecture Review | Tech lead, feature owners, design systems owner, performance lead | Shell compliance, reuse progress, bespoke implementation violations, migration blockers | Shell compliance report, canonical mismatch report, open architecture risks | Approved architecture actions, freeze exceptions (if any), dependency resolution plan |
| Editorial Review | Editorial lead, chapter owners, glossary owner, learning design lead | Canonical terminology consistency, chapter narrative integrity, concept checks quality | Canonical mismatch report, chapter migration tickets, editorial QA checklist | Approved term changes, content correction actions, chapter readiness status |
| QA Review | QA lead, accessibility owner, performance owner, release manager | Accessibility defects, perf pass rate, regression risk, launch readiness | A11y defect log, perf dashboard, test pass/fail trends | Defect priorities, risk register updates, go/no-go recommendations |

## Migration Freeze Policy

### Bespoke Page Freeze (Mandatory)
During the migration freeze period (from Foundation phase exit until Hardening/launch phase exit), **no new bespoke page implementations are allowed**.

Allowed work during freeze:
- Migration of existing pages into the canonical chapter shell and shared visualization modules
- Bug fixes required to preserve existing behavior or accessibility
- Performance and reliability remediation

Disallowed work during freeze:
- New route-level one-off page architecture
- Page-specific CSS/JS behavior when equivalent shared token/component patterns exist
- Duplicative data models or chapter/concept maps outside canonical sources

Exception process:
1. Open a freeze-exception ticket with rationale, scope, and rollback plan.
2. Obtain explicit approval in weekly Architecture Review.
3. Timebox and track as elevated-risk work item.

## Phase Plan and Exit Criteria

| Phase | Scope | Exit Criteria (must all pass) | Primary Metrics |
|---|---|---|---|
| Foundation | Canonical model readiness, chapter shell baseline, migration workflow setup, governance launch | 1) Canonical data sources defined and referenced by all new work<br>2) Program board and ticketing active for all chapters/visualizations<br>3) Governance cadence running weekly with published notes<br>4) Freeze policy active and communicated | - Shell compliance >= 40% across in-scope chapter routes<br>- Canonical mismatch count <= 25 open mismatches<br>- A11y defects (sev1/sev2) <= 20<br>- Perf pass rate >= 60% of measured routes/modules |
| Chapter migration | Migrate chapter pages to unified shell and canonical taxonomy links | 1) All chapter pages moved to canonical shell structure<br>2) Every chapter includes required learning sections and cross-links<br>3) Legacy chapter-specific layouts retired or behind temporary compatibility layer only | - Shell compliance = 100% chapter routes<br>- Canonical mismatch count <= 10<br>- A11y defects (sev1/sev2) <= 10<br>- Perf pass rate >= 75% chapter routes |
| Visualization migration | Move visualizations to shared interaction semantics, fallback, and reduced-motion support | 1) All in-scope visualizations use shared interaction model and instruction pattern<br>2) Fallback mode and reduced-motion equivalent available per visualization<br>3) Resource disposal and lazy-loading validated for heavy modules | - Shell compliance maintained at 100% chapter routes<br>- Canonical mismatch count <= 8<br>- A11y defects (sev1/sev2) <= 8<br>- Perf pass rate >= 80% visualization modules |
| Atlas/tours rollout | Deliver non-linear atlas exploration and curated thematic tours integrated with canonical model | 1) Atlas routes and tours connected to canonical chapter/concept/symbol graph<br>2) Tour wayfinding and progress UX integrated into global/local nav model<br>3) Editorial sign-off on tour coherence and source anchors | - Shell compliance >= 95% across all user-facing routes<br>- Canonical mismatch count <= 5<br>- A11y defects (sev1/sev2) <= 5<br>- Perf pass rate >= 85% routes/modules |
| Hardening/launch | Defect burn-down, performance tuning, release readiness, freeze exit | 1) No open sev1 defects; sev2 defects at accepted threshold<br>2) Reliability, accessibility, and performance checks stable across two consecutive weekly cycles<br>3) Launch checklist complete with governance sign-off from Architecture + Editorial + QA | - Shell compliance = 100% all production routes<br>- Canonical mismatch count = 0 critical / <= 2 minor<br>- A11y defects (sev1/sev2) = 0 / <= 2<br>- Perf pass rate >= 95% |

## Metric Definitions

- **Shell compliance**: Percentage of in-scope routes implementing the standard chapter shell (header, thesis, key concepts, visualization module, synthesis, next links) and shared navigation semantics.
- **Canonical mismatch count**: Number of validated inconsistencies between route/module content and canonical glossary/taxonomy/relationship definitions.
- **A11y defects**: Open accessibility defects at severity 1 or 2 found via automated checks + manual keyboard/screen-reader validation.
- **Perf pass rate**: Percentage of measured routes/modules meeting agreed budgets (LCP, TBT, CLS, JS payload, interaction responsiveness, and visualization FPS constraints).

## Migration Ticket Board

Each migration item must be tracked as a discrete ticket with owner, date, and risk.

### Chapter Migration Tickets

| Ticket | Chapter | Owner | Target Date | Risk | Status | Notes |
|---|---|---|---|---|---|---|
| CH-MIG-01 | Chapter 1 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Includes concept checks + reflection prompt |
| CH-MIG-02 | Chapter 2 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Align cross-links to canonical graph |
| CH-MIG-03 | Chapter 3 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | High | Planned | Legacy bespoke layout removal risk |
| CH-MIG-04 | Chapter 4 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Validate term consistency |
| CH-MIG-05 | Chapter 5 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Ensure interaction instructions present |
| CH-MIG-06 | Chapter 6 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | High | Planned | Deep-linking dependency risk |
| CH-MIG-07 | Chapter 7 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Add synthesis and next-links parity |
| CH-MIG-08 | Chapter 8 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Validate source anchors |
| CH-MIG-09 | Chapter 9 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | High | Planned | Potential glossary normalization gaps |
| CH-MIG-10 | Chapter 10 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | QA focus on keyboard flow |
| CH-MIG-11 | Chapter 11 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Ensure canonical symbol links |
| CH-MIG-12 | Chapter 12 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Verify chapter narrative coherence |
| CH-MIG-13 | Chapter 13 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | High | Planned | Performance sensitivity on rich modules |
| CH-MIG-14 | Chapter 14 migration to canonical shell | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Editorial sign-off gate |

### Visualization Migration Tickets

| Ticket | Visualization Module | Owner | Target Date | Risk | Status | Notes |
|---|---|---|---|---|---|---|
| VIZ-MIG-01 | Archetype relationship graph | _TBD_ | _YYYY-MM-DD_ | High | Planned | Unify interaction semantics + legend |
| VIZ-MIG-02 | Shadow integration timeline | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Add reduced-motion equivalent |
| VIZ-MIG-03 | Anima/Animus polarity explorer | _TBD_ | _YYYY-MM-DD_ | High | Planned | Ensure keyboard-operable controls |
| VIZ-MIG-04 | Self symbol constellation view | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Canonical symbol mapping validation |
| VIZ-MIG-05 | Chapter concept dependency map | _TBD_ | _YYYY-MM-DD_ | High | Planned | Perf budget risk on dense graph |
| VIZ-MIG-06 | Individuation pathway simulator | _TBD_ | _YYYY-MM-DD_ | High | Planned | Fallback mode required |
| VIZ-MIG-07 | Mythic motif comparison matrix | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Editorial terminology harmonization |
| VIZ-MIG-08 | Tour narrative progress map | _TBD_ | _YYYY-MM-DD_ | Medium | Planned | Integrate with tours rollout |

## Risk Tracking Rules
- Any ticket marked **High** risk must include a mitigation plan and explicit review checkpoint in the weekly Architecture or QA review.
- Tickets missing owner/date cannot move to In Progress.
- Tickets with unresolved canonical mismatches cannot move to Done.
