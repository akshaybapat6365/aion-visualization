/**
 * Aion Design System - Screenshot & OCR Testing
 * 
 * Automated visual testing with OCR analysis for quality assurance.
 * Captures screenshots and analyzes text readability, contrast, and spacing.
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const CONFIG = {
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2
  },
  outputDir: './quality-control/visual-tests',
  reportsDir: './quality-control/reports'
};

class DesignSystemTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      screenshots: [],
      analysis: [],
      errors: [],
      score: 0
    };
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport(CONFIG.viewport);
    
    // Create output directories
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    await fs.mkdir(CONFIG.reportsDir, { recursive: true });
  }

  async testDesignSystem() {
    try {
      console.log('🚀 Starting Design System Testing...');
      
      // Load test page
      const testPagePath = path.resolve('./test-design-system.html');
      await this.page.goto(`file://${testPagePath}`);
      
      // Wait for page to fully load
      await this.page.waitForTimeout(2000);
      
      // Test individual components
      await this.testTypography();
      await this.testColorPalette();
      await this.testComponents();
      await this.testLayout();
      await this.testSpacing();
      await this.testAccessibility();
      
      // Generate full page screenshot
      await this.captureFullPage();
      
      // Analyze overall quality
      await this.generateReport();
      
      console.log('✅ Testing complete!');
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.cleanup();
    }
  }

  async testTypography() {
    console.log('📝 Testing Typography...');
    
    const typographyElements = [
      { selector: '.h1', name: 'heading-1' },
      { selector: '.h2', name: 'heading-2' },
      { selector: '.h3', name: 'heading-3' },
      { selector: '.body-large', name: 'body-large' },
      { selector: '.body-text', name: 'body-text' },
      { selector: '.small-text', name: 'small-text' }
    ];

    for (const element of typographyElements) {
      try {
        const screenshot = await this.captureElement(element.selector, `typography-${element.name}`);
        const analysis = await this.analyzeTypography(element.selector);
        
        this.results.screenshots.push(screenshot);
        this.results.analysis.push({
          type: 'typography',
          element: element.name,
          ...analysis
        });
      } catch (error) {
        this.results.errors.push(`Typography test failed for ${element.name}: ${error.message}`);
      }
    }
  }

  async testColorPalette() {
    console.log('🎨 Testing Color Palette...');
    
    try {
      const screenshot = await this.captureElement('.color-grid', 'color-palette');
      const analysis = await this.analyzeColorContrast();
      
      this.results.screenshots.push(screenshot);
      this.results.analysis.push({
        type: 'colors',
        ...analysis
      });
    } catch (error) {
      this.results.errors.push(`Color palette test failed: ${error.message}`);
    }
  }

  async testComponents() {
    console.log('🧩 Testing Components...');
    
    const components = [
      { selector: '.btn', name: 'buttons' },
      { selector: '.card', name: 'cards' }
    ];

    for (const component of components) {
      try {
        const screenshot = await this.captureElement(component.selector, `component-${component.name}`);
        const analysis = await this.analyzeComponent(component.selector);
        
        this.results.screenshots.push(screenshot);
        this.results.analysis.push({
          type: 'component',
          component: component.name,
          ...analysis
        });
      } catch (error) {
        this.results.errors.push(`Component test failed for ${component.name}: ${error.message}`);
      }
    }
  }

  async testLayout() {
    console.log('📐 Testing Layout...');
    
    const layouts = [
      { selector: '.grid-2', name: 'grid-2-columns' },
      { selector: '.grid-3', name: 'grid-3-columns' },
      { selector: '.flex-between', name: 'flex-space-between' }
    ];

    for (const layout of layouts) {
      try {
        const screenshot = await this.captureElement(layout.selector, `layout-${layout.name}`);
        const analysis = await this.analyzeLayout(layout.selector);
        
        this.results.screenshots.push(screenshot);
        this.results.analysis.push({
          type: 'layout',
          layout: layout.name,
          ...analysis
        });
      } catch (error) {
        this.results.errors.push(`Layout test failed for ${layout.name}: ${error.message}`);
      }
    }
  }

  async testSpacing() {
    console.log('📏 Testing Spacing...');
    
    try {
      const screenshot = await this.captureElement('.spacing-demo', 'spacing-system');
      const analysis = await this.analyzeSpacing();
      
      this.results.screenshots.push(screenshot);
      this.results.analysis.push({
        type: 'spacing',
        ...analysis
      });
    } catch (error) {
      this.results.errors.push(`Spacing test failed: ${error.message}`);
    }
  }

  async testAccessibility() {
    console.log('♿ Testing Accessibility...');
    
    try {
      // Run accessibility audit
      const accessibilityResults = await this.page.evaluate(() => {
        // Check color contrast
        const textElements = document.querySelectorAll('p, h1, h2, h3, .btn, .small-text');
        const contrastResults = [];
        
        textElements.forEach((element, index) => {
          const styles = window.getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          contrastResults.push({
            element: element.tagName + (element.className ? `.${element.className}` : ''),
            color,
            backgroundColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight
          });
        });
        
        return {
          contrastTests: contrastResults,
          totalElements: textElements.length
        };
      });
      
      this.results.analysis.push({
        type: 'accessibility',
        ...accessibilityResults
      });
    } catch (error) {
      this.results.errors.push(`Accessibility test failed: ${error.message}`);
    }
  }

  async captureElement(selector, name) {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(CONFIG.outputDir, filename);
    
    await element.screenshot({
      path: filepath,
      type: 'png'
    });
    
    console.log(`📸 Captured: ${filename}`);
    
    return {
      name,
      selector,
      filename,
      filepath,
      timestamp: new Date().toISOString()
    };
  }

  async captureFullPage() {
    const filename = `full-page-${Date.now()}.png`;
    const filepath = path.join(CONFIG.outputDir, filename);
    
    await this.page.screenshot({
      path: filepath,
      type: 'png',
      fullPage: true
    });
    
    console.log(`📸 Full page captured: ${filename}`);
    
    this.results.screenshots.push({
      name: 'full-page',
      filename,
      filepath,
      timestamp: new Date().toISOString()
    });
  }

  async analyzeTypography(selector) {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      
      const styles = window.getComputedStyle(element);
      
      return {
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
        color: styles.color,
        textContent: element.textContent.trim(),
        readabilityScore: element.textContent.length > 0 ? 100 : 0
      };
    }, selector);
  }

  async analyzeColorContrast() {
    return await this.page.evaluate(() => {
      const swatches = document.querySelectorAll('.color-swatch');
      const contrastTests = [];
      
      swatches.forEach((swatch, index) => {
        const styles = window.getComputedStyle(swatch);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        contrastTests.push({
          index,
          backgroundColor,
          color,
          text: swatch.textContent.trim()
        });
      });
      
      return {
        totalSwatches: swatches.length,
        contrastTests,
        paletteComplete: swatches.length >= 20
      };
    });
  }

  async analyzeComponent(selector) {
    return await this.page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      const analysis = [];
      
      elements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        analysis.push({
          index,
          width: rect.width,
          height: rect.height,
          padding: styles.padding,
          margin: styles.margin,
          border: styles.border,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          interactive: element.tagName === 'BUTTON' || element.getAttribute('role') === 'button'
        });
      });
      
      return {
        count: elements.length,
        elements: analysis,
        consistent: analysis.length > 0
      };
    }, selector);
  }

  async analyzeLayout(selector) {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      
      const styles = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gap: styles.gap,
        justifyContent: styles.justifyContent,
        alignItems: styles.alignItems,
        width: rect.width,
        height: rect.height,
        childCount: element.children.length
      };
    }, selector);
  }

  async analyzeSpacing() {
    return await this.page.evaluate(() => {
      const spacingDemo = document.querySelector('.spacing-demo');
      if (!spacingDemo) return null;
      
      const children = Array.from(spacingDemo.children);
      const spacingAnalysis = [];
      
      children.forEach((child, index) => {
        const styles = window.getComputedStyle(child);
        const rect = child.getBoundingClientRect();
        
        spacingAnalysis.push({
          index,
          marginBottom: styles.marginBottom,
          padding: styles.padding,
          height: rect.height,
          text: child.textContent.trim()
        });
      });
      
      return {
        elements: spacingAnalysis,
        consistent: spacingAnalysis.length > 0
      };
    });
  }

  calculateQualityScore() {
    let score = 100;
    
    // Deduct points for errors
    score -= this.results.errors.length * 10;
    
    // Check analysis results
    const analyses = this.results.analysis;
    
    // Typography check
    const typographyTests = analyses.filter(a => a.type === 'typography');
    if (typographyTests.length < 6) score -= 10;
    
    // Color palette check
    const colorTests = analyses.filter(a => a.type === 'colors');
    if (colorTests.length === 0) score -= 15;
    
    // Component check
    const componentTests = analyses.filter(a => a.type === 'component');
    if (componentTests.length < 2) score -= 10;
    
    // Layout check
    const layoutTests = analyses.filter(a => a.type === 'layout');
    if (layoutTests.length < 3) score -= 10;
    
    // Accessibility check
    const accessibilityTests = analyses.filter(a => a.type === 'accessibility');
    if (accessibilityTests.length === 0) score -= 20;
    
    return Math.max(0, score);
  }

  async generateReport() {
    this.results.score = this.calculateQualityScore();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        score: this.results.score,
        screenshotCount: this.results.screenshots.length,
        analysisCount: this.results.analysis.length,
        errorCount: this.results.errors.length
      },
      screenshots: this.results.screenshots,
      analysis: this.results.analysis,
      errors: this.results.errors,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(CONFIG.reportsDir, `design-system-test-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable report
    const humanReport = this.generateHumanReport(report);
    const humanReportPath = path.join(CONFIG.reportsDir, `design-system-report-${Date.now()}.md`);
    await fs.writeFile(humanReportPath, humanReport);
    
    console.log(`📊 Report generated: ${reportPath}`);
    console.log(`📋 Human report: ${humanReportPath}`);
    console.log(`🏆 Quality Score: ${this.results.score}/100`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.errors.length > 0) {
      recommendations.push({
        type: 'critical',
        message: 'Fix all errors before proceeding to next phase',
        action: 'Review error log and address each issue'
      });
    }
    
    if (this.results.score < 90) {
      recommendations.push({
        type: 'improvement',
        message: 'Quality score below Forbes 2025 standards',
        action: 'Review failing tests and improve implementation'
      });
    }
    
    const accessibilityTests = this.results.analysis.filter(a => a.type === 'accessibility');
    if (accessibilityTests.length === 0) {
      recommendations.push({
        type: 'accessibility',
        message: 'Add comprehensive accessibility testing',
        action: 'Implement WCAG AAA compliance checks'
      });
    }
    
    return recommendations;
  }

  generateHumanReport(report) {
    return `# Aion Design System - Quality Report

## Summary
- **Quality Score**: ${report.summary.score}/100
- **Screenshots**: ${report.summary.screenshotCount}
- **Tests Run**: ${report.summary.analysisCount}
- **Errors**: ${report.summary.errorCount}
- **Generated**: ${report.timestamp}

## Test Results

### Typography Tests
${report.analysis.filter(a => a.type === 'typography').map(t => 
  `- **${t.element}**: ${t.fontSize || 'N/A'} | ${t.fontWeight || 'N/A'} | Readability: ${t.readabilityScore || 0}%`
).join('\n')}

### Color Palette
${report.analysis.filter(a => a.type === 'colors').map(c => 
  `- **Swatches**: ${c.totalSwatches} | Complete: ${c.paletteComplete ? '✅' : '❌'}`
).join('\n')}

### Components
${report.analysis.filter(a => a.type === 'component').map(c => 
  `- **${c.component}**: ${c.count} instances | Consistent: ${c.consistent ? '✅' : '❌'}`
).join('\n')}

### Layout System
${report.analysis.filter(a => a.type === 'layout').map(l => 
  `- **${l.layout}**: ${l.display} | Children: ${l.childCount || 0}`
).join('\n')}

### Accessibility
${report.analysis.filter(a => a.type === 'accessibility').map(a => 
  `- **Elements Tested**: ${a.totalElements || 0} | Contrast Tests: ${a.contrastTests?.length || 0}`
).join('\n')}

## Errors
${report.errors.map(error => `- ❌ ${error}`).join('\n')}

## Recommendations
${report.recommendations.map(rec => `- **${rec.type.toUpperCase()}**: ${rec.message}\n  *Action*: ${rec.action}`).join('\n\n')}

## Screenshots
${report.screenshots.map(s => `- ${s.name}: \`${s.filename}\``).join('\n')}

---
*Generated by Aion Design System Quality Assurance*
`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the tests
async function runTests() {
  const tester = new DesignSystemTester();
  await tester.init();
  await tester.testDesignSystem();
}

// Export for use in other scripts
export { DesignSystemTester };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}