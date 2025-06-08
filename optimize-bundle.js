/**
 * Bundle Optimization Script
 * Minifies and optimizes CSS/JS files for production
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BundleOptimizer {
  constructor() {
    this.cssFiles = [];
    this.jsFiles = [];
    this.totalSavings = 0;
  }

  async optimize() {
    console.log('🚀 Starting bundle optimization...\n');

    // Find all CSS and JS files
    await this.findFiles();

    // Minify CSS files
    await this.minifyCSS();

    // Minify JS files
    await this.minifyJS();

    // Create optimized bundles
    await this.createBundles();

    // Update HTML files to use optimized versions
    await this.updateHTMLReferences();

    // Report results
    this.reportResults();
  }

  async findFiles() {
    console.log('🔍 Finding files to optimize...');

    const directories = [
      'assets/css',
      'assets/js',
      'src'
    ];

    for (const dir of directories) {
      await this.scanDirectory(dir);
    }

    console.log(`   Found ${this.cssFiles.length} CSS files`);
    console.log(`   Found ${this.jsFiles.length} JS files`);
  }

  async scanDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          
          if (ext === '.css' && !entry.name.includes('.min.')) {
            this.cssFiles.push(fullPath);
          } else if (ext === '.js' && !entry.name.includes('.min.')) {
            this.jsFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async minifyCSS() {
    console.log('\n🎨 Minifying CSS files...');

    for (const file of this.cssFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const originalSize = Buffer.byteLength(content);

        // Simple CSS minification
        let minified = content
          // Remove comments
          .replace(/\/\*[\s\S]*?\*\//g, '')
          // Remove unnecessary whitespace
          .replace(/\s+/g, ' ')
          // Remove whitespace around selectors
          .replace(/\s*([{}:;,])\s*/g, '$1')
          // Remove trailing semicolon before }
          .replace(/;}/g, '}')
          // Remove quotes from urls when possible
          .replace(/url\(["']([^"')]+)["']\)/g, 'url($1)')
          // Remove unnecessary zeros
          .replace(/:0px/g, ':0')
          .replace(/ 0px/g, ' 0')
          // Trim
          .trim();

        const minifiedSize = Buffer.byteLength(minified);
        const savings = originalSize - minifiedSize;

        if (savings > 0) {
          // Create .min.css version
          const minPath = file.replace('.css', '.min.css');
          await fs.writeFile(minPath, minified);
          
          this.totalSavings += savings;
          console.log(`   ✅ ${path.basename(file)}: ${this.formatSize(originalSize)} → ${this.formatSize(minifiedSize)} (saved ${this.formatSize(savings)})`);
        }
      } catch (error) {
        console.error(`   ❌ Error minifying ${file}:`, error.message);
      }
    }
  }

  async minifyJS() {
    console.log('\n📦 Minifying JavaScript files...');

    for (const file of this.jsFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const originalSize = Buffer.byteLength(content);

        // Skip if it's a module or has complex syntax
        if (content.includes('import ') || content.includes('export ')) {
          console.log(`   ⏭️  Skipping module: ${path.basename(file)}`);
          continue;
        }

        // Simple JS minification (conservative to avoid breaking code)
        let minified = content
          // Remove single-line comments
          .replace(/\/\/.*$/gm, '')
          // Remove multi-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '')
          // Remove console.log statements
          .replace(/console\.(log|info|warn|debug)\([^)]*\);?/g, '')
          // Remove unnecessary whitespace
          .replace(/\s+/g, ' ')
          // Remove whitespace around operators
          .replace(/\s*([=+\-*/%<>!&|,;:?{}()\[\]])\s*/g, '$1')
          // Trim
          .trim();

        const minifiedSize = Buffer.byteLength(minified);
        const savings = originalSize - minifiedSize;

        if (savings > 0) {
          // Create .min.js version
          const minPath = file.replace('.js', '.min.js');
          await fs.writeFile(minPath, minified);
          
          this.totalSavings += savings;
          console.log(`   ✅ ${path.basename(file)}: ${this.formatSize(originalSize)} → ${this.formatSize(minifiedSize)} (saved ${this.formatSize(savings)})`);
        }
      } catch (error) {
        console.error(`   ❌ Error minifying ${file}:`, error.message);
      }
    }
  }

  async createBundles() {
    console.log('\n📚 Creating optimized bundles...');

    // Create CSS bundle
    await this.createCSSBundle();

    // Create core JS bundle
    await this.createJSBundle();
  }

  async createCSSBundle() {
    const criticalCSS = [
      'assets/css/main.min.css',
      'assets/css/liquid-morphing.min.css'
    ];

    let bundleContent = '/* Aion Visualization - Optimized CSS Bundle */\n';

    for (const file of criticalCSS) {
      try {
        const content = await fs.readFile(file, 'utf8');
        bundleContent += `\n/* ${path.basename(file)} */\n${content}`;
      } catch (error) {
        // Use non-minified version if min doesn't exist
        try {
          const nonMinFile = file.replace('.min.css', '.css');
          const content = await fs.readFile(nonMinFile, 'utf8');
          bundleContent += `\n/* ${path.basename(nonMinFile)} */\n${content}`;
        } catch (err) {
          console.warn(`   ⚠️  Could not include ${file}`);
        }
      }
    }

    await fs.writeFile('assets/css/bundle.min.css', bundleContent);
    console.log(`   ✅ Created CSS bundle: ${this.formatSize(Buffer.byteLength(bundleContent))}`);
  }

  async createJSBundle() {
    const coreJS = [
      'assets/js/core/github-pages-router.js',
      'assets/js/core/consolidated-utilities.js'
    ];

    let bundleContent = '/* Aion Visualization - Core JS Bundle */\n';

    for (const file of coreJS) {
      try {
        const minFile = file.replace('.js', '.min.js');
        let content;
        
        try {
          content = await fs.readFile(minFile, 'utf8');
        } catch {
          content = await fs.readFile(file, 'utf8');
        }
        
        bundleContent += `\n/* ${path.basename(file)} */\n${content}`;
      } catch (error) {
        console.warn(`   ⚠️  Could not include ${file}`);
      }
    }

    await fs.writeFile('assets/js/bundle.min.js', bundleContent);
    console.log(`   ✅ Created JS bundle: ${this.formatSize(Buffer.byteLength(bundleContent))}`);
  }

  async updateHTMLReferences() {
    console.log('\n📝 Updating HTML references...');

    const htmlFiles = [
      'index.html',
      'showcase.html',
      'chapters/index.html',
      'polish-test.html'
    ];

    for (const file of htmlFiles) {
      try {
        let content = await fs.readFile(file, 'utf8');
        let modified = false;

        // Add bundle references if not present
        if (!content.includes('bundle.min.css')) {
          // Add CSS bundle after other CSS
          content = content.replace(
            '<link rel="stylesheet" href="assets/css/main.css">',
            '<link rel="stylesheet" href="assets/css/bundle.min.css">'
          );
          
          // Also handle relative paths
          content = content.replace(
            '<link rel="stylesheet" href="../assets/css/main.css">',
            '<link rel="stylesheet" href="../assets/css/bundle.min.css">'
          );
          
          modified = true;
        }

        if (modified) {
          await fs.writeFile(file, content);
          console.log(`   ✅ Updated ${file}`);
        }
      } catch (error) {
        // File might not exist
      }
    }
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  reportResults() {
    console.log('\n📊 Optimization Results:');
    console.log('═══════════════════════════════════════════');
    console.log(`   Total savings: ${this.formatSize(this.totalSavings)}`);
    console.log(`   CSS files minified: ${this.cssFiles.length}`);
    console.log(`   JS files processed: ${this.jsFiles.length}`);
    console.log('\n✅ Bundle optimization complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test the site with optimized bundles');
    console.log('   2. Enable gzip/brotli compression on server');
    console.log('   3. Implement cache headers for static assets');
    console.log('   4. Consider using a CDN for global distribution');
  }
}

// Run optimizer
const optimizer = new BundleOptimizer();
optimizer.optimize().catch(console.error);