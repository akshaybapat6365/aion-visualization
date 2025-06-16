#!/usr/bin/env node

/**
 * Quick Path Fix Script
 * Updates hardcoded / paths for Vercel deployment
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to update
const KEY_FILES = [
  '*.html',
  '404.html',
  'sw.js',
  'assets/js/core/environment-config.js',
  'assets/js/core/environment-config.min.js',
  'chapters/index.html',
  'chapters/enhanced/*.html',
  'chapters/standard/*.html',
  'visualizations.html',
  'viz.html',
  'src/visualizations/**/*.html',
  'src/visualizations/**/*.js',
  'src/visualizations/**/*.css',
  'src/core/*.js',
  'config/*.js',
  'scripts/*.js'
];

async function fixPaths() {
  console.log('🚀 Starting quick path fix for Vercel deployment...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  let filesUpdated = 0;
  let totalReplacements = 0;
  
  // Gather all files
  const files = [];
  for (const pattern of KEY_FILES) {
    const matches = await glob(pattern, { cwd: projectRoot });
    files.push(...matches);
  }
  
  console.log(`📂 Found ${files.length} files to check\n`);
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(projectRoot, file);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      
      // Count replacements
      const replacements = [
        { pattern: /\/aion-visualization\//g, replacement: '/' },
        { pattern: /href="\/g, replacement: 'href="' },
        { pattern: /src="\/g, replacement: 'src="' },
        { pattern: /url\(\/g, replacement: 'url(' },
        { pattern: /import\s+.*from\s+['"]\/g, replacement: match => match.replace('/aion-visualization', '') }
      ];
      
      let fileReplacements = 0;
      
      for (const { pattern, replacement } of replacements) {
        const matches = content.match(pattern);
        if (matches) {
          fileReplacements += matches.length;
          content = content.replace(pattern, replacement);
        }
      }
      
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ ${file} - ${fileReplacements} replacements`);
        filesUpdated++;
        totalReplacements += fileReplacements;
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`- Files updated: ${filesUpdated}`);
  console.log(`- Total replacements: ${totalReplacements}`);
  console.log('\n✨ Quick fix complete! Your site should now work on Vercel.');
  console.log('\n🧪 Run tests with: npm run test:smoke');
}

// Run the fix
fixPaths().catch(console.error);