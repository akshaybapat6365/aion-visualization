/**
 * self-mandala.js — Ch4 Self Mandala Visualization
 *
 * D3 SVG concentric-ring mandala representing the structure of the psyche:
 *   Center (Self) → Anima/Animus → Shadow → Ego (outermost)
 *
 * Interactive: click a ring to expand it and reveal its concept definition.
 * Gold gradient emanates from the center outward.
 */

const LAYERS = [
    {
        id: 'self',
        label: 'The Self',
        description: 'The totality of the psyche — both conscious and unconscious. The Self is the archetype of wholeness, symbolized by the mandala.',
        color: '#d4af37',
        glowColor: 'rgba(212, 175, 55, 0.5)',
        innerRadius: 0,
        outerRadius: 0.2
    },
    {
        id: 'anima-animus',
        label: 'Anima / Animus',
        description: 'The contrasexual archetype — the feminine in man (anima) and the masculine in woman (animus). Bridge between ego and the deeper unconscious.',
        color: '#a67c00',
        glowColor: 'rgba(166, 124, 0, 0.35)',
        innerRadius: 0.22,
        outerRadius: 0.42
    },
    {
        id: 'shadow',
        label: 'The Shadow',
        description: 'The repressed, undeveloped, or denied aspects of personality. Often projected onto others. Integration is the first task of individuation.',
        color: '#525252',
        glowColor: 'rgba(82, 82, 82, 0.3)',
        innerRadius: 0.44,
        outerRadius: 0.68
    },
    {
        id: 'ego',
        label: 'The Ego',
        description: 'The center of consciousness and personal identity. The ego mediates between inner and outer worlds but represents only a fraction of the total psyche.',
        color: '#737373',
        glowColor: 'rgba(115, 115, 115, 0.25)',
        innerRadius: 0.70,
        outerRadius: 0.92
    }
];

export default class SelfMandala {
    constructor(container) {
        this.container = typeof container === 'string'
            ? document.getElementById(container)
            : container;
        this.svg = null;
        this.selectedLayer = null;
        this.tooltip = null;
        this.init();
    }

