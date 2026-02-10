/**
 * Emanation Spheres — Ch13: Gnostic Symbols of the Self
 * Nested concentric spheres from Pleroma to Hyle. A light-spark spirals inward.
 * Click spheres to explore emanation levels.
 * Self-contained Canvas 2D.
 */
export default class EmanationSpheresViz {
    constructor(container) {
        this.container = container;
        this.running = true;
        this.time = 0;
        this.selectedLayer = -1;
        this.layers = [
            { name: 'Pleroma', color: '#ffd37a', desc: 'Divine fullness — source of all emanation' },
            { name: 'Nous', color: '#d4af37', desc: 'Divine Mind — first emanation, wisdom\'s origin' },
            { name: 'Sophia', color: '#e67e22', desc: 'Fallen Wisdom — desire that causes creation' },
            { name: 'Demiurge', color: '#c0392b', desc: 'False creator — shaping matter without knowledge' },
            { name: 'Archons', color: '#8e44ad', desc: 'Rulers of the spheres — jailers of the soul' },
            { name: 'Hyle', color: '#555555', desc: 'Matter — where the light-spark is trapped' },
        ];
        const w = container.clientWidth || 600, h = container.clientHeight || 450;
        this.dpr = Math.min(window.devicePixelRatio, 2);
        this.canvas = document.createElement('canvas');
        this.canvas.width = w * this.dpr; this.canvas.height = h * this.dpr;
        this.canvas.style.cssText = `width:${w}px;height:${h}px;display:block;cursor:pointer;`;
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.sparkAngle = 0;
        this._onClick = (e) => {
            const rect = container.getBoundingClientRect();
            const dist = Math.sqrt((e.clientX - rect.left - (this.canvas.width / this.dpr) / 2) ** 2 + (e.clientY - rect.top - (this.canvas.height / this.dpr) / 2) ** 2);
            const maxR = Math.min(this.canvas.width / this.dpr, this.canvas.height / this.dpr) * 0.4;
            const idx = 5 - Math.min(5, Math.floor((dist / maxR) * 6));
            this.selectedLayer = this.selectedLayer === idx ? -1 : idx;
        };
        this.canvas.addEventListener('click', this._onClick);
        this._onResize = () => {
            const nw = container.clientWidth, nh = container.clientHeight;
            this.canvas.width = nw * this.dpr; this.canvas.height = nh * this.dpr;
            this.canvas.style.width = nw + 'px'; this.canvas.style.height = nh + 'px';
        };
        window.addEventListener('resize', this._onResize);
        this._createUI();
        this._animate();
    }
    _createUI() {
        const o = document.createElement('div');
        o.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:system-ui;color:#8a8a8a;';
        o.innerHTML = `<span style="position:absolute;top:5%;left:50%;transform:translateX(-50%);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#d4af37;">Gnostic Emanation</span>`;
        this._info = document.createElement('div');
        this._info.style.cssText = 'position:absolute;bottom:8%;left:50%;transform:translateX(-50%);font-size:0.6rem;text-align:center;max-width:280px;opacity:0;transition:opacity 0.3s;color:#ccc;';
        o.appendChild(this._info);
        o.innerHTML += `<span style="position:absolute;bottom:4%;left:50%;transform:translateX(-50%);font-size:0.55rem;opacity:0.3;">click spheres to explore levels</span>`;
        this.container.style.position = 'relative';
        this.container.appendChild(o);
        this._overlay = o;
    }
    _animate() {
        if (!this.running) return;
        requestAnimationFrame(() => this._animate());
        this.time += 0.016; this.sparkAngle += 0.008;
        this._draw();
    }
    _draw() {
        const ctx = this.ctx; ctx.save(); ctx.scale(this.dpr, this.dpr);
        const w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
        const cx = w / 2, cy = h / 2, t = this.time, maxR = Math.min(w, h) * 0.4;
        ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < this.layers.length; i++) {
            const l = this.layers[i], r = maxR * (1 - i / this.layers.length);
            const sel = this.selectedLayer === i, breath = 1 + Math.sin(t * 0.5 + i) * 0.02;
            ctx.beginPath(); ctx.arc(cx, cy, r * breath, 0, Math.PI * 2);
            ctx.strokeStyle = l.color + (sel ? 'a0' : '40'); ctx.lineWidth = sel ? 2.5 : 1; ctx.stroke();
            if (sel) { ctx.fillStyle = l.color + '12'; ctx.fill(); }
            const la = -Math.PI / 4 + i * 0.15;
            ctx.fillStyle = l.color + (sel ? 'c0' : '50'); ctx.font = `${sel ? 8 : 7}px system-ui`;
            ctx.textAlign = 'left';
            ctx.fillText(l.name, cx + Math.cos(la) * (r * breath + 5), cy + Math.sin(la) * (r * breath + 5));
        }
        // Light-spark
        const st = (this.sparkAngle % (Math.PI * 12)) / (Math.PI * 12), sr = maxR * (1 - st);
        const sa = this.sparkAngle * 3, sx = cx + Math.cos(sa) * sr, sy = cy + Math.sin(sa) * sr;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
        sg.addColorStop(0, 'rgba(255,211,122,0.6)'); sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg; ctx.fillRect(sx - 12, sy - 12, 24, 24);
        ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fillStyle = '#ffd37a'; ctx.fill();
        for (let i = 1; i <= 8; i++) {
            const ta = sa - i * 0.15, tt = Math.max(0, st - i * 0.005), tr = maxR * (1 - tt);
            ctx.beginPath(); ctx.arc(cx + Math.cos(ta) * tr, cy + Math.sin(ta) * tr, 1.5 - i * 0.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,211,122,${0.3 - i * 0.03})`; ctx.fill();
        }
        if (this.selectedLayer >= 0) {
            const l = this.layers[this.selectedLayer];
            this._info.innerHTML = `<strong style="color:${l.color}">${l.name}</strong><br>${l.desc}`;
            this._info.style.opacity = '1';
        } else this._info.style.opacity = '0';
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
