/**
 * Basic Keyboard Navigation
 * Essential shortcuts only
 */

document.addEventListener('keydown', (e) => {
  // Skip if typing in input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  // Number keys 1-9 for chapters
  if (/^[1-9]$/.test(e.key)) {
    window.location.href = `/chapters/standard/chapter-${e.key}.html`;
  }
  
  // Escape to go home
  if (e.key === 'Escape') {
    window.location.href = '/';
  }
});