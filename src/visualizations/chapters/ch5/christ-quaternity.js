import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * christ-quaternity.js — Ch5 Quaternity Diagram
 * Ported to BaseViz (Phase 6 Architecture)
 * Note: uses SVG, so checks/hides the default BaseViz canvas.
 */

const POLES = [
    {
        id: 'father',
        label: 'God / Father',
        angle: -90, // top
        description: 'The creator archetype — transcendent authority, source of the logos principle. In the trinity, the ungenerated origin.',
        color: '#ffd37a'
    },
    {
        id: 'christ',
        label: 'Christ / Self',
        angle: 0, // right
        description: 'Symbol of the Self — the God-man who unites the divine and human. Jung argues Christ represents only the light half of the Self, leaving evil excluded.',
        color: '#d4af37'
    },
    {
        id: 'shadow',
        label: 'Devil / Shadow',
        angle: 90, // bottom
        description: 'The excluded fourth — the dark counterpart to Christ. Jung insists psychic totality requires integration of this shadow element, completing the quaternity.',
        color: '#525252'
    },
    {
        id: 'spirit',
        label: 'Holy Spirit / Mother',
        angle: 180, // left
        description: 'The relational, maternal principle — the Sophia. Often suppressed in Western theology, yet essential for wholeness in Jung\'s quaternitarian schema.',
        color: '#a67c00'
    }
];

const TENSIONS = [
    { from: 'father', to: 'shadow', label: 'Light vs. Dark' },
    { from: 'christ', to: 'spirit', label: 'Logos vs. Eros' },
    { from: 'father', to: 'christ', label: 'Source → Manifestation' },
    { from: 'christ', to: 'shadow', label: 'Good ↔ Evil' },
    { from: 'shadow', to: 'spirit', label: 'Repressed ↔ Feminine' },
    { from: 'spirit', to: 'father', label: 'Mother ↔ Father' }
];

export default class ChristQuaternityViz extends BaseViz {
    constructor(container) {
        super(container);
    }

    async init() {
        // SVG-based viz, so hide the default canvas
        if (this.canvas) {
            this.canvas.style.display = 'none';
        }

        this.svg = null;
        this.tooltip = null;
        this.selectedPole = null;
        this.lines = {};
        this.poleGroups = {};

        this._createSVG();

        // BaseViz handles resize via _onResize -> onResize
        // But SVG scales via viewBox/width=100%, so automatic resize is handled by CSS mostly.
        // We might need to redraw if container aspect ratio changes drastically but viewBox handles it.
    }

    _createSVG() {
        // Determine size based on container (BaseViz has this.width/this.height)
        // But for SVG viewBox we want a square logical size usually.
        const size = 520;
        const cx = size / 2;
        const cy = size / 2;
        const radius = size * 0.35;

        // Create SVG
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.maxWidth = `${size}px`;
        this.svg.style.display = 'block';
        this.svg.style.margin = '0 auto';
        // BaseViz container is fixed/absolute. 
        this.svg.style.position = 'absolute';
        this.svg.style.top = '50%';
        this.svg.style.left = '50%';
        this.svg.style.transform = 'translate(-50%, -50%)';

        // Defs
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.id = 'quat-glow';
        filter.innerHTML = `
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        `;
        defs.appendChild(filter);
        this.svg.appendChild(defs);

        // Center diamond outline
        const polePositions = {};
        POLES.forEach(pole => {
            const rad = (pole.angle * Math.PI) / 180;
            polePositions[pole.id] = {
                x: cx + radius * Math.cos(rad),
                y: cy + radius * Math.sin(rad)
            };
        });

        // Draw connection lines (initially dim)
        TENSIONS.forEach(tension => {
            const p1 = polePositions[tension.from];
            const p2 = polePositions[tension.to];
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', p1.x);
            line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x);
            line.setAttribute('y2', p2.y);
            line.setAttribute('stroke', 'rgba(212,175,55,0.08)');
            line.setAttribute('stroke-width', '1');
            line.setAttribute('stroke-dasharray', '4,6');
            line.style.transition = 'all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)';
            this.lines[`${tension.from}-${tension.to}`] = line;
            this.svg.appendChild(line);
        });

        // Draw diamond frame
        const diamondPoints = [
            polePositions.father,
            polePositions.christ,
            polePositions.shadow,
            polePositions.spirit
        ];
        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        diamond.setAttribute('points', diamondPoints.map(p => `${p.x},${p.y}`).join(' '));
        diamond.setAttribute('fill', 'none');
        diamond.setAttribute('stroke', 'rgba(212,175,55,0.15)');
        diamond.setAttribute('stroke-width', '1');
        this.svg.appendChild(diamond);

        // Center label
        const centerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        centerLabel.setAttribute('x', cx);
        centerLabel.setAttribute('y', cy);
        centerLabel.setAttribute('text-anchor', 'middle');
        centerLabel.setAttribute('dominant-baseline', 'central');
        centerLabel.setAttribute('fill', '#404040');
        centerLabel.setAttribute('font-size', '11');
        centerLabel.setAttribute('font-family', "'Fraunces', serif");
        centerLabel.setAttribute('letter-spacing', '0.15em');
        centerLabel.textContent = 'QUATERNITY';
        this.svg.appendChild(centerLabel);

