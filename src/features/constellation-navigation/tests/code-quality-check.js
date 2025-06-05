#!/usr/bin/env node

/**
 * Code Quality Check
 * Recursively checks code quality for constellation navigation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Quality check rules
const qualityRules = {
  maxLineLength: 100,
  maxFunctionLength: 50,
  maxComplexity: 10,
  requiredComments: ['@param', '@returns', '@throws'],
  bannedPatterns: [
    /console\.log(?!\s*\()/,  // console.log without proper formatting
    /var\s+/,                  // Use of var instead of let/const
    /==(?!=)/,                 // Use of == instead of ===
    /!=(?!=)/,                 // Use of != instead of !==
  ],
  requiredPatterns: [
    /^\/\*\*[\s\S]*?\*\//,     // JSDoc comments for files
  ]
};

/**
 * Check a single JavaScript file
 * @param {string} filePath - Path to the file
 * @returns {Array} Array of issues found
 */
function checkFile(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check file header comment
  if (!qualityRules.requiredPatterns[0].test(content)) {
    issues.push({
      file: filePath,
      line: 1,
      issue: 'Missing file header JSDoc comment'
    });
  }
  
  // Check line by line
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Max line length
    if (line.length > qualityRules.maxLineLength) {
      issues.push({
        file: filePath,
        line: lineNum,
        issue: `Line too long (${line.length} chars, max ${qualityRules.maxLineLength})`
      });
    }
    
    // Banned patterns
    qualityRules.bannedPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: lineNum,
          issue: `Banned pattern: ${pattern.toString()}`
        });
      }
    });
  });
  
  // Function complexity check
  const functions = content.match(/function\s+\w+\s*\([^)]*\)\s*{|(\w+)\s*[:=]\s*(?:async\s+)?(?:function\s*)?\([^)]*\)\s*(?:=>)?\s*{/g) || [];
  
  functions.forEach(func => {
    // Simple complexity check based on control flow keywords
    const funcContent = content.substring(content.indexOf(func));
    const braceCount = funcContent.split('{').length - funcContent.split('}').length;
    const controlFlow = (funcContent.match(/if\s*\(|for\s*\(|while\s*\(|switch\s*\(/g) || []).length;
    
    if (controlFlow > qualityRules.maxComplexity) {
      issues.push({
        file: filePath,
        line: lines.findIndex(l => l.includes(func)) + 1,
        issue: `Function too complex (complexity: ${controlFlow}, max: ${qualityRules.maxComplexity})`
      });
    }
  });
  
  return issues;
}

/**
 * Recursively check all JavaScript files in a directory
 * @param {string} dir - Directory to check
 * @returns {Array} All issues found
 */
function checkDirectory(dir) {
  let allIssues = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      allIssues = allIssues.concat(checkDirectory(filePath));
    } else if (file.endsWith('.js') && !file.includes('.min.') && !file.includes('.test.')) {
      const issues = checkFile(filePath);
      allIssues = allIssues.concat(issues);
    }
  });
  
  return allIssues;
}

/**
 * Generate quality report
 * @param {Array} issues - Array of issues
 * @returns {Object} Report summary
 */
function generateReport(issues) {
  const report = {
    totalIssues: issues.length,
    issuesByFile: {},
    issuesByType: {}
  };
  
  issues.forEach(issue => {
    // By file
    if (!report.issuesByFile[issue.file]) {
      report.issuesByFile[issue.file] = [];
    }
    report.issuesByFile[issue.file].push(issue);
    
    // By type
    const type = issue.issue.split(':')[0];
    if (!report.issuesByType[type]) {
      report.issuesByType[type] = 0;
    }
    report.issuesByType[type]++;
  });
  
  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Running code quality checks...\n');
  
  const targetDir = path.join(__dirname, '..');
  const issues = checkDirectory(targetDir);
  const report = generateReport(issues);
  
  // Display results
  console.log(`📊 Code Quality Report`);
  console.log(`${'='.repeat(50)}\n`);
  
  if (issues.length === 0) {
    console.log('✅ No quality issues found! Code is clean.\n');
  } else {
    console.log(`❌ Found ${issues.length} quality issues:\n`);
    
    // Group by file
    Object.entries(report.issuesByFile).forEach(([file, fileIssues]) => {
      console.log(`\n📄 ${path.relative(targetDir, file)}:`);
      fileIssues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.issue}`);
      });
    });
    
    // Summary by type
    console.log(`\n📈 Issues by type:`);
    Object.entries(report.issuesByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }
  
  // Calculate quality score
  const totalLines = Object.keys(report.issuesByFile).reduce((sum, file) => {
    const content = fs.readFileSync(file, 'utf8');
    return sum + content.split('\n').length;
  }, 0);
  
  const qualityScore = Math.max(0, 100 - (issues.length / totalLines * 1000));
  
  console.log(`\n🎯 Quality Score: ${qualityScore.toFixed(1)}%`);
  
  // Exit with appropriate code
  process.exit(issues.length > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
  main();
}

export { checkFile, checkDirectory, generateReport };