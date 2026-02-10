import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Shadow Projection Visualization — Chapter 2: The Shadow
 * Ported to BaseViz (Phase 6 Architecture)
 */
export default class ShadowProjectionViz extends BaseViz {
    constructor(container) {
        super(container);
    }

    async init() {
        this.time = 0;
        // State
        this.selfCenter = { x: 0.25, y: 0.5 };
        this.projectionTarget = { x: 0.78, y: 0.5 };
        this.integrationLevel = 0;
        this.shadowParticles = [];
        this.dragging = null;
        this.selfColors = ['#d4af37'];
        this.scrollInfluence = 0;

        // Color palette
        this._integrationColors = [
            '#22d3ee', '#8b5cf6', '#ef4444', '#10b981',
            '#f59e0b', '#ec4899', '#6366f1', '#14b8a6',
        ];

        this._initParticles();
        this._createLabels();

        // Bind handlers and add listeners
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onMouseDown = this._handleMouseDown.bind(this);
        this._onMouseUp = this._handleMouseUp.bind(this);

        this.container.addEventListener('mousemove', this._onMouseMove);
        this.container.addEventListener('mousedown', this._onMouseDown);
        this.container.addEventListener('mouseup', this._onMouseUp);
        this.container.addEventListener('mouseleave', this._onMouseUp);
    }

    _initParticles() {
        const count = 8;
        this.shadowParticles = [];
        for (let i = 0; i < count; i++) {
            this.shadowParticles.push({
                x: 0.18 + Math.random() * 0.08,
                y: 0.3 + Math.random() * 0.4,
                radius: 8 + Math.random() * 6,
                color: `hsl(${240 + Math.random() * 40}, 30%, ${25 + Math.random() * 15}%)`,
                glow: `hsl(${260 + Math.random() * 30}, 50%, 40%)`,
                integrated: false,
                wobble: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5,
            });
        }
    }

    _createLabels() {
        // We reuse the overlay logic but ensure it is cleaned up in destroy()
        this._overlay = document.createElement('div');
        this._overlay.style.cssText = `
            position:absolute;inset:0;pointer-events:none;
            font-family:var(--font-sans,system-ui);color:var(--text-tertiary,#8a8a8a);
            opacity: 0; transition: opacity 1s ease;
        `;
        this._overlay.innerHTML = `
            <span style="position:absolute;top:15%;left:25%;transform:translateX(-50%);
                font-size:0.65rem;text-transform:uppercase;letter-spacing:0.12em;
                color:var(--color-accent-light,#ffd37a);">
                Conscious Self
            </span>
            <span style="position:absolute;top:15%;right:15%;
                font-size:0.65rem;text-transform:uppercase;letter-spacing:0.12em;">
                Projection Surface
            </span>
        `;
        this.container.appendChild(this._overlay);
    }

    // Called by VizController on Scroll
    onScroll(state) {
        // state = { globalProgress, activeSection, sectionProgress }
        // We can use this to reveal the labels or dim the background

        // Example: Only show labels when near the interactive section (e.g. section 3)
        // Or just map global opacity
        if (state.activeSection >= 2) {
            this._overlay.style.opacity = 1;
        } else {
            this._overlay.style.opacity = 0;
        }

        // Map scroll to some "tension"
        this.scrollInfluence = state.sectionProgress;
    }

    update(dt) {
        this.time += dt;

        // Animate particles
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;

        this.shadowParticles.forEach((p, i) => {
            if (p.integrated) return;

            // Wobble when not dragging
            if (this.dragging !== i) {
                p.y += Math.sin(this.time * p.speed + p.wobble) * 0.0003 * 60 * dt; // Scale for dt
                p.x += Math.cos(this.time * p.speed * 0.7 + p.wobble) * 0.0002 * 60 * dt;
            }
        });
    }

