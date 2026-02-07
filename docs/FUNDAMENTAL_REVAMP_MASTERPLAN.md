# Aion Visualization — Fundamental Revamp Master Plan

## 0. Why this plan exists
The current webapp has valuable assets (multiple chapters, several visualizations, existing test/deploy scaffolding), but it still behaves as a collection of pages and demos rather than a deeply integrated learning platform. This plan defines a full core-level transformation strategy focused on conceptual clarity, structural consistency, premium visual quality, and measurable learning outcomes.

---

## 1. Current-state diagnosis (deep)

### 1.1 Structural diagnosis
- Content architecture is route/page-centric, not concept-centric.
- Narrative continuity between chapters and visualizations is inconsistent.
- Navigation patterns differ by area, reducing orientation and flow.
- Multiple legacy/parallel structures increase drift and inconsistency risk.

### 1.2 Learning diagnosis
- Visualizations are engaging but often positioned as demos, not pedagogically scaffolded modules.
- User pathways for beginners vs advanced learners are not clearly differentiated.
- Cross-concept synthesis (e.g., Shadow ↔ Self ↔ Syzygy) is under-supported.
- Reflection/application loops (understanding checks, recap loops) are limited.

### 1.3 Experience diagnosis
- Visual quality can be strong per-page but not always unified as a single design system.
- Motion exists, but semantic meaning of transitions is not consistently encoded.
- Users can lose context (“Where am I in Aion?” “What is this connected to?”).

### 1.4 Technical diagnosis
- Heavy interactive modules need stronger lifecycle management and shared abstractions.
- Consistency constraints are not enforced by architecture, data contracts, and tests.
- Performance/accessibility governance exists partially but needs hard gates.

---

## 2. North-star product definition

## 2.1 Product thesis
Build the definitive interactive Aion learning environment with dual intelligence:
1. **Narrative intelligence** (guided chapter progression)
2. **Relational intelligence** (concept graph exploration)

## 2.2 Product outcomes
- Users understand both the chapter sequence and the conceptual network of *Aion*.
- Users can move between reading, interaction, and synthesis without losing orientation.
- The experience feels museum-quality, modern, coherent, and meaningful.

## 2.3 Hard goals
- 100% consistency in terminology, layout structure, and interaction semantics.
- 100% chapter coverage with structured learning scaffolding.
- 100% visualization modules embedded in pedagogy (objective, guided interaction, insight summary).
- WCAG 2.1 AA baseline across all core experiences.
- Performance budgets met on mobile + desktop profiles.

---

## 3. Core transformation model

## 3.1 Canonical data core (single source of truth)
Create `src/data/aion-core/` with typed schemas for:
- **chapters**: id, order, title, thesis, summary, key concept IDs, prerequisites, outcomes
- **concepts**: id, canonical term, definition tiers (beginner/scholar/practitioner), source anchors
- **symbols**: id, motif, historical context, related concepts/chapters
- **relationships**: source, target, relation type, directionality, explanatory note, confidence
- **learning objects**: prompts, checks, assessments, reflection cards

### Deliverables
- JSON schema files
- runtime validators
- ingestion/build step
- integrity test suite (broken references, orphan concepts, duplicate labels)

## 3.2 Experience shell core
Create one global shell used across all routes:
- persistent orientation bar (chapter, concept cluster, progress)
- mode switcher: Journey / Atlas / Tours
- glossary drawer
- learning layer switch (Beginner/Scholar/Practitioner)

### Deliverables
- `src/core/app-shell/` (layout, state, accessibility)
- unified navigation model + keyboard map
- chapter context panel + related concept rail

## 3.3 Visualization core platform
Introduce reusable visualization module contract:
- init / mount / pause / resume / dispose lifecycle
- guided steps API
- learning checkpoint API
- telemetry hooks
- fallback rendering mode (static + explanation)

### Deliverables
- `src/core/viz-module/` framework
- adapters for all existing visualizations
- standardized UI chrome for module controls and summaries

## 3.4 Consistency core platform
Establish deterministic consistency through systems, not manual effort:
- Design tokens
- Component library
- Motion grammar
- Content template contracts
- Lint/check scripts for content + UI contract compliance

