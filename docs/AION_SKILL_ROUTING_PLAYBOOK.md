# Aion Skill Routing Playbook

## Purpose

Use this playbook when planning or executing visual-development batches for Aion Visualization. It turns the available skill stack into a repeatable workflow without requiring every skill on every turn.

The rule is simple: use many skills across the project, but use the smallest high-signal set for each batch. Every skill invocation must create evidence: a design direction, a code change, a QA finding, a screenshot, a test result, a PR, or a live-route verification.

## Default Batch Stack

Most visual batches should use this compact stack:

| Role | Default skill or tool | Output |
|---|---|---|
| Product/context | `redesign-existing-projects`, `open-design`, or `product-design:research` | Target route, audience, learning job, constraints |
| Taste direction | `design-taste-frontend`, `frontend-design`, `stitch-design-taste`, `high-end-visual-design` | Visual thesis, hierarchy, typography, material rules |
| Story/visualization | `storytelling-web`, `data-visualization`, D3/Three/WebGL skills as needed | Concept map, scene grammar, interaction model |
| Browser evidence | `Browser` / Playwright | Desktop/mobile screenshots, console/404 checks, route behavior |
| Accessibility/testing | `accessibility-review`, `webapp-testing` | Keyboard, reduced motion, touch targets, smoke/a11y gates |
| Shipping | `github:yeet` | Commit, push, PR, checks, merge/deploy evidence |

Default size: 4-6 skills plus Browser. Add more only when the task has distinct specialist work.

## Current Source Of Truth

Anchor skill-routed work to the active React/Vite app, not older static-site docs.

| Concern | Current source |
|---|---|
| Routes | `src/app/routes.ts`, `src/app/App.tsx` |
| Global shell | `src/app/components/Shell.tsx` |
| Shared visual system | `src/app/styles.css` |
| Chapter page shell | `src/app/pages/ChapterPage.tsx`, `src/app/components/SceneHost.tsx` |
| Chapter scene registry | `src/app/visualization/chapterScenes.ts` |
| Chapter scene modules | `src/visualizations/chapters/ch1` through `src/visualizations/chapters/ch14` |
| Canonical data | `src/data/aion-core/*`, `src/data/aion-graph/*`, `src/app/data/aionData.ts` |
| App contract tests | `tests/app/aion-app-contract.test.ts` |
| Browser smoke | `scripts/testing/app-shell-smoke.mjs` |
| Accessibility smoke | `scripts/testing/app-accessibility-smoke.mjs` |
| Visual QA control tower | `scripts/testing/visual-control-tower.mjs` |

Shared ownership warnings:

- `src/app/styles.css` has high blast radius. Keep one active owner per batch.
- `src/app/visualization/chapterScenes.ts` is a registry choke point. Avoid parallel edits unless one person owns integration.
- Old phase docs may mention static HTML, pure monochrome, or noncanonical chapter counts. Treat those as historical unless current source files and package scripts confirm them.
- Old visual-test summaries and Backstop/static dashboards target retired surfaces unless explicitly regenerated against the React/Vite route set. Use the Control Tower script for current route-score evidence.

## Specialist Triggers

Use named skills when their trigger is real:

| Trigger | Skills/tools |
|---|---|
| Broad multi-file route redesign | `orchestration-autopilot`, `parallel-task`, `subagent-driven-development` |
| Competing visual directions | `creative-production:moodboard-explorer`, `open-design`, `sdd:create-ideas` |
| Source-target comparison QA | `product-design:design-qa` after a source image/mockup and rendered implementation both exist |
| New generated visual assets | `imagegen` for raster backgrounds, texture plates, symbolic stills, and fallback images |
| Searchable maps, timelines, graphs | `data-visualization`, `d3-viz`, scientific-figure skills |
| Chapter narrative pacing | `storytelling-web` |
| Existing-app polish without architecture churn | `redesign-existing-projects`, `frontend-design`, `design-taste-frontend` |
| Current user/UX research on an external product | `product-design:research` |
| PR publishing and merge workflow | `github:yeet` plus local git and GitHub checks |

Do not invoke `product-design:design-qa` as generic critique. It requires both a source visual target and a rendered implementation.

## Browser Usage Contract

Use Browser for every route-impacting visual batch.

Required Browser evidence:

- Open the changed local route or live route.
- Capture or inspect at desktop and mobile widths.
- For visual batches, run `npm run test:visual:control-tower` and use `test-results/control-tower/route-scores.md` as the generated screenshot and route-score index.
- Check visible global nav, route context, primary interaction, and text overflow.
- Check console errors and unexpected 404s when practical.
- For chapter scenes, verify canvas presence and nonblank visual output through smoke tests.

Screenshots should be temporary unless the batch intentionally adds visual baselines. Delete temporary screenshots before committing.

## Creative Production And Imagegen

Use Creative Production before implementation when the visual direction is unclear or multiple art territories would help.

Good uses:

- Moodboards for "luxury scholarly atlas", "alchemical laboratory", "gnostic emanation map", or "fish aeon wheel".
- Scene territory exploration for chapter clusters.
- Reference boards for typography, materiality, diagrams, and symbolic density.

Use Imagegen only when a generated raster asset is the right medium. Do not use Imagegen to replace layout, navigation, data visualization, or interactive scene work that belongs in code.