    init() {
        if (!this.container) return;

        const width = Math.min(this.container.clientWidth || 600, 600);
        const height = width;
        const cx = width / 2;
        const cy = height / 2;
        const maxR = (width / 2) * 0.95;

        // Create SVG
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.maxWidth = `${width}px`;
        this.svg.style.display = 'block';
        this.svg.style.margin = '0 auto';

        // Defs for glow filter + radial gradient
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        // Gold radial gradient from center
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        grad.id = 'mandala-gold-glow';
        grad.innerHTML = `
      <stop offset="0%" stop-color="rgba(212,175,55,0.18)" />
      <stop offset="60%" stop-color="rgba(212,175,55,0.04)" />
      <stop offset="100%" stop-color="transparent" />
    `;
        defs.appendChild(grad);

        // Glow filter
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.id = 'ring-glow';
        filter.innerHTML = `
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    `;
        defs.appendChild(filter);

        this.svg.appendChild(defs);

        // Background glow circle
        const bgGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgGlow.setAttribute('cx', cx);
        bgGlow.setAttribute('cy', cy);
        bgGlow.setAttribute('r', maxR);
        bgGlow.setAttribute('fill', 'url(#mandala-gold-glow)');
        this.svg.appendChild(bgGlow);

        // Draw rings (outermost first so inner paints on top)
        const reversedLayers = [...LAYERS].reverse();
        reversedLayers.forEach(layer => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('data-layer', layer.id);
            group.style.cursor = 'pointer';
            group.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';

            const inner = layer.innerRadius * maxR;
            const outer = layer.outerRadius * maxR;

            // Ring path using two arcs
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = this._ringPath(cx, cy, inner, outer);
            path.setAttribute('d', d);
            path.setAttribute('fill', layer.color);
            path.setAttribute('fill-opacity', '0.35');
            path.setAttribute('stroke', layer.color);
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('stroke-opacity', '0.6');
            group.appendChild(path);

            // Label
            const labelRadius = (inner + outer) / 2;
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', cx);
            label.setAttribute('y', cy - labelRadius);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'central');
            label.setAttribute('fill', layer.id === 'self' ? '#ffd37a' : '#a3a3a3');
            label.setAttribute('font-size', layer.id === 'self' ? '16' : '13');
            label.setAttribute('font-weight', layer.id === 'self' ? '600' : '400');
            label.setAttribute('font-family', "'Fraunces', ui-serif, 'Iowan Old Style', serif");
            label.setAttribute('letter-spacing', '0.05em');
            label.setAttribute('pointer-events', 'none');
            label.textContent = layer.label;
            group.appendChild(label);

            // Click interaction
            group.addEventListener('click', () => this._selectLayer(layer));

            // Hover
            group.addEventListener('mouseenter', () => {
                path.setAttribute('fill-opacity', '0.55');
                if (layer.id !== 'self') path.setAttribute('filter', 'url(#ring-glow)');
            });
            group.addEventListener('mouseleave', () => {
                path.setAttribute('fill-opacity', this.selectedLayer?.id === layer.id ? '0.65' : '0.35');
                path.removeAttribute('filter');
            });

            this.svg.appendChild(group);
        });

        // Tooltip panel
        this.tooltip = document.createElement('div');
        Object.assign(this.tooltip.style, {
            marginTop: '16px',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            color: '#a3a3a3',
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: '14px',
            lineHeight: '1.65',
            textAlign: 'center',
            opacity: '0',
            transition: 'opacity 300ms ease',
            minHeight: '60px'
        });
        this.tooltip.innerHTML = '<em style="color:#737373;">Click a ring to explore its meaning</em>';
        this.tooltip.style.opacity = '1';

        this.container.appendChild(this.svg);
        this.container.appendChild(this.tooltip);
    }

    _ringPath(cx, cy, inner, outer) {
        if (inner === 0) {
            // Simple circle for innermost
            return `
        M ${cx} ${cy - outer}
        A ${outer} ${outer} 0 1 1 ${cx} ${cy + outer}
        A ${outer} ${outer} 0 1 1 ${cx} ${cy - outer}
        Z
      `;
        }
        // Annulus: outer arc CW, inner arc CCW
        return `
      M ${cx} ${cy - outer}
      A ${outer} ${outer} 0 1 1 ${cx} ${cy + outer}
      A ${outer} ${outer} 0 1 1 ${cx} ${cy - outer}
      Z
      M ${cx} ${cy - inner}
      A ${inner} ${inner} 0 1 0 ${cx} ${cy + inner}
      A ${inner} ${inner} 0 1 0 ${cx} ${cy - inner}
      Z
    `;
    }

    _selectLayer(layer) {
        // Update visual state
        this.selectedLayer = layer;
        this.svg.querySelectorAll('g[data-layer]').forEach(g => {
            const path = g.querySelector('path');
            if (g.getAttribute('data-layer') === layer.id) {
                path.setAttribute('fill-opacity', '0.65');
                path.setAttribute('stroke-width', '2.5');
                path.setAttribute('stroke', '#d4af37');
            } else {
                path.setAttribute('fill-opacity', '0.25');
                path.setAttribute('stroke-width', '1');
                path.setAttribute('stroke-opacity', '0.4');
            }
        });

        // Show definition
        this.tooltip.style.opacity = '0';
        setTimeout(() => {
            this.tooltip.innerHTML = `
        <strong style="color:#ffd37a;font-family:'Fraunces',serif;font-size:16px;letter-spacing:0.03em;">
          ${layer.label}
        </strong>
        <p style="margin:8px 0 0;color:#a3a3a3;">${layer.description}</p>
      `;
            this.tooltip.style.opacity = '1';
        }, 200);
    }

    pause() { /* static visualization — no animation to pause */ }
    resume() { /* no-op */ }

    dispose() {
        if (this.svg) this.svg.remove();
        if (this.tooltip) this.tooltip.remove();
        this.svg = null;
        this.tooltip = null;
    }
}
