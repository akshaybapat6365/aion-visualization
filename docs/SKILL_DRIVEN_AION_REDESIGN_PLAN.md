# Skill-Driven Aion Redesign Plan

## Purpose

This plan turns the installed Codex skill library into a disciplined execution system for the Aion Visualization redesign. The goal is not to use skills performatively. The goal is to use a large, relevant set of design, frontend, visualization, research, testing, performance, and review skills so the project becomes a visual-first learning atlas for Jung's *Aion*.

For daily routing, use the compact companion guide: [Aion Skill Routing Playbook](./AION_SKILL_ROUTING_PLAYBOOK.md). This document remains the deeper roadmap and inventory.

The plan preserves the user's stated taste direction:

- Keep the best parts of the previous design language, especially the Chapter 1 Ego typography, dark field, symbolic motion, and cinematic atmosphere.
- Make every surface visual-first, interactive, and sparse with text.
- Teach the book to someone who has not read it by using meaningful symbolic scenes, 3D visualizations, interaction, and a connected narrative system.
- Use the React/Vite app shell, canonical Aion data, Three.js scenes, and global navigation as the forward path.

## Skill Inventory Summary

The current machine has a large skill library. A symlink-safe inventory pass over installed skill roots found roughly:

| Source | Count | Role in this plan |
|---|---:|---|
| Active vendor skills | 1228 | Engineering, QA, accessibility, product, research, agents, review, performance |
| `ai-config-main` skills | 99 | Taste, themes, frontend design, research, data visualization, webapp testing |
| Codex skill root | 9 | Three/WebGPU, D3, storytelling web, animation, documentation |
| System skills | 4 | First-party image, docs, plugin, skill tooling |

The project should not blindly invoke every installed skill. Many are irrelevant automation or business/compliance skills. Instead, each phase below uses a broad but focused skill set that directly improves the Aion website.

## Operating Rule For Skill Use

For each work batch:

1. Pick a small working stack of 4-8 skills.
2. Read each selected `SKILL.md` enough to follow its workflow.
3. Produce one concrete artifact: code, design tokens, visualization module, test, audit, or plan update.
4. Verify with browser screenshots, nonblank canvas checks, accessibility scans, build checks, and consistency validators.
5. Record what skill stack was used and what changed.

This keeps the work intense and skill-rich without turning the project into chaos.

The short version: pick a default stack of product/context, taste direction, story/visualization, Browser evidence, accessibility/testing, and shipping. Add specialist skills only when their trigger is real.

## Core Skill Stack

### 1. Taste And Visual Direction

Use these when designing the look and page composition:

| Skill | Use |
|---|---|
| `high-end-visual-design` | Agency-tier polish, premium typography, tactile buttons, motion curves, spatial rhythm |
| `design-taste-frontend` | Avoid generic AI design, enforce strong visual taste and hierarchy |
| `gpt-taste` | Push pages away from default layouts and toward distinctive visual compositions |
| `frontend-design-pro` / `frontend-design` | Layout, visual systems, responsive frontend execution |
| `redesign-existing-projects` | Improve the current app without breaking architecture |
| `luxe-theme-studio` | Dark luxury, alchemical gold, scholarly atlas tone |
| `premium-theme-factory` / `theme-factory` | Formalize theme variants and token families |
| `open-design` | Generate alternate art direction explorations before implementation |
| `reference-driven-design` | Use if screenshots of the previous design are supplied or extracted as reference |
| `brand-guidelines` | Lock a durable Aion identity system |

Primary outputs:

- `src/app/styles.css` token upgrades.
- A living visual language page in docs.
- Component states for buttons, cards, chapter navigation, filters, and scene controls.
- Screenshot-based comparison against previous Ego design.

### 2. Symbolic And Scholarly Integrity

Use these when changing concepts, summaries, chapter sequencing, or symbolic claims:

| Skill | Use |
|---|---|
| `academic-research` | Research-grounded framing of Jungian terms |
| `deep-research` | Longer source tracing for difficult chapter concepts |
| `fact-check` | Check claims before they enter public copy |
| `conservative-retriever` | Prefer restrained, source-compatible explanations |
| `project-knowledge` | Keep project-specific decisions consistent |
| `literature-reviewer` / `claude-scholar` skills | Use only when doing actual literature/source work |
| `zotero` tooling if available | Use for future source anchor workflows |

