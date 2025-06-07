/**
 * Update navigation to include showcase link
 */

import { promises as fs } from 'fs';

async function updateNavigation() {
  const filesToUpdate = [
    'index.html',
    'chapters/index.html',
    'about.html'
  ];

  for (const file of filesToUpdate) {
    try {
      let content = await fs.readFile(file, 'utf8');
      
      // Find navigation menu
      const navRegex = /<nav[^>]*>[\s\S]*?<\/nav>/i;
      const navMatch = content.match(navRegex);
      
      if (navMatch) {
        let nav = navMatch[0];
        
        // Check if showcase link already exists
        if (!nav.includes('showcase.html')) {
          // Add showcase link before About
          nav = nav.replace(
            '<a href="about.html">About</a>',
            '<a href="showcase.html">Showcase</a>\n                <a href="about.html">About</a>'
          );
          
          // Also handle relative paths
          nav = nav.replace(
            '<a href="../about.html">About</a>',
            '<a href="../showcase.html">Showcase</a>\n                <a href="../about.html">About</a>'
          );
          
          content = content.replace(navMatch[0], nav);
          await fs.writeFile(file, content);
          console.log(`✓ Updated navigation in ${file}`);
        } else {
          console.log(`ℹ Showcase link already exists in ${file}`);
        }
      }
    } catch (err) {
      console.warn(`Could not update ${file}:`, err.message);
    }
  }
}

updateNavigation().catch(console.error);