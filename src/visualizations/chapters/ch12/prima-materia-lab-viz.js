
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Prima Materia Lab — Chapter 12: Background to the Psychology of Alchemy
 * Refactored to extend BaseViz for Phase 6 Architecture.
 */
export default class PrimaMateriaLabViz extends BaseViz {
    constructor(container) {
        super(container);
        this.elements = [
            { id: 'earth', symbol: '🜃', name: 'Earth', color: '#27ae60', x: 0, y: 0, placed: false },
            { id: 'water', symbol: '🜄', name: 'Water', color: '#3498db', x: 0, y: 0, placed: false },
            { id: 'fire', symbol: '🜂', name: 'Fire', color: '#e74c3c', x: 0, y: 0, placed: false },
            { id: 'air', symbol: '🜁', name: 'Air', color: '#f1c40f', x: 0, y: 0, placed: false },
        ];

        this.dragging = null;
        this.dragOffset = { x: 0, y: 0 };
        this.reactions = 0;
        this.vesselGlow = 0;

        this._onMouseDown = (e) => this._handleDown(e.clientX, e.clientY);
        this._onMouseMove = (e) => this._handleMove(e.clientX, e.clientY);
        this._onMouseUp = () => this._handleUp();
    }

    async init() {
        // Initial layout
        const rect = this.container.getBoundingClientRect();
        this._layoutElements(rect.width, rect.height);

        this.container.style.cursor = 'grab';
        // Bind events to container for robustness
        this.container.addEventListener('mousedown', this._onMouseDown);
        this.container.addEventListener('mousemove', this._onMouseMove);
        this.container.addEventListener('mouseup', this._onMouseUp);
        this.container.addEventListener('mouseleave', this._onMouseUp);

        this._createUI();
    }

    _handleResize() {
        super._handleResize(); // Call BaseViz resize to update canvas
        const rect = this.container.getBoundingClientRect();
        this._layoutElements(rect.width, rect.height);
    }

    _layoutElements(w, h) {
        const positions = [
            { x: w * 0.15, y: h * 0.3 },
            { x: w * 0.15, y: h * 0.6 },
            { x: w * 0.85, y: h * 0.3 },
            { x: w * 0.85, y: h * 0.6 },
        ];
        this.elements.forEach((el, i) => {
            if (!el.placed) {
                el.x = positions[i].x;
                el.y = positions[i].y;
                el.homeX = positions[i].x;
                el.homeY = positions[i].y;
            }
        });
    }

    _handleDown(clientX, clientY) {
        const rect = this.container.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;

        for (const el of this.elements) {
            if (el.placed) continue;
            // Note: el.x/y are in CSS pixels relative to container
            const dist = Math.sqrt((mx - el.x) ** 2 + (my - el.y) ** 2);
            if (dist < 22) {
                this.dragging = el;
                this.dragOffset = { x: mx - el.x, y: my - el.y };
                this.container.style.cursor = 'grabbing';
                return;
            }
        }
    }

    _handleMove(clientX, clientY) {
        if (!this.dragging) return;
        const rect = this.container.getBoundingClientRect();
        this.dragging.x = clientX - rect.left - this.dragOffset.x;
        this.dragging.y = clientY - rect.top - this.dragOffset.y;
    }

    _handleUp() {
        if (!this.dragging) return;
        const el = this.dragging;
        const width = this.canvas.width / this.dpr;
        const height = this.canvas.height / this.dpr;
        const cx = width / 2;
        const cy = height / 2;

        const dist = Math.sqrt((el.x - cx) ** 2 + (el.y - cy) ** 2);

        if (dist < 50) {
            el.placed = true;
            el.x = cx;
            el.y = cy;
            this.reactions++;
            this.vesselGlow = 1;
        } else {
            el.x = el.homeX;
            el.y = el.homeY;
        }

        this.dragging = null;
        this.container.style.cursor = 'grab';
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position:absolute;inset:0;pointer-events:none;
          font-family:var(--font-sans,system-ui);color:var(--text-tertiary,#8a8a8a);
        `;
        overlay.innerHTML = `
          <span style="position:absolute;top:5%;left:50%;transform:translateX(-50%);
            font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#e67e22;">
            Prima Materia Lab
          </span>
          <span style="position:absolute;bottom:5%;left:50%;transform:translateX(-50%);
            font-size:0.55rem;opacity:0.3;">drag elements into the vessel</span>
        `;
        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    update(dt) {
        this.time += dt;
        this.vesselGlow *= 0.97;
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

        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        // Vessel
        const vesselR = 45;
        const vesselColor = ['#555555', '#c0c0c0', '#d4af37', '#c0392b', '#d4af37'][Math.min(this.reactions, 4)];

        // Vessel glow
        const glow = ctx.createRadialGradient(cx, cy, vesselR * 0.3, cx, cy, vesselR * 2);
        glow.addColorStop(0, vesselColor + Math.round((0.15 + this.vesselGlow * 0.4) * 255).toString(16).padStart(2, '0'));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, vesselR * 2, 0, Math.PI * 2);
        ctx.fill();

        // Vessel circle
        ctx.beginPath();
        ctx.arc(cx, cy, vesselR, 0, Math.PI * 2);
        ctx.strokeStyle = vesselColor + '80';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = vesselColor + '15';
        ctx.fill();

        // Vessel label
        ctx.fillStyle = vesselColor + '60';
        ctx.font = '7px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('VESSEL', cx, cy + vesselR + 15);

        // Reaction count
        if (this.reactions > 0) {
            ctx.fillStyle = vesselColor;
            ctx.font = '9px system-ui';
            ctx.fillText(`${this.reactions}/4`, cx, cy + 4);
        }

        // Reaction particles inside vessel
        for (let i = 0; i < this.reactions * 8; i++) {
            const angle = t * 1.5 + i * 0.78;
            const dist = 10 + Math.sin(t * 2 + i * 0.5) * 20;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = vesselColor + '60';
            ctx.fill();
        }

        // Draw elements
        for (const el of this.elements) {
            if (el.placed) continue;
            const isBeingDragged = this.dragging === el;
            const r = isBeingDragged ? 24 : 18;

            // Element glow
            const elGlow = ctx.createRadialGradient(el.x, el.y, 0, el.x, el.y, r * 1.5);
            elGlow.addColorStop(0, el.color + '30');
            elGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = elGlow;
            ctx.beginPath();
            ctx.arc(el.x, el.y, r * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Element circle
            ctx.beginPath();
            ctx.arc(el.x, el.y, r, 0, Math.PI * 2);
            ctx.fillStyle = el.color + '30';
            ctx.fill();
            ctx.strokeStyle = el.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Symbol
            ctx.fillStyle = el.color;
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(el.symbol, el.x, el.y + 5);

            // Name
            ctx.fillStyle = el.color + '80';
            ctx.font = '7px system-ui';
            ctx.fillText(el.name, el.x, el.y + r + 12);
        }

        // Completion message
        if (this.reactions >= 4) {
            ctx.fillStyle = '#d4af37';
            ctx.font = '10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('✦ The Philosopher\'s Stone is achieved ✦', cx, cy + vesselR + 35);
        }

        ctx.restore();
    }

    destroy() {
        this.container.removeEventListener('mousedown', this._onMouseDown);
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('mouseup', this._onMouseUp);
        this.container.removeEventListener('mouseleave', this._onMouseUp);
        this.container.style.cursor = '';
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