Primary outputs:

- Strengthened `src/data/aion-core/*`.
- Optional `sourceRefs` filled later with chapter/section anchors.
- A concept editorial QA checklist.
- No unsupported invented Jung claims.

### 3. Visualization And Generative Graphics

Use these when building chapter scenes, atlas maps, symbolic diagrams, and animation systems:

| Skill | Use |
|---|---|
| `webgpu-threejs-tsl` | Advanced Three.js/WebGPU/WebGL visual scene planning |
| `d3-viz` | Graph, atlas, timeline, and relational visualization |
| `algorithmic-art` | Symbolic generative art systems for chapter surfaces |
| `data-visualization` | Encode relations and learning structure visually |
| `scientific-figures` | Produce legible diagrams with accurate labels and hierarchy |
| `canvas-design` | Static fallback images and non-WebGL visual alternatives |
| `storytelling-web` | Scrollytelling sequence design and narrative animation pacing |
| `wiggle` | Motion experimentation where subtle animated life helps comprehension |

Primary outputs:

- Scene adapters for all 14 chapters.
- Meaningful interaction states per scene.
- Static/reduced-motion equivalents.
- Nonblank canvas tests for every route.
- Shared motion grammar tied to opposition, integration, transformation, and cyclical return.

### 4. Frontend Architecture And Performance

Use these when refactoring React, routing, scene lifecycle, and bundle strategy:

| Skill | Use |
|---|---|
| `senior-frontend` | React architecture and component quality |
| `senior-architect` | System-level route/data/component decisions |
| `react-component-performance` | Render behavior, memoization, heavy scene isolation |
| `performance-profiler` | Runtime and bundle performance audits |
| `tech-stack-evaluator` | Validate library choices before adding dependencies |
| `migration-architect` | Preserve compatibility while moving away from legacy static stacks |
| `dependency-auditor` | Prevent dependency bloat and vulnerable additions |

Primary outputs:

- One canonical app shell.
- Lazy-loaded scene chunks.
- WebGL lifecycle cleanup.
- Performance budgets per route.
- Compatibility redirects for legacy paths.

### 5. Testing, Accessibility, And Browser Verification

Use these before any work is considered stable:

| Skill | Use |
|---|---|
| `webapp-testing` | Playwright scripts and local app inspection |
| `playwright` / `playwright-pro` | Route smoke, screenshots, visual regression |
| `screenshot` / `full-page-screenshot` | Visual review artifacts |
| `accessibility-review` | WCAG 2.2 AA page audit |
| `a11y-audit` | Deeper codebase accessibility fixes |
| `senior-qa` | QA strategy and test expansion |
| `verification-before-completion` | Prevent declaring done without evidence |
| `trailofbits-property-based-testing` | Use selectively for data/model invariants |

Primary outputs:

- `npm run test:e2e:app` remains a real browser gate.
- Axe checks for key routes.
- Keyboard and reduced-motion checks.
- Screenshot set: Home, Chapters, Atlas, Chapter 1, one mid-book chapter, Chapter 14.

### 6. Review, Critique, And Shipping Gates

Use these after each major batch:

| Skill | Use |
|---|---|
| `code-reviewer` | Correctness and maintainability review |
| `adversarial-reviewer` | Harsh pass for hidden regressions and weak assumptions |
| `pr-review-expert` | PR-quality final audit |
| `ship-gate` | Decide if a batch can be considered shippable |
| `security-guidance` / `security-best-practices` | Ensure static app and tooling changes are safe |
| `full-output-enforcement` | Keep deliverables complete and not half-written |

Primary outputs:

- Findings-first review notes.
- Final verification matrix.
- No unresolved console errors, 404s, or broken navigation paths.

### 7. Multi-Agent And Parallel Workflows

Use these when a batch is broad enough to benefit from parallel critique or alternatives:

| Skill | Use |
|---|---|
| `agenthub` / `spawn` / `eval` / `merge` | Competing implementation or design alternatives |
| `dispatching-parallel-agents` | Split research, design, testing, and code review tasks |
| `swarm-planner` | Multi-track execution planning |
| `using-git-worktrees` / `git-worktree-manager` | Isolated experiments for large visual alternatives |
| `autoresearch-agent` | Metric-driven improvement loops when a clear score exists |

