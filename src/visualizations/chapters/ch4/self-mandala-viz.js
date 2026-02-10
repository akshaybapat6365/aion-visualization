import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Self Mandala Visualization — Chapter 4: The Self
 * Ported to BaseViz (Phase 6 Architecture)
 */
export default class SelfMandalaViz extends BaseViz {
    constructor(container) {
        super(container);
    }

    async init() {
        this.time = 0;

        // Layers — activated in order by clicking
        this.layers = [
            { id: 'ego', label: 'Ego', color: '#ffd37a', secondaryColor: '#d4af37', radius: 20, segments: 1, active: true, progress: 1 },
            { id: 'shadow', label: 'Shadow', color: '#6b46c1', secondaryColor: '#8b5cf6', radius: 50, segments: 4, active: false, progress: 0 },
            { id: 'anima-animus', label: 'Anima / Animus', color: '#22d3ee', secondaryColor: '#93c5fd', radius: 80, segments: 8, active: false, progress: 0 },
            { id: 'collective', label: 'Collective Unconscious', color: '#10b981', secondaryColor: '#059669', radius: 110, segments: 12, active: false, progress: 0 },
            { id: 'self', label: 'Self — totality', color: '#d4af37', secondaryColor: '#ffd37a', radius: 140, segments: 16, active: false, progress: 0 },
        ];

        this.nextLayerIndex = 1; // Next layer to activate
        this.hoveredLayer = -1;

        this._createUI();

        // Bind handlers
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onClick = this._handleClick.bind(this);

        // Attach content-agnostic listeners to container (BaseViz pattern)
        // Or canvas directly since we created it in BaseViz
        this.container.addEventListener('mousemove', this._onMouseMove);
        this.container.addEventListener('click', this._onClick);

        // Note: BaseViz handles resize
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:absolute;inset:0;pointer-events:none;
            font-family:var(--font-sans,system-ui);color:var(--text-tertiary,#8a8a8a);
            transition: opacity 0.5s ease;
        `;

        this._statusLabel = document.createElement('span');
        this._statusLabel.style.cssText = `
            position:absolute;bottom:8%;left:50%;transform:translateX(-50%);
            font-size:0.6rem;text-transform:uppercase;letter-spacing:0.12em;opacity:0.5;
            transition:opacity 0.3s;
        `;
        this._statusLabel.textContent = 'click the next ring to build the mandala';

        this._layerLabel = document.createElement('span');
        this._layerLabel.style.cssText = `
            position:absolute;top:8%;left:50%;transform:translateX(-50%);
            font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0;
            color:var(--color-accent-light,#ffd37a);transition:opacity 0.3s;
        `;

        overlay.appendChild(this._statusLabel);
        overlay.appendChild(this._layerLabel);

        this.container.style.position = 'relative';
        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    _handleMouseMove(e) {
        // Handle coordinates relative to the CANVAs (taking CSS scaling into account)
        // BaseViz container is the reference.
        const rect = this.container.getBoundingClientRect(); // BaseViz calls it container. BaseViz canvas is 100% w/h
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Logical coords (before DPR scaling)
        const w = this.width; // BaseViz prop
        const h = this.height; // BaseViz prop
        const cx = w / 2;
        const cy = h / 2;
        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);

        // Find hovered layer ring
        this.hoveredLayer = -1;
        // Layers: radii are hardcoded (20, 50, 80...). 
        // We should maybe scale them relative to screen size?
        // Original code used constant radii. Let's keep constant for now but maybe scale if screen is small.
        const scale = Math.min(w, h) / 400; // rough autoscaling

        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const r = layer.radius * scale;
            const innerR = i === 0 ? 0 : this.layers[i - 1].radius * scale;

            if (dist >= innerR && dist <= r) {
                this.hoveredLayer = i;
                break;
            }
        }

        // Show label for hovered layer
        if (this.hoveredLayer >= 0) {
            const layer = this.layers[this.hoveredLayer];
            if (layer.active) {
                this._layerLabel.textContent = layer.label;
                this._layerLabel.style.opacity = '0.7';
                this._layerLabel.style.color = layer.color;
            } else if (this.hoveredLayer === this.nextLayerIndex) {
                this._layerLabel.textContent = `activate: ${layer.label}`;
                this._layerLabel.style.opacity = '0.5';
                this._layerLabel.style.color = layer.color;
            } else {
                this._layerLabel.style.opacity = '0';
            }
            this.container.style.cursor = this.hoveredLayer === this.nextLayerIndex ? 'pointer' : 'default';
        } else {
            this._layerLabel.style.opacity = '0';
            this.container.style.cursor = 'default';
        }
    }

    _handleClick() {
        if (this.hoveredLayer === this.nextLayerIndex) {
            this.layers[this.nextLayerIndex].active = true;
            this.nextLayerIndex++;
            if (this.nextLayerIndex >= this.layers.length) {
                this._statusLabel.textContent = 'mandala complete — the Self integrates all';
            }
        }
    }

    onScroll(state) {
        // Maybe auto-activate layers if they scroll past certain points?
        // Let's keep interaction primary.
        if (state.activeSection >= 3) { // Visualization section
            this._overlay.style.opacity = 1;
        } else {
            this._overlay.style.opacity = 0;
        }
    }

    update(dt) {
        this.time += dt;

        // Animate layer progress
        this.layers.forEach(layer => {
            if (layer.active && layer.progress < 1) {
                layer.progress = Math.min(1, layer.progress + 2.0 * dt); // speed up check
            }
        });
    }

    render() {
        const ctx = this.ctx;
        // BaseViz handles scaling via this.dpr and canvas size.
        // We use logical w/h for drawing cmds if we use ctx.scale().
        // BaseViz sets ctx.scale(dpr, dpr) in _onResize.
        const w = this.width;
        const h = this.height;
        const cx = w / 2;
        const cy = h / 2;
        const t = this.time;

        const scale = Math.min(w, h) / 400;

        // Clear
        ctx.fillStyle = '#07070a';
        ctx.fillRect(0, 0, w, h);

        // Global rotation
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.05);

        // ─── Draw layers from outside in ───
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const progress = layer.progress;
            if (progress === 0 && i !== this.nextLayerIndex) continue;

            const r = layer.radius * scale; // use scale
            const displayR = r * progress;
            const isHovered = i === this.hoveredLayer;
            const isNext = i === this.nextLayerIndex && !layer.active;

            // ─── Background fill ───
            if (layer.active) {
                const grad = ctx.createRadialGradient(0, 0, displayR * 0.3, 0, 0, displayR);
                grad.addColorStop(0, layer.color + '08');
                grad.addColorStop(1, layer.color + '15');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, displayR, 0, Math.PI * 2);
                ctx.fill();
            }

            // ─── Ring segments ───
            const segments = layer.segments;
            for (let s = 0; s < segments; s++) {
                const startAngle = (s / segments) * Math.PI * 2;
                const endAngle = ((s + 1) / segments) * Math.PI * 2 - 0.02;
                const breath = 1 + Math.sin(t * 0.6 + s * 0.5 + i) * 0.02;
                const segR = displayR * breath;

                ctx.save();
                ctx.strokeStyle = layer.active
                    ? (s % 2 === 0 ? layer.color : layer.secondaryColor)
                    : (isNext ? layer.color + '40' : layer.color + '15');

                ctx.lineWidth = layer.active
                    ? (isHovered ? 2.5 : 1.5)
                    : (isNext ? 1 : 0.5);

                if (layer.active) {
                    ctx.shadowColor = layer.color;
                    ctx.shadowBlur = isHovered ? 12 : 4;
                }

                ctx.globalAlpha = layer.active ? (0.6 + progress * 0.4) : 0.25;

                ctx.beginPath();
                ctx.arc(0, 0, segR, startAngle, endAngle);
                ctx.stroke();

                // ─── Petal shapes on active layers ───
                if (layer.active && segments >= 4 && s % 2 === 0) {
                    const petalAngle = startAngle + (endAngle - startAngle) / 2;
                    const petalR = displayR * 0.15 * progress;
                    const px = Math.cos(petalAngle) * (segR - petalR);
                    const py = Math.sin(petalAngle) * (segR - petalR);

                    ctx.fillStyle = layer.color + '20';
                    ctx.beginPath();
                    ctx.arc(px, py, petalR, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }

            // ─── Radial lines (quaternity axes on Self layer) ───
            if (i === 4 && layer.active) {
                ctx.save();
                ctx.strokeStyle = '#d4af3740';
                ctx.lineWidth = 1;
                for (let q = 0; q < 4; q++) {
                    const angle = (q / 4) * Math.PI * 2 + Math.PI / 4;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * displayR, Math.sin(angle) * displayR);
                    ctx.stroke();
                }
                // Quaternity labels (if scale permits)
                if (scale > 0.8) {
                    ctx.fillStyle = '#d4af37';
                    ctx.globalAlpha = 0.4;
                    ctx.font = '10px system-ui';
                    ctx.textAlign = 'center';
                    const qlabels = ['Thinking', 'Feeling', 'Sensation', 'Intuition'];
                    qlabels.forEach((ql, qi) => {
                        const angle = (qi / 4) * Math.PI * 2 + Math.PI / 4;
                        ctx.fillText(ql,
                            Math.cos(angle) * (displayR + 14),
                            Math.sin(angle) * (displayR + 14) + 3
                        );
                    });
                }
                ctx.restore();
            }
        }

        // ─── Central ego dot ───
        const egoR = (6 + Math.sin(t * 1.2) * 1.5) * scale;
        const egoGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, egoR * 4);
        egoGlow.addColorStop(0, '#ffd37a55');
        egoGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = egoGlow;
        ctx.fillRect(-egoR * 4, -egoR * 4, egoR * 8, egoR * 8);
        ctx.fillStyle = '#ffd37a';
        ctx.beginPath();
        ctx.arc(0, 0, egoR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    destroy() {
        if (this._overlay) this._overlay.remove();
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('click', this._onClick);
        super.destroy();
    }
}
