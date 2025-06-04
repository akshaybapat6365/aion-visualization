// Simple starfield background animation
window.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return; // Respect user preference for reduced motion
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'starfield';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Faint mandala watermark
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'mandala');
  Object.assign(svg.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    opacity: '0.04',
  });
  document.body.appendChild(svg);

  const starColor =
    getComputedStyle(document.documentElement).getPropertyValue('--primary') ||
    '#ffffff';

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawMandala();
  }
  window.addEventListener('resize', resize);
  resize();

  function drawMandala() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.6;
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', centerX);
      line.setAttribute('y1', centerY);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', starColor.trim());
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
  }

  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3,
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = starColor.trim();
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      s.x += s.dx;
      s.y += s.dy;
      if (s.x < 0) s.x += canvas.width;
      if (s.x > canvas.width) s.x -= canvas.width;
      if (s.y < 0) s.y += canvas.height;
      if (s.y > canvas.height) s.y -= canvas.height;
    }
    requestAnimationFrame(animate);
  }

  animate();
});