Primary outputs:

- Alternative design proposals for high-value pages.
- Isolated branch/worktree experiments.
- Evaluation rubrics before merge.

## Whole-Project Execution Phases

### Phase 0: Control Tower And Evidence Baseline

Skill stack:

- `project-skill-audit`
- `writing-plans`
- `verification-before-completion`
- `webapp-testing`
- `accessibility-review`
- `performance-profiler`

Actions:

- Keep this document as the current skill orchestration plan.
- Preserve the React/Vite app as the canonical implementation.
- Capture baseline screenshots for `/`, `/chapters`, `/atlas`, `/journey/chapter/ch1`, `/journey/chapter/ch7`, `/journey/chapter/ch14`.
- Record current build/test/a11y evidence.
- Track route performance and chunk sizes.

Success evidence:

- `npm run build`
- `npm run test:app`
- `npm test`
- `npm run validate:consistency`
- `npm run ci:chapter-shell`
- `npm run test:e2e:app`
- Axe WCAG scan on core routes
- Screenshots saved only as intentional artifacts or deleted before final handoff

### Phase 1: Visual Language Canon

Skill stack:

- `high-end-visual-design`
- `design-taste-frontend`
- `gpt-taste`
- `luxe-theme-studio`
- `premium-theme-factory`
- `redesign-existing-projects`

Actions:

- Keep the Ego page's huge serif display type, dark field, gold/cyan symbolic accents, and restrained scholarly atmosphere as the visual north star.
- Replace older monochrome-only docs with the current luxury scholarly atlas direction:
  - black field,
  - alchemical gold,
  - cool analytic cyan,
  - Instrument Serif display,
  - Source Serif body moments,
  - compact UI sans for controls.
- Define page-level composition patterns:
  - full-bleed visual stage,
  - orbit map,
  - symbolic lab,
  - split scrollytelling,
  - visual index wall.
- Add reusable CSS primitives for:
  - glass/gold controls,
  - scene panels,
  - chapter cards,
  - map nodes,
  - concept chips,
  - reduced-motion still frames.

Success evidence:

- No page reads as generic SaaS or AI-template design.
- Home, Chapters, Atlas, Chapter 1 share a clear family resemblance.
- Mobile does not clip text or hide controls.

### Phase 2: Canonical Knowledge And Learning Model

Skill stack:

- `academic-research`
- `fact-check`
- `conservative-retriever`
- `deep-research`
- `project-knowledge`

Actions:

- Treat `src/data/aion-core/*` as the single source for chapter/concept/symbol relationships.
- Add missing optional source-reference slots without forcing unsupported anchors yet.
- Audit every chapter summary for:
  - conceptual restraint,
  - visual learnability,
  - no unsupported section claims,
  - short public-facing copy.
- Create a compact "visual thesis" for each chapter:
  - what the scene shows,
  - what interaction teaches,
  - what insight the user should retain.

Success evidence:

- `npm run validate:consistency` proves no broken references.
- No duplicate chapter arrays in page components.
- Page copy stays short and visual-first.

### Phase 3: Scene Engine Upgrade

Skill stack:

- `webgpu-threejs-tsl`
- `d3-viz`
- `algorithmic-art`
- `storytelling-web`
- `react-component-performance`
- `performance-profiler`

Actions:

- Keep the existing Three.js chapter modules as substrate, but adapt them into a consistent scene contract:
  - mount,
  - setPanelState,
  - setReducedMotion,
  - dispose.
- Make every chapter scene teach one core idea with one dominant visual metaphor.
- Add common controls:
  - reset,
  - focus mode,
  - reduced-motion mode,
  - checkpoint state.
- Improve scene richness in this order:
  1. Chapter 1, The Ego - preserve and refine the loved design.
  2. Chapter 2, The Shadow - mirror/projection/integration field.
  3. Chapter 3, Syzygy - orbital relation lab.
  4. Chapter 4, Self - mandala/quaternity scene.
  5. Chapter 14, final synthesis - prove the whole arc.
  6. Chapters 5-13 - polish through fish, prophecy, alchemy, Gnosis.

