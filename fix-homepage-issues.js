/**
 * Script to diagnose and fix homepage test issues
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkHomepageStructure() {
  console.log('🔍 Checking homepage structure...\n');
  
  const content = await fs.readFile('index.html', 'utf8');
  
  // Check for required elements
  const checks = [
    {
      name: 'Hero Title',
      selector: 'hero-title',
      found: content.includes('class="hero-title"')
    },
    {
      name: 'Navigation Links',
      selector: 'nav-link',
      found: content.includes('class="nav-link"')
    },
    {
      name: 'Global Loader',
      selector: 'global-loader',
      found: content.includes('id="global-loader"')
    },
    {
      name: 'Action Buttons',
      selector: 'button',
      found: content.includes('class="button')
    },
    {
      name: 'Navigation Container',
      selector: 'nav-container',
      found: content.includes('class="nav-container"')
    }
  ];
  
  console.log('Element Check Results:');
  checks.forEach(check => {
    console.log(`${check.found ? '✅' : '❌'} ${check.name} (${check.selector})`);
  });
  
  // Count nav links
  const navLinkMatches = content.match(/class="nav-link"/g);
  console.log(`\nNav links found: ${navLinkMatches ? navLinkMatches.length : 0}`);
  
  // Count buttons
  const buttonMatches = content.match(/class="button[^"]*"/g);
  console.log(`Buttons found: ${buttonMatches ? buttonMatches.length : 0}`);
  
  // Check if elements are inside main content
  const mainContentStart = content.indexOf('<main');
  const mainContentEnd = content.indexOf('</main>');
  
  if (mainContentStart > -1 && mainContentEnd > -1) {
    const mainContent = content.substring(mainContentStart, mainContentEnd);
    console.log('\nElements in main content:');
    console.log(`- Hero section: ${mainContent.includes('class="hero"') ? 'Yes' : 'No'}`);
    console.log(`- Hero title: ${mainContent.includes('class="hero-title"') ? 'Yes' : 'No'}`);
    console.log(`- Buttons: ${mainContent.includes('class="button') ? 'Yes' : 'No'}`);
  }
  
  // Check CSS loading
  console.log('\nCSS Files:');
  const cssLinks = content.match(/<link[^>]+href="[^"]+\.css"[^>]*>/g);
  if (cssLinks) {
    cssLinks.forEach(link => {
      const href = link.match(/href="([^"]+)"/)?.[1];
      console.log(`- ${href}`);
    });
  }
  
  return checks;
}

// Run the check
checkHomepageStructure().catch(console.error);