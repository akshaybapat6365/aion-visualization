#!/usr/bin/env node

/**
 * Path Migration Script
 * Updates all hardcoded / paths to use relative paths or config
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob').glob;

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OLD_BASE_PATH = '/';
const BACKUP_DIR = path.join(PROJECT_ROOT, 'path-migration-backup');

// File patterns to process
const FILE_PATTERNS = [
  '**/*.html',
  '**/*.js',
  '**/*.css',
  'sw.js',
  'manifest.json',
  'vercel.json'
];

// Patterns to exclude
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  'path-migration-backup/**',
  '.git/**',
  'dist/**',
  'build/**',
  '**/backup/**',
  '**/BACKUP/**',
  'scripts/migrate-paths.js'
];

// Path replacement rules
const REPLACEMENT_RULES = [
  // HTML link and script tags - convert to relative
  {
    pattern: /<link\s+([^>]*?)href="\/aion-visualization\/(.*?)"/g,
    replacement: (match, attrs, path) => {
      const depth = getCurrentFileDepth();
      const relativePath = '../'.repeat(depth);
      return `<link ${attrs}href="${relativePath}${path}"`;
    },
    fileTypes: ['.html']
  },
  {
    pattern: /<script\s+([^>]*?)src="\/aion-visualization\/(.*?)"/g,
    replacement: (match, attrs, path) => {
      const depth = getCurrentFileDepth();
      const relativePath = '../'.repeat(depth);
      return `<script ${attrs}src="${relativePath}${path}"`;
    },
    fileTypes: ['.html']
  },
  {
    pattern: /<a\s+([^>]*?)href="\/aion-visualization\/(.*?)"/g,
    replacement: (match, attrs, path) => {
      const depth = getCurrentFileDepth();
      const relativePath = '../'.repeat(depth);
      return `<a ${attrs}href="${relativePath}${path}"`;
    },
    fileTypes: ['.html']
  },
  {
    pattern: /<img\s+([^>]*?)src="\/aion-visualization\/(.*?)"/g,
    replacement: (match, attrs, path) => {
      const depth = getCurrentFileDepth();
      const relativePath = '../'.repeat(depth);
      return `<img ${attrs}src="${relativePath}${path}"`;
    },
    fileTypes: ['.html']
  },
  
  // JavaScript string literals - use config
  {
    pattern: /['"`]\/aion-visualization\/(['"`])/g,
    replacement: "siteConfig.baseUrl + '/$1",
    fileTypes: ['.js'],
    requiresImport: true
  },
  {
    pattern: /['"`]\/aion-visualization\/(.*?)['"`]/g,
    replacement: "siteConfig.getUrl('$1')",
    fileTypes: ['.js'],
    requiresImport: true
  },
  
  // CSS url() - convert to relative
  {
    pattern: /url\(['"]?\/aion-visualization\/(.*?)['"]?\)/g,
    replacement: (match, path) => {
      const depth = getCurrentFileDepth();
      const relativePath = '../'.repeat(depth);
      return `url('${relativePath}${path}')`;
    },
    fileTypes: ['.css']
  },
  
  // Service Worker paths - use self.location.pathname
  {
    pattern: /['"`]\/aion-visualization\//g,
    replacement: "self.location.pathname.replace(/\\/[^\\/]*$/, '') + '/",
    fileTypes: ['sw.js']
  },
  
  // Manifest.json - special handling
  {
    pattern: /"\/aion-visualization\/(.*?)"/g,
    replacement: '"/$1"',
    fileTypes: ['manifest.json']
  }
];

let currentFile = '';

function getCurrentFileDepth() {
  if (!currentFile) return 0;
  const relativePath = path.relative(PROJECT_ROOT, currentFile);
  return relativePath.split(path.sep).length - 1;
}

async function createBackup() {
  console.log(`Creating backup in ${BACKUP_DIR}...`);
  
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Copy all files that will be modified
    const files = await findFiles();
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes(OLD_BASE_PATH)) {
        const backupPath = path.join(BACKUP_DIR, path.relative(PROJECT_ROOT, file));
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.copyFile(file, backupPath);
      }
    }
    
    console.log('Backup created successfully');
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

async function findFiles() {
  const files = [];
  
  for (const pattern of FILE_PATTERNS) {
    const matches = await glob(pattern, {
      cwd: PROJECT_ROOT,
      ignore: EXCLUDE_PATTERNS,
      absolute: true
    });
    files.push(...matches);
  }
  
  return [...new Set(files)]; // Remove duplicates
}

async function processFile(filePath) {
  try {
    currentFile = filePath;
    const content = await fs.readFile(filePath, 'utf8');
    
    if (!content.includes(OLD_BASE_PATH)) {
      return { filePath, modified: false };
    }
    
    let newContent = content;
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    let requiresImport = false;
    
    // Apply replacement rules
    for (const rule of REPLACEMENT_RULES) {
      // Check if rule applies to this file type
      if (rule.fileTypes) {
        const applies = rule.fileTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExt === type;
          }
          return fileName === type;
        });
        
        if (!applies) continue;
      }
      
      // Apply replacement
      if (typeof rule.replacement === 'function') {
        newContent = newContent.replace(rule.pattern, rule.replacement);
      } else {
        newContent = newContent.replace(rule.pattern, rule.replacement);
      }
      
      if (rule.requiresImport) {
        requiresImport = true;
      }
    }
    
    // Add import statement if needed
    if (requiresImport && fileExt === '.js' && !newContent.includes('site-config.js')) {
      const importStatement = `import siteConfig from '${getRelativePathToConfig(filePath)}/config/site-config.js';\n`;
      
      // Add import at the beginning of the file
      if (newContent.startsWith('#!/usr/bin/env node')) {
        // Handle shebang
        const lines = newContent.split('\n');
        lines.splice(1, 0, importStatement);
        newContent = lines.join('\n');
      } else {
        newContent = importStatement + newContent;
      }
    }
    
    // Write the modified content
    if (newContent !== content) {
      await fs.writeFile(filePath, newContent, 'utf8');
      return { filePath, modified: true, changes: countChanges(content, newContent) };
    }
    
    return { filePath, modified: false };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { filePath, error: error.message };
  }
}

function getRelativePathToConfig(filePath) {
  const depth = path.relative(PROJECT_ROOT, filePath).split(path.sep).length - 1;
  return '../'.repeat(depth);
}

function countChanges(original, modified) {
  const originalMatches = (original.match(/\/aion-visualization\//g) || []).length;
  const modifiedMatches = (modified.match(/\/aion-visualization\//g) || []).length;
  return originalMatches - modifiedMatches;
}

async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      modifiedFiles: results.filter(r => r.modified).length,
      errors: results.filter(r => r.error).length,
      totalChanges: results.reduce((sum, r) => sum + (r.changes || 0), 0)
    },
    files: results
  };
  
  await fs.writeFile(
    path.join(PROJECT_ROOT, 'path-migration-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

async function createConfigIncludeScript() {
  const script = `<!-- Site Configuration -->
<script src="/config/site-config.js"></script>
<script>
  // Initialize site configuration
  if (typeof siteConfig !== 'undefined') {
    siteConfig.init();
  }
</script>`;
  
  await fs.writeFile(
    path.join(PROJECT_ROOT, 'config', 'site-config-include.html'),
    script
  );
}

async function updateIndexFiles() {
  // Update main index.html and other key files to include site config
  const keyFiles = [
    'index.html',
    '404.html',
    'chapters/index.html',
    'visualizations.html'
  ];
  
  for (const file of keyFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Add config script before closing head tag
      if (!content.includes('site-config.js')) {
        content = content.replace(
          '</head>',
          `    <script src="${getRelativePathToConfig(filePath)}config/site-config.js"></script>\n</head>`
        );
        await fs.writeFile(filePath, content);
        console.log(`Updated ${file} with site config`);
      }
    } catch (error) {
      console.warn(`Could not update ${file}:`, error.message);
    }
  }
}

async function main() {
  console.log('=== Path Migration Script ===');
  console.log(`Project root: ${PROJECT_ROOT}`);
  console.log(`Old base path: ${OLD_BASE_PATH}`);
  console.log('');
  
  try {
    // Step 1: Create backup
    await createBackup();
    
    // Step 2: Find all files
    console.log('Finding files to process...');
    const files = await findFiles();
    console.log(`Found ${files.length} files`);
    
    // Step 3: Process files
    console.log('Processing files...');
    const results = [];
    let processed = 0;
    
    for (const file of files) {
      const result = await processFile(file);
      results.push(result);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${files.length} files...`);
      }
    }
    
    // Step 4: Create config include script
    await createConfigIncludeScript();
    
    // Step 5: Update index files
    await updateIndexFiles();
    
    // Step 6: Generate report
    console.log('Generating report...');
    const report = await generateReport(results);
    
    console.log('\n=== Migration Complete ===');
    console.log(`Total files scanned: ${report.summary.totalFiles}`);
    console.log(`Files modified: ${report.summary.modifiedFiles}`);
    console.log(`Total replacements: ${report.summary.totalChanges}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log('\nReport saved to: path-migration-report.json');
    console.log(`Backup saved to: ${BACKUP_DIR}`);
    
    if (report.summary.errors > 0) {
      console.log('\nFiles with errors:');
      results.filter(r => r.error).forEach(r => {
        console.log(`  - ${r.filePath}: ${r.error}`);
      });
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles, REPLACEMENT_RULES };