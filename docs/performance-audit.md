# Performance Audit - June 2025

The new `scripts/audit-bundles.cjs` utility was used to check the size of assets in the `src` directory.

```
Bundle Size Audit for src directory
JS: 524.87 KB
CSS: 64.34 KB
HTML: 675.93 KB
OTHER: 0.00 KB
TOTAL: 1265.14 KB
```

To keep the site performant we enabled dynamic module loading via `lazy-visualizations.js` and lowered the WebGL context limit to reduce memory usage on low-power devices.
