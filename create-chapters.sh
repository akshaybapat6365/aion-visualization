#\!/bin/bash

# Chapter 10: The Lapis
cat > chapter10-v2.html << 'CHAPTER10'
<\!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chapter 10: The Lapis - Aion by Carl Jung</title>
    <link rel="stylesheet" href="styles-v2.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
    <style>
        .main-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 48px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: flex;
            align-items: center;
            padding: 0 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .nav-home {
            font-size: 1.125rem;
            font-weight: 500;
            color: #fff;
            text-decoration: none;
            margin-right: auto;
        }
        .nav-toggle {
            display: none;
            background: none;
            border: none;
            color: #fff;
            font-size: 1.5rem;
            cursor: pointer;
        }
        .nav-links {
            display: flex;
            gap: 2rem;
        }
        .nav-links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-size: 0.875rem;
            transition: color 0.3s ease;
        }
        .nav-links a:hover {
            color: #fff;
        }
        .chapter-content {
            padding: 6rem 2rem 4rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .chapter-header {
            text-align: center;
            margin-bottom: 4rem;
        }
        .chapter-number {
            font-size: 0.875rem;
            font-weight: 600;
            color: #6B46C1;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .chapter-title {
            font-size: 3.75rem;
            font-weight: 200;
            margin: 1rem 0;
            letter-spacing: -0.02em;
        }
        .chapter-subtitle {
            font-size: 1.25rem;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 300;
        }
        .chapter-intro {
            max-width: 800px;
            margin: 0 auto 4rem;
            font-size: 1.125rem;
            line-height: 1.8;
            color: rgba(255, 255, 255, 0.8);
        }
        .visualization-section {
            margin: 4rem 0;
        }
        .visualization-section h2 {
            font-size: 2rem;
            font-weight: 300;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .visualization-intro {
            max-width: 600px;
            margin: 0 auto 2rem;
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
        }
        .visualization-container {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 2rem;
            margin: 2rem 0;
        }
        .visualization-controls {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
        }
        .visualization-controls button {
            padding: 0.5rem 1.5rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .visualization-controls button:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-1px);
        }
        .visualization-controls button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .content-section {
            margin: 4rem 0;
        }
        .content-section h2 {
            font-size: 2rem;
            font-weight: 300;
            margin-bottom: 2rem;
        }
        .concept-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .concept-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        .concept-card:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
        }
        .concept-card h3 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            color: #9D4EDD;
        }
        .concept-card p {
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
        }
        .insight-list {
            list-style: none;
            padding: 0;
        }
        .insight-list li {
            padding: 1rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
        }
        .insight-list li:last-child {
            border-bottom: none;
        }
        .chapter-nav {
            display: flex;
            justify-content: space-between;
            margin-top: 6rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chapter-nav a {
            color: #9D4EDD;
            text-decoration: none;
            font-size: 0.875rem;
            transition: all 0.3s ease;
        }
        .chapter-nav a:hover {
            color: #B57BFF;
            transform: translateX(±4px);
        }
        .prev-chapter:hover {
            transform: translateX(-4px);
        }
        .next-chapter:hover {
            transform: translateX(4px);
        }
        #bg-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }
        @media (max-width: 768px) {
            .nav-toggle {
                display: block;
            }
            .nav-links {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.95);
                flex-direction: column;
                padding: 1rem;
            }
            .nav-links.active {
                display: flex;
            }
            .chapter-title {
                font-size: 2.5rem;
            }
            .concept-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <nav class="main-nav">
        <a href="index-v2.html" class="nav-home">Aion</a>
        <button class="nav-toggle" aria-label="Toggle navigation">☰</button>
        <div class="nav-links">
            <a href="chapters-v2.html">Chapters</a>
            <a href="timeline-v2.html">Timeline</a>
            <a href="symbols-v2.html">Symbols</a>
            <a href="about-v2.html">About</a>
        </div>
    </nav>

    <main class="chapter-content">
        <div class="chapter-header">
            <div class="chapter-number">Chapter X</div>
            <h1 class="chapter-title">The Lapis</h1>
            <p class="chapter-subtitle">The Philosopher's Stone of Transformation</p>
        </div>

        <section class="chapter-intro">
            <p>Jung explores the lapis philosophorum—the philosopher's stone—as the ultimate symbol of psychological transformation. This mysterious substance represents the Self, achieved through the alchemical process of individuation, transforming base matter (the unconscious) into gold (consciousness).</p>
        </section>

        <section class="visualization-section">
            <h2>Alchemical Transformation Stages</h2>
            <div class="visualization-intro">
                <p>This visualization shows the three primary stages of alchemical transformation: nigredo (blackening), albedo (whitening), and rubedo (reddening), representing the death, purification, and rebirth of the psyche.</p>
            </div>
            <div id="alchemy-viz" class="visualization-container"></div>
            <div class="visualization-controls">
                <button id="animate-transformation">Animate Transformation</button>
                <button id="show-symbols">Show Alchemical Symbols</button>
                <button id="reset-alchemy">Reset</button>
            </div>
        </section>

        <section class="content-section">
            <h2>The Stages of the Great Work</h2>
            <div class="concept-grid">
                <div class="concept-card">
                    <h3>Nigredo</h3>
                    <p>The blackening stage of dissolution and death, where the ego confronts the shadow and unconscious material.</p>
                </div>
                <div class="concept-card">
                    <h3>Albedo</h3>
                    <p>The whitening stage of purification, where opposites are differentiated and the anima/animus emerges.</p>
                </div>
                <div class="concept-card">
                    <h3>Rubedo</h3>
                    <p>The reddening stage of integration, where the Self is realized through the union of opposites.</p>
                </div>
                <div class="concept-card">
                    <h3>The Lapis</h3>
                    <p>The philosopher's stone itself, symbol of the perfected Self and the goal of individuation.</p>
                </div>
            </div>
        </section>

        <section class="visualization-section">
            <h2>The Vessel of Transformation</h2>
            <div id="vessel-viz" class="visualization-container"></div>
        </section>

        <section class="content-section">
            <h2>Psychological Meaning</h2>
            <p>The alchemical opus parallels the process of individuation:</p>
            <ul class="insight-list">
                <li>The prima materia represents the raw, unconscious psyche</li>
                <li>The alchemical vessel is the containing space of analysis or self-reflection</li>
                <li>Chemical operations symbolize psychological transformations</li>
                <li>The lapis represents the integrated Self, the union of conscious and unconscious</li>
                <li>The process is circular and ongoing, not a one-time achievement</li>
            </ul>
        </section>

        <div class="chapter-nav">
            <a href="chapter9-v2.html" class="prev-chapter">← Chapter 9: The Naassenes</a>
            <a href="chapter11-v2.html" class="next-chapter">Chapter 11: Mercurius →</a>
        </div>
    </main>

    <canvas id="bg-canvas"></canvas>

    <script>
        // Background shader - alchemical patterns
        const canvas = document.getElementById('bg-canvas');
        const gl = canvas.getContext('webgl');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const vertexShaderSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 resolution;
            uniform float time;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                // Alchemical transformation gradient
                float t = sin(time * 0.2) * 0.5 + 0.5;
                
                // Three stages blending
                vec3 nigredo = vec3(0.0, 0.0, 0.0);
                vec3 albedo = vec3(1.0, 1.0, 1.0);
                vec3 rubedo = vec3(0.8, 0.1, 0.1);
                
                vec3 color;
                if (t < 0.33) {
                    color = mix(nigredo, albedo, t * 3.0);
                } else if (t < 0.66) {
                    color = mix(albedo, rubedo, (t - 0.33) * 3.0);
                } else {
                    color = mix(rubedo, vec3(0.8, 0.6, 0.2), (t - 0.66) * 3.0);
                }
                
                // Add mystical swirls
                float swirl = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 - time);
                color += swirl * 0.1;
                
                gl_FragColor = vec4(color * 0.3, 1.0);
            }
        `;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const resolutionLocation = gl.getUniformLocation(program, 'resolution');
        const timeLocation = gl.getUniformLocation(program, 'time');

        function animate(time) {
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, time * 0.001);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(animate);
        }
        animate(0);

        // Alchemical Transformation Visualization
        const alchemyWidth = 800;
        const alchemyHeight = 600;

        const alchemySvg = d3.select("#alchemy-viz")
            .append("svg")
            .attr("viewBox", `0 0 ${alchemyWidth} ${alchemyHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Define gradients for each stage
        const defs = alchemySvg.append("defs");

        // Nigredo gradient
        const nigredoGradient = defs.append("radialGradient")
            .attr("id", "nigredoGradient");
        nigredoGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#1a1a1a");
        nigredoGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#000000");

        // Albedo gradient
        const albedoGradient = defs.append("radialGradient")
            .attr("id", "albedoGradient");
        albedoGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#FFFFFF");
        albedoGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#E0E0E0");

        // Rubedo gradient
        const rubedoGradient = defs.append("radialGradient")
            .attr("id", "rubedoGradient");
        rubedoGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#DC143C");
        rubedoGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#8B0000");

        // Create transformation stages
        const stages = [
            { name: "Nigredo", x: 200, y: 300, gradient: "nigredoGradient", symbol: "☾", textColor: "#FFF" },
            { name: "Albedo", x: 400, y: 300, gradient: "albedoGradient", symbol: "☉", textColor: "#000" },
            { name: "Rubedo", x: 600, y: 300, gradient: "rubedoGradient", symbol: "♃", textColor: "#FFF" }
        ];

        // Draw connections
        const connectionPath = d3.path();
        connectionPath.moveTo(stages[0].x, stages[0].y);
        connectionPath.quadraticCurveTo(300, 200, stages[1].x, stages[1].y);
        connectionPath.quadraticCurveTo(500, 200, stages[2].x, stages[2].y);

        alchemySvg.append("path")
            .attr("d", connectionPath.toString())
            .attr("fill", "none")
            .attr("stroke", "#9D4EDD")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "5,5")
            .attr("opacity", 0.5);

        // Draw stages
        const stageGroups = alchemySvg.selectAll(".stage")
            .data(stages)
            .enter()
            .append("g")
            .attr("class", "stage")
            .attr("transform", d => `translate(${d.x}, ${d.y})`);

        stageGroups.append("circle")
            .attr("r", 80)
            .attr("fill", d => `url(#${d.gradient})`)
            .attr("stroke", "#9D4EDD")
            .attr("stroke-width", 2);

        stageGroups.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.35em")
            .attr("fill", d => d.textColor)
            .attr("font-size", "48px")
            .text(d => d.symbol);

        stageGroups.append("text")
            .attr("text-anchor", "middle")
            .attr("y", 120)
            .attr("fill", "#FFF")
            .attr("font-size", "16px")
            .text(d => d.name);

        // Add lapis at the end
        const lapisGroup = alchemySvg.append("g")
            .attr("transform", `translate(${alchemyWidth / 2}, 100)`)
            .attr("opacity", 0);

        lapisGroup.append("rect")
            .attr("x", -30)
            .attr("y", -30)
            .attr("width", 60)
            .attr("height", 60)
            .attr("fill", "#FFD700")
            .attr("stroke", "#FFF")
            .attr("stroke-width", 3)
            .attr("transform", "rotate(45)");

        lapisGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("y", 60)
            .attr("fill", "#FFF")
            .attr("font-size", "14px")
            .text("Lapis Philosophorum");

        // Alchemical symbols overlay
        const symbolsGroup = alchemySvg.append("g")
            .attr("class", "symbols")
            .attr("opacity", 0);

        const alchemicalSymbols = [
            { symbol: "🜔", x: 150, y: 400, name: "Fire" },
            { symbol: "🜄", x: 250, y: 400, name: "Water" },
            { symbol: "🜁", x: 350, y: 400, name: "Air" },
            { symbol: "🜃", x: 450, y: 400, name: "Earth" },
            { symbol: "☿", x: 550, y: 400, name: "Mercury" },
            { symbol: "🜍", x: 650, y: 400, name: "Sulfur" }
        ];

        alchemicalSymbols.forEach(sym => {
            const symGroup = symbolsGroup.append("g")
                .attr("transform", `translate(${sym.x}, ${sym.y})`);

            symGroup.append("text")
                .attr("text-anchor", "middle")
                .attr("fill", "#9D4EDD")
                .attr("font-size", "24px")
                .text(sym.symbol);

            symGroup.append("text")
                .attr("text-anchor", "middle")
                .attr("y", 25)
                .attr("fill", "#FFF")
                .attr("font-size", "12px")
                .text(sym.name);
        });

        // Animation controls
        let animating = false;
        let showingSymbols = false;

        document.getElementById("animate-transformation").addEventListener("click", function() {
            if (animating) return;
            animating = true;
            this.disabled = true;

            // Animate through stages
            stageGroups.each(function(d, i) {
                d3.select(this).select("circle")
                    .transition()
                    .delay(i * 1500)
                    .duration(1000)
                    .attr("r", 100)
                    .transition()
                    .duration(500)
                    .attr("r", 80);
            });

            // Show lapis at the end
            lapisGroup.transition()
                .delay(4500)
                .duration(1000)
                .attr("opacity", 1)
                .on("end", () => {
                    animating = false;
                    document.getElementById("animate-transformation").disabled = false;
                });
        });

        document.getElementById("show-symbols").addEventListener("click", function() {
            showingSymbols = \!showingSymbols;
            symbolsGroup.transition()
                .duration(500)
                .attr("opacity", showingSymbols ? 1 : 0);
            this.textContent = showingSymbols ? "Hide Alchemical Symbols" : "Show Alchemical Symbols";
        });

        document.getElementById("reset-alchemy").addEventListener("click", function() {
            lapisGroup.attr("opacity", 0);
            symbolsGroup.attr("opacity", 0);
            showingSymbols = false;
            document.getElementById("show-symbols").textContent = "Show Alchemical Symbols";
        });

        // Vessel Visualization
        const vesselWidth = 800;
        const vesselHeight = 400;

        const vesselSvg = d3.select("#vessel-viz")
            .append("svg")
            .attr("viewBox", `0 0 ${vesselWidth} ${vesselHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Draw alchemical vessel
        const vesselCenterX = vesselWidth / 2;
        const vesselCenterY = vesselHeight / 2;

        // Vessel shape
        const vesselPath = d3.path();
        vesselPath.moveTo(vesselCenterX - 100, vesselCenterY - 50);
        vesselPath.quadraticCurveTo(vesselCenterX - 100, vesselCenterY + 100, vesselCenterX, vesselCenterY + 120);
        vesselPath.quadraticCurveTo(vesselCenterX + 100, vesselCenterY + 100, vesselCenterX + 100, vesselCenterY - 50);
        vesselPath.lineTo(vesselCenterX + 80, vesselCenterY - 80);
        vesselPath.lineTo(vesselCenterX + 60, vesselCenterY - 100);
        vesselPath.lineTo(vesselCenterX - 60, vesselCenterY - 100);
        vesselPath.lineTo(vesselCenterX - 80, vesselCenterY - 80);
        vesselPath.closePath();

        vesselSvg.append("path")
            .attr("d", vesselPath.toString())
            .attr("fill", "rgba(255, 255, 255, 0.1)")
            .attr("stroke", "#9D4EDD")
            .attr("stroke-width", 3);

        // Animated contents
        const contentsGroup = vesselSvg.append("g");

        function createBubble() {
            const bubble = contentsGroup.append("circle")
                .attr("cx", vesselCenterX + (Math.random() - 0.5) * 150)
                .attr("cy", vesselCenterY + 100)
                .attr("r", Math.random() * 10 + 5)
                .attr("fill", d3.schemeCategory10[Math.floor(Math.random() * 10)])
                .attr("opacity", 0.6);

            bubble.transition()
                .duration(3000 + Math.random() * 2000)
                .attr("cy", vesselCenterY - 100)
                .attr("opacity", 0)
                .remove();
        }

        setInterval(createBubble, 500);

        // Mobile menu toggle
        document.querySelector('.nav-toggle').addEventListener('click', function() {
            document.querySelector('.nav-links').classList.toggle('active');
        });
    </script>
</body>
</html>
CHAPTER10

# Chapter 11: Mercurius
cat > chapter11-v2.html << 'CHAPTER11'
<\!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chapter 11: Mercurius - Aion by Carl Jung</title>
    <link rel="stylesheet" href="styles-v2.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
    <style>
        .main-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 48px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: flex;
            align-items: center;
            padding: 0 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .nav-home {
            font-size: 1.125rem;
            font-weight: 500;
            color: #fff;
            text-decoration: none;
            margin-right: auto;
        }
        .nav-toggle {
            display: none;
            background: none;
            border: none;
            color: #fff;
            font-size: 1.5rem;
            cursor: pointer;
        }
        .nav-links {
            display: flex;
            gap: 2rem;
        }
        .nav-links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-size: 0.875rem;
            transition: color 0.3s ease;
        }
        .nav-links a:hover {
            color: #fff;
        }
        .chapter-content {
            padding: 6rem 2rem 4rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .chapter-header {
            text-align: center;
            margin-bottom: 4rem;
        }
        .chapter-number {
            font-size: 0.875rem;
            font-weight: 600;
            color: #6B46C1;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .chapter-title {
            font-size: 3.75rem;
            font-weight: 200;
            margin: 1rem 0;
            letter-spacing: -0.02em;
        }
        .chapter-subtitle {
            font-size: 1.25rem;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 300;
        }
        .chapter-intro {
            max-width: 800px;
            margin: 0 auto 4rem;
            font-size: 1.125rem;
            line-height: 1.8;
            color: rgba(255, 255, 255, 0.8);
        }
        .visualization-section {
            margin: 4rem 0;
        }
        .visualization-section h2 {
            font-size: 2rem;
            font-weight: 300;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .visualization-intro {
            max-width: 600px;
            margin: 0 auto 2rem;
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
        }
        .visualization-container {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 2rem;
            margin: 2rem 0;
        }
        .visualization-controls {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
        }
        .visualization-controls button {
            padding: 0.5rem 1.5rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .visualization-controls button:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-1px);
        }
        .visualization-controls button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .content-section {
            margin: 4rem 0;
        }
        .content-section h2 {
            font-size: 2rem;
            font-weight: 300;
            margin-bottom: 2rem;
        }
        .concept-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .concept-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        .concept-card:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
        }
        .concept-card h3 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            color: #9D4EDD;
        }
        .concept-card p {
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
        }
        .insight-list {
            list-style: none;
            padding: 0;
        }
        .insight-list li {
            padding: 1rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
        }
        .insight-list li:last-child {
            border-bottom: none;
        }
        .chapter-nav {
            display: flex;
            justify-content: space-between;
            margin-top: 6rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chapter-nav a {
            color: #9D4EDD;
            text-decoration: none;
            font-size: 0.875rem;
            transition: all 0.3s ease;
        }
        .chapter-nav a:hover {
            color: #B57BFF;
            transform: translateX(±4px);
        }
        .prev-chapter:hover {
            transform: translateX(-4px);
        }
        .next-chapter:hover {
            transform: translateX(4px);
        }
        #bg-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }
        @media (max-width: 768px) {
            .nav-toggle {
                display: block;
            }
            .nav-links {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.95);
                flex-direction: column;
                padding: 1rem;
            }
            .nav-links.active {
                display: flex;
            }
            .chapter-title {
                font-size: 2.5rem;
            }
            .concept-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <nav class="main-nav">
        <a href="index-v2.html" class="nav-home">Aion</a>
        <button class="nav-toggle" aria-label="Toggle navigation">☰</button>
        <div class="nav-links">
            <a href="chapters-v2.html">Chapters</a>
            <a href="timeline-v2.html">Timeline</a>
            <a href="symbols-v2.html">Symbols</a>
            <a href="about-v2.html">About</a>
        </div>
    </nav>

    <main class="chapter-content">
        <div class="chapter-header">
            <div class="chapter-number">Chapter XI</div>
            <h1 class="chapter-title">Mercurius</h1>
            <p class="chapter-subtitle">The Spirit of Transformation</p>
        </div>

        <section class="chapter-intro">
            <p>Jung examines Mercurius as the most paradoxical figure in alchemy—simultaneously divine and demonic, male and female, volatile and fixed. As the spirit of transformation itself, Mercurius represents the dynamic unconscious that drives the individuation process.</p>
        </section>

        <section class="visualization-section">
            <h2>The Dance of Mercurius</h2>
            <div class="visualization-intro">
                <p>This visualization shows Mercurius in constant motion between polarities, embodying the fluid, transformative nature of the psyche.</p>
            </div>
            <div id="mercurius-viz" class="visualization-container"></div>
            <div class="visualization-controls">
                <button id="toggle-flow">Toggle Flow</button>
                <button id="show-aspects">Show All Aspects</button>
                <button id="balance-forces">Balance Forces</button>
            </div>
        </section>

        <section class="content-section">
            <h2>The Many Faces of Mercurius</h2>
            <div class="concept-grid">
                <div class="concept-card">
                    <h3>Quicksilver</h3>
                    <p>The liquid metal that cannot be grasped, representing the elusive nature of the unconscious.</p>
                </div>
                <div class="concept-card">
                    <h3>Hermaphrodite</h3>
                    <p>The union of masculine and feminine, symbolizing psychological wholeness.</p>
                </div>
                <div class="concept-card">
                    <h3>Trickster</h3>
                    <p>The shape-shifter who disrupts consciousness, forcing growth through chaos.</p>
                </div>
                <div class="concept-card">
                    <h3>Mediator</h3>
                    <p>The bridge between opposites, facilitating the transcendent function.</p>
                </div>
            </div>
        </section>

        <section class="visualization-section">
            <h2>The Caduceus of Integration</h2>
            <div id="caduceus-viz" class="visualization-container"></div>
        </section>

        <section class="content-section">
            <h2>Psychological Significance</h2>
            <p>Mercurius embodies essential psychological dynamics:</p>
            <ul class="insight-list">
                <li>The autonomous activity of the unconscious</li>
                <li>The compensatory function that balances conscious attitudes</li>
                <li>The creative spirit that generates new possibilities</li>
                <li>The ambivalent nature of psychological complexes</li>
                <li>The transformative power of accepting paradox</li>
            </ul>
        </section>

        <div class="chapter-nav">
            <a href="chapter10-v2.html" class="prev-chapter">← Chapter 10: The Lapis</a>
            <a href="chapter12-v2.html" class="next-chapter">Chapter 12: The Coniunctio →</a>
        </div>
    </main>

    <canvas id="bg-canvas"></canvas>

    <script>
        // Background shader - mercurial flow
        const canvas = document.getElementById('bg-canvas');
        const gl = canvas.getContext('webgl');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const vertexShaderSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 resolution;
            uniform float time;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                // Mercurial flow pattern
                float flow1 = sin(uv.x * 5.0 + time * 0.5 + sin(uv.y * 3.0 + time * 0.3));
                float flow2 = cos(uv.y * 4.0 - time * 0.4 + cos(uv.x * 6.0 - time * 0.2));
                float mercury = flow1 * flow2;
                
                // Shifting colors
                vec3 color1 = vec3(0.5, 0.5, 0.8); // Mercury blue
                vec3 color2 = vec3(0.8, 0.4, 0.2); // Sulfur orange
                vec3 color = mix(color1, color2, mercury * 0.5 + 0.5);
                
                // Add shimmer
                float shimmer = sin(length(uv - 0.5) * 20.0 - time * 2.0) * 0.1;
                color += shimmer;
                
                gl_FragColor = vec4(color * 0.3, 1.0);
            }
        `;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const resolutionLocation = gl.getUniformLocation(program, 'resolution');
        const timeLocation = gl.getUniformLocation(program, 'time');

        function animate(time) {
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(timeLocation, time * 0.001);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(animate);
        }
        animate(0);

        // Mercurius Flow Visualization
        const mercuriusWidth = 800;
        const mercuriusHeight = 600;

        const mercuriusSvg = d3.select("#mercurius-viz")
            .append("svg")
            .attr("viewBox", `0 0 ${mercuriusWidth} ${mercuriusHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Create flowing particles system
        const particleCount = 100;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * mercuriusWidth,
                y: Math.random() * mercuriusHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 5 + 2,
                color: d3.interpolateRainbow(i / particleCount)
            });
        }

        const particleGroup = mercuriusSvg.append("g").attr("class", "particles");

        const particleElements = particleGroup.selectAll("circle")
            .data(particles)
            .enter()
            .append("circle")
            .attr("r", d => d.size)
            .attr("fill", d => d.color)
            .attr("opacity", 0.7);

        // Central vortex
        const centerX = mercuriusWidth / 2;
        const centerY = mercuriusHeight / 2;

        const vortexGroup = mercuriusSvg.append("g")
            .attr("transform", `translate(${centerX}, ${centerY})`);

        // Create spiral paths
        const spiralCount = 3;
        for (let i = 0; i < spiralCount; i++) {
            const spiral = d3.path();
            const rotOffset = (i * 2 * Math.PI) / spiralCount;
            
            for (let t = 0; t < 100; t++) {
                const angle = t * 0.1 + rotOffset;
                const radius = t * 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (t === 0) spiral.moveTo(x, y);
                else spiral.lineTo(x, y);
            }
            
            vortexGroup.append("path")
                .attr("d", spiral.toString())
                .attr("fill", "none")
                .attr("stroke", d3.interpolateRainbow(i / spiralCount))
                .attr("stroke-width", 2)
                .attr("opacity", 0.5);
        }

        // Aspect symbols
        const aspects = [
            { name: "Sol", symbol: "☉", x: 150, y: 150, color: "#FFD700" },
            { name: "Luna", symbol: "☽", x: 650, y: 150, color: "#C0C0C0" },
            { name: "Sulfur", symbol: "🜍", x: 150, y: 450, color: "#FF6347" },
            { name: "Salt", symbol: "🜔", x: 650, y: 450, color: "#FFFFFF" }
        ];

        const aspectGroup = mercuriusSvg.append("g")
            .attr("class", "aspects")
            .attr("opacity", 0);

        aspects.forEach(aspect => {
            const g = aspectGroup.append("g")
                .attr("transform", `translate(${aspect.x}, ${aspect.y})`);

            g.append("circle")
                .attr("r", 40)
                .attr("fill", aspect.color)
                .attr("fill-opacity", 0.3)
                .attr("stroke", aspect.color)
                .attr("stroke-width", 2);

            g.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("fill", aspect.color)
                .attr("font-size", "24px")
                .text(aspect.symbol);

            g.append("text")
                .attr("text-anchor", "middle")
                .attr("y", 60)
                .attr("fill", "#FFF")
                .attr("font-size", "14px")
                .text(aspect.name);
        });

        // Animation functions
        let flowActive = true;

        function updateParticles() {
            if (\!flowActive) return;

            particles.forEach(p => {
                // Attraction to center
                const dx = centerX - p.x;
                const dy = centerY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 50) {
                    p.vx += dx / dist * 0.1;
                    p.vy += dy / dist * 0.1;
                }
                
                // Circular motion near center
                if (dist < 200) {
                    const angle = Math.atan2(dy, dx);
                    p.vx += Math.cos(angle + Math.PI/2) * 0.2;
                    p.vy += Math.sin(angle + Math.PI/2) * 0.2;
                }
                
                // Update position
                p.x += p.vx;
                p.y += p.vy;
                
                // Damping
                p.vx *= 0.99;
                p.vy *= 0.99;
                
                // Wrap around edges
                if (p.x < 0) p.x = mercuriusWidth;
                if (p.x > mercuriusWidth) p.x = 0;
                if (p.y < 0) p.y = mercuriusHeight;
                if (p.y > mercuriusHeight) p.y = 0;
            });

            particleElements
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            requestAnimationFrame(updateParticles);
        }

        updateParticles();

        // Rotate vortex
        function rotateVortex() {
            vortexGroup
                .transition()
                .duration(20000)
                .ease(d3.easeLinear)
                .attr("transform", `translate(${centerX}, ${centerY}) rotate(360)`)
                .on("end", () => {
                    vortexGroup.attr("transform", `translate(${centerX}, ${centerY}) rotate(0)`);
                    rotateVortex();
                });
        }
        rotateVortex();

        // Controls
        document.getElementById("toggle-flow").addEventListener("click", function() {
            flowActive = \!flowActive;
            if (flowActive) updateParticles();
            this.textContent = flowActive ? "Stop Flow" : "Toggle Flow";
        });

        document.getElementById("show-aspects").addEventListener("click", function() {
            const showing = aspectGroup.attr("opacity") === "0";
            aspectGroup.transition()
                .duration(500)
                .attr("opacity", showing ? 1 : 0);
            this.textContent = showing ? "Hide Aspects" : "Show All Aspects";
        });

        document.getElementById("balance-forces").addEventListener("click", function() {
            particles.forEach(p => {
                p.vx = 0;
                p.vy = 0;
                const angle = Math.random() * Math.PI * 2;
                const radius = 150 + Math.random() * 50;
                p.x = centerX + Math.cos(angle) * radius;
                p.y = centerY + Math.sin(angle) * radius;
            });
        });

        // Caduceus Visualization
        const caduceusWidth = 800;
        const caduceusHeight = 400;

        const caduceusSvg = d3.select("#caduceus-viz")
            .append("svg")
            .attr("viewBox", `0 0 ${caduceusWidth} ${caduceusHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const caduceusCenterX = caduceusWidth / 2;
        const staffHeight = 300;

        // Central staff
        caduceusSvg.append("line")
            .attr("x1", caduceusCenterX)
            .attr("y1", 50)
            .attr("x2", caduceusCenterX)
            .attr("y2", 350)
            .attr("stroke", "#9D4EDD")
            .attr("stroke-width", 4);

        // Intertwining serpents
        const serpentData = [];
        const points = 20;
        for (let i = 0; i <= points; i++) {
            const t = i / points;
            const y = 80 + t * 250;
            serpentData.push({
                left: {
                    x: caduceusCenterX - Math.sin(t * Math.PI * 3) * 50,
                    y: y
                },
                right: {
                    x: caduceusCenterX + Math.sin(t * Math.PI * 3) * 50,
                    y: y
                }
            });
        }

        const lineGenerator = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveBasis);

        // Left serpent
        caduceusSvg.append("path")
            .datum(serpentData.map(d => d.left))
            .attr("d", lineGenerator)
            .attr("fill", "none")
            .attr("stroke", "#FF6347")
            .attr("stroke-width", 3);

        // Right serpent
        caduceusSvg.append("path")
            .datum(serpentData.map(d => d.right))
            .attr("d", lineGenerator)
            .attr("fill", "none")
            .attr("stroke", "#4169E1")
            .attr("stroke-width", 3);

        // Wings at top
        const wingPath = d3.path();
        wingPath.moveTo(caduceusCenterX, 50);
        wingPath.quadraticCurveTo(caduceusCenterX - 80, 30, caduceusCenterX - 100, 60);
        wingPath.quadraticCurveTo(caduceusCenterX - 80, 50, caduceusCenterX, 50);

        caduceusSvg.append("path")
            .attr("d", wingPath.toString())
            .attr("fill", "#FFD700")
            .attr("opacity", 0.7);

        caduceusSvg.append("path")
            .attr("d", wingPath.toString())
            .attr("transform", `translate(${caduceusCenterX * 2}, 0) scale(-1, 1)`)
            .attr("fill", "#FFD700")
            .attr("opacity", 0.7);

        // Central orb
        caduceusSvg.append("circle")
            .attr("cx", caduceusCenterX)
            .attr("cy", 50)
            .attr("r", 15)
            .attr("fill", "#9D4EDD")
            .attr("stroke", "#FFF")
            .attr("stroke-width", 2);

        // Mobile menu toggle
        document.querySelector('.nav-toggle').addEventListener('click', function() {
            document.querySelector('.nav-links').classList.toggle('active');
        });
    </script>
</body>
</html>
CHAPTER11

echo "Chapters 10-11 created successfully"