    render() {
        // console.log('[ShadowViz] render', !!this.selfCenter);
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        const w = W / this.dpr;
        const h = H / this.dpr;

        // Clear
        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        ctx.clearRect(0, 0, w, h);

        // Calculate layout positions based on container size
        const selfX = this.selfCenter.x * w;
        const selfY = this.selfCenter.y * h;
        const projX = this.projectionTarget.x * w;
        const projY = this.projectionTarget.y * h;

        // ─── Projection beam ───
        const beamOpacity = Math.max(0.03, 0.3 * (1 - this.integrationLevel));

        ctx.save();
        const beamGrad = ctx.createLinearGradient(selfX, selfY, projX, projY);
        beamGrad.addColorStop(0, `rgba(212, 175, 55, ${beamOpacity})`);
        beamGrad.addColorStop(0.5, `rgba(212, 175, 55, ${beamOpacity * 0.5})`);
        beamGrad.addColorStop(1, `rgba(140, 100, 40, ${beamOpacity * 0.3})`);
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(selfX, selfY - 5);
        ctx.lineTo(projX, projY - h * 0.25);
        ctx.lineTo(projX, projY + h * 0.25);
        ctx.lineTo(selfX, selfY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // ─── Projection surface (right) ───
        ctx.save();
        const surfaceX = projX - 10;
        const surfaceGrad = ctx.createLinearGradient(surfaceX, 0, surfaceX + 40, 0);
        surfaceGrad.addColorStop(0, 'rgba(255,255,255,0.02)');
        surfaceGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = surfaceGrad;
        ctx.fillRect(surfaceX, h * 0.15, 40, h * 0.7);

        // Projected shadow shapes (distorted)
        const unintegrated = this.shadowParticles.filter(p => !p.integrated);
        unintegrated.forEach((p, i) => {
            const py = h * 0.3 + (i / (unintegrated.length || 1)) * h * 0.4;
            const size = p.radius * (2.5 - this.integrationLevel);
            const distortion = Math.sin(this.time * p.speed + p.wobble) * 5;

            ctx.save();
            ctx.globalAlpha = 0.4 * (1 - this.integrationLevel);
            ctx.fillStyle = '#1a1030';
            ctx.shadowColor = p.glow;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            for (let a = 0; a < Math.PI * 2; a += 0.3) {
                const r = size + Math.sin(a * 3 + this.time) * distortion;
                const bx = surfaceX + 15 + Math.cos(a) * r;
                const by = py + Math.sin(a) * r * 1.5;
                a === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        ctx.restore();

        // ─── Self figure (left) ───
        ctx.save();
        this.selfColors.forEach((color, i) => {
            const size = 40 + i * 4 + Math.sin(this.time * 0.8 + i) * 3;
            const grad = ctx.createRadialGradient(selfX, selfY, 0, selfX, selfY, size);
            grad.addColorStop(0, color + '44');
            grad.addColorStop(0.5, color + '18');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(selfX - size, selfY - size, size * 2, size * 2);
        });

        // Silhouette
        ctx.fillStyle = '#d4af37';
        ctx.globalAlpha = 0.7 + this.integrationLevel * 0.3;
        ctx.beginPath();
        ctx.arc(selfX, selfY - 22, 8 + this.integrationLevel * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(selfX, selfY + 5, 6 + this.integrationLevel * 3, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ─── Shadow particles ───
        this.shadowParticles.forEach((p, i) => {
            if (p.integrated) return;
            const px = p.x * w;
            const py = p.y * h;

            ctx.save();
            ctx.shadowColor = p.glow;
            ctx.shadowBlur = 12;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(px, py, p.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner highlight
            ctx.shadowBlur = 0;
            ctx.fillStyle = p.glow;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(px - p.radius * 0.2, py - p.radius * 0.2, p.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.restore();
    }

    // Interaction Handlers
    _handleMouseDown(e) {
        const { x, y } = this._canvasMouse(e);
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;

        for (let i = this.shadowParticles.length - 1; i >= 0; i--) {
            const p = this.shadowParticles[i];
            if (p.integrated) continue;

            // Map p.x (normalized) to pixels
            const px = p.x * w;
            const py = p.y * h;

            const dx = x - px;
            const dy = y - py;

            if (Math.sqrt(dx * dx + dy * dy) < p.radius * 2.5) {
                this.dragging = i;
                return;
            }
        }
    }

    _handleMouseMove(e) {
        if (this.dragging === null) return;
        const { x, y } = this._canvasMouse(e);
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;

        const p = this.shadowParticles[this.dragging];
        p.x = x / w;
        p.y = y / h;
    }

    _handleMouseUp() {
        if (this.dragging === null) return;
        const p = this.shadowParticles[this.dragging];

        // Check integration (distance to self)
        const dx = p.x - this.selfCenter.x;
        const dy = p.y - this.selfCenter.y;

        if (Math.sqrt(dx * dx + dy * dy) < 0.1) {
            p.integrated = true;
            const intCount = this.shadowParticles.filter(sp => sp.integrated).length;
            this.integrationLevel = intCount / this.shadowParticles.length;
            if (intCount <= this._integrationColors.length) {
                this.selfColors.push(this._integrationColors[intCount - 1]);
            }
        }
        this.dragging = null;
    }

    _canvasMouse(e) {
        // BaseViz provides this.container
        const rect = this.container.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    destroy() {
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('mousedown', this._onMouseDown);
        this.container.removeEventListener('mouseup', this._onMouseUp);
        this.container.removeEventListener('mouseleave', this._onMouseUp);
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