### Deliverables
- tokens: color, type, spacing, depth, motion
- chapter template package
- glossary consistency checker
- UI contract tests

---

## 4. Information architecture redesign

## 4.1 Primary modes
1. **Journey Mode** (chapter-first)
   - linear progression with synthesis checkpoints
2. **Atlas Mode** (concept-first)
   - graph navigation by archetype, symbol, polarity, theme
3. **Curated Tours**
   - short guided pathways for specific learning goals

## 4.2 IA map
- `/experience` — cinematic onboarding + path selection
- `/journey/chapter/:id` — standardized chapter pages
- `/atlas` — interactive concept universe
- `/tour/:id` — thematic guided tour
- `/glossary` — canonical terms with linked graph neighbors
- `/studio` — compare/contrast tools and learner synthesis workspace

## 4.3 Chapter blueprint (100% consistent)
Each chapter page must follow this exact structure:
1. Chapter identity + thesis
2. Why this matters (context)
3. Key concepts + canonical definitions
4. Primary interactive module
5. Insight checkpoints (short interactive understanding checks)
6. Symbol/relationship panel
7. Synthesis summary
8. Next steps (related chapter + related concept + optional tour)

---

## 5. Pedagogical system redesign

## 5.1 Three learning layers
- **Beginner**: intuitive language, low jargon, concrete examples
- **Scholar**: technical nuance, intertextual and structural analysis
- **Practitioner**: reflective/application prompts and journaling

## 5.2 Learning loop per module
1. Priming question
2. Guided interaction
3. Meaning capture prompt
4. Concept validation
5. Transfer prompt (“Where else does this apply?”)

## 5.3 Mastery system
Track mastery for concept clusters, not just page completion:
- novice → familiar → integrated
- show progress map and recommended revisits

---

## 6. Visual design and motion redesign

## 6.1 Design language
- Elegant dark field with controlled luminous accents
- Strong hierarchy and reading comfort
- Scientific/museum-grade information density without clutter

## 6.2 Token system
- typography scale with chapter/content roles
- spatial rhythm grid
- semantic color tokens (concept categories + states)
- depth and glass/light effects with strict limits

## 6.3 Motion grammar (semantic)
Encode concept relationships into motion:
- **opposition**: divergence + tension fields
- **integration**: convergence + harmonic stabilization
- **transformation**: staged morph sequences
- **cyclical return**: orbital recurrence and periodicity

## 6.4 Signature “wow” experiences
- Aion Universe map intro
- Real-time concept constellation morphing between chapter states
- Story transitions that visually encode chapter-to-chapter transformations

---

## 7. Visualization strategy (module-by-module)

## 7.1 Fish Symbol Timeline
Upgrade from timeline demo to semantic historical-symbolic engine:
- layered tracks: historical, symbolic, psychological interpretation
- user-controlled comparative epochs
- highlight shifts with annotated causes/effects

## 7.2 Shadow Integration
Evolve interaction from game-like drag behavior to structured transformation model:
- explicit stages: confrontation → differentiation → integration
- friction/ambiguity modeling
- reflective checkpoint at stage transitions

## 7.3 Anima/Animus Constellation
Turn into relational laboratory:
- relation type filters
- dynamic narratives (“show pathways to Self”)
- compare archetypal configurations by chapter context

## 7.4 Gnostic Cosmology
Convert to layered map + doctrine-psychology crosswalk:
- hierarchical level navigation
- interpretation overlays
- concept anchors linking back to chapters

## 7.5 Alchemical Lab
Transform from elemental toy into process pedagogy:
- alchemical operation stages
- symbolic/psychological parallel lanes
- operation consequences and reversibility

## 7.6 Aion Clock
Expand from zodiac age visualization to macro-cycle interpretation environment:
- multiscale temporal overlays
- symbolic transitions and confidence levels
- chapter-linked explanatory narratives

---

## 8. UI/UX consistency framework (100%)

## 8.1 Global component contracts
Mandatory reusable components:
- chapter header
- concept card
- relation card
- glossary tooltip
- insight checkpoint
- progress compass
- visualization control dock

## 8.2 Behavior contracts
- same keyboard shortcuts across experiences
- same loading/empty/error/fallback states
- same animation durations and easings by semantic role
- same tooltip/accessibility behavior everywhere

