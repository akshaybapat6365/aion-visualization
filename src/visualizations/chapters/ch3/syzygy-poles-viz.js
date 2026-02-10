import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Syzygy Poles Visualization — Chapter 3: Anima & Animus
 * Ported to BaseViz (Phase 6 Architecture)
 */
export default class SyzygyPolesViz extends BaseViz {
    constructor(container) {
        super(container);
    }

    async init() {
        this.time = 0;

        // Balance state: 0 = extreme separation, 1 = perfect union
        this.balance = 0.5;
        this.targetBalance = 0.5;

        // Particle streams
        this.streams = [];
        this._initStreams();

        this._createUI();

        // Bind UI events if needed (slider handles itself via closure but better to bind)
    }

    _initStreams() {
        this.streams = [];
        for (let i = 0; i < 120; i++) {
            this.streams.push({
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.7,
                orbit: 0.3 + Math.random() * 0.7,
                side: Math.random() > 0.5 ? 1 : -1,
                size: 1.5 + Math.random() * 2,
            });
        }
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:absolute;inset:0;pointer-events:none;
            font-family:var(--font-sans,system-ui);color:var(--text-tertiary,#8a8a8a);
            opacity: 0; transition: opacity 1s ease;
        `;

        // Balance slider
        const sliderWrap = document.createElement('div');
        sliderWrap.style.cssText = `
            position:absolute;bottom:14%;left:50%;transform:translateX(-50%);
            pointer-events:auto;display:flex;flex-direction:column;align-items:center;gap:6px;
        `;
        const label = document.createElement('span');
        label.style.cssText = 'font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;opacity:0.5;';
        label.textContent = 'balance of opposites';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = '50';
        slider.style.cssText = 'width:180px;accent-color:#d4af37;opacity:0.7;';

        // Use arrow function to allow 'this' access
        slider.addEventListener('input', (e) => {
            this.targetBalance = parseInt(e.target.value) / 100;
        });

        sliderWrap.appendChild(label);
        sliderWrap.appendChild(slider);

        overlay.innerHTML = `
            <span style="position:absolute;top:15%;left:28%;
                font-size:0.65rem;text-transform:uppercase;letter-spacing:0.12em;
                color:#ffd37a;">
                Anima — eros
            </span>
            <span style="position:absolute;top:15%;right:22%;
                font-size:0.65rem;text-transform:uppercase;letter-spacing:0.12em;
                color:#93c5fd;">
                Animus — logos
            </span>
        `;
        overlay.appendChild(sliderWrap);

        this.container.style.position = 'relative';
        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    onScroll(state) {
        // Reveal UI when scrolling into the main content
        if (state.activeSection >= 1) {
            this._overlay.style.opacity = 1;
        } else {
            this._overlay.style.opacity = 0;
        }

        // Subtle influence of scroll on balance if user hasn't touched it?
        // Let's stick to the slider for now, as it's the core metaphor interaction.
    }

    update(dt) {
        this.time += dt;
        // Smooth lerp
        this.balance += (this.targetBalance - this.balance) * 2.0 * dt;
    }

    render() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        const w = W / this.dpr;
        const h = H / this.dpr;
        const cx = w / 2;
        const cy = h / 2;
        const t = this.time;

        ctx.save();
        ctx.scale(this.dpr, this.dpr);

        // Clear
        ctx.fillStyle = '#07070a';
        ctx.fillRect(0, 0, w, h);

        // Separation = how far apart the poles are
        const separation = (1 - this.balance) * (w * 0.32);
        const orbitSpeed = 0.4 + this.balance * 0.6; // faster when balanced

        // Figure-8 orbit positions
        const animaX = cx - separation + Math.cos(t * orbitSpeed) * separation * 0.3;
        const animaY = cy + Math.sin(t * orbitSpeed * 2) * (h * 0.12);
        const animusX = cx + separation + Math.cos(t * orbitSpeed + Math.PI) * separation * 0.3;
        const animusY = cy + Math.sin((t * orbitSpeed + Math.PI) * 2) * (h * 0.12);

        // ─── Mandala pattern (Balanced) ───
        if (this.balance > 0.6) {
            const mandalaOpacity = (this.balance - 0.6) / 0.4;
            ctx.save();
            ctx.globalAlpha = mandalaOpacity * 0.15;
            const rings = 4;
            for (let r = 0; r < rings; r++) {
                const radius = 40 + r * 25;
                const segments = 8 + r * 4;
                ctx.strokeStyle = r % 2 === 0 ? '#d4af37' : '#93c5fd';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                for (let s = 0; s <= segments; s++) {
                    const angle = (s / segments) * Math.PI * 2 + t * 0.2 * (r % 2 === 0 ? 1 : -1);
                    const px = cx + Math.cos(angle) * radius;
                    const py = cy + Math.sin(angle) * radius;
                    s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            }
            ctx.restore();
        }

        // ─── Chaos particles (Imbalanced) ───
        if (this.balance < 0.4) {
            const chaosIntensity = (0.4 - this.balance) / 0.4;
            ctx.save();
            ctx.globalAlpha = chaosIntensity * 0.3;
            for (let i = 0; i < 30; i++) {
                const angle = t * (1 + i * 0.3) + i * 0.7;
                const dist = 30 + Math.sin(t * 2 + i) * 60 * chaosIntensity;
                const px = cx + Math.cos(angle) * dist;
                const py = cy + Math.sin(angle) * dist;
                ctx.fillStyle = i % 2 === 0 ? '#ffd37a' : '#93c5fd';
                ctx.beginPath();
                ctx.arc(px, py, 1.5 + chaosIntensity * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // ─── Particle streams between poles ───
        this.streams.forEach(p => {
            const phase = p.phase + t * p.speed;
            const lerp = (Math.sin(phase) + 1) / 2; // 0→1 cycle

            // Interpolate between anima and animus positions
            const px = animaX + (animusX - animaX) * lerp + Math.sin(phase * 3) * p.orbit * 20;
            const py = animaY + (animusY - animaY) * lerp + Math.cos(phase * 2) * p.orbit * 15;

            // Color shifts from warm to cool as particle moves between poles
            const r = Math.round(255 * (1 - lerp) + 147 * lerp);
            const g = Math.round(211 * (1 - lerp) + 197 * lerp);
            const b = Math.round(55 * (1 - lerp) + 253 * lerp);

            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // ─── Infinity loop path ───
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            const ix = cx + Math.cos(angle) * separation * 0.8;
            const iy = cy + Math.sin(angle * 2) * (h * 0.12);
            i === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy);
        }
        ctx.stroke();
        ctx.restore();

        // ─── Anima pole (warm gold) ───
        const animaRadius = 18 + Math.sin(t * 1.5) * 3;
        const glowA = ctx.createRadialGradient(animaX, animaY, 0, animaX, animaY, animaRadius * 3);
        glowA.addColorStop(0, 'rgba(255, 211, 122, 0.3)');
        glowA.addColorStop(0.5, 'rgba(212, 175, 55, 0.08)');
        glowA.addColorStop(1, 'transparent');
        ctx.fillStyle = glowA;
        ctx.fillRect(animaX - animaRadius * 3, animaY - animaRadius * 3, animaRadius * 6, animaRadius * 6);

        ctx.fillStyle = '#ffd37a';
        ctx.beginPath();
        ctx.arc(animaX, animaY, animaRadius, 0, Math.PI * 2);
        ctx.fill();

        // ─── Animus pole (cool blue) ───
        const animusRadius = 18 + Math.cos(t * 1.5) * 3;
        const glowB = ctx.createRadialGradient(animusX, animusY, 0, animusX, animusY, animusRadius * 3);
        glowB.addColorStop(0, 'rgba(147, 197, 253, 0.3)');
        glowB.addColorStop(0.5, 'rgba(96, 165, 250, 0.08)');
        glowB.addColorStop(1, 'transparent');
        ctx.fillStyle = glowB;
        ctx.fillRect(animusX - animusRadius * 3, animusY - animusRadius * 3, animusRadius * 6, animusRadius * 6);

        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.arc(animusX, animusY, animusRadius, 0, Math.PI * 2);
        ctx.fill();

        // ─── Balance state label ───
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#8a8a8a';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        const stateLabel = this.balance > 0.7 ? 'integration — harmony'
            : this.balance > 0.4 ? 'dynamic tension'
                : 'one-sided — chaotic';
        ctx.fillText(stateLabel, cx, h * 0.91);
        ctx.restore();

        ctx.restore();
    }

    destroy() {
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
