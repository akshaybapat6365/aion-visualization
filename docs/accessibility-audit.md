# Accessibility Audit - June 2025

The project was reviewed for common accessibility issues. Key findings:

- All interactive regions now receive ARIA roles and labels via `accessibility-utils.js`.
- Keyboard navigation is enabled for menus and visualizations.
- Skip links provide quick navigation for screen readers.
- Reduced motion styles respect the `prefers-reduced-motion` media query.

No blocking issues were found. Further manual testing with screen readers is recommended before the public launch.
