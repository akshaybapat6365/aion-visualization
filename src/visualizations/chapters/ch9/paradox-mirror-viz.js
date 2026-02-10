
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Paradox Mirror — Chapter 9: The Ambivalence of the Fish Symbol
 * Refactored to extend BaseViz for Phase 6 Architecture.
 */
export default class ParadoxMirrorViz extends BaseViz {
    constructor(container) {
        super(container);
        this.balance = 0.5; // 0=full dark, 1=full light
        this.targetBalance = 0.5;
        this._isDragging = false;

        // Particles for each domain
        this.particles = [];
        for (let i = 0; i < 60; i++) {
            this.particles.push({
                x: Math.random(), y: Math.random(),
                vx: (Math.random() - 0.5) * 0.002,
                vy: (Math.random() - 0.5) * 0.002,
                side: i < 30 ? 'light' : 'dark',
                size: 1 + Math.random() * 2,
            });
        }

        this._onMouseDown = (e) => {
            this._isDragging = true;
            this.container.style.cursor = 'grabbing';
        };
        this._onMouseUp = () => {
            this._isDragging = false;
            this.container.style.cursor = 'grab';
        };
        this._onMouseMove = (e) => {
            if (!this._isDragging) return;
            const rect = this.container.getBoundingClientRect();
            this.targetBalance = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
        };
    }

    async init() {
        this.container.style.cursor = 'grab';

        // Bind events to container, not canvas, for better hit testing
        this.container.addEventListener('mousedown', this._onMouseDown);
        this.container.addEventListener('mouseup', this._onMouseUp);
        this.container.addEventListener('mouseleave', this._onMouseUp);
        this.container.addEventListener('mousemove', this._onMouseMove);

        this._createUI();
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position:absolute;inset:0;pointer-events:none;
          font-family:var(--font-sans,system-ui);color:var(--text-tertiary,#8a8a8a);
        `;
        overlay.innerHTML = `
          <span style="position:absolute;top:10%;left:50%;transform:translateX(-50%);
            font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#e74c3c;">
            Paradox Mirror — Ambivalence of the Fish
          </span>
          <span style="position:absolute;bottom:10%;left:50%;transform:translateX(-50%);
            font-size:0.55rem;opacity:0.3;">drag left/right to tilt the balance</span>
        `;
        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    update(dt) {
        this.time += dt * 0.5;
        // Smooth balance transition
        this.balance += (this.targetBalance - this.balance) * 0.06;
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        const w = width / this.dpr;
        const h = height / this.dpr;
        const cx = w / 2;
        const cy = h / 2;
        const t = this.time;
        const bal = this.balance;

        // Background gradient shifts with balance
        const bg = ctx.createLinearGradient(0, 0, w, 0);
        bg.addColorStop(0, `rgba(${Math.round(212 * (1 - bal))}, ${Math.round(175 * (1 - bal))}, ${Math.round(55 * (1 - bal))}, 0.08)`);
        bg.addColorStop(1, `rgba(${Math.round(34 * bal)}, ${Math.round(211 * bal)}, ${Math.round(238 * bal)}, 0.08)`);
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Mirror line — position shifts with balance
        const mirrorX = w * bal;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(mirrorX, 20);
        ctx.lineTo(mirrorX, h - 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Fulcrum
        ctx.beginPath();
        ctx.arc(mirrorX, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();

        // Left fish (light)
        const leftFishX = mirrorX * 0.5;
        const bob1 = Math.sin(t * 0.7) * 8;
        this._drawFish(ctx, leftFishX, cy + bob1, Math.min(w, h) * 0.12, 1, '#d4af37', bal);
        ctx.fillStyle = `rgba(212,175,55,${0.3 + bal * 0.3})`;
        ctx.font = '8px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Light', leftFishX, cy + Math.min(w, h) * 0.12 + 30);

        // Right fish (dark)
        const rightFishX = mirrorX + (w - mirrorX) * 0.5;
        const bob2 = Math.sin(t * 0.7 + Math.PI) * 8;
        this._drawFish(ctx, rightFishX, cy + bob2, Math.min(w, h) * 0.12, -1, '#22d3ee', 1 - bal);
        ctx.fillStyle = `rgba(34,211,238,${0.3 + (1 - bal) * 0.3})`;
        ctx.font = '8px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Shadow', rightFishX, cy + Math.min(w, h) * 0.12 + 30);

        // Domain particles
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > 1) p.vx *= -1;
            if (p.y < 0 || p.y > 1) p.vy *= -1;
            p.x = Math.max(0, Math.min(1, p.x));
            p.y = Math.max(0, Math.min(1, p.y));

            const px = p.x * w;
            const py = p.y * h;
            const isLeft = px < mirrorX;

            let alpha;
            if (p.side === 'light') {
                alpha = isLeft ? 0.4 * bal : 0.1;
            } else {
                alpha = !isLeft ? 0.4 * (1 - bal) : 0.1;
            }

            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.side === 'light'
                ? `rgba(212,175,55,${alpha})`
                : `rgba(34,211,238,${alpha})`;
            ctx.fill();
        }

        ctx.restore();
    }

    _drawFish(ctx, x, y, size, dir, color, intensity) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(dir, 1);
        ctx.globalAlpha = 0.3 + intensity * 0.7;

        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.quadraticCurveTo(0, -size * 0.65, -size, 0);
        ctx.quadraticCurveTo(0, size * 0.65, size, 0);

        ctx.fillStyle = color + '30';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(size * 0.35, -size * 0.1, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    destroy() {
        this.container.removeEventListener('mousedown', this._onMouseDown);
        this.container.removeEventListener('mouseup', this._onMouseUp);
        this.container.removeEventListener('mouseleave', this._onMouseUp);
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.style.cursor = '';
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
