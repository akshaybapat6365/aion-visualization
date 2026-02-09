// Shared semantic animation grammar runtime for visualization containers.
(function initSemanticMotion() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const relationBehaviorMap = {
    opposes: 'opposition',
    'relates_to': 'integration',
    'integrates_into': 'integration',
    'develops_toward': 'integration',
    'guides_to': 'integration',
    'achieved_through': 'integration',
    requires: 'deflation',
    supports: 'deflation',
    'resolved_by': 'deflation',
    'manifests_as': 'inflation',
    'expresses_as': 'inflation',
    'symbolized_by': 'cyclical-return',
    'structured_as': 'cyclical-return',
    represents: 'cyclical-return',
    'completed_by': 'cyclical-return',
    'culminates_in': 'cyclical-return',
    'aspect_of': 'deflation',
    enacts: 'inflation'
  };

  const semanticMotionPresets = {
    opposition: {
      keyframes: [{ transform: 'translateX(0) scale(1)' }, { transform: 'translateX(-12px) scale(0.98)' }, { transform: 'translateX(12px) scale(0.98)' }, { transform: 'translateX(0) scale(1)' }],
      options: { duration: 460, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    },
    integration: {
      keyframes: [{ opacity: 0.88, transform: 'scale(0.98)' }, { opacity: 1, transform: 'scale(1)' }],
      options: { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    },
    inflation: {
      keyframes: [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(1.05)', filter: 'brightness(1.1)' }, { transform: 'scale(1)', filter: 'brightness(1)' }],
      options: { duration: 520, easing: 'ease-out' }
    },
    deflation: {
      keyframes: [{ transform: 'scale(1.02)', opacity: 1 }, { transform: 'scale(0.96)', opacity: 0.84 }, { transform: 'scale(1)', opacity: 1 }],
      options: { duration: 440, easing: 'ease-out' }
    },
    'cyclical-return': {
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0deg)' }],
      options: { duration: 800, easing: 'ease-in-out' }
    }
  };

  const antagonisticChapterPairs = new Set(['3-4', '4-3', '7-8', '8-7']);

  const choreography = {
    relationBehaviorMap,
    semanticMotionPresets,

    isReducedMotion() {
      return prefersReducedMotion.matches;
    },

    getMotionBehaviorForRelation(relationType) {
      return relationBehaviorMap[relationType] || 'integration';
    },

    getChapterSemantic(fromRoute, toRoute) {
      if (!fromRoute || !fromRoute.chapterId || !toRoute || !toRoute.chapterId) {
        return 'integration';
      }

      if (fromRoute.chapterId === 14 && toRoute.chapterId === 1) {
        return 'cyclical-return';
      }

      const pairKey = `${fromRoute.chapterId}-${toRoute.chapterId}`;
      if (antagonisticChapterPairs.has(pairKey)) {
        return 'opposition';
      }

      const delta = toRoute.chapterId - fromRoute.chapterId;
      if (Math.abs(delta) >= 3) {
        return 'inflation';
      }

      if (delta > 0) {
        return 'integration';
      }

      if (delta < 0) {
        return 'deflation';
      }

      return 'integration';
    },

    applySemanticTransition({ semantic = 'integration', target = document.body, detail = {} } = {}) {
      if (!target) return;

      target.dataset.motionSemantic = semantic;
      target.classList.add(`semantic-${semantic}`);

      if (this.isReducedMotion()) {
        target.dataset.motionState = semantic;
        document.dispatchEvent(new CustomEvent('aion:semanticTransition', {
          detail: { semantic, reducedMotion: true, ...detail }
        }));
        return;
      }

      const preset = semanticMotionPresets[semantic] || semanticMotionPresets.integration;
      if (target.animate) {
        target.animate(preset.keyframes, {
          ...preset.options,
          fill: 'none'
        });
      }

      document.dispatchEvent(new CustomEvent('aion:semanticTransition', {
        detail: { semantic, reducedMotion: false, ...detail }
      }));
    },

    applyChapterTransition(fromRoute, toRoute) {
      const semantic = this.getChapterSemantic(fromRoute, toRoute);
      this.applySemanticTransition({
        semantic,
        target: document.body,
        detail: {
          from: fromRoute?.path,
          to: toRoute?.path,
          chapterFrom: fromRoute?.chapterId,
          chapterTo: toRoute?.chapterId
        }
      });
      return semantic;
    }
  };

  window.AionMotionChoreographer = choreography;
})();

// Ensure all animations start when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  // Force canvas resize for all canvases
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach((canvas) => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
      }
    });
    resizeObserver.observe(canvas);
  });

  // Ensure SVG animations are running
  const svgs = document.querySelectorAll('svg');
  svgs.forEach((svg) => {
    svg.style.display = 'none';
    svg.offsetHeight;
    svg.style.display = '';
  });

  // Handle iframe loading
  const iframes = document.querySelectorAll('.viz-container iframe');
  iframes.forEach((iframe) => {
    iframe.addEventListener('error', () => {
      console.error('Failed to load iframe:', iframe.src);
      setTimeout(() => {
        iframe.src = iframe.src;
      }, 1000);
    });
  });

  // Attach semantic choreography to chapter route changes if router is active.
  document.addEventListener('aion:routeChange', (event) => {
    const { route, previousRoute } = event.detail || {};
    if (window.AionMotionChoreographer) {
      window.AionMotionChoreographer.applyChapterTransition(previousRoute, route);
    }
  });
});

// Intersection Observer for lazy loading animations
const animationObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    entry.target.classList.add('animate');

    const animatedElements = entry.target.querySelectorAll('[data-animate]');
    animatedElements.forEach((el) => {
      const relationType = el.dataset.relationType;
      if (relationType && window.AionMotionChoreographer) {
        const semantic = window.AionMotionChoreographer.getMotionBehaviorForRelation(relationType);
        window.AionMotionChoreographer.applySemanticTransition({
          semantic,
          target: el,
          detail: { relationType }
        });
      }

      el.style.animationPlayState = window.AionMotionChoreographer?.isReducedMotion() ? 'paused' : 'running';
    });
  });
}, {
  threshold: 0.1
});

document.querySelectorAll('.viz-container').forEach((container) => {
  animationObserver.observe(container);
});
