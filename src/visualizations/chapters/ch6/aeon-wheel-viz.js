
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Aeon Wheel — Chapter 6: The Sign of the Fishes
 * Refactored to extend BaseViz for Phase 6 Architecture.
 */
export default class AeonWheelViz extends BaseViz {
    constructor(container) {
        super(container);
        this.signs = [
            'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ];
        this.signColors = [
            '#e74c3c', '#27ae60', '#f1c40f', '#3498db', '#e67e22', '#8e44ad',
            '#1abc9c', '#c0392b', '#9b59b6', '#2c3e50', '#22d3ee', '#d4af37'
        ];
        this.yearNormalized = 0.5; // 0=0AD, 1=2000AD
    }

    async init() {
        this._createUI();
        // BaseViz handles canvas creation and resize listening
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
          position:absolute;bottom:14%;left:50%;transform:translateX(-50%);
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
          position:absolute;bottom:20%;left:50%;transform:translateX(-50%);
          font-size:0.8rem;color:#d4af37;opacity:0.7;
        `;
        // yearDisplay.appendChild(this._yearLabel); // Already used or duplicate? 
        // Logic check: original code appended yearLabel to yearDisplay, but here I reused it.
        // Let's stick to the original structure but clean it up.
        // Actually, the original appended _yearLabel to yearDisplay AND defined it.
        yearDisplay.appendChild(this._yearLabel);
        overlay.appendChild(yearDisplay);

        // UI Title is redundant with HUD/Chapter Title, but keeping for specific viz context if needed
        const title = document.createElement('span');
        title.style.cssText = `
          position:absolute;top:8%;left:50%;transform:translateX(-50%);
          font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4;color:#22d3ee;
        `;
        title.textContent = 'The Great Year — Aeon Wheel';
        overlay.appendChild(title);

        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    update(dt) {
        this.time += dt * 0.5; // Adjust speed if needed
    }

    render() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const width = this.canvas.width; // actual pixel width
        const height = this.canvas.height;

        // BaseViz handles dpr scaling in its resize, but often we want to just rely on 
        // standard drawing commands.
        // However, BaseViz creates canvas with width/height * dpr.
        // We should ensure we scale context? BaseViz usually doesn't auto-scale context 
        // to keep it flexible. We need to handle scale like the original did.

        ctx.save();
        ctx.scale(this.dpr, this.dpr);

        const logicalW = width / this.dpr;
        const logicalH = height / this.dpr;
        const cx = logicalW / 2;
        const cy = logicalH / 2;
        const t = this.time;

        // Clear (BaseViz doesn't auto-clear)
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, logicalW, logicalH);

        const outerR = Math.min(logicalW, logicalH) * 0.38;
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

            ctx.fillStyle = this.signColors[i] + (isPisces ? '40' : (isAquarius ? '18' : '10'));
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

        // Age marker
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

        this._drawFish(ctx, cx + Math.cos(fishAngle1) * fishR, cy + Math.sin(fishAngle1) * fishR,
            fishAngle1 + Math.PI / 2, '#d4af37', 16);
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
            ctx.fillText('→ Age of Aquarius', cx, cy + innerR * 0.5);
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

    destroy() {
        if (this._overlay) this._overlay.remove();
        super.destroy();
    }
}
