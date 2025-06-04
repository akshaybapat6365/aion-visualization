#!/bin/bash

# Create placeholder pages for chapters 4-14

create_chapter() {
    local num=$1
    local title=$2
    local subtitle=$3
    local prev_num=$((num - 1))
    local next_num=$((num + 1))
    local filename="chapter${num}-v2.html"
    
    cat > "$filename" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chapter ${num}: ${title} - Aion Visualization</title>
    <link rel="stylesheet" href="styles-v3.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <!-- WebGL Background -->
    <canvas id="webgl-canvas" class="webgl-canvas"></canvas>
    
    <!-- Navigation -->
    <nav class="nav">
        <div class="nav-container">
            <a href="index-v2.html" class="nav-link">Home</a>
            <a href="chapters-v2.html" class="nav-link">Chapters</a>
            <a href="journey-v2.html" class="nav-link">Journey</a>
            <a href="about-v2.html" class="nav-link">About</a>
        </div>
    </nav>
    
    <!-- Content -->
    <main style="padding-top: calc(var(--nav-height) + var(--space-16));">
        <div class="container" style="text-align: center;">
            <span class="chapter-number">Chapter $(printf "%02d" $num)</span>
            <h1 style="font-size: var(--text-6xl); font-weight: 200; margin: var(--space-4) 0;">
                ${title}
            </h1>
            <p style="font-size: var(--text-xl); color: var(--text-secondary); margin-bottom: var(--space-8);">
                ${subtitle}
            </p>
            
            <div class="card" style="max-width: 600px; margin: 0 auto; padding: var(--space-8);">
                <p style="font-size: var(--text-lg); color: var(--text-secondary);">
                    This chapter is currently being developed.
                </p>
                <p style="margin-top: var(--space-4);">
                    The visualization will explore ${subtitle} through interactive WebGL experiences.
                </p>
            </div>
            
            <!-- Navigation -->
            <div style="display: flex; justify-content: space-between; margin-top: var(--space-16);">
                <a href="chapter${prev_num}-v2.html" class="button">← Previous Chapter</a>
                <a href="chapter${next_num}-v2.html" class="button">Next Chapter →</a>
            </div>
        </div>
    </main>
    
    <!-- Minimal Background -->
    <script>
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('webgl-canvas'),
            antialias: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        const gradientShader = {
            uniforms: {
                time: { value: 0 },
                chapter: { value: ${num} }
            },
            vertexShader: \`
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            \`,
            fragmentShader: \`
                uniform float time;
                uniform float chapter;
                
                void main() {
                    vec2 uv = gl_FragCoord.xy / vec2(\${window.innerWidth}.0, \${window.innerHeight}.0);
                    
                    float gradient = uv.y * 0.5 + 0.5;
                    gradient += sin(uv.x * 2.0 + time * 0.2 + chapter) * 0.02;
                    
                    vec3 color = vec3(0.0);
                    float hue = chapter / 14.0;
                    color += vec3(0.05 * hue, 0.02, 0.08 * (1.0 - hue)) * gradient * 0.5;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            \`
        };
        
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial(gradientShader);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        function animate() {
            requestAnimationFrame(animate);
            material.uniforms.time.value += 0.01;
            renderer.render(scene, camera);
        }
        
        animate();
    </script>
    <script src="transitions.js"></script>
</body>
</html>
EOF
    
    echo "Created $filename"
}

# Create all placeholder chapters
create_chapter 4 "The Sign of the Fishes" "The astrological symbolism of the Piscean Age"
create_chapter 5 "Christ as Archetype" "The Self manifested in Christian symbolism"
create_chapter 6 "The Antichrist" "The shadow of the Christian aeon"
create_chapter 7 "The Pleroma" "The Gnostic conception of divine fullness"
create_chapter 8 "Sophia" "Divine wisdom and the fallen soul"
create_chapter 9 "The Naassenes" "The serpent wisdom and transformation"
create_chapter 10 "The Lapis" "The philosopher's stone as symbol of the Self"
create_chapter 11 "Mercurius" "The spirit of transformation"
create_chapter 12 "The Coniunctio" "The sacred marriage of opposites"
create_chapter 13 "The Quaternary" "The fourfold structure of wholeness"

# Fix navigation for last chapter
cat > "chapter14-v2.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chapter 14: The Self - Aion Visualization</title>
    <link rel="stylesheet" href="styles-v3.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <!-- WebGL Background -->
    <canvas id="webgl-canvas" class="webgl-canvas"></canvas>
    
    <!-- Navigation -->
    <nav class="nav">
        <div class="nav-container">
            <a href="index-v2.html" class="nav-link">Home</a>
            <a href="chapters-v2.html" class="nav-link">Chapters</a>
            <a href="journey-v2.html" class="nav-link">Journey</a>
            <a href="about-v2.html" class="nav-link">About</a>
        </div>
    </nav>
    
    <!-- Content -->
    <main style="padding-top: calc(var(--nav-height) + var(--space-16));">
        <div class="container" style="text-align: center;">
            <span class="chapter-number">Chapter 14</span>
            <h1 style="font-size: var(--text-6xl); font-weight: 200; margin: var(--space-4) 0;">
                The Self
            </h1>
            <p style="font-size: var(--text-xl); color: var(--text-secondary); margin-bottom: var(--space-8);">
                The archetype of wholeness and regulation
            </p>
            
            <div class="card" style="max-width: 600px; margin: 0 auto; padding: var(--space-8);">
                <p style="font-size: var(--text-lg); color: var(--text-secondary);">
                    The final chapter - where all elements unite in the archetype of the Self.
                </p>
                <p style="margin-top: var(--space-4);">
                    This culminating visualization will represent the integration of all previous concepts.
                </p>
            </div>
            
            <!-- Navigation -->
            <div style="display: flex; justify-content: space-between; margin-top: var(--space-16);">
                <a href="chapter13-v2.html" class="button">← Chapter 13: The Quaternary</a>
                <a href="chapters-v2.html" class="button">Return to Chapters</a>
            </div>
        </div>
    </main>
    
    <!-- Minimal Background -->
    <script>
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('webgl-canvas'),
            antialias: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        const selfShader = {
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                
                void main() {
                    vec2 uv = gl_FragCoord.xy / vec2(${window.innerWidth}.0, ${window.innerHeight}.0);
                    vec2 center = vec2(0.5, 0.5);
                    
                    float dist = distance(uv, center);
                    float pulse = sin(time * 2.0) * 0.1 + 1.0;
                    
                    vec3 color = vec3(0.0);
                    
                    // Mandala-like pattern
                    float angle = atan(uv.y - 0.5, uv.x - 0.5);
                    float radius = length(uv - center);
                    
                    float pattern = sin(angle * 4.0 + time) * sin(radius * 20.0 - time * 2.0);
                    pattern = smoothstep(0.0, 0.1, pattern);
                    
                    color += vec3(0.1, 0.05, 0.15) * pattern * (1.0 - dist);
                    color += vec3(0.05, 0.02, 0.08) * (1.0 - dist * 2.0);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        };
        
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial(selfShader);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        function animate() {
            requestAnimationFrame(animate);
            material.uniforms.time.value += 0.01;
            renderer.render(scene, camera);
        }
        
        animate();
    </script>
    <script src="transitions.js"></script>
</body>
</html>
EOF

echo "Created chapter14-v2.html"
echo "All placeholder chapters created!"