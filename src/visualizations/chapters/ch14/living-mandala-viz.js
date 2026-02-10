
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Living Mandala — Ch14: Structure and Dynamics of the Self
 * Refactored to extend BaseViz for Phase 6 Architecture.
 */
export default class LivingMandalaViz extends BaseViz {
    constructor(container) {
        super(container);
        this.selectedSegment = -1;
        this.hoveredSeg = -1;
        this.mouse = { x: 0, y: 0 };
        this.segments = [
            { ch: 'Ch 1', name: 'The Ego', color: '#d4af37', motif: 'Ego sphere within the Self-field' },
            { ch: 'Ch 2', name: 'The Shadow', color: '#8e44ad', motif: 'Shadow projection and integration' },
            { ch: 'Ch 3', name: 'Syzygy', color: '#e67e22', motif: 'Anima/Animus poles in tension' },
            { ch: 'Ch 4', name: 'The Self', color: '#ffd37a', motif: 'Mandala of quaternity wholeness' },
            { ch: 'Ch 5', name: 'Christ Symbol', color: '#27ae60', motif: 'Quaternity cross — excluded fourth' },
            { ch: 'Ch 6', name: 'Sign of Fishes', color: '#22d3ee', motif: 'Zodiac wheel — Age of Pisces' },
            { ch: 'Ch 7', name: 'Nostradamus', color: '#9b59b6', motif: 'Prophecy timeline — enantiodromia' },
            { ch: 'Ch 8', name: 'Fish History', color: '#3498db', motif: 'Christ/Antichrist inversion' },
            { ch: 'Ch 9', name: 'Ambivalence', color: '#e74c3c', motif: 'Paradox mirror of opposites' },
            { ch: 'Ch 10', name: 'Fish in Alchemy', color: '#c0392b', motif: 'Alchemical vessel transformation' },
            { ch: 'Ch 11', name: 'Alchemical Opus', color: '#e67e22', motif: 'Seven operations of the opus' },
            { ch: 'Ch 12', name: 'Prima Materia', color: '#f1c40f', motif: 'Elemental combination in the vessel' },
            { ch: 'Ch 13', name: 'Gnostic Self', color: '#8e44ad', motif: 'Emanation spheres — light-spark' },
            { ch: 'Ch 14', name: 'Living Mandala', color: '#d4af37', motif: 'Synthesis of all motifs into wholeness' },
        ];

        this._onMouseMove = (e) => {
            const r = this.container.getBoundingClientRect();
            this.mouse.x = e.clientX - r.left;
            this.mouse.y = e.clientY - r.top;
        };
        this._onClick = () => {
            if (this.hoveredSeg >= 0) {
                this.selectedSegment = this.selectedSegment === this.hoveredSeg ? -1 : this.hoveredSeg;
            }
        };
    }

    async init() {
        this.container.addEventListener('mousemove', this._onMouseMove);
        this.container.addEventListener('click', this._onClick);
        this.container.style.cursor = 'pointer';
        this._createUI();
    }

    _createUI() {
        const o = document.createElement('div');
        o.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:system-ui;color:#8a8a8a;';
        o.innerHTML = `<span style="position:absolute;top:5%;left:50%;transform:translateX(-50%);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#d4af37;">Living Mandala — Wholeness of the Self</span>`;
        this._info = document.createElement('div');
        this._info.style.cssText = 'position:absolute;bottom:6%;left:50%;transform:translateX(-50%);font-size:0.6rem;text-align:center;max-width:300px;opacity:0;transition:opacity 0.3s;color:#ccc;';
        o.appendChild(this._info);
        this.container.appendChild(o);
        this._overlay = o;
    }

    update(dt) {
        this.time += dt;
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

        const R = Math.min(w, h) * 0.38, innerR = R * 0.35;
        const slice = Math.PI * 2 / 14;

        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        this.hoveredSeg = -1;

        // Segments
        for (let i = 0; i < 14; i++) {
            const a1 = i * slice - Math.PI / 2;
            const a2 = a1 + slice;
            const mid = a1 + slice / 2;
            const s = this.segments[i];
            const sel = this.selectedSegment === i;

            // Hover detect
            const nx = cx + Math.cos(mid) * R * 0.7;
            const ny = cy + Math.sin(mid) * R * 0.7;
            // Mouse coords are relative to container, consistent with scale
            const dist = Math.sqrt((this.mouse.x - nx) ** 2 + (this.mouse.y - ny) ** 2);
            if (dist < 28) this.hoveredSeg = i;

            const hov = this.hoveredSeg === i;

            // Sector
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, R, a1, a2);
            ctx.closePath();
            ctx.fillStyle = s.color + (sel ? '30' : hov ? '18' : '0a');
            ctx.fill();
            ctx.strokeStyle = s.color + (sel ? '80' : '25');
            ctx.lineWidth = sel ? 1.5 : 0.5;
            ctx.stroke();

            // Label
            const lr = R * 0.82;
            ctx.save();
            ctx.translate(cx + Math.cos(mid) * lr, cy + Math.sin(mid) * lr);
            ctx.rotate(mid + Math.PI / 2);
            ctx.fillStyle = s.color + (sel ? 'e0' : hov ? '90' : '45');
            ctx.font = `${sel ? 8 : 6}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillText(s.ch, 0, 0);
            ctx.restore();
        }

        // Inner ring
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = '#050508';
        ctx.fill();
        ctx.strokeStyle = 'rgba(212,175,55,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center — rotating Self symbol
        const selfPulse = 1 + Math.sin(t) * 0.05;
        ctx.beginPath();
        ctx.arc(cx, cy, 12 * selfPulse, 0, Math.PI * 2);
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12 * selfPulse);
        cg.addColorStop(0, 'rgba(255,211,122,0.5)');
        cg.addColorStop(1, 'rgba(212,175,55,0.1)');
        ctx.fillStyle = cg;
        ctx.fill();

        ctx.fillStyle = '#d4af37';
        ctx.font = '8px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('SELF', cx, cy + 3);

        // Rotating crosshairs
        for (let i = 0; i < 4; i++) {
            const a = t * 0.2 + i * Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15);
            ctx.lineTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
            ctx.strokeStyle = 'rgba(212,175,55,0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Info
        if (this.selectedSegment >= 0 || this.hoveredSeg >= 0) {
            const idx = this.selectedSegment >= 0 ? this.selectedSegment : this.hoveredSeg;
            const s = this.segments[idx];
            this._info.innerHTML = `<strong style="color:${s.color}">${s.ch}: ${s.name}</strong><br>${s.motif}`;
            this._info.style.opacity = '1';
        } else {
            this._info.style.opacity = '0';
        }

        ctx.restore();
    }

    destroy() {
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('click', this._onClick);
        this.container.style.cursor = '';
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
