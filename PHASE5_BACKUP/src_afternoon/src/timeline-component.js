// Reusable D3 timeline component
// Usage: initTimeline('container-id', eventsArray)

export function initTimeline(containerId, events, options = {}) {
  const container = document.getElementById(containerId);
  if (!container || !events) return;

  const margin = { top: 40, right: 20, bottom: 40, left: 80 };
  const width = (options.width || 800) - margin.left - margin.right;
  const height = (options.height || 400) - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleTime()
    .domain(d3.extent(events, d => d.date))
    .range([0, width]);

  const categories = [...new Set(events.map(d => d.category))];

  const yScale = d3.scaleBand()
    .domain(categories)
    .range([0, height])
    .padding(0.4);

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(categories);

  g.append('g')
    .attr('class', 'timeline-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(5));

  g.append('g')
    .attr('class', 'timeline-axis')
    .call(d3.axisLeft(yScale));

  g.selectAll('.timeline-event')
    .data(events)
    .enter()
    .append('circle')
    .attr('class', 'timeline-event')
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScale(d.category) + yScale.bandwidth() / 2)
    .attr('r', d => (d.importance || 1) * 2 + 4)
    .style('fill', d => colorScale(d.category))
    .on('click', d => {
      if (options.onEventClick) options.onEventClick(d);
    });
}

window.initTimeline = initTimeline;
