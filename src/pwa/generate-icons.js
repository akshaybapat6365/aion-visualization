/**
 * PWA Icon Generator
 * Creates all required icons for Progressive Web App
 * Run this with Node.js to generate icons from a base SVG
 */

const fs = require('fs').promises;
const path = require('path');

// SVG template for the Aion icon
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#0A0A0A"/>
  
  <!-- Golden accent border -->
  <rect x="${size * 0.05}" y="${size * 0.05}" 
        width="${size * 0.9}" height="${size * 0.9}" 
        fill="none" stroke="#FFD700" stroke-width="${size * 0.02}"
        rx="${size * 0.1}" ry="${size * 0.1}"/>
  
  <!-- Aion Symbol - Simplified Ouroboros -->
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.35}" 
          fill="none" stroke="#FFD700" stroke-width="${size * 0.04}"/>
  
  <!-- Center dot representing consciousness -->
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.08}" fill="#FFD700"/>
  
  <!-- Text "A" for Aion -->
  <text x="${size * 0.5}" y="${size * 0.58}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-size="${size * 0.3}" font-weight="300" 
        fill="#F0F0F0" text-anchor="middle">A</text>
</svg>
`;

// Icon sizes required for PWA
const iconSizes = [
  72, 96, 128, 144, 152, 192, 384, 512
];

// Additional icons for specific purposes
const specialIcons = {
  'chapters-icon': {
    size: 96,
    content: (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#141414"/>
  <rect x="${size * 0.1}" y="${size * 0.2}" width="${size * 0.8}" height="${size * 0.1}" fill="#FFD700" rx="2"/>
  <rect x="${size * 0.1}" y="${size * 0.4}" width="${size * 0.8}" height="${size * 0.1}" fill="#FFD700" rx="2"/>
  <rect x="${size * 0.1}" y="${size * 0.6}" width="${size * 0.8}" height="${size * 0.1}" fill="#FFD700" rx="2"/>
</svg>`
  },
  'chapter1-icon': {
    size: 96,
    content: (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#141414"/>
  <text x="${size * 0.5}" y="${size * 0.6}" 
        font-family="system-ui" font-size="${size * 0.5}" font-weight="300" 
        fill="#FFD700" text-anchor="middle">1</text>
</svg>`
  },
  'timeline-icon': {
    size: 96,
    content: (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#141414"/>
  <line x1="${size * 0.2}" y1="${size * 0.5}" x2="${size * 0.8}" y2="${size * 0.5}" 
        stroke="#FFD700" stroke-width="${size * 0.03}"/>
  <circle cx="${size * 0.3}" cy="${size * 0.5}" r="${size * 0.06}" fill="#FFD700"/>
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.06}" fill="#FFD700"/>
  <circle cx="${size * 0.7}" cy="${size * 0.5}" r="${size * 0.06}" fill="#FFD700"/>
</svg>`
  }
};

// Maskable icon with safe area
const createMaskableIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with safe area -->
  <rect width="${size}" height="${size}" fill="#0A0A0A"/>
  
  <!-- Safe area indicator (will be hidden in actual use) -->
  <rect x="${size * 0.1}" y="${size * 0.1}" 
        width="${size * 0.8}" height="${size * 0.8}" 
        fill="#0A0A0A" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="5,5" opacity="0.5"/>
  
  <!-- Icon content within safe area -->
  <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(0.6)">
    <!-- Golden accent border -->
    <rect x="${size * 0.05}" y="${size * 0.05}" 
          width="${size * 0.9}" height="${size * 0.9}" 
          fill="none" stroke="#FFD700" stroke-width="${size * 0.02}"
          rx="${size * 0.1}" ry="${size * 0.1}"/>
    
    <!-- Aion Symbol -->
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.35}" 
            fill="none" stroke="#FFD700" stroke-width="${size * 0.04}"/>
    
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.08}" fill="#FFD700"/>
    
    <text x="${size * 0.5}" y="${size * 0.58}" 
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="${size * 0.3}" font-weight="300" 
          fill="#F0F0F0" text-anchor="middle">A</text>
  </g>
</svg>
`;

// Function to save SVG as file (in browser context, this would convert to PNG)
async function saveIcon(filename, svgContent) {
  const outputPath = path.join(__dirname, '../../assets/images', filename);
  await fs.writeFile(outputPath, svgContent, 'utf8');
  console.log(`Created: ${filename}`);
}

// Generate all icons
async function generateIcons() {
  try {
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../../assets/images');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate standard icons
    for (const size of iconSizes) {
      const filename = `icon-${size}x${size}.svg`;
      const svg = createIconSVG(size);
      await saveIcon(filename, svg);
    }
    
    // Generate maskable icons
    for (const size of [192, 512]) {
      const filename = `icon-maskable-${size}x${size}.svg`;
      const svg = createMaskableIconSVG(size);
      await saveIcon(filename, svg);
    }
    
    // Generate special icons
    for (const [name, config] of Object.entries(specialIcons)) {
      const filename = `${name}.svg`;
      const svg = config.content(config.size);
      await saveIcon(filename, svg);
    }
    
    console.log('All icons generated successfully!');
    
    // Create a simple HTML preview
    const previewHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>PWA Icons Preview</title>
    <style>
        body { 
            background: #0A0A0A; 
            color: #F0F0F0; 
            font-family: system-ui; 
            padding: 2rem;
        }
        .icons { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 2rem;
        }
        .icon-container {
            text-align: center;
        }
        .icon-container img {
            background: #141414;
            border: 1px solid #1F1F1F;
            border-radius: 8px;
            padding: 1rem;
        }
        .icon-container p {
            margin-top: 0.5rem;
            color: #8A8A8A;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <h1>PWA Icons Preview</h1>
    <div class="icons">
        ${iconSizes.map(size => `
        <div class="icon-container">
            <img src="icon-${size}x${size}.svg" width="${size}" height="${size}" alt="${size}x${size} icon">
            <p>${size}x${size}</p>
        </div>
        `).join('')}
    </div>
    <h2>Special Icons</h2>
    <div class="icons">
        ${Object.entries(specialIcons).map(([name, config]) => `
        <div class="icon-container">
            <img src="${name}.svg" width="${config.size}" height="${config.size}" alt="${name}">
            <p>${name}</p>
        </div>
        `).join('')}
    </div>
</body>
</html>
    `;
    
    await fs.writeFile(
      path.join(outputDir, 'icons-preview.html'), 
      previewHTML, 
      'utf8'
    );
    
    console.log('Preview page created: assets/images/icons-preview.html');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// For browser context, provide the SVG functions
if (typeof window !== 'undefined') {
  window.PWAIcons = {
    createIconSVG,
    createMaskableIconSVG,
    iconSizes,
    specialIcons
  };
} else {
  // Run if executed with Node.js
  generateIcons();
}

module.exports = {
  createIconSVG,
  createMaskableIconSVG,
  iconSizes,
  specialIcons
};