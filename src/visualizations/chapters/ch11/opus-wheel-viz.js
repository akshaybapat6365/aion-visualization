/**
 * Opus Wheel — Chapter 11: The Alchemical Interpretation of the Fish
 *
 * Circular process diagram showing the alchemical opus stages as
 * a wheel. Animated material flows between stages in a continuous
 * cycle. Hover each stage for a description of the process.
 *
 * Self-contained Canvas 2D — no dependencies.
 */

export default class OpusWheelViz {
    constructor(container) {
        this.container = container;
        this.running = true;
        this.time = 0;
        this.mouse = { x: 0, y: 0 };
        this.hoveredStage = -1;

        this.stages = [
            { name: 'Calcinatio', color: '#e74c3c', desc: 'Burning away impurities — the fire of spiritual trial' },
            { name: 'Solutio', color: '#3498db', desc: 'Dissolving rigid structures — the water of the unconscious' },
            { name: 'Coagulatio', color: '#27ae60', desc: 'Solidifying new form — incarnation of spirit into matter' },
            { name: 'Sublimatio', color: '#9b59b6', desc: 'Rising of the volatile — spirit ascending from matter' },
            { name: 'Mortificatio', color: '#555555', desc: 'Death of the old form — the nigredo\'s necessary darkness' },
            { name: 'Separatio', color: '#e67e22', desc: 'Dividing elements — distinguishing what is from what seems' },
            { name: 'Coniunctio', color: '#d4af37', desc: 'Sacred marriage — union of opposites into the lapis' },
        ];

        const w = container.clientWidth || 600;
        const h = container.clientHeight || 450;
        this.dpr = Math.min(window.devicePixelRatio, 2);

        this.canvas = document.createElement('canvas');
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.cssText = `width:${w}px;height:${h}px;display:block;`;
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this._onMouseMove = (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        };
        this._onResize = () => {
            const nw = container.clientWidth, nh = container.clientHeight;
            this.canvas.width = nw * this.dpr;
            this.canvas.height = nh * this.dpr;
            this.canvas.style.width = nw + 'px';
            this.canvas.style.height = nh + 'px';
        };
        container.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('resize', this._onResize);
        this._createUI();
        this._animate();
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position:absolute;inset:0;pointer-events:none;
      font-family:var(--font-sans,system-ui);color:var(--text-tertiary,#8a8a8a);
    `;
        overlay.innerHTML = `
      <span style="position:absolute;top:5%;left:50%;transform:translateX(-50%);
        font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#d4af37;">
        Opus Wheel — The Alchemical Process
      </span>
    `;
        this._infoEl = document.createElement('div');
        this._infoEl.style.cssText = `
      position:absolute;bottom:8%;left:50%;transform:translateX(-50%);
      font-size:0.6rem;text-align:center;max-width:280px;opacity:0;
      transition:opacity 0.3s;color:#ccc;
    `;
        overlay.appendChild(this._infoEl);
        this.container.style.position = 'relative';
        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    _animate() {
        if (!this.running) return;
        requestAnimationFrame(() => this._animate());
        this.time += 0.016;
        this._draw();
    }

    _draw() {
        const ctx = this.ctx;
        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;
        const cx = w / 2, cy = h / 2;
        const t = this.time;
        const radius = Math.min(w, h) * 0.32;
        const count = this.stages.length;
        const sliceAngle = (Math.PI * 2) / count;

        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        this.hoveredStage = -1;

        // Draw stages
        for (let i = 0; i < count; i++) {
            const angle = i * sliceAngle - Math.PI / 2;
            const nx = cx + Math.cos(angle) * radius;
            const ny = cy + Math.sin(angle) * radius;
            const s = this.stages[i];

            // Hover detection
            const dist = Math.sqrt((this.mouse.x - nx) ** 2 + (this.mouse.y - ny) ** 2);
            const isHovered = dist < 28;
            if (isHovered) this.hoveredStage = i;

            const rSize = isHovered ? 20 : 14;
            const pulse = 1 + Math.sin(t * 2 + i) * 0.08;

            // Glow
            const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, rSize * 2);
            glow.addColorStop(0, s.color + '30');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(nx - rSize * 2, ny - rSize * 2, rSize * 4, rSize * 4);

            // Node
            ctx.beginPath();
            ctx.arc(nx, ny, rSize * pulse, 0, Math.PI * 2);
            ctx.fillStyle = s.color + (isHovered ? '80' : '40');
            ctx.fill();
            ctx.strokeStyle = s.color;
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.stroke();

            // Label
            ctx.fillStyle = isHovered ? '#fff' : 'rgba(200,200,200,0.5)';
            ctx.font = `${isHovered ? 8 : 7}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillText(s.name, nx, ny + rSize + 14);

            // Connecting arc to next
            const nextAngle = ((i + 1) % count) * sliceAngle - Math.PI / 2;
            const nnx = cx + Math.cos(nextAngle) * radius;
            const nny = cy + Math.sin(nextAngle) * radius;

            ctx.strokeStyle = s.color + '25';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(nnx, nny);
            ctx.stroke();
        }

        // Flowing particles around the wheel
        for (let i = 0; i < 15; i++) {
            const pAngle = (t * 0.3 + i * (Math.PI * 2) / 15) % (Math.PI * 2);
            const px = cx + Math.cos(pAngle - Math.PI / 2) * radius;
            const py = cy + Math.sin(pAngle - Math.PI / 2) * radius;
            const stageIdx = Math.floor((pAngle / (Math.PI * 2)) * count) % count;
            const alpha = 0.3 + Math.sin(t + i) * 0.15;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.stages[stageIdx].color + Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.fill();
        }

        // Center — Lapis/Stone
        const stoneGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
        stoneGlow.addColorStop(0, 'rgba(212,175,55,0.2)');
        stoneGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = stoneGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,175,55,0.4)';
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(212,175,55,0.5)';
        ctx.font = '6px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('LAPIS', cx, cy + 20);

        // Info panel
        if (this.hoveredStage >= 0) {
            const s = this.stages[this.hoveredStage];
            this._infoEl.innerHTML = `<strong style="color:${s.color}">${s.name}</strong><br>${s.desc}`;
            this._infoEl.style.opacity = '1';
        } else {
            this._infoEl.style.opacity = '0';
        }

        ctx.restore();
    }

    pause() { this.running = false; }
    resume() { this.running = true; this._animate(); }
    dispose() {
        this.running = false;
        this.container.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('resize', this._onResize);
        if (this._overlay) this._overlay.remove();
        if (this.canvas.parentElement) this.canvas.remove();
    }
}
