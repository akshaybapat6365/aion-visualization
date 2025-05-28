// Simple starfield background animation
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');
  canvas.className = 'starfield';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3
  }));
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
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
