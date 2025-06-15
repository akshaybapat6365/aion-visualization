#!/bin/bash

# Script to integrate remaining visualizations into their respective chapters

echo "🔗 Integrating visualizations into chapters..."

# Chapter 4 - Fish Symbol Timeline
echo "🐟 Adding Fish Timeline to Chapter 4..."
if [ -f "chapters/enhanced/chapter-4.html" ]; then
    # Add Fish Timeline integration to Chapter 4
    cat >> temp_chapter_4_script.js << 'EOF'
        // Load Fish Symbol Timeline Visualization
        async function loadFishTimeline() {
            const container = document.getElementById('fish-timeline-container') || 
                           document.querySelector('.visualization-container');
            if (!container) return;
            
            const loadingDiv = container.querySelector('.viz-loading');
            
            try {
                // Load D3.js for timeline
                if (!window.d3) {
                    const d3Script = document.createElement('script');
                    d3Script.src = 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
                    d3Script.type = 'module';
                    document.head.appendChild(d3Script);
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Load the fish timeline module
                const FishTimeline = await import('../../src/visualizations/chapters/chapter-4-fish/fish-timeline-simple.js');
                
                // Clear loading indicator
                if (loadingDiv) loadingDiv.remove();
                
                // Initialize the visualization
                if (FishTimeline.initFishTimeline) {
                    FishTimeline.initFishTimeline(container);
                } else {
                    throw new Error('Fish timeline initialization function not found');
                }
                
                console.log('Fish Timeline visualization loaded successfully');
            } catch (error) {
                console.error('Failed to load Fish Timeline:', error);
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="color: #ff6b6b;">Failed to load visualization. <a href="../../src/visualizations/chapters/chapter-4-fish/fish-timeline-showcase.html" style="color: #ffd700;">View standalone demo</a></div>';
                }
            }
        }
EOF
    
    echo "Fish Timeline integration script created"
else
    echo "⚠️  Chapter 4 file not found"
fi

# Chapter 11 - Alchemical Lab  
echo "⚗️ Adding Alchemy Lab to Chapter 11..."
if [ -f "chapters/enhanced/chapter-11.html" ]; then
    cat >> temp_chapter_11_script.js << 'EOF'
        // Load Alchemical Transformation Lab
        async function loadAlchemyLab() {
            const container = document.getElementById('alchemy-lab-container') || 
                           document.querySelector('.visualization-container');
            if (!container) return;
            
            const loadingDiv = container.querySelector('.viz-loading');
            
            try {
                // Load the alchemy lab module
                const AlchemyLab = await import('../../src/visualizations/alchemy/AlchemyLab.js');
                
                // Clear loading indicator
                if (loadingDiv) loadingDiv.remove();
                
                // Initialize the visualization
                const alchemyViz = new AlchemyLab.default(container);
                
                console.log('Alchemy Lab visualization loaded successfully');
            } catch (error) {
                console.error('Failed to load Alchemy Lab:', error);
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="color: #ff6b6b;">Failed to load visualization. <a href="../../src/visualizations/alchemy/alchemy-lab-demo.html" style="color: #ffd700;">View standalone demo</a></div>';
                }
            }
        }
EOF
    
    echo "Alchemy Lab integration script created"
else
    echo "⚠️  Chapter 11 file not found"
fi

# Chapter 9 - Gnostic Cosmology
echo "🌌 Adding Gnostic Map to Chapter 9..."
cat >> temp_chapter_9_script.js << 'EOF'
        // Load Gnostic Cosmology Map
        async function loadGnosticMap() {
            const container = document.getElementById('gnostic-map-container') || 
                           document.querySelector('.visualization-container');
            if (!container) return;
            
            const loadingDiv = container.querySelector('.viz-loading');
            
            try {
                // Three.js should already be loaded in chapters
                if (!window.THREE) {
                    throw new Error('Three.js not loaded');
                }
                
                // Load the gnostic map module
                const GnosticMap = await import('../../src/visualizations/cosmology/GnosticMap.js');
                
                // Clear loading indicator
                if (loadingDiv) loadingDiv.remove();
                
                // Initialize the visualization
                const gnosticViz = new GnosticMap.default(container);
                
                console.log('Gnostic Map visualization loaded successfully');
            } catch (error) {
                console.error('Failed to load Gnostic Map:', error);
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="color: #ff6b6b;">Failed to load visualization. <a href="../../src/visualizations/cosmology/gnostic-map-demo.html" style="color: #ffd700;">View standalone demo</a></div>';
                }
            }
        }
