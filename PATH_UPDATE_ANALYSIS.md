# Aion Visualization Path Update Analysis

## Current Directory Structure

```
/aion-visualization/
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── chapters.css
│   └── js/
│       ├── core/
│       │   ├── chapter-router.js
│       │   ├── navigation.js
│       │   └── utilities.js
│       ├── chapters/
│       └── visualizations/
│           └── webgl-manager.js
├── chapters/
│   ├── index.html
│   ├── enhanced/
│   │   └── chapter-1.html through chapter-14.html
│   └── standard/
│       └── chapter-1.html through chapter-14.html
└── src/
    ├── index.html
    ├── chapters.html
    ├── chapter1.html through chapter14.html
    └── [various .js and .css files]
```

## Files That Need Path Updates

### 1. **Main Index Files**
- `/src/index.html` - Currently uses relative paths, needs no updates if staying in src/
- `/chapters/index.html` - Uses incorrect relative paths (styles-v3.css, transitions.js)

### 2. **Source Chapter Files** (/src/)
All chapter files (chapter1.html - chapter14.html) currently use:
- CSS: `<link rel="stylesheet" href="styles-v3.css">`
- JS: Various scripts like `transitions.js`, `visualization-loader.js`, etc.
- Navigation: Links to other chapters use `chapter2.html` format

### 3. **Enhanced Chapter Files** (/chapters/enhanced/)
All enhanced chapter files currently use:
- CSS: `<link rel="stylesheet" href="../../assets/css/main.css">`
- JS: Mix of paths - some use `../../assets/js/core/utilities.js`, others use local paths
- Navigation: Mix of paths - some use `../../index.html`, others use local references

### 4. **Standard Chapter Files** (/chapters/standard/)
Similar issues to enhanced chapters with inconsistent path references.

## Current Path Patterns Found

### CSS Imports
1. **In /src/ files:**
   - `href="styles-v3.css"` (relative to src/)
   - `href="responsive-utils.css"` (relative to src/)

2. **In /chapters/enhanced/ files:**
   - `href="../../assets/css/main.css"` (correct for new structure)

3. **In /chapters/index.html:**
   - `href="styles-v3.css"` (incorrect - file doesn't exist at this level)

### JavaScript Imports
1. **In /src/ files:**
   - Direct references: `src="transitions.js"`
   - CDN: `src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"`

2. **In /chapters/enhanced/ files:**
   - Mix of `../../assets/js/core/utilities.js` and local references
   - Many scripts reference files that don't exist (e.g., `js/advanced-animations.js`)

### Navigation Links
1. **In /src/ files:**
   - Nav links: `href="index.html"`, `href="chapters.html"`
   - Chapter links: `href="chapter2.html"`

2. **In /chapters/enhanced/ files:**
   - Nav links: `href="../../index.html"` (assumes index.html is at root)
   - Chapter links: `href="chapter2.html"` (incorrect - missing path)

## Required Path Mappings

### For Files in /src/
No changes needed if keeping current structure.

### For Files in /chapters/enhanced/
```
CSS:
- styles-v3.css → ../../assets/css/main.css OR ../../src/styles-v3.css
- responsive-utils.css → ../../src/responsive-utils.css

JS (from src/):
- transitions.js → ../../src/transitions.js
- visualization-loader.js → ../../src/visualization-loader.js
- webgl-utils.js → ../../src/webgl-utils.js
- [other JS files] → ../../src/[filename].js

JS (from assets/):
- Already correct: ../../assets/js/core/utilities.js

Navigation:
- index.html → ../../src/index.html
- chapters.html → ../../src/chapters.html
- chapter2.html → ./chapter-2.html (note naming convention)
- timeline.html → ../../src/timeline.html
- symbols.html → ../../src/symbols.html
- about.html → ../../src/about.html
```

### For Files in /chapters/standard/
Same as enhanced chapters.

### For /chapters/index.html
```
CSS:
- styles-v3.css → ../src/styles-v3.css OR ../assets/css/main.css

JS:
- transitions.js → ../src/transitions.js

Navigation:
- index.html → ../src/index.html
- chapter1.html → ./enhanced/chapter-1.html OR ./standard/chapter-1.html
```

## Inconsistencies Found

1. **Naming Convention Mismatch:**
   - /src/ uses: `chapter1.html`, `chapter2.html`
   - /chapters/ uses: `chapter-1.html`, `chapter-2.html`

2. **Missing Files Referenced:**
   - Many JS files referenced in /chapters/enhanced/ don't exist in expected locations
   - Some reference `js/advanced-animations.js` but file is at `/src/advanced-animations.js`

3. **CSS File Confusion:**
   - Some files use `styles-v3.css` (in /src/)
   - Others use `main.css` (in /assets/css/)
   - Need to decide on primary CSS file

4. **Script Loading Issues:**
   - Some files load scripts that depend on others but in wrong order
   - Mix of module and non-module scripts

## Recommendations

1. **Standardize CSS:**
   - Use `/assets/css/main.css` as primary stylesheet
   - Move necessary styles from `styles-v3.css` to `main.css`
   - Or keep both and load in correct order

2. **Fix Navigation Paths:**
   - Update all navigation links to use correct relative paths
   - Ensure consistency in chapter naming (with or without hyphens)

3. **Consolidate JavaScript:**
   - Move shared JS to `/assets/js/`
   - Update all script references to correct paths

4. **Create Path Configuration:**
   - Consider creating a path configuration file
   - Or use a build process to handle path resolution

5. **Test Navigation:**
   - Verify all links work from each directory level
   - Test both enhanced and standard chapter variations