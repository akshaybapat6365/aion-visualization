/**
 * Performance Audit Script
 * Analyzes and optimizes site performance
 * Provides actionable recommendations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceAuditor {
  constructor() {
    this.results = {
      totalSize: 0,
      fileCount: 0,
      largeFiles: [],
      cssAnalysis: {},
      jsAnalysis: {},
      imageAnalysis: {},
      recommendations: []
    };
  }

  async runAudit() {
    console.log('🔍 Starting Performance Audit...\n');

    // Analyze file sizes
    await this.analyzeFileSizes();

    // These are handled during file analysis
    // await this.analyzeCSS();
    // await this.analyzeJavaScript();

    // Check for optimization opportunities
    await this.checkOptimizations();

    // Generate report
    this.generateReport();
  }

  async analyzeFileSizes() {
    console.log('📊 Analyzing file sizes...');

    const directories = [
      'assets/css',
      'assets/js',
      'assets/images',
      'src',
      'chapters'
    ];

    for (const dir of directories) {
      await this.scanDirectory(dir);
    }
  }

  async scanDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          await this.analyzeFile(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async analyzeFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const sizeKB = stats.size / 1024;

      this.results.totalSize += stats.size;
      this.results.fileCount++;

      // Track large files (> 100KB)
      if (sizeKB > 100) {
        this.results.largeFiles.push({
          path: filePath,
          size: sizeKB,
          type: ext
        });
      }

      // Categorize by type
      if (['.css', '.scss', '.sass'].includes(ext)) {
        await this.analyzeCSSFile(filePath, stats.size);
      } else if (['.js', '.mjs', '.ts'].includes(ext)) {
        await this.analyzeJSFile(filePath, stats.size);
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
        this.analyzeImageFile(filePath, stats.size);
      }
    } catch (error) {
      // File might not be accessible
    }
  }

  async analyzeCSSFile(filePath, size) {
    if (!this.results.cssAnalysis.totalSize) {
      this.results.cssAnalysis = {
        totalSize: 0,
        fileCount: 0,
        duplicates: [],
        unusedSelectors: []
      };
    }

    this.results.cssAnalysis.totalSize += size;
    this.results.cssAnalysis.fileCount++;

    // Read and analyze CSS content
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check for duplicated rules
      const rules = content.match(/[^{}]+{[^}]+}/g) || [];
      const ruleMap = new Map();
      
      rules.forEach(rule => {
        if (ruleMap.has(rule)) {
          this.results.cssAnalysis.duplicates.push({
            file: filePath,
            rule: rule.substring(0, 50) + '...'
          });
        }
        ruleMap.set(rule, true);
      });

      // Check for vendor prefixes that might not be needed
      if (content.includes('-webkit-') || content.includes('-moz-') || content.includes('-ms-')) {
        this.results.recommendations.push({
          type: 'css',
          file: filePath,
          message: 'Contains vendor prefixes - consider using autoprefixer'
        });
      }

      // Check for unminified CSS
      if (!filePath.includes('.min.') && content.includes('    ')) {
        this.results.recommendations.push({
          type: 'css',
          file: filePath,
          message: 'CSS file is not minified',
          savings: Math.round(size * 0.3 / 1024) + 'KB'
        });
      }
    } catch (error) {
      // Could not read file
    }
  }

  async analyzeJSFile(filePath, size) {
    if (!this.results.jsAnalysis.totalSize) {
      this.results.jsAnalysis = {
        totalSize: 0,
        fileCount: 0,
        unminified: [],
        largeLibraries: []
      };
    }

    this.results.jsAnalysis.totalSize += size;
    this.results.jsAnalysis.fileCount++;

    // Check for unminified JS
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      if (!filePath.includes('.min.') && content.includes('    ')) {
        this.results.jsAnalysis.unminified.push({
          file: filePath,
          size: Math.round(size / 1024) + 'KB',
          potentialSavings: Math.round(size * 0.4 / 1024) + 'KB'
        });
      }

      // Check for console.log statements
      if (content.includes('console.log')) {
        this.results.recommendations.push({
          type: 'js',
          file: filePath,
          message: 'Contains console.log statements - remove for production'
        });
      }

      // Check for large libraries
      if (size > 200 * 1024) {
        this.results.jsAnalysis.largeLibraries.push({
          file: filePath,
          size: Math.round(size / 1024) + 'KB'
        });
      }
    } catch (error) {
      // Could not read file
    }
  }

  analyzeImageFile(filePath, size) {
    if (!this.results.imageAnalysis.totalSize) {
      this.results.imageAnalysis = {
        totalSize: 0,
        fileCount: 0,
        largeImages: [],
        unoptimized: []
      };
    }

    this.results.imageAnalysis.totalSize += size;
    this.results.imageAnalysis.fileCount++;

    const ext = path.extname(filePath).toLowerCase();
    const sizeKB = size / 1024;

    // Large images (> 200KB)
    if (sizeKB > 200) {
      this.results.imageAnalysis.largeImages.push({
        file: filePath,
        size: Math.round(sizeKB) + 'KB',
        format: ext
      });

      // Recommend WebP
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        this.results.recommendations.push({
          type: 'image',
          file: filePath,
          message: `Convert to WebP format for ~30% size reduction`,
          savings: Math.round(sizeKB * 0.3) + 'KB'
        });
      }
    }
  }

  async checkOptimizations() {
    console.log('🔧 Checking optimization opportunities...');

    // Check for missing compression
    await this.checkCompression();

    // Check for bundle opportunities
    await this.checkBundling();

    // Check for lazy loading opportunities
    await this.checkLazyLoading();

    // Check caching headers
    this.checkCaching();
  }

  async checkCompression() {
    // Check if gzip/brotli versions exist
    const criticalFiles = [
      'assets/css/main.css',
      'assets/js/core/github-pages-router.js'
    ];

    for (const file of criticalFiles) {
      try {
        await fs.access(file);
        const stats = await fs.stat(file);
        
        if (!await this.fileExists(file + '.gz') && !await this.fileExists(file + '.br')) {
          this.results.recommendations.push({
            type: 'compression',
            file: file,
            message: 'No compressed version found - enable gzip/brotli',
            savings: Math.round(stats.size * 0.7 / 1024) + 'KB'
          });
        }
      } catch (error) {
        // File doesn't exist
      }
    }
  }

  async checkBundling() {
    // Count number of JS files loaded
    const jsFiles = this.results.largeFiles.filter(f => f.type === '.js');
    
    if (jsFiles.length > 10) {
      this.results.recommendations.push({
        type: 'bundling',
        message: `${jsFiles.length} JavaScript files detected - consider bundling`,
        impact: 'high'
      });
    }

    // Check for multiple CSS files
    const cssFiles = this.results.largeFiles.filter(f => f.type === '.css');
    
    if (cssFiles.length > 5) {
      this.results.recommendations.push({
        type: 'bundling',
        message: `${cssFiles.length} CSS files detected - consider combining`,
        impact: 'medium'
      });
    }
  }

  async checkLazyLoading() {
    // Check HTML files for images without loading="lazy"
    const htmlFiles = ['index.html', 'showcase.html', 'chapters/index.html'];

    for (const file of htmlFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const imgTags = content.match(/<img[^>]+>/g) || [];
        const lazyImages = imgTags.filter(tag => tag.includes('loading="lazy"')).length;
        
        if (imgTags.length > 0 && lazyImages < imgTags.length) {
          this.results.recommendations.push({
            type: 'performance',
            file: file,
            message: `${imgTags.length - lazyImages} images without lazy loading`,
            impact: 'medium'
          });
        }
      } catch (error) {
        // File doesn't exist
      }
    }
  }

  checkCaching() {
    // Recommend service worker enhancements
    this.results.recommendations.push({
      type: 'caching',
      message: 'Implement aggressive caching in service worker for static assets',
      impact: 'high'
    });

    this.results.recommendations.push({
      type: 'caching',
      message: 'Use cache-first strategy for fonts and images',
      impact: 'medium'
    });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  generateReport() {
    console.log('\n📋 Performance Audit Report\n');
    console.log('═══════════════════════════════════════════');

    // Overall statistics
    console.log('\n📊 Overall Statistics:');
    console.log(`   Total files: ${this.results.fileCount}`);
    console.log(`   Total size: ${(this.results.totalSize / 1024 / 1024).toFixed(2)} MB`);

    // Large files
    if (this.results.largeFiles.length > 0) {
      console.log('\n🔴 Large Files (>100KB):');
      this.results.largeFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .forEach(file => {
          console.log(`   ${file.path}: ${Math.round(file.size)} KB`);
        });
    }

    // CSS Analysis
    if (this.results.cssAnalysis.totalSize) {
      console.log('\n🎨 CSS Analysis:');
      console.log(`   Total CSS: ${Math.round(this.results.cssAnalysis.totalSize / 1024)} KB`);
      console.log(`   CSS files: ${this.results.cssAnalysis.fileCount}`);
      if (this.results.cssAnalysis.duplicates.length > 0) {
        console.log(`   ⚠️  Duplicate rules found: ${this.results.cssAnalysis.duplicates.length}`);
      }
    }

    // JavaScript Analysis
    if (this.results.jsAnalysis.totalSize) {
      console.log('\n📦 JavaScript Analysis:');
      console.log(`   Total JS: ${Math.round(this.results.jsAnalysis.totalSize / 1024)} KB`);
      console.log(`   JS files: ${this.results.jsAnalysis.fileCount}`);
      if (this.results.jsAnalysis.unminified.length > 0) {
        console.log(`   ⚠️  Unminified files: ${this.results.jsAnalysis.unminified.length}`);
      }
    }

    // Image Analysis
    if (this.results.imageAnalysis.totalSize) {
      console.log('\n🖼️  Image Analysis:');
      console.log(`   Total images: ${Math.round(this.results.imageAnalysis.totalSize / 1024)} KB`);
      console.log(`   Image files: ${this.results.imageAnalysis.fileCount}`);
      if (this.results.imageAnalysis.largeImages.length > 0) {
        console.log(`   ⚠️  Large images: ${this.results.imageAnalysis.largeImages.length}`);
      }
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      
      // Group by impact
      const highImpact = this.results.recommendations.filter(r => r.impact === 'high');
      const mediumImpact = this.results.recommendations.filter(r => r.impact === 'medium');
      const other = this.results.recommendations.filter(r => !r.impact);

      if (highImpact.length > 0) {
        console.log('\n   🔴 High Impact:');
        highImpact.forEach(rec => {
          console.log(`      - ${rec.message}`);
          if (rec.savings) console.log(`        Potential savings: ${rec.savings}`);
        });
      }

      if (mediumImpact.length > 0) {
        console.log('\n   🟡 Medium Impact:');
        mediumImpact.forEach(rec => {
          console.log(`      - ${rec.message}`);
          if (rec.savings) console.log(`        Potential savings: ${rec.savings}`);
        });
      }

      if (other.length > 0) {
        console.log('\n   🔵 Other:');
        other.slice(0, 10).forEach(rec => {
          const prefix = rec.file ? `[${path.basename(rec.file)}] ` : '';
          console.log(`      - ${prefix}${rec.message}`);
          if (rec.savings) console.log(`        Potential savings: ${rec.savings}`);
        });
      }
    }

    // Summary
    console.log('\n📈 Performance Score Estimate:');
    const score = this.calculatePerformanceScore();
    console.log(`   Overall: ${score}/100`);
    console.log(`   ${this.getScoreEmoji(score)} ${this.getScoreMessage(score)}`);

    console.log('\n═══════════════════════════════════════════\n');

    // Save detailed report
    this.saveDetailedReport();
  }

  calculatePerformanceScore() {
    let score = 100;

    // Deduct for large total size
    const totalMB = this.results.totalSize / 1024 / 1024;
    if (totalMB > 5) score -= 10;
    if (totalMB > 10) score -= 10;
    if (totalMB > 20) score -= 10;

    // Deduct for unminified files
    if (this.results.jsAnalysis.unminified?.length > 0) {
      score -= this.results.jsAnalysis.unminified.length * 2;
    }

    // Deduct for large images
    if (this.results.imageAnalysis.largeImages?.length > 0) {
      score -= this.results.imageAnalysis.largeImages.length * 3;
    }

    // Deduct for missing optimizations
    const highImpactCount = this.results.recommendations.filter(r => r.impact === 'high').length;
    score -= highImpactCount * 5;

    return Math.max(0, Math.min(100, score));
  }

  getScoreEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  getScoreMessage(score) {
    if (score >= 90) return 'Excellent performance!';
    if (score >= 70) return 'Good performance with room for improvement';
    if (score >= 50) return 'Moderate performance - optimization recommended';
    return 'Poor performance - significant optimization needed';
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      ...this.results,
      score: this.calculatePerformanceScore()
    };

    await fs.writeFile(
      'performance-audit-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('📄 Detailed report saved to: performance-audit-report.json');
  }
}

// Run audit
const auditor = new PerformanceAuditor();
auditor.runAudit().catch(console.error);