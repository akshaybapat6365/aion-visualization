import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Ego-Self Visualization (Phase 6 Scrollytelling)
 * 
 * Narrative Arc:
 * 1. Ego (Start): A tight, solid, golden sun. 
 * 2. Self (Scroll 1): The sun softens, the outer sphere becomes visible (Totality).
 * 3. Mandala (Scroll 2): Particles align into geometric order.
 */
export default class EgoSelfViz extends BaseViz {
    constructor(container) {
        super(container, { contextType: '2d' });
    }

    async init() {
        // ─── Narrative State ───
        this.state = {
            egoPulse: 1,
            selfOpacity: 0.2,
            particleChaos: 1,
            alignmentStrength: 0,
            zoom: 1,
        };

        // ─── Input State ───
        this.mouse = { x: 0.5, y: 0.5 };
        this._isDragging = false;
        this._prevMouse = { x: 0, y: 0 };
        this._rotationOffset = 0;
        this._rotationVelocity = 0;

        this.particles = [];
        this._initParticles(600);
        this._setupInput();
    }

    _initParticles(count) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 0.15 + Math.random() * 0.82;
            this.particles.push({
                dist,
                angle,
                baseAngle: angle,
                speed: 0.1 + Math.random() * 0.3,
                wobble: Math.random() * Math.PI * 2,
                wobbleAmp: 0.005 + Math.random() * 0.02,
                size: 1 + Math.random() * 2.5,
                brightness: 0,
                targetBrightness: 0,
                // Mandala target position
                mandalaRing: Math.floor(Math.random() * 5) + 1, // 1-5
                mandalaAngle: (Math.round(Math.random() * 12) / 12) * Math.PI * 2 // 12-fold symmetry
            });
        }
    }

    _setupInput() {
        const el = this.canvas; // We attach to canvas now, or container
        // We can use BaseViz container
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) / rect.width;
            this.mouse.y = (e.clientY - rect.top) / rect.height;

            if (this._isDragging) {
                const dx = e.clientX - this._prevMouse.x;
                this._rotationVelocity = dx * 0.003;
                this._prevMouse = { x: e.clientX, y: e.clientY };
            }
        });

        this.container.addEventListener('mousedown', (e) => {
            this._isDragging = true;
            this._prevMouse = { x: e.clientX, y: e.clientY };
            this.container.style.cursor = 'grabbing';
        });

        const stopDrag = () => {
            this._isDragging = false;
            this.container.style.cursor = 'grab';
        };
        this.container.addEventListener('mouseup', stopDrag);
        this.container.addEventListener('mouseleave', stopDrag);

        this.container.style.cursor = 'grab';
    }

    /**
     * Scrollytelling Reactive Logic
     * @param {object} s - scrollState { activeSection, sectionProgress, globalProgress }
     */
    onScroll(s) {
        super.onScroll(s);
        console.log('EgoSelfViz.onScroll', s.globalProgress, s.activeSection, s.sectionProgress);

        // Section 0: Ego (0.0 - 1.0)
        // Section 1: Self (1.0 - 2.0)
        // Section 2: Mandala (2.0 - 3.0)
        // We can use global progress or activeSection + sectionProgress

        // Let's create a continuous 'cinematic time' variable
        const cinematicTime = s.activeSection + s.sectionProgress;

        // 1. Zoom Logic: 
        // Start zoomed in on Ego (Zoom 1.5) -> Zoom out to Self (Zoom 1.0)
        if (cinematicTime < 1.0) {
            // Ego Phase
            this.state.zoom = 1.6 - (s.sectionProgress * 0.6); // 1.6 -> 1.0
            this.state.selfOpacity = s.sectionProgress * 0.3; // 0 -> 0.3
            this.state.particleChaos = 1;
            this.state.alignmentStrength = 0;
        } else if (cinematicTime < 2.0) {
            // Self Phase (Zoom stable, Chaos reduces)
            this.state.zoom = 1.0;
            this.state.selfOpacity = 0.3 + (s.sectionProgress * 0.2); // 0.3 -> 0.5
            this.state.particleChaos = 1.0 - (s.sectionProgress * 0.5); // 1.0 -> 0.5
            this.state.alignmentStrength = s.sectionProgress * 0.4; // 0 -> 0.4
        } else {
            // Mandala Phase (Full Alignment)
            this.state.zoom = 1.0 + (s.sectionProgress * 0.2); // Slow drift back in
            this.state.particleChaos = 0.5 - (s.sectionProgress * 0.5); // 0.5 -> 0
            this.state.alignmentStrength = 0.4 + (s.sectionProgress * 0.6); // 0.4 -> 1.0
        }
    }

    update(dt) {
        // Rotation physics
        this._rotationOffset += this._rotationVelocity;
        this._rotationVelocity *= 0.95;
        this._rotationOffset += 0.0005; // Slow ambient drift
    }

    render() {
        const ctx = this.ctx;
        const w = this.width; // pre-scaled by dpr in BaseViz? No, BaseViz sets canvas.width/height
        // BaseViz handles scaling: 
        // If contextType is 2d, it scales the context. 
        // So w/h should be logical CSS pixels.
        const logicalW = this.width;
        const logicalH = this.height;

        const cx = logicalW / 2;
        const cy = logicalH / 2;
        const t = this.time;

        // Clear with semi-transparent black for trails? Or solid?
        // Solid is cleaner for high-fidelity.
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, logicalW, logicalH);

        const zoom = this.state.zoom;
        const scaleFactor = Math.min(logicalW, logicalH) * 0.45 * zoom;

        ctx.save();
        ctx.translate(cx, cy);

        // ─── 1. The Self (Outer Sphere) ───
        if (this.state.selfOpacity > 0.01) {
            this._renderSelfSphere(ctx, scaleFactor, t);
        }

        // ─── 2. Particles (Unconscious/Mandala) ───
        this._renderParticles(ctx, scaleFactor, t);

        // ─── 3. The Ego (Inner Sun) ───
        this._renderEgo(ctx, scaleFactor, t);

        ctx.restore();
    }

    _renderSelfSphere(ctx, r, t) {
        const opacity = this.state.selfOpacity;

        // Wireframe Rings
        ctx.save();
        ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.3})`;
        ctx.lineWidth = 0.7;

        const ringCount = 6;
        for (let i = 0; i < ringCount; i++) {
            const tilt = (i / ringCount) * Math.PI + this._rotationOffset;
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 0.3, tilt, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // Subtle Fill
        const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
        grad.addColorStop(0, 'rgba(10, 10, 18, 0)');
        grad.addColorStop(1, `rgba(10, 10, 25, ${opacity * 0.5})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderParticles(ctx, r, t) {
        const chaos = this.state.particleChaos;
        const order = this.state.alignmentStrength;

        for (const p of this.particles) {
            // Chaos Position (Orbit)
            let angle = p.baseAngle + this._rotationOffset + t * p.speed * 0.1;
            let dist = p.dist * r;

            // Order Position (Mandala)
            // Ring count = 5.
            // angle = 12-fold symmetry
            const mandalaDist = (p.mandalaRing / 6) * r;
            const mandalaAngle = p.mandalaAngle + this._rotationOffset;

            // Lerp between Chaos and Order
            if (order > 0) {
                // Interpolate polar coords roughly
                // Better to interpolate Cartesian for smoothness
                const cx = Math.cos(angle) * dist;
                const cy = Math.sin(angle) * dist * 0.8; // flattened orbit

                const ox = Math.cos(mandalaAngle) * mandalaDist;
                const oy = Math.sin(mandalaAngle) * mandalaDist;

                const x = cx + (ox - cx) * order;
                const y = cy + (oy - cy) * order;

                ctx.fillStyle = this._getParticleColor(p);
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Pure Chaos Optimization
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist * 0.8;
                ctx.fillStyle = this._getParticleColor(p);
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    _getParticleColor(p) {
        // Simple mock logic for color
        // We can animate brightness based on mouse but let's just make them twinkle
        const twinkle = Math.sin(this.time * 2 + p.baseAngle * 10) * 0.2 + 0.8;
        return `rgba(180, 180, 200, ${twinkle * 0.4})`;
    }

    _renderEgo(ctx, r, t) {
        // Ego is always center, size depends on 'zoom' relative to 'self'
        // But logically, Self is huge, Ego is small.
        // Let's make Ego size relatively constant in screen-space, or pulsing
        const egoR = 15 + Math.sin(t * 2) * 2;

        // Core
        ctx.fillStyle = '#fff8e7';
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, egoR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Glow
        const glow = ctx.createRadialGradient(0, 0, egoR, 0, 0, egoR * 4);
        glow.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, egoR * 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