        // Draw pole nodes
        POLES.forEach(pole => {
            const pos = polePositions[pole.id];
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('data-pole', pole.id);
            group.style.cursor = 'pointer';

            // Outer circle (button)
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', 28);
            circle.setAttribute('fill', pole.color);
            circle.setAttribute('fill-opacity', '0.2');
            circle.setAttribute('stroke', pole.color);
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('stroke-opacity', '0.6');
            circle.style.transition = 'all 300ms ease';
            group.appendChild(circle);

            // Inner dot
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', pos.x);
            dot.setAttribute('cy', pos.y);
            dot.setAttribute('r', 5);
            dot.setAttribute('fill', pole.color);
            dot.setAttribute('fill-opacity', '0.8');
            dot.setAttribute('pointer-events', 'none');
            group.appendChild(dot);

            // Label
            const labelOffsetY = pole.angle === -90 ? -42 : pole.angle === 90 ? 48 : 0;
            const labelOffsetX = pole.angle === 0 ? 44 : pole.angle === 180 ? -44 : 0;
            const anchor = pole.angle === 0 ? 'start' : pole.angle === 180 ? 'end' : 'middle';

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', pos.x + labelOffsetX);
            label.setAttribute('y', pos.y + labelOffsetY);
            label.setAttribute('text-anchor', anchor);
            label.setAttribute('dominant-baseline', 'central');
            label.setAttribute('fill', '#a3a3a3');
            label.setAttribute('font-size', '12');
            label.setAttribute('font-family', "'Fraunces', serif");
            label.setAttribute('letter-spacing', '0.04em');
            label.setAttribute('pointer-events', 'none');
            label.textContent = pole.label;
            group.appendChild(label);

            // Interactions
            group.addEventListener('mouseenter', () => {
                circle.setAttribute('fill-opacity', '0.45');
                circle.setAttribute('stroke-width', '3');
            });
            group.addEventListener('mouseleave', () => {
                const isSelected = this.selectedPole?.id === pole.id;
                circle.setAttribute('fill-opacity', isSelected ? '0.5' : '0.2');
                circle.setAttribute('stroke-width', isSelected ? '3' : '2');
            });

            // Use arrow function
            group.addEventListener('click', () => this._selectPole(pole));

            this.poleGroups[pole.id] = group;
            this.svg.appendChild(group);
        });

        // Tooltip
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
            opacity: '1',
            transition: 'opacity 300ms ease',
            minHeight: '60px',
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: '400px',
            pointerEvents: 'none'
        });
        this.tooltip.innerHTML = '<em style="color:#737373;">Click a pole to explore Jung\'s quaternity</em>';

        this.container.appendChild(this.svg);
        this.container.appendChild(this.tooltip);
    }

    _selectPole(pole) {
        this.selectedPole = pole;

        // Reset all lines
        Object.values(this.lines).forEach(line => {
            line.setAttribute('stroke', 'rgba(212,175,55,0.08)');
            line.setAttribute('stroke-width', '1');
        });

        // Reset all poles
        Object.entries(this.poleGroups).forEach(([id, group]) => {
            const circle = group.querySelector('circle');
            if (id === pole.id) {
                circle.setAttribute('fill-opacity', '0.5');
                circle.setAttribute('stroke-width', '3');
                circle.setAttribute('filter', 'url(#quat-glow)');
            } else {
                circle.setAttribute('fill-opacity', '0.15');
                circle.setAttribute('stroke-width', '1.5');
                circle.removeAttribute('filter');
            }
        });

        // Highlight relevant tension lines
        TENSIONS.forEach(tension => {
            if (tension.from === pole.id || tension.to === pole.id) {
                const key = `${tension.from}-${tension.to}`;
                const line = this.lines[key];
                if (line) {
                    line.setAttribute('stroke', 'rgba(212,175,55,0.45)');
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('stroke-dasharray', '6,4');
                }
            }
        });

        // Update tooltip
        this.tooltip.style.opacity = '0';
        setTimeout(() => {
            const relevantTensions = TENSIONS
                .filter(t => t.from === pole.id || t.to === pole.id)
                .map(t => `<span style="color:#d4af37;font-size:12px;">${t.label}</span>`)
                .join(' · ');

            this.tooltip.innerHTML = `
        <strong style="color:${pole.color};font-family:'Fraunces',serif;font-size:16px;letter-spacing:0.03em;">
          ${pole.label}
        </strong>
        <p style="margin:8px 0 0;color:#a3a3a3;">${pole.description}</p>
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
          ${relevantTensions}
        </div>
      `;
            this.tooltip.style.opacity = '1';
        }, 200);
    }

    onScroll(state) {
        // Can add reactivity here if needed, e.g. auto-select poles
    }

    render() {
        // No-op for SVG
    }

    destroy() {
        if (this.svg) this.svg.remove();
        if (this.tooltip) this.tooltip.remove();
        super.destroy(); // handles container cleanup
    }
}
