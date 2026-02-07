# Editorial Style Guide

## Purpose
This guide standardizes terminology, tone, and definition quality for psychology content in the Aion visualization project.

## Terminology Standards

### Canonical term policy
- Use one canonical label for each core concept across docs, chapter pages, metadata, and UI copy.
- Keep capitalization consistent for canonical concepts (e.g., `Self`, `Shadow`, `Anima`, `Animus`, `Syzygy`).
- On first mention in a page or section, use the full canonical form. You may use shortened references only after first definition.

### Preferred forms
- Use `Self` (capitalized) for Jung's archetypal totality.
- Use `ego` (lowercase) for the center of consciousness unless it starts a sentence.
- Use `shadow` (lowercase) for the archetypal rejected/unconscious dimension unless sentence-initial.
- Use `anima/animus` when referring to the pair; use `Anima` or `Animus` when discussing one as a concept heading.
- Use `individuation` rather than substitutes like `self-development` in analytical contexts.

### Avoid term drift
- Avoid introducing near-synonyms that can fragment meaning (for example, switching between `wholeness center` and `Self` without clarification).
- If a new term is required, add it to the glossary and concept change log in the same PR.

## Tone Standards

### Voice
- Use precise, academically grounded language with plain-English readability.
- Prefer descriptive and interpretive phrasing over declarative absolutes.
- Distinguish interpretation from source claim using cues like `Jung argues`, `this passage suggests`, or `in this interpretation`.

### Sensitivity and scope
- Avoid diagnostic, prescriptive, or therapeutic claims.
- Avoid framing symbolic material as empirical fact unless explicitly sourced.
- Respect cross-cultural references by avoiding reductive comparisons.

### Reader guidance
- Keep sentences concise and direct.
- Use glossary-compatible definitions in intros and tooltips.
- When describing polarity/opposition, include integration context where relevant.

## Definition Standards

### Required definition format
Each concept definition should include:
1. **Concept name** (canonical form)
2. **One-sentence definition** (clear and neutral)
3. **Context sentence** (how it functions in Aion/Jungian framing)
4. **Boundary note** (what it is not or where interpretation varies)

### Definition quality checks
- No circular definitions (do not define a term with itself).
- Avoid undefined jargon in first-pass definitions.
- Keep each core definition stable across chapters unless intentional changes are logged.

## Source Anchor Standards
- Concept graph metadata must include `chapter`, `section`, and `note` for each concept node.
- `chapter` should be numeric and map to the chapter context for the visualization.
- `section` should match a human-readable subsection label.
- `note` should provide a brief rationale connecting concept placement to source interpretation.

## Update Protocol
When editing psychology-facing language:
1. Update glossary entries as needed.
2. Run glossary consistency tests.
3. Add/update an entry in `docs/concept-change-log.md` if definitions changed.
4. Complete `docs/psychology-domain-qa-checklist.md` before merge.