## 8.3 Content contracts
- one canonical glossary term per concept ID
- one canonical chapter summary per chapter ID
- one canonical relation description per relation type

## 8.4 Consistency test suite
Automate checks for:
- duplicate term variants
- missing chapter sections
- inconsistent component usage
- invalid relation links

---

## 9. Technical implementation roadmap

## Phase A — Foundation (4–6 weeks)
- build canonical data core and validators
- implement app shell and unified navigation
- define design tokens + component primitives
- create chapter template contract and migrate 2 pilot chapters

## Phase B — Platform migration (6–10 weeks)
- migrate all 14 chapters to unified blueprint
- adapt all visualization modules to new lifecycle contract
- integrate learning layers and mastery tracking
- launch atlas mode MVP

## Phase C — Premium interaction layer (5–8 weeks)
- semantic motion grammar implementation
- signature onboarding (`/experience`)
- curated tour system
- comparative tools (concept contrast lab)

## Phase D — Quality hardening (3–5 weeks)
- full accessibility audits and fixes
- performance budget optimization passes
- cross-browser visual regression + interaction regression
- content/editorial QA and source anchor validation

## Phase E — Launch and post-launch iteration (ongoing)
- telemetry-informed refinements
- A/B testing for onboarding and path recommendation
- new thematic tours and advanced scholarly modules

---

## 10. Governance and operating model

## 10.1 Team lanes
- Product/IA lead
- Jungian editorial lead
- Design systems lead
- Visualization engineering lead
- Accessibility/performance QA lead

## 10.2 Review gates
- Gate 1: Concept correctness
- Gate 2: Consistency compliance
- Gate 3: Accessibility compliance
- Gate 4: Performance compliance
- Gate 5: Learning outcome validation

## 10.3 Definition of done (major feature)
A feature is done only when:
- conceptually accurate
- integrated into canonical data model
- uses standard components/tokens/motion semantics
- passes accessibility + performance gates
- includes tests and documentation updates

---

## 11. Metrics and success measurement

## 11.1 Learning metrics
- chapter comprehension checkpoint pass rates
- concept mastery progression rates
- revisit rates for recommended concept links

## 11.2 UX metrics
- completion rates by mode (Journey/Atlas/Tour)
- drop-off points and recovery rates
- interaction depth in visualization modules

## 11.3 Quality metrics
- consistency violations per release (target: near-zero)
- accessibility defects by severity
- FPS/memory stability for visual modules
- regression escape rate

---

## 12. Risks and mitigations

## Risk 1: Scope explosion
Mitigation: strict phased rollout, architecture-first milestones, no parallel ad-hoc feature work.

## Risk 2: Visual overproduction reduces clarity
Mitigation: pedagogical objective required for every animation/interaction.

## Risk 3: Performance degradation with advanced visuals
Mitigation: hard budgets, staged loading, adaptive quality tiers, fallback modes.

## Risk 4: Conceptual drift
Mitigation: canonical data model + editorial review + source anchor checks.

## Risk 5: Consistency debt
Mitigation: component contracts + CI consistency tests + template enforcement.

---

## 13. Concrete first 30-day execution checklist
1. Create canonical schemas and validators.
2. Implement app shell and unified nav prototype.
3. Build design token system and migrate global styles.
4. Create standardized chapter template and migrate Chapter 1 + Chapter 2.
5. Wrap one visualization (Shadow) into the new module contract.
6. Launch glossary canonical source and term checker.
7. Add consistency CI jobs for content/UI contracts.
8. Produce before/after QA report for architecture, consistency, and learning flow.

---

## 14. Additional strategic opportunities
- Private reflective journal with local-first storage and export.
- AI-assisted concept explainer constrained to canonical concept graph.
- Multi-language pathway once canonical content model stabilizes.
- Classroom mode (instructor tours + discussion prompts).
- Museum installation mode (kiosk UX + large-display choreography).

---

## 15. Final directive
Do not ship isolated visual tweaks as “revamp.”
Ship architecture, pedagogy, and consistency systems first; then visual spectacle becomes coherent, meaningful, and durable.
