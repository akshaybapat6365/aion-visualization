
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Emanation Spheres — Ch13: Gnostic Symbols of the Self
 * Refactored to extend BaseViz for Phase 6 Architecture.
 */
export default class EmanationSpheresViz extends BaseViz {
    constructor(container) {
        super(container);
        this.selectedLayer = -1;
        this.layers = [
            { name: 'Pleroma', color: '#ffd37a', desc: 'Divine fullness — source of all emanation' },
            { name: 'Nous', color: '#d4af37', desc: 'Divine Mind — first emanation, wisdom\'s origin' },
            { name: 'Sophia', color: '#e67e22', desc: 'Fallen Wisdom — desire that causes creation' },
            { name: 'Demiurge', color: '#c0392b', desc: 'False creator — shaping matter without knowledge' },
            { name: 'Archons', color: '#8e44ad', desc: 'Rulers of the spheres — jailers of the soul' },
            { name: 'Hyle', color: '#555555', desc: 'Matter — where the light-spark is trapped' },
        ];
        this.sparkAngle = 0;

        this._onClick = (e) => {
            const rect = this.container.getBoundingClientRect();
            const width = this.canvas.width / this.dpr;
            const height = this.canvas.height / this.dpr;
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Interaction logic uses logical pixels, but mouse event is in CSS pixels.
            // Since canvas is 100% width/height of container, we can use container relative coords directly.
            const cx = width / 2;
            const cy = height / 2;
            const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);

            const maxR = Math.min(width, height) * 0.4;
            // Map click distance to layer index (inverse relation: closer to center = higher index)
            // Outer layer is index 0 (Pleroma)? Wait. 
            // In original code: `r = maxR * (1 - i / this.layers.length)`
            // So i=0 is maxR (outermost), i=5 is smallest (innermost).
            // Click Logic: `idx = 5 - Math.min(5, Math.floor((dist / maxR) * 6))`
            // If dist is small (0), floor is 0 -> idx = 5 (Hyle, center).
            // If dist is maxR (1), floor is 6 -> min(5,6)=5 -> idx = 0 (Pleroma, outer).
            // Correct.

            if (dist > maxR) {
                this.selectedLayer = -1;
                return;
            }

            const idx = 5 - Math.min(5, Math.floor((dist / maxR) * 6));
            this.selectedLayer = this.selectedLayer === idx ? -1 : idx;
        };
    }

    async init() {
        this.container.addEventListener('click', this._onClick);
        this.container.style.cursor = 'pointer';
        this._createUI();
    }

    _createUI() {
        const o = document.createElement('div');
        o.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:system-ui;color:#8a8a8a;';
        o.innerHTML = `<span style="position:absolute;top:5%;left:50%;transform:translateX(-50%);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#d4af37;">Gnostic Emanation</span>`;
        this._info = document.createElement('div');
        this._info.style.cssText = 'position:absolute;bottom:8%;left:50%;transform:translateX(-50%);font-size:0.6rem;text-align:center;max-width:280px;opacity:0;transition:opacity 0.3s;color:#ccc;';
        o.appendChild(this._info);
        o.innerHTML += `<span style="position:absolute;bottom:4%;left:50%;transform:translateX(-50%);font-size:0.55rem;opacity:0.3;">click spheres to explore levels</span>`;
        this.container.appendChild(o);
        this._overlay = o;
    }

    update(dt) {
        this.time += dt;
        this.sparkAngle += dt * 0.5;
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
        const maxR = Math.min(w, h) * 0.4;

        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < this.layers.length; i++) {
            const l = this.layers[i];
            const r = maxR * (1 - i / this.layers.length);
            const sel = this.selectedLayer === i;
            const breath = 1 + Math.sin(t * 0.5 + i) * 0.02;

            ctx.beginPath();
            ctx.arc(cx, cy, r * breath, 0, Math.PI * 2);
            ctx.strokeStyle = l.color + (sel ? 'a0' : '40');
            ctx.lineWidth = sel ? 2.5 : 1;
            ctx.stroke();

            if (sel) {
                ctx.fillStyle = l.color + '12';
                ctx.fill();
            }

            const la = -Math.PI / 4 + i * 0.15;
            ctx.fillStyle = l.color + (sel ? 'c0' : '50');
            ctx.font = `${sel ? 8 : 7}px system-ui`;
            ctx.textAlign = 'left';
            ctx.fillText(l.name, cx + Math.cos(la) * (r * breath + 5), cy + Math.sin(la) * (r * breath + 5));
        }

        // Light-spark
        const st = (this.sparkAngle % (Math.PI * 12)) / (Math.PI * 12);
        const sr = maxR * (1 - st);
        const sa = this.sparkAngle * 3;
        const sx = cx + Math.cos(sa) * sr;
        const sy = cy + Math.sin(sa) * sr;

        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
        sg.addColorStop(0, 'rgba(255,211,122,0.6)');
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.fillRect(sx - 12, sy - 12, 24, 24);

        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd37a';
        ctx.fill();

        for (let i = 1; i <= 8; i++) {
            const ta = sa - i * 0.15;
            const tt = Math.max(0, st - i * 0.005);
            const tr = maxR * (1 - tt);
            ctx.beginPath();
            ctx.arc(cx + Math.cos(ta) * tr, cy + Math.sin(ta) * tr, 1.5 - i * 0.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,211,122,${0.3 - i * 0.03})`;
            ctx.fill();
        }

        if (this.selectedLayer >= 0) {
            const l = this.layers[this.selectedLayer];
            this._info.innerHTML = `<strong style="color:${l.color}">${l.name}</strong><br>${l.desc}`;
            this._info.style.opacity = '1';
        } else {
            this._info.style.opacity = '0';
        }

        ctx.restore();
    }

    destroy() {
        this.container.removeEventListener('click', this._onClick);
        this.container.style.cursor = '';
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
