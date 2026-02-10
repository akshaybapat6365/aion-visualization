/**
 * Prophecy Timeline — Chapter 7: The Prophecies of Nostradamus
 *
 * Horizontal timeline with prophetic symbol nodes. Each node pulses
 * with symbolic meaning. Hovering reveals details about the prophecy
 * and its connection to the enantiodromia of the aeons.
 *
 * Self-contained Canvas 2D — no dependencies.
 */

export default class ProphecyTimelineViz {
    constructor(container) {
        this.container = container;
        this.running = true;
        this.time = 0;
        this.mouse = { x: 0, y: 0 };
        this.hoveredNode = null;

        const w = container.clientWidth || 600;
        const h = container.clientHeight || 450;
        this.dpr = Math.min(window.devicePixelRatio, 2);

        this.canvas = document.createElement('canvas');
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.cssText = `width:${w}px;height:${h}px;display:block;`;
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

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
        this._onResize = () => {
            const nw = container.clientWidth;
            const nh = container.clientHeight;
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
        font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#9b59b6;">
        Prophecy Timeline — Enantiodromia of the Aeons
      </span>
      <span style="position:absolute;bottom:5%;left:50%;transform:translateX(-50%);
        font-size:0.55rem;opacity:0.3;">hover nodes for details</span>
    `;
        this._tooltipEl = document.createElement('div');
        this._tooltipEl.style.cssText = `
      position:absolute;padding:8px 12px;border-radius:6px;
      background:rgba(20,20,30,0.9);border:1px solid rgba(155,89,182,0.3);
      color:#ccc;font-size:0.6rem;max-width:200px;opacity:0;
      transition:opacity 0.3s;pointer-events:none;
    `;
        overlay.appendChild(this._tooltipEl);
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
        const t = this.time;

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
            const dist = Math.sqrt((this.mouse.x - nx) ** 2 + (this.mouse.y - lineY) ** 2);
            if (dist < 25) {
                this.hoveredNode = node;
                this._tooltipEl.style.left = (nx + 15) + 'px';
                this._tooltipEl.style.top = (lineY - 40) + 'px';
                this._tooltipEl.innerHTML = `<strong>${node.label}</strong><br>${node.detail}`;
                this._tooltipEl.style.opacity = '1';
            }
        }

        if (!this.hoveredNode) {
            this._tooltipEl.style.opacity = '0';
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
