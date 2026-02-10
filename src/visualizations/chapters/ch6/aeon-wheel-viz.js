/**
 * Aeon Wheel — Chapter 6: The Sign of the Fishes
 *
 * A zodiac ring highlighting the Age of Pisces. Two fish orbit in
 * opposite directions within the Pisces sector. A time-scrub slider
 * moves from 0 AD to 2000 AD, shifting the "current age" marker
 * along the ring and revealing the approaching Age of Aquarius.
 *
 * Self-contained Canvas 2D — no dependencies.
 */

export default class AeonWheelViz {
    constructor(container) {
        this.container = container;
        this.running = true;
        this.time = 0;

        const w = container.clientWidth || 600;
        const h = container.clientHeight || 450;
        this.dpr = Math.min(window.devicePixelRatio, 2);

        this.canvas = document.createElement('canvas');
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.canvas.style.cssText = `width:${w}px;height:${h}px;display:block;`;
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // State
        this.yearNormalized = 0.5; // 0=0AD, 1=2000AD
        this.signs = [
            'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ];
        this.signColors = [
            '#e74c3c', '#27ae60', '#f1c40f', '#3498db', '#e67e22', '#8e44ad',
            '#1abc9c', '#c0392b', '#9b59b6', '#2c3e50', '#22d3ee', '#d4af37'
        ];

        this._createUI();
        this._onResize = () => {
            const nw = container.clientWidth;
            const nh = container.clientHeight;
            this.canvas.width = nw * this.dpr;
            this.canvas.height = nh * this.dpr;
            this.canvas.style.width = nw + 'px';
            this.canvas.style.height = nh + 'px';
        };
        window.addEventListener('resize', this._onResize);
        this._animate();
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position:absolute;inset:0;pointer-events:none;
      font-family:var(--font-sans,system-ui);color:var(--text-tertiary,#8a8a8a);
    `;
        // Year slider
        const sliderWrap = document.createElement('div');
        sliderWrap.style.cssText = `
      position:absolute;bottom:6%;left:50%;transform:translateX(-50%);
      pointer-events:auto;display:flex;align-items:center;gap:8px;
    `;
        this._yearLabel = document.createElement('span');
        this._yearLabel.style.cssText = 'font-size:0.65rem;opacity:0.6;min-width:60px;text-align:center;color:#d4af37;';
        this._yearLabel.textContent = '1000 AD';

        const slider = document.createElement('input');
        slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = '50';
        slider.style.cssText = 'width:180px;accent-color:#d4af37;opacity:0.7;';
        slider.addEventListener('input', (e) => {
            this.yearNormalized = parseInt(e.target.value) / 100;
            const year = Math.round(this.yearNormalized * 2000);
            this._yearLabel.textContent = `${year} AD`;
        });

        sliderWrap.appendChild(document.createTextNode('0 AD'));
        sliderWrap.appendChild(slider);
        sliderWrap.appendChild(document.createTextNode('2000 AD'));

        overlay.appendChild(sliderWrap);

        // Year readout
        const yearDisplay = document.createElement('div');
        yearDisplay.style.cssText = `
      position:absolute;bottom:13%;left:50%;transform:translateX(-50%);
      font-size:0.8rem;color:#d4af37;opacity:0.7;
    `;
        yearDisplay.appendChild(this._yearLabel);
        overlay.appendChild(yearDisplay);

        // Title label
        const title = document.createElement('span');
        title.style.cssText = `
      position:absolute;top:5%;left:50%;transform:translateX(-50%);
      font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#22d3ee;
    `;
        title.textContent = 'The Great Year — Aeon Wheel';
        overlay.appendChild(title);

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
        const cx = w / 2, cy = h / 2;
        const t = this.time;

        // Background
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        const outerR = Math.min(w, h) * 0.38;
        const innerR = outerR * 0.72;
        const midR = (outerR + innerR) / 2;
        const sliceAngle = (Math.PI * 2) / 12;

        // Draw zodiac ring
        for (let i = 0; i < 12; i++) {
            const startA = i * sliceAngle - Math.PI / 2;
            const endA = startA + sliceAngle;
            const isPisces = i === 11;
            const isAquarius = i === 10;

            // Sector fill
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, outerR, startA, endA);
            ctx.closePath();

            const alpha = isPisces ? 0.25 : (isAquarius ? 0.12 : 0.06);
            ctx.fillStyle = this.signColors[i] + (isPisces ? '40' : '18');
            ctx.fill();

            // Sector border
            ctx.strokeStyle = `rgba(255,255,255,0.08)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Label
            const labelA = startA + sliceAngle / 2;
            const labelR = outerR * 0.88;
            const lx = cx + Math.cos(labelA) * labelR;
            const ly = cy + Math.sin(labelA) * labelR;
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(labelA + Math.PI / 2);
            ctx.fillStyle = isPisces ? '#d4af37' : (isAquarius ? '#22d3ee' : 'rgba(255,255,255,0.25)');
            ctx.font = `${isPisces ? '600 ' : ''}${isPisces ? 9 : 7}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillText(this.signs[i], 0, 0);
            ctx.restore();
        }

        // Inner ring (hollow center)
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = '#050508';
        ctx.fill();

        // Age marker — position based on year slider
        // Pisces age: ~0-2000 AD (sector 11: from ~330° to 360°/0°)
        const piscesStart = 11 * sliceAngle - Math.PI / 2;
        const ageAngle = piscesStart + this.yearNormalized * sliceAngle;
        const markerR = midR;
        const mx = cx + Math.cos(ageAngle) * markerR;
        const my = cy + Math.sin(ageAngle) * markerR;

        // Marker glow
        const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 18);
        glow.addColorStop(0, 'rgba(212,175,55,0.5)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(mx - 18, my - 18, 36, 36);

        // Marker dot
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd37a';
        ctx.fill();

        // ─── Fish pair in center ───
        const fishR = innerR * 0.45;
        const fishAngle1 = t * 0.5;
        const fishAngle2 = fishAngle1 + Math.PI;

        // Fish 1 (gold — Christ)
        this._drawFish(ctx, cx + Math.cos(fishAngle1) * fishR, cy + Math.sin(fishAngle1) * fishR,
            fishAngle1 + Math.PI / 2, '#d4af37', 16);
        // Fish 2 (cyan — Antichrist/Shadow)
        this._drawFish(ctx, cx + Math.cos(fishAngle2) * fishR, cy + Math.sin(fishAngle2) * fishR,
            fishAngle2 + Math.PI / 2, '#22d3ee', 16);

        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();

        // Aquarius approach indicator
        if (this.yearNormalized > 0.85) {
            const aquaAlpha = (this.yearNormalized - 0.85) / 0.15;
            ctx.save();
            ctx.fillStyle = `rgba(34,211,238,${0.3 * aquaAlpha})`;
            ctx.font = '8px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('→ Age of Aquarius approaching', cx, cy + innerR * 0.7);
            ctx.restore();
        }

        ctx.restore();
    }

    _drawFish(ctx, x, y, angle, color, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        // Vesica piscis shape
        ctx.moveTo(0, -size);
        ctx.quadraticCurveTo(size * 0.8, -size * 0.2, 0, size);
        ctx.quadraticCurveTo(-size * 0.8, -size * 0.2, 0, -size);
        ctx.fillStyle = color + '60';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        // Eye
        ctx.beginPath();
        ctx.arc(0, -size * 0.4, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    pause() { this.running = false; }
    resume() { this.running = true; this._animate(); }
    dispose() {
        this.running = false;
        window.removeEventListener('resize', this._onResize);
        if (this._overlay) this._overlay.remove();
        if (this.canvas.parentElement) this.canvas.remove();
    }
}
