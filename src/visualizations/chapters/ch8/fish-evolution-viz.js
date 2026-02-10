
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Fish Symbol Evolution — Chapter 8: Historical Significance of the Fish
 * Refactored to extend BaseViz for Phase 6 Architecture.
 */
export default class FishEvolutionViz extends BaseViz {
    constructor(container) {
        super(container);
        this.leftRevealed = false;
        this.rightRevealed = false;

        this._onClick = (e) => {
            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const w = rect.width;
            if (x < w / 2) this.leftRevealed = !this.leftRevealed;
            else this.rightRevealed = !this.rightRevealed;
        };
    }

    async init() {
        // Ensure cursor indicates interactivity
        this.container.style.cursor = 'pointer';
        this.container.addEventListener('click', this._onClick);
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
            font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#d4af37;">
            Fish Symbol — Historical Inversion
          </span>
          <span style="position:absolute;bottom:10%;left:50%;transform:translateX(-50%);
            font-size:0.55rem;opacity:0.3;">click each side to reveal hidden aspect</span>
        `;
        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    update(dt) {
        this.time += dt * 0.5;
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

        // Clear
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        // Central dividing axis
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(cx, 30);
        ctx.lineTo(cx, h - 30);
        ctx.stroke();
        ctx.setLineDash([]);

        // Axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '7px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('INVERSION POINT', cx, 22);
        ctx.fillText('~1000 AD', cx, h - 18);

        // Left fish — First millennium (Christ)
        const leftX = cx * 0.5;
        const fishSize = Math.min(w, h) * 0.15;
        const bob1 = Math.sin(t * 0.8) * 5;
        this._drawLargeFish(ctx, leftX, cy + bob1, fishSize, -1,
            this.leftRevealed ? '#c0392b' : '#d4af37',
            this.leftRevealed ? 'Shadow Within' : 'Christ — Light',
            t);

        // Right fish — Second millennium (Antichrist)
        const rightX = cx * 1.5;
        const bob2 = Math.sin(t * 0.8 + Math.PI) * 5;
        this._drawLargeFish(ctx, rightX, cy + bob2, fishSize, 1,
            this.rightRevealed ? '#d4af37' : '#22d3ee',
            this.rightRevealed ? 'Light Within' : 'Antichrist — Shadow',
            t);

        // Era labels
        ctx.font = '8px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(212,175,55,0.4)';
        ctx.fillText('First Millennium', leftX, cy + fishSize + 45);
        ctx.fillStyle = 'rgba(34,211,238,0.4)';
        ctx.fillText('Second Millennium', rightX, cy + fishSize + 45);

        // Connecting energy streams
        for (let i = 0; i < 8; i++) {
            const progress = ((t * 0.3 + i * 0.125) % 1);
            const px = leftX + (rightX - leftX) * progress;
            const py = cy + Math.sin(progress * Math.PI * 3 + t) * 15;
            const alpha = Math.sin(progress * Math.PI) * 0.15;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,180,200,${alpha})`;
            ctx.fill();
        }

        ctx.restore();
    }

    _drawLargeFish(ctx, x, y, size, direction, color, label, t) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(direction, 1);

        // Body (vesica)
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.quadraticCurveTo(0, -size * 0.7, -size, 0);
        ctx.quadraticCurveTo(0, size * 0.7, size, 0);

        // Body fill with gradient
        const grad = ctx.createLinearGradient(-size, 0, size, 0);
        grad.addColorStop(0, color + '20');
        grad.addColorStop(0.5, color + '40');
        grad.addColorStop(1, color + '10');
        ctx.fillStyle = grad;
        ctx.fill();

        // Outline
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Eye
        const pulse = 1 + Math.sin(t * 2) * 0.2;
        ctx.beginPath();
        ctx.arc(size * 0.4, -size * 0.1, 3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(-size * 1.3, -size * 0.3);
        ctx.lineTo(-size * 1.3, size * 0.3);
        ctx.closePath();
        ctx.fillStyle = color + '30';
        ctx.fill();

        ctx.restore();

        // Label
        ctx.save();
        ctx.fillStyle = color + '80';
        ctx.font = '9px system-ui';
        ctx.textAlign = 'center';
        // Note: we are inside a scale transform (direction, 1). 
        // Text drawing might flip if direction is -1.
        // Better to draw text outside the flipped context?
        // Actually, the previous implementation drew it inside but flipped. 
        // Let's verify: In original code, `restore()` was called BEFORE label.
        // My code calls restore() before label too.
        // Wait, line 165 in original: restore() then label.
        // My code: restore() then label.
        // Wait, line 148 in MY code is function start. 182 Restore. 184 Label? 
        // Ah, looking at `_drawLargeFish` logic above:
        // Original: `restore()` at 188. Label at 191.
        // My code: `restore()` at 162. Label at 165.
        // Wait, I need to make sure I am not drawing label inside the flipped context.
        // `ctx.restore()` restores the state SAVED at line 124.
        // So yes, text is drawn in normal coordinate space relative to x,y.
        // But x,y were passed in.

        ctx.fillStyle = color + '90';
        ctx.fillText(label, x, y - size * 0.9);
        ctx.restore();
    }

    destroy() {
        this.container.removeEventListener('click', this._onClick);
        this.container.style.cursor = '';
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