Success evidence:

- Nonblank canvas pixel checks pass for all 14 chapters.
- Route changes do not leak WebGL resources.
- Reduced-motion fallback preserves meaning.

### Phase 4: Page Factory And Navigation System

Skill stack:

- `senior-frontend`
- `senior-architect`
- `frontend-design-pro`
- `redesign-existing-projects`
- `react-component-performance`

Actions:

- Complete one global shell:
  - Home,
  - Chapters,
  - Journey,
  - Atlas,
  - Timeline,
  - Symbols,
  - About,
  - quick chapter jump,
  - previous/next chapter controls,
  - active route state,
  - mobile navigation.
- Turn Chapters and Atlas into complementary views:
  - Chapters is a visual sequence and entry point.
  - Atlas is searchable, filterable concept/symbol graph exploration.
- Add route transition semantics from `docs/animation-grammar.md`.

Success evidence:

- All canonical routes load directly and through legacy redirects.
- The chapter jump can launch every chapter.
- The app is navigable by keyboard.

### Phase 5: Chapter-By-Chapter Visual Production

Skill stack:

- `storytelling-web`
- `algorithmic-art`
- `webgpu-threejs-tsl`
- `data-visualization`
- `scientific-figures`
- `accessibility-review`

Per-chapter production loop:

1. Define visual thesis.
2. Define primary symbolic geometry.
3. Define interaction grammar.
4. Define three scrollytelling panels.
5. Implement or refine Three/D3/Canvas scene.
6. Add reduced-motion still equivalent.
7. Verify mobile, desktop, keyboard, and a11y.

Chapter visual map:

| Chapter | Visual direction |
|---|---|
| 1. The Ego | Ego/Self depth field, small light inside larger psychic totality |
| 2. The Shadow | Mirror/projection field, rejected figure returning to relation |
| 3. Syzygy | Anima/animus orbital relation lab |
| 4. Self | Mandala, quaternity, ordering totality |
| 5. Christ Symbol | Trinity/quaternity, missing fourth, luminous cross/root system |
| 6. Sign of the Fishes | Zodiac wheel, opposing fish, aeon cycle |
| 7. Prophecies | Time field of collective anxiety and symbolic expectation |
| 8. Historical Fish | Layered historical strata and symbol sediment |
| 9. Ambivalent Fish | Paradox mirror, ouroboros, double meaning |
| 10. Fish in Alchemy | Vessel transformation sequence |
| 11. Alchemical Interpretation | Opus wheel, Mercurius, lapis |
| 12. Christian Alchemical Background | Root system joining traditions |
| 13. Gnostic Symbols | Emanation/quaternio map |
| 14. Self Dynamics | Final synthesis mandala and aeon integration |

Success evidence:

- Every chapter is visually distinct but systemically consistent.
- The user can understand the narrative sequence without reading long prose.
- Every page has meaningful interaction, not decorative motion.

### Phase 6: Atlas, Timeline, Symbols, About

Skill stack:

- `d3-viz`
- `data-visualization`
- `scientific-figures`
- `high-end-visual-design`
- `frontend-design-pro`

Actions:

- Atlas:
  - searchable concept/chapter/symbol map,
  - filters by cluster and relation type,
  - direct chapter launch,
  - concept detail states.
- Timeline:
  - visual time field connecting Jung's publication context, Aion chapter arc, and symbolic motifs.
- Symbols:
  - gallery of visual motifs, each linked to concepts and chapters.
- About:
  - concise statement of scholarly method, visual-first learning model, accessibility/performance commitments.

Success evidence:

- These pages feel as visually rich as the chapter surfaces.
- No route becomes a text-heavy placeholder.

### Phase 7: Excellence Gate

Skill stack:

- `webapp-testing`
- `playwright`
- `a11y-audit`
- `accessibility-review`
- `performance-profiler`
- `code-reviewer`
- `adversarial-reviewer`
- `ship-gate`

Actions:

- Expand browser smoke coverage.
- Add screenshot comparison gates for key routes.
- Add canvas nonblank checks on desktop and mobile.
- Add keyboard and reduced-motion checks for scene controls.
- Add bundle/perf reporting for app shell vs scene chunks.
- Run findings-first review before handoff.

