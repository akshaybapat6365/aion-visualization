# Concept Change Log

Tracks updates to core psychology concept definitions and rationale.

## 2026-02-07

### Added baseline canonical glossary
- **Change**: Added a project glossary with canonical terms and one-line definitions.
- **Why**: Establish a stable source for terminology consistency checks and editorial review.
- **Impact**: Enables automated duplicate/variant detection and reduces definition drift.
- **Related files**: `docs/glossary.md`, `tests/functionality/glossary-consistency.test.js`

### Added source-anchor metadata policy
- **Change**: Added required `chapter`, `section`, and `note` anchors for concept graph metadata and applied anchors to chapter 8 interactive concept graph nodes.
- **Why**: Improve traceability from visual nodes to interpretive source context.
- **Impact**: Reviewers can audit node meanings against chapter framing before merge.
- **Related files**: `docs/editorial-style-guide.md`, `chapters/chapter-8.html`
