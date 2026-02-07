# Psychology Domain QA Checklist (Pre-Merge)

Use this checklist for PRs that modify psychology-domain content, concept definitions, chapter interpretation, or concept graph metadata.

## A. Terminology and Style
- [ ] Canonical terms match `docs/editorial-style-guide.md`.
- [ ] No inconsistent term variants were introduced.
- [ ] Tone is interpretive/analytic rather than clinical or prescriptive.
- [ ] First-use definitions are present for newly introduced concepts.

## B. Definition Integrity
- [ ] Updated definitions are clear, non-circular, and jargon-minimized.
- [ ] Definition changes are reflected in glossary entries.
- [ ] Any definition drift is intentional and documented.
- [ ] Ambiguous claims include interpretive qualifiers (e.g., `Jung suggests`).

## C. Source Anchoring
- [ ] Concept graph nodes include `chapter`, `section`, and `note` metadata.
- [ ] Anchors are internally consistent with chapter content.
- [ ] Anchor notes are specific enough for reviewer traceability.

## D. Change Management
- [ ] `docs/concept-change-log.md` includes all definition updates.
- [ ] Rationale for each definition change is recorded.
- [ ] Backward compatibility impact (if any) is noted.

## E. Automated Checks
- [ ] Glossary consistency tests pass.
- [ ] Relevant existing tests pass for changed files.

## Reviewer Sign-off
- Domain reviewer:
- Date:
- PR:
- Notes:
