# Aion Continual Visual Polish Loop

## Objective

Keep improving Aion Visualization as a visual-first learning atlas for Jung's *Aion*. Each batch should make the current site more visually meaningful, more interactive, more coherent, and easier to verify without drifting into a giant unreviewable redesign.

## Working Principles

- Stabilize before ornament: never start a visual batch from a dirty or failing baseline.
- Preserve the strongest prior design DNA: deep charcoal field, alchemical gold, cool analytic cyan, expressive serif display type, and Chapter 1's depth-field teaching rhythm.
- Make visuals teach: every animation, orbit, glyph, panel, and scene control should clarify a concept, relation, or chapter transition.
- Reduce text pressure: keep prose concise and let diagrams, scenes, symbolic marks, concept maps, and motion grammar carry the explanation.
- Improve the system, then the page: extract repeatable tokens and primitives before doing one-off chapter fixes.
- Ship one focused PR per batch with local checks, PR checks, and Pages smoke when routes change.

## Skill Stack For Each Loop

- Orchestration autopilot: split broad audits into independent scout, planner, reviewer, verifier, and devil-advocate tracks.
- Redesign existing projects: identify generic UI drift and upgrade the existing stack rather than replacing it.
- Frontend design pro and design taste frontend: enforce distinctive typography, asymmetric composition, tactile states, and anti-generic visual choices.
- High-end visual design: add refined material details, glass edge treatment, button-in-button cues, and cinematic rhythm where they support learning.
- Storytelling web: keep chapter pages as scrollytelling sequences with progressive visual understanding.
- Accessibility review: check contrast, focus, keyboard paths, landmarks, target size, and reduced-motion parity before handoff.
- React component performance: protect scene mounts, Three.js lazy loading, stable props, cleanup, and route budget discipline.

## Batch Loop

1. Baseline scan
   - Confirm `git status --short --branch` is clean or create a backup branch/patch first.
   - Run a narrow route/file audit for the target batch.
   - Identify the one reusable improvement that will compound across later pages.

2. Design intent
   - Name the learning job of the target surface.
   - Pick the visual grammar: opposition, integration, transformation, or cyclical return.
   - Define the visual proof: what the learner can now see or manipulate that was previously only text.

3. Component pass
   - Polish shared components before page-specific surfaces.
   - Prefer existing React pages, `src/app/styles.css`, canonical data, and Three scene adapters.
   - Avoid overlapping write scopes when using implementation workers.

4. Page pass
   - Apply the shared component upgrade to one route family.
   - Keep page copy short, visual hierarchy clear, and navigation consistent.
   - Check desktop and mobile composition before expanding the pattern.

5. Verification
   - Run the fastest targeted checks first, then broaden.
   - Inspect the rendered route with Playwright or the in-app browser.
   - Record any residual debt as the next batch input, not as hidden knowledge.

6. Ship
   - Commit a focused batch.
   - Push the branch and open a PR when the batch is coherent.
   - After merge, smoke live GitHub Pages for changed routes.

## Component Polish Order

1. Global shell
   - Floating scholarly nav, visible active state, quick chapter jump, skip link, and mobile wrapping.
   - Acceptance: all routes expose visible navigation, active route state, keyboard focus, and no mobile overlap.

2. Design tokens and material primitives
   - Typography stack, gold/cyan/rose palette, motion curves, surface treatments, chip styles, panels, and buttons.
   - Acceptance: repeated cards/panels/chips share one visual language without generic box-shadow or purple-blue drift.

3. ChapterSigil
   - Stronger chapter identity mark that can scale from compact nav/card usage to chapter hero usage.
   - Acceptance: sigils remain readable at compact size and do not become decorative noise.

4. Orbit and map controls
   - Reusable orbit semantics for Home, Chapters, Atlas, Timeline, Symbols, and About.
   - Acceptance: selected, hover, focus, and disabled states are visually distinct and keyboard-operable.

5. SceneHost
   - Loading, fallback, reduced-motion, nonblank canvas, and cleanup reliability.
   - Acceptance: scene routes pass smoke tests, reduced-motion shows meaningful non-motion summaries, and no console errors appear.

6. Chapter panel system
   - Scrollytelling panels, symbolic mini-diagrams, concept anchors, checkpoints, reflection, and next/previous links.
   - Acceptance: panels communicate the chapter's core movement with minimal prose and clear active state.

## Page Polish Order

1. Home
   - Gold-standard first viewport with living Aion constellation, concise path choices, and chapter orbit preview.

2. Shell and Chapters
   - Make the route system feel like one atlas: no route family should look bolted on.

3. Atlas
   - Evolve the map into a searchable concept-symbol-chapter constellation using canonical data.

4. Chapter 1: The Ego
   - Treat as the reference chapter. Preserve the depth field, root filaments, Self reveal, and teaching-by-reveal cadence.

5. Chapters 2-4
   - Shadow, Syzygy, and Self as the first coherent psychology cluster.

6. Chapters 5-9
   - Christ symbol and fish aeon cluster with stronger opposition, historical strata, and ambivalence visuals.

7. Chapters 10-14
   - Alchemy, Gnosis, and final synthesis cluster with transformation and integration grammar.

8. Timeline, Symbols, About
   - Bring supporting routes up to the same visual system after the core journey feels mature.

## Motion Grammar Backlog

- Opposition: split fields, mirror tension, projection arcs, warm/cool conflict.
- Integration: orbital relation, conjunction flashes, paired colors resolving into one field.
- Transformation: vessel, strata, phase change, heat, opacity, and material state shifts.
- Cyclical return: mandala, orbit, recurrence, return paths, and chapter-to-chapter resonance.

`opposition` and `integration` already have stronger CSS treatment. The next grammar batch should make `transformation` and `cyclical-return` equally distinct in the chapter panel system and route visuals.

## Verification Gates

Fast local sequence for most visual batches:

```bash
npm run lint
npx tsc --noEmit
npm run validate:consistency
npm run ci:chapter-shell
npm run test:app
npm run build
```

Route-impacting or page-polish batches also run:

```bash
npm run test:e2e:app
npm run test:a11y:app
npm run build:pages
npm run test:pages:artifact
```

Visual proof checklist:

- No console errors.
- No unexpected `404`s.
- Visible global navigation and active state.
- Keyboard path through nav, route controls, and selected interactive elements.
- Reduced-motion fallback is meaningful.
- Expected scene canvas is nonblank.
- Mobile layout has no incoherent overlap.
- Text stays short and does not crowd visual elements.

## First Five Batches

1. Visual system foundation
   - Tokens, typography, nav material, buttons, chips, shared cards/panels, and this loop document.

2. Home and shell detailing
   - Strengthen first viewport, path choices, metrics, nav choreography, and mobile polish.

3. Atlas constellation
   - Upgrade chapter/concept/symbol search into a more visual constellation with richer selection feedback.

4. Chapter 1 reference pass
   - Preserve and elevate the Ego page until it becomes the exemplar for every chapter.

5. Chapter cluster passes
   - Work in clusters: 2-4, 5-9, 10-14, each with focused scene/panel/route tests.
