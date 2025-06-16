// Ensure all animations start when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Force canvas resize for all canvases
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
            }
        });
        resizeObserver.observe(canvas);
    });
    
    // Ensure SVG animations are running
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
        // Force reflow to restart animations
        svg.style.display = 'none';
        svg.offsetHeight; // Trigger reflow
        svg.style.display = '';
    });
    
    // Handle iframe loading
    const iframes = document.querySelectorAll('.viz-container iframe');
    iframes.forEach(iframe => {
        iframe.addEventListener('error', function() {
            console.error('Failed to load iframe:', iframe.src);
            // Try reloading once
            setTimeout(() => {
                iframe.src = iframe.src;
            }, 1000);
        });
    });
});

// Intersection Observer for lazy loading animations
const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            // Start any paused animations
            const animatedElements = entry.target.querySelectorAll('[data-animate]');
            animatedElements.forEach(el => {
                el.style.animationPlayState = 'running';
            });
        }
    });
}, {
    threshold: 0.1
});

// Observe all viz containers
document.querySelectorAll('.viz-container').forEach(container => {
    animationObserver.observe(container);
});