EOF

# Chapter 3 - Anima/Animus Constellation
echo "⭐ Adding Constellation to Chapter 3..."
cat >> temp_chapter_3_script.js << 'EOF'
        // Load Anima/Animus Constellation
        async function loadConstellation() {
            const container = document.getElementById('constellation-container') || 
                           document.querySelector('.visualization-container');
            if (!container) return;
            
            const loadingDiv = container.querySelector('.viz-loading');
            
            try {
                // Load D3.js and Three.js dependencies
                if (!window.THREE) {
                    throw new Error('Three.js not loaded');
                }
                
                if (!window.d3) {
                    const d3Script = document.createElement('script');
                    d3Script.src = 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
                    d3Script.type = 'module';
                    document.head.appendChild(d3Script);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Load the constellation module
                const AnimaAnimus = await import('../../src/visualizations/constellation/AnimaAnimus.js');
                
                // Clear loading indicator
                if (loadingDiv) loadingDiv.remove();
                
                // Initialize the visualization
                const constellationViz = new AnimaAnimus.default(container);
                
                console.log('Anima/Animus Constellation visualization loaded successfully');
            } catch (error) {
                console.error('Failed to load Constellation:', error);
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="color: #ff6b6b;">Failed to load visualization. <a href="../../src/visualizations/constellation/anima-animus-demo.html" style="color: #ffd700;">View standalone demo</a></div>';
                }
            }
        }
EOF

# Chapter 14 - Aion Clock
echo "🕐 Adding Aion Clock to Chapter 14..."
cat >> temp_chapter_14_script.js << 'EOF'
        // Load Aion Clock Visualization
        async function loadAionClock() {
            const container = document.getElementById('aion-clock-container') || 
                           document.querySelector('.visualization-container');
            if (!container) return;
            
            const loadingDiv = container.querySelector('.viz-loading');
            
            try {
                // Load D3.js for clock functionality
                if (!window.d3) {
                    const d3Script = document.createElement('script');
                    d3Script.src = 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
                    d3Script.type = 'module';
                    document.head.appendChild(d3Script);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Load the aion clock module
                const AionClock = await import('../../src/visualizations/clock/AionClock.js');
                
                // Clear loading indicator
                if (loadingDiv) loadingDiv.remove();
                
                // Initialize the visualization
                const clockViz = new AionClock.default(container);
                
                console.log('Aion Clock visualization loaded successfully');
            } catch (error) {
                console.error('Failed to load Aion Clock:', error);
                if (loadingDiv) {
                    loadingDiv.innerHTML = '<div style="color: #ff6b6b;">Failed to load visualization. <a href="../../src/visualizations/clock/aion-clock-demo.html" style="color: #ffd700;">View standalone demo</a></div>';
                }
            }
        }
EOF

echo "✅ Integration scripts created!"
echo ""
echo "📝 Manual steps needed:"
echo "1. Review each chapter file and add the appropriate visualization container"
echo "2. Add the loading scripts to each chapter's JavaScript section"
echo "3. Update container IDs to match the script expectations"
echo ""
echo "🎯 Priority chapters to update:"
echo "- Chapter 4 (Fish): Add Fish Timeline"
echo "- Chapter 11 (Alchemy): Add Alchemy Lab"  
echo "- Chapter 9 (Gnostic): Add Gnostic Map"
echo "- Chapter 3 (Syzygy): Add Constellation"
echo "- Chapter 14 (Structure): Add Aion Clock"

# Clean up temp files
rm -f temp_chapter_*.js

echo ""
echo "🚀 Next: Test the visualizations.html page and individual demos"