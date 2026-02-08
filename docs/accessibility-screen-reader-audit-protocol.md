# Screen Reader Manual Audit Protocol (Core Routes)

This protocol is required for every release candidate and complements automated checks.

## Routes to Audit
- `/src/index.html`
- `/chapters/index.html`
- `/src/timeline.html`
- `/src/symbols.html`
- `/src/about.html`

## Required Assistive Technology Matrix
- NVDA + Firefox (Windows)
- VoiceOver + Safari (macOS)
- TalkBack + Chrome (Android) for at least one smoke pass

## Manual Walkthrough Steps (Each Route)
1. Start from top of document and read by landmarks (quick-nav for landmarks).
2. Confirm there is exactly one clear **main** region and at least one navigation region.
3. Traverse all interactive elements with `Tab` / `Shift+Tab`.
4. Verify every control has a meaningful accessible name and role announcement.
5. Trigger primary actions with keyboard only (`Enter` / `Space`), no pointer.
6. Validate focus order follows visual/narrative order.
7. Confirm no critical information is conveyed by color/motion alone.
8. Enable reduced motion and confirm equivalent understanding path remains available.
9. For visualization routes, validate slider/button/toggle controls can be operated without drag gestures.
10. Record issues with severity, reproduction steps, route, and control selector/text.

## Pass/Fail Criteria
- **Block release** if any of the following are found:
  - Missing/incorrect landmark structure on a core route
  - Unlabeled critical controls
  - Keyboard trap or unreachable key learning interaction
  - Visualization controls requiring pointer-only interaction
- Non-critical issues must be logged with remediation owner and target release.

## Reporting Template
- Route:
- Screen reader + browser:
- Issue summary:
- Severity (Critical/High/Medium/Low):
- Steps to reproduce:
- Expected announcement/behavior:
- Actual announcement/behavior:
- Suggested fix:
