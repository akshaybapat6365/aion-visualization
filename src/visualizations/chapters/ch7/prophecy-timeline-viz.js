
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Prophecy Timeline — Chapter 7: The Prophecies of Nostradamus
 * Refactored to extend BaseViz for Phase 6 Architecture.
 */
export default class ProphecyTimelineViz extends BaseViz {
    constructor(container) {
        super(container);
        this.mouse = { x: 0, y: 0 };
        this.hoveredNode = null;
        this.nodes = [
            { year: 1555, label: 'Centuries Published', symbol: '📜', detail: 'Nostradamus publishes his prophetic quatrains, encoding astrological symbolism.' },
            { year: 1600, label: 'Conjunction Saturn–Jupiter', symbol: '⚡', detail: 'Great conjunction marking the boundary between religious epochs.' },
            { year: 1789, label: 'French Revolution', symbol: '🔥', detail: 'The enantiodromia begins — Christian values invert toward secular upheaval.' },
            { year: 1900, label: 'Turn of Pisces–Aquarius', symbol: '♓', detail: 'The second fish reaches its end — shadow rises as the age turns.' },
            { year: 2000, label: 'Age of Aquarius', symbol: '♒', detail: 'The new aeon approaches — union of opposites or further splitting?' },
        ];

        this._onMouseMove = (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        };
    }

    async init() {
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
          <span style="position:absolute;top:12%;left:50%;transform:translateX(-50%);
            font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#9b59b6;">
            Prophecy Timeline — Enantiodromia of the Aeons
          </span>
          <span style="position:absolute;bottom:12%;left:50%;transform:translateX(-50%);
            font-size:0.55rem;opacity:0.3;">hover nodes for details</span>
        `;

        this._tooltipEl = document.createElement('div');
        this._tooltipEl.style.cssText = `
          position:absolute;padding:8px 12px;border-radius:6px;
          background:rgba(20,20,30,0.95);border:1px solid rgba(155,89,182,0.4);
          color:#e0e0e0;font-size:0.75rem;max-width:220px;opacity:0;
          transition:opacity 0.2s;pointer-events:none;line-height:1.4;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;
        overlay.appendChild(this._tooltipEl);

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
        const t = this.time;

        // Clear
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        const margin = 60;
        const lineY = h * 0.5;
        const lineLeft = margin;
        const lineRight = w - margin;
        const lineWidth = lineRight - lineLeft;

        // Timeline base line
        ctx.strokeStyle = 'rgba(155,89,182,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lineLeft, lineY);
        ctx.lineTo(lineRight, lineY);
        ctx.stroke();

        // Flowing particles along the line
        for (let i = 0; i < 20; i++) {
            const px = lineLeft + ((t * 15 + i * lineWidth / 20) % lineWidth);
            const alpha = 0.1 + Math.sin(t + i) * 0.05;
            ctx.fillStyle = `rgba(155,89,182,${alpha})`;
            ctx.beginPath();
            ctx.arc(px, lineY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Year range
        const minYear = 1500;
        const maxYear = 2100;
        this.hoveredNode = null;

        // Draw nodes
        for (const node of this.nodes) {
            const nx = lineLeft + ((node.year - minYear) / (maxYear - minYear)) * lineWidth;
            const pulse = 1 + Math.sin(t * 2 + node.year * 0.01) * 0.15;

            // Node glow
            const glow = ctx.createRadialGradient(nx, lineY, 0, nx, lineY, 22 * pulse);
            glow.addColorStop(0, 'rgba(155,89,182,0.3)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(nx - 22, lineY - 22, 44, 44);

            // Node circle
            ctx.beginPath();
            ctx.arc(nx, lineY, 8 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(155,89,182,0.6)';
            ctx.fill();
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Symbol
            ctx.font = '12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff'; // Ensure visible symbol
            ctx.fillText(node.symbol, nx, lineY + 1);

            // Year label
            ctx.fillStyle = 'rgba(155,89,182,0.5)';
            ctx.font = '7px system-ui';
            ctx.fillText(`${node.year}`, nx, lineY + 24);

            // Name label
            ctx.fillStyle = 'rgba(200,200,200,0.4)';
            ctx.font = '7px system-ui';
            ctx.fillText(node.label, nx, lineY - 18);

            // Hover detection
            // Note: Mouse coordinates are relative to container, 
            // but we are drawing in scaled canvas coordinates.
            // this.mouse.x is CSS pixels. nx is logical canvas pixels.
            // Since we scaled by DPR, logical pixels ~ CSS pixels.
            const dist = Math.sqrt((this.mouse.x - nx) ** 2 + (this.mouse.y - lineY) ** 2);
            if (dist < 25) {
                this.hoveredNode = node;
                // Tooltip positioning
                this._tooltipEl.style.left = Math.min(w - 220, Math.max(10, nx + 15)) + 'px';
                this._tooltipEl.style.top = (lineY - 60) + 'px';
                this._tooltipEl.innerHTML = `<strong style="color:#dbaae8">${node.label} (${node.year})</strong><br><span style="color:#bfa">${node.symbol}</span> ${node.detail}`;
                this._tooltipEl.style.opacity = '1';
            }
        }

        if (!this.hoveredNode && this._tooltipEl) {
            this._tooltipEl.style.opacity = '0';
        }

        ctx.restore();
    }

    destroy() {
        this.container.removeEventListener('mousemove', this._onMouseMove);
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