## Subagent Policy

Spawn subagents by default for non-trivial batches, but give them independent lanes.

Recommended lanes:

- `explorer`: route/component/data map, read-only.
- `architect_planner`: implementation sequence and ownership boundaries.
- `implementation_worker`: bounded code slice in an explicit write set.
- `reviewer`: correctness, regressions, visual/accessibility risks.
- `test_verifier`: targeted verification and failure triage.
- `devil_advocate`: challenge the design plan and assumptions.

Use 3-6 workers for ordinary complex batches. Use 8-12 only for broad research, large migrations, or independent page-family audits. Do not spawn agents for trivial single-file fixes or simple factual checks.

## Design QA Release Rubric

For substantial visual batches, score each category as `0 fail`, `1 partial`, or `2 pass`. A batch should not ship with critical failures, and the total should be at least 85% unless the PR explicitly documents a narrow stabilization exception.

| Category | Pass condition | Evidence |
|---|---|---|
| Visual-first learning | First viewport has a meaningful visual anchor and concise supporting copy | Desktop/mobile Browser screenshots |
| Scholarly integrity | Terminology matches canonical data; source-anchor gaps are known and routed to the scholarly batch | Consistency validation and editorial notes |
| Meaningful interaction | Controls change visual understanding, not just decoration | Interaction matrix or Playwright smoke |
| Accessibility | Named controls, keyboard path, reduced motion, no color/motion-only meaning | `npm run test:a11y:app`, focused manual checks |
| Motion grammar | Motion maps to opposition, integration, transformation, or cyclical return | Motion intent notes and reduced-motion check |
| Data visualization | Graphs/maps answer a clear relationship question with legible labels | Visual spec and route screenshot |
| Browser evidence | No console errors, unexpected 404s, text overflow, or blank expected canvas | Browser/Playwright output |
| Performance/reliability | Route budget and WebGL lifecycle risks are checked when scenes change | Build, smoke, performance scripts as applicable |

Source anchors are important, but they are a dedicated content-governance migration. Do not make `sourceRefs` required casually inside a visual polish PR unless that batch owns the editorial migration and validation updates.

## Create Or Install New Skills

Do not install or create new skills just because more skills exist on the web. Create or install a new skill only when all are true:

1. The workflow recurs across this project.
2. Existing skills plus this playbook are insufficient.
3. The source is trusted or the local skill can be reviewed before use.

Preferred order:

1. Add or update a project doc.
2. Add a small script/test if it creates better evidence.
3. Create a project-local skill only when the workflow is stable.
4. Install an external skill only after source review and exact-path verification.

When evaluating external skills, prefer the standard Codex skill shape described in the official Codex skills documentation: `SKILL.md` with `name` and `description`, plus optional `scripts/`, `references/`, and `assets/`. For testing skills, prefer workflows that align with Playwright's official visual-comparison and accessibility-testing capabilities rather than bespoke screenshot scripts with stale selectors.

Useful external references:

- [Agent Skills - Codex](https://developers.openai.com/codex/skills)
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)

## Per-Batch Record

Every batch PR should include this short record in its body or notes:

```text
Skill stack:
Routes changed:
Visual thesis:
Browser evidence:
Checks:
Residual debt:
```

## Verification Matrix

Fast route-independent checks:

```bash
npm run lint
npx tsc --noEmit
npm run validate:consistency
npm run ci:chapter-shell
npm run test:app
npm run build
```

Route-impacting checks:

```bash
npm run test:e2e:app
npm run test:a11y:app
npm run build:pages
npm run test:pages:artifact
npm run test:visual:control-tower
```

`npm run test:visual:control-tower` is report-first in the early redesign phase. It fails on technical blockers such as route load failure, console/page errors, failed requests, HTTP 4xx/5xx responses, missing shell landmarks, horizontal overflow, and blank expected chapter canvases. It writes generated evidence under `test-results/control-tower/`; do not commit those screenshots unless a future batch intentionally creates visual baselines.

Live-site check after merge:

- Confirm GitHub PR checks are green.
- Merge through PR.
- Confirm `main` CI, Accessibility Gate, Deploy to GitHub Pages, and Pages deployment are green.
- Browser-smoke the live changed route.

## Next Skill-Routed Batches

1. Chapter 1 reference pass.
   - Skills: `frontend-design`, `design-taste-frontend`, `high-end-visual-design`, `storytelling-web`, Browser, `accessibility-review`, `webapp-testing`.
   - Output: Ego page as the visual benchmark for all chapters.

2. Chapter 2-4 psyche arc.
   - Skills: `storytelling-web`, `data-visualization`, D3/Three/WebGL skills, Browser, `webapp-testing`, reviewer/test verifier subagents.
   - Output: shadow, syzygy, and self as one coherent learning sequence.

3. Timeline/Symbols/About support-route polish.
   - Skills: `data-visualization`, `high-end-visual-design`, `redesign-existing-projects`, Browser, `accessibility-review`.
   - Output: support pages that are visual instruments, not text pages.

4. Scholarly source-anchor migration.
   - Skills: `academic-research`, `fact-check`, `conservative-retriever`, product research only if external user evidence is needed.
   - Output: source-reference structure filled enough to support public-facing concept and scene claims.