Required checks:

```bash
npm run build
npm run test:app
npm test
npm run validate:consistency
npm run ci:chapter-shell
npm run test:e2e:app
```

Additional browser/a11y checks:

- Axe WCAG scan for `/`, `/chapters`, `/atlas`, `/timeline`, `/symbols`, `/about`, `/journey/chapter/ch1`, `/journey/chapter/ch14`.
- Screenshot inspection on desktop and mobile.
- Console error and 404 scan.
- WebGL cleanup scan after cycling through at least five chapters.

## Batch Execution Order From Here

### Batch A: Current shell and visual index hardening

Already underway:

- Home full-bleed Aion field.
- Chapters visual orbit page.
- Atlas visual map repair.
- Global chapter jump and adjacent chapter controls.
- Strong browser smoke tests.

Next refinements:

- Make nav more fluid and premium on mobile.
- Add route transition meaning states.
- Add screenshot baseline set.

### Batch B: Chapter 1 perfection pass

Goal:

- Preserve what the user loved.
- Make it the reference-quality chapter.

Skill stack:

- `high-end-visual-design`
- `webgpu-threejs-tsl`
- `storytelling-web`
- `algorithmic-art`
- `accessibility-review`
- `react-component-performance`

Deliverables:

- Refined Ego scene lighting and depth.
- Interactive checkpoints tied to ego/Self relation.
- Reduced-motion still diagram.
- Screenshot evidence.

### Batch C: Chapters 2-4 core psyche arc

Goal:

- Build the first conceptual arc: ego, shadow, syzygy, Self.

Skill stack:

- `webgpu-threejs-tsl`
- `d3-viz`
- `scientific-figures`
- `storytelling-web`
- `academic-research`
- `fact-check`

Deliverables:

- Shadow mirror.
- Syzygy orbital lab.
- Self mandala.
- Unified scrollytelling controls.

### Batch D: Chapters 5-9 fish and aeon arc

Goal:

- Make the historical-symbolic middle of the book understandable visually.

Skill stack:

- `data-visualization`
- `algorithmic-art`
- `scientific-figures`
- `deep-research`
- `fact-check`
- `storytelling-web`

Deliverables:

- Christ symbol excluded-fourth visualization.
- Zodiac/fish aeon wheel.
- Prophecy anxiety field.
- Fish history strata.
- Ambivalent fish/ouroboros scene.

### Batch E: Chapters 10-14 alchemy, Gnosis, synthesis

Goal:

- Turn the difficult final arc into a visual transformation system.

Skill stack:

- `webgpu-threejs-tsl`
- `algorithmic-art`
- `data-visualization`
- `academic-research`
- `conservative-retriever`
- `performance-profiler`

Deliverables:

- Alchemical vessel sequence.
- Opus/Mercurius/lapis wheel.
- Christian-alchemical roots.
- Gnostic emanation/quaternio.
- Final aeon mandala synthesis.

### Batch F: Whole-site review and polish

Goal:

- Make the product feel finished, coherent, fast, accessible, and unusually beautiful.

Skill stack:

- `code-reviewer`
- `adversarial-reviewer`
- `a11y-audit`
- `webapp-testing`
- `performance-profiler`
- `ship-gate`

Deliverables:

- Findings-first review.
- Fixed critical/major issues.
- Final screenshots.
- Verification matrix.

## Quality Bar

A page is not "perfected" unless all are true:

- It has a dominant visual scene or visual map.
- Text is concise and subordinate to the visual learning.
- Interaction teaches a Jungian concept.
- It uses canonical chapter/concept/symbol data.
- It has keyboard access.
- It has reduced-motion parity.
- It has no console errors or 404s.
- It passes responsive screenshot inspection.
- It feels like the same luxury scholarly atlas as Chapter 1 and Home.

## Immediate Next Action

Continue with Batch A and Batch B:

1. Finish cleanup after current Home/Chapters/Atlas/global navigation work.
2. Capture stable screenshots.
3. Start the Chapter 1 perfection pass using the Ego page as the design reference.
4. Carry the refined Chapter 1 shell pattern into Chapter 2.
