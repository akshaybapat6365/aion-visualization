// Simple world map visualization for cultural context
// events: [{name, year, lat, lon, type}]
export function initCulturalMap(containerId, events, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const width = options.width || 800;
  const height = options.height || 450;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const projection = d3.geoNaturalEarth1()
    .scale(width / 6.5)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  svg.append('path')
    .datum({ type: 'Sphere' })
    .attr('d', path)
    .attr('fill', '#0a0a0a')
    .attr('stroke', '#333');

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  svg.selectAll('.culture-event')
    .data(events)
    .enter()
    .append('circle')
    .attr('class', 'culture-event')
    .attr('cx', d => projection([d.lon, d.lat])[0])
    .attr('cy', d => projection([d.lon, d.lat])[1])
    .attr('r', d => (d.intensity || 0.8) * 8)
    .attr('fill', d => color(d.type))
    .attr('opacity', 0.7)
    .on('click', d => {
      if (options.onEventClick) options.onEventClick(d);
    });
}

window.initCulturalMap = initCulturalMap;
