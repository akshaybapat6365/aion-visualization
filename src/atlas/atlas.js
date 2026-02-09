const CLUSTER_COLORS = {
  Identity: '#E4C568',
  'Relational Psyche': '#9CC9E8',
  Selfhood: '#8DDEB8',
  Symbolism: '#B5A0FF',
  Alchemy: '#FFA98F',
  Cosmology: '#F6E6A7'
};

const NODES = [
  { id: 1, title: 'The Ego', cluster: 'Identity' },
  { id: 2, title: 'The Shadow', cluster: 'Identity' },
  { id: 3, title: 'The Syzygy', cluster: 'Relational Psyche' },
  { id: 4, title: 'The Self', cluster: 'Selfhood' },
  { id: 5, title: 'Christ as Symbol', cluster: 'Selfhood' },
  { id: 6, title: 'Sign of the Fishes', cluster: 'Symbolism' },
  { id: 7, title: 'Nostradamus', cluster: 'Symbolism' },
  { id: 8, title: 'Historical Fish Symbol', cluster: 'Symbolism' },
  { id: 9, title: 'Ambivalence of Fish', cluster: 'Symbolism' },
  { id: 10, title: 'Fish in Alchemy', cluster: 'Alchemy' },
  { id: 11, title: 'Alchemical Interpretation', cluster: 'Alchemy' },
  { id: 12, title: 'Psychology of Alchemy', cluster: 'Alchemy' },
  { id: 13, title: 'Gnostic Symbols', cluster: 'Cosmology' },
  { id: 14, title: 'Dynamics of the Self', cluster: 'Cosmology' }
];

const LINKS = [
  ...NODES.slice(0, -1).map((node, index) => ({ source: node.id, target: NODES[index + 1].id, type: 'journey' })),
  { source: 2, target: 4, type: 'integration' },
  { source: 3, target: 5, type: 'integration' },
  { source: 6, target: 10, type: 'symbolic' },
  { source: 9, target: 13, type: 'symbolic' },
  { source: 11, target: 14, type: 'synthesis' }
];

function initAtlas() {
  const svg = d3.select('#atlas');
  if (svg.empty()) return;

  const width = 1200;
  const height = 700;

  const linkGroup = svg.append('g').attr('stroke-opacity', 0.45);
  const nodeGroup = svg.append('g');

  const simulation = d3.forceSimulation(NODES)
    .force('link', d3.forceLink(LINKS).id(d => d.id).distance(l => (l.type === 'journey' ? 90 : 140)).strength(0.85))
    .force('charge', d3.forceManyBody().strength(-330))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('x', d3.forceX(width / 2).strength(0.04))
    .force('y', d3.forceY(height / 2).strength(0.06));

  const links = linkGroup.selectAll('path')
    .data(LINKS)
    .enter()
    .append('path')
    .attr('fill', 'none')
    .attr('stroke-width', d => (d.type === 'journey' ? 2.3 : 1.5))
    .attr('stroke', d => (d.type === 'journey' ? '#D4AF37' : '#7AA6C8'));

  const nodes = nodeGroup.selectAll('g')
    .data(NODES)
    .enter()
    .append('g')
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded));

  nodes.append('circle')
    .attr('r', 17)
    .attr('fill', d => CLUSTER_COLORS[d.cluster] || '#ddd')
    .attr('stroke', '#1a1a1a')
    .attr('stroke-width', 2.5)
    .on('click', (_, d) => showDetails(d));

  nodes.append('text')
    .text(d => d.id)
    .attr('fill', '#111')
    .attr('font-size', 11)
    .attr('font-weight', 700)
    .attr('text-anchor', 'middle')
    .attr('dy', 4)
    .style('pointer-events', 'none');

  simulation.on('tick', () => {
    links.attr('d', d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });

    nodes.attr('transform', d => `translate(${d.x}, ${d.y})`);
  });

  const chapterParam = Number(new URLSearchParams(window.location.search).get('chapter'));
  if (chapterParam) {
    const matching = NODES.find(node => node.id === chapterParam);
    if (matching) showDetails(matching);
  }

  function dragStarted(event) {
    if (!event.active) simulation.alphaTarget(0.2).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragEnded(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}

function showDetails(node) {
  const outbound = LINKS
    .filter(link => link.source.id === node.id || link.source === node.id)
    .map(link => link.target.id || link.target)
    .join(', ') || 'None';

  const title = document.getElementById('detail-title');
  const body = document.getElementById('detail-body');
  if (!title || !body) return;

  title.textContent = `Chapter ${node.id}: ${node.title}`;
  body.innerHTML = `<strong>Cluster:</strong> ${node.cluster}<br/><strong>Pathways forward:</strong> ${outbound}<br/><strong>Route:</strong> <a href="/journey/chapter/ch${node.id}">Open chapter view</a>`;

  if (window.learningAnalytics && typeof window.learningAnalytics.trackEvent === 'function') {
    window.learningAnalytics.trackEvent('atlas_node_selected', { chapterNumber: node.id, cluster: node.cluster });
  }
}

window.addEventListener('DOMContentLoaded', initAtlas);
