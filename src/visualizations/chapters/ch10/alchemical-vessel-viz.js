/**
 * Alchemical Vessel — Chapter 10: The Fish in Alchemy
 *
 * A 4-stage alchemical vessel showing the opus transformation:
 *   nigredo (black) → albedo (white) → citrinitas (yellow) → rubedo (red)
 *
 * Click the vessel to advance through stages. Each stage shows
 * different colored particles bubbling and transforming within.
 *
 * Self-contained Canvas 2D — no dependencies.
 */

export default class AlchemicalVesselViz {
    constructor(container) {
        this.container = container;
        this.running = true;
        this.time = 0;
        this.stage = 0; // 0-3
        this.stageProgress = 0;

        this.stages = [
            { name: 'Nigredo', color: '#1a1a2e', accent: '#555555', particles: '#888888', desc: 'Dissolution — the prima materia blackens' },
            { name: 'Albedo', color: '#2d2d44', accent: '#c0c0c0', particles: '#e0e0e0', desc: 'Purification — the whitening of the soul' },
            { name: 'Citrinitas', color: '#2d2a1a', accent: '#d4af37', particles: '#ffd37a', desc: 'Illumination — the dawning of solar consciousness' },
            { name: 'Rubedo', color: '#2e1a1a', accent: '#c0392b', particles: '#e74c3c', desc: 'Completion — the philosopher\'s stone achieved' },
        ];

        const w = container.clientWidth || 600;
        const h = container.clientHeight || 450;
        this.dpr = Math.min(window.devicePixelRatio, 2);

        this.canvas = document.createElement('canvas');
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.cssText = `width:${w}px;height:${h}px;display:block;cursor:pointer;`;
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Bubbles
        this.bubbles = [];
        for (let i = 0; i < 40; i++) {
            this.bubbles.push({
                x: 0.3 + Math.random() * 0.4,
                y: 0.6 + Math.random() * 0.3,
                r: 1 + Math.random() * 3,
                speed: 0.2 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
            });
        }

        this._onClick = () => {
            this.stage = (this.stage + 1) % 4;
            this.stageProgress = 0;
        };
        this.canvas.addEventListener('click', this._onClick);

        this._onResize = () => {
            const nw = container.clientWidth, nh = container.clientHeight;
            this.canvas.width = nw * this.dpr;
            this.canvas.height = nh * this.dpr;
            this.canvas.style.width = nw + 'px';
            this.canvas.style.height = nh + 'px';
        };
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
        this._stageLabel = document.createElement('span');
        this._stageLabel.style.cssText = `
      position:absolute;top:5%;left:50%;transform:translateX(-50%);
      font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;
      transition:color 0.5s;
    `;
        this._descLabel = document.createElement('span');
        this._descLabel.style.cssText = `
      position:absolute;top:10%;left:50%;transform:translateX(-50%);
      font-size:0.55rem;opacity:0.4;transition:opacity 0.5s;
    `;
        overlay.appendChild(this._stageLabel);
        overlay.appendChild(this._descLabel);

        const hint = document.createElement('span');
        hint.style.cssText = `
      position:absolute;bottom:5%;left:50%;transform:translateX(-50%);
      font-size:0.55rem;opacity:0.3;
    `;
        hint.textContent = 'click vessel to advance transformation';
        overlay.appendChild(hint);

        // Stage dots
        const dotsWrap = document.createElement('div');
        dotsWrap.style.cssText = `
      position:absolute;bottom:10%;left:50%;transform:translateX(-50%);
      display:flex;gap:8px;
    `;
        this._dots = [];
        for (let i = 0; i < 4; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
        width:8px;height:8px;border-radius:50%;
        border:1px solid rgba(255,255,255,0.2);
        transition:background 0.3s;
      `;
            dotsWrap.appendChild(dot);
            this._dots.push(dot);
        }
        overlay.appendChild(dotsWrap);

        this.container.style.position = 'relative';
        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    _animate() {
        if (!this.running) return;
        requestAnimationFrame(() => this._animate());
        this.time += 0.016;
        this.stageProgress = Math.min(1, this.stageProgress + 0.01);
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
        const s = this.stages[this.stage];

        // Background
        ctx.fillStyle = s.color;
        ctx.fillRect(0, 0, w, h);

        // Update UI
        this._stageLabel.style.color = s.accent;
        this._stageLabel.textContent = s.name;
        this._descLabel.textContent = s.desc;
        this._dots.forEach((dot, i) => {
            dot.style.background = i === this.stage ? s.accent : 'transparent';
        });

        // Vessel body — flask shape
        const vw = w * 0.35;
        const vh = h * 0.55;
        const vx = cx - vw / 2;
        const vy = cy - vh * 0.35;

        // Flask neck
        const neckW = vw * 0.3;
        const neckH = vh * 0.2;
        ctx.beginPath();
        ctx.moveTo(cx - neckW / 2, vy);
        ctx.lineTo(cx - neckW / 2, vy - neckH);
        ctx.arc(cx, vy - neckH, neckW / 2, Math.PI, 0);
        ctx.lineTo(cx + neckW / 2, vy);
        ctx.strokeStyle = s.accent + '60';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Flask body (rounded bottom)
        ctx.beginPath();
        ctx.moveTo(cx - neckW / 2, vy);
        ctx.quadraticCurveTo(vx - 10, vy + vh * 0.3, vx, vy + vh * 0.7);
        ctx.quadraticCurveTo(vx + vw * 0.1, vy + vh, cx, vy + vh);
        ctx.quadraticCurveTo(vx + vw * 0.9, vy + vh, vx + vw, vy + vh * 0.7);
        ctx.quadraticCurveTo(vx + vw + 10, vy + vh * 0.3, cx + neckW / 2, vy);
        ctx.strokeStyle = s.accent + '40';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Liquid fill — rises with stageProgress
        const fillH = vh * 0.6 * this.stageProgress;
        const fillY = vy + vh - fillH;

        const liquidGrad = ctx.createLinearGradient(cx, fillY, cx, vy + vh);
        liquidGrad.addColorStop(0, s.particles + '30');
        liquidGrad.addColorStop(1, s.particles + '60');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(vx + 5, fillY);
        // Wavy top
        for (let px = vx + 5; px <= vx + vw - 5; px += 2) {
            const wave = Math.sin((px - vx) * 0.05 + t * 3) * 3;
            ctx.lineTo(px, fillY + wave);
        }
        ctx.lineTo(vx + vw - 5, vy + vh);
        ctx.lineTo(vx + 5, vy + vh);
        ctx.closePath();
        ctx.fillStyle = liquidGrad;
        ctx.fill();
        ctx.restore();

        // Bubbles
        for (const b of this.bubbles) {
            b.y -= b.speed * 0.002;
            if (b.y < 0.35) b.y = 0.85 + Math.random() * 0.1;

            const bx = b.x * w + Math.sin(t * 2 + b.phase) * 5;
            const by = b.y * h;

            if (by > fillY && by < vy + vh && bx > vx + 10 && bx < vx + vw - 10) {
                ctx.beginPath();
                ctx.arc(bx, by, b.r, 0, Math.PI * 2);
                ctx.fillStyle = s.particles + '40';
                ctx.fill();
            }
        }

        // Fire beneath vessel
        for (let i = 0; i < 12; i++) {
            const fx = cx + (Math.random() - 0.5) * vw * 0.6;
            const fy = vy + vh + 5 + Math.random() * 15;
            const fSize = 2 + Math.random() * 4;
            const flicker = Math.sin(t * 5 + i * 3) * 0.3 + 0.5;
            ctx.beginPath();
            ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(230,126,34,${flicker * 0.5})`;
            ctx.fill();
        }

        ctx.restore();
    }

    pause() { this.running = false; }
    resume() { this.running = true; this._animate(); }
    dispose() {
        this.running = false;
        this.canvas.removeEventListener('click', this._onClick);
        window.removeEventListener('resize', this._onResize);
        if (this._overlay) this._overlay.remove();
        if (this.canvas.parentElement) this.canvas.remove();
    }
}
