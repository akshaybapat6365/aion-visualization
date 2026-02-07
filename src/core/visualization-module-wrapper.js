(function(global){
  class VisualizationModuleWrapper {
    constructor(options = {}) {
      this.options = {
        moduleId: 'unknown-module',
        chapterNumber: null,
        title: 'Visualization Module',
        objective: 'You will understand how this symbolic dynamic unfolds through interaction.',
        checklist: [],
        chapterLinks: { before: '#', after: '#' },
        checkpoints: [],
        mount: document.body,
        ...options
      };

      this.state = {
        startedAt: Date.now(),
        interactionCount: 0,
        completionLogged: false,
        interactions: [],
        unlockedCheckpoints: new Set()
      };

      this.storageKey = `aion-module-progress:${this.options.moduleId}`;
      this.injectStyles();
      this.render();
      this.bindLifecycle();
    }

    injectStyles() {
      if (document.getElementById('viz-module-wrapper-styles')) return;
      const style = document.createElement('style');
      style.id = 'viz-module-wrapper-styles';
      style.textContent = `
        .viz-module-panel {position: fixed;left: 1rem;top: 1rem;z-index: 1100;max-width: 320px;background: rgba(8,8,12,.88);border: 1px solid rgba(212,175,55,.5);border-radius: 10px;padding: .9rem;color: #f1f1f1;font-family: system-ui,sans-serif;font-size: .9rem;line-height: 1.4;backdrop-filter: blur(6px);} 
        .viz-module-panel h3 {margin: .2rem 0 .5rem;color: #D4AF37;font-size: 1rem;} 
        .viz-module-panel h4 {margin: .7rem 0 .3rem;color: #D4AF37;font-size: .85rem;text-transform: uppercase;letter-spacing: .04em;} 
        .viz-module-panel ul {margin: .2rem 0 .5rem 1.1rem;padding: 0;} 
        .viz-module-panel a {color: #8fd3ff;} 
        .viz-module-checkpoint {margin-top: .35rem;padding: .35rem .45rem;border: 1px solid #444;border-radius: 6px;} 
        .viz-module-checkpoint.done {border-color: #4CAF50;background: rgba(76,175,80,.12);} 
        .viz-module-exit {margin-top: .7rem;background: #D4AF37;border: 0;color:#000;padding: .45rem .6rem;border-radius: 6px;cursor:pointer;font-weight: 600;} 
        .viz-insight-toast {position: fixed;bottom: 1rem;right: 1rem;background: #111;border:1px solid #D4AF37;color:#f7f7f7;padding:.7rem .8rem;border-radius:8px;z-index:1200;max-width:320px;} 
      `;
      document.head.appendChild(style);
    }

    render() {
      const list = this.options.checkpoints.map(cp => `<div class="viz-module-checkpoint" data-cp="${cp.id}">${cp.label}</div>`).join('');
      const checklist = this.options.checklist.map(item => `<li>${item}</li>`).join('');
      this.panel = document.createElement('aside');
      this.panel.className = 'viz-module-panel';
      this.panel.innerHTML = `
        <h3>${this.options.title}</h3>
        <h4>Objective</h4>
        <div>You will understand ${this.options.objective}</div>
        <h4>Watch for</h4>
        <ul>${checklist}</ul>
        <h4>Read before/after</h4>
        <div><a href="${this.options.chapterLinks.before}">Read before</a> · <a href="${this.options.chapterLinks.after}">Read after</a></div>
        <h4>Insight checkpoints</h4>
        <div>${list || '<div class="viz-module-checkpoint">Interact to unlock insights.</div>'}</div>
        <button class="viz-module-exit" type="button">What changed in your understanding?</button>
      `;
      this.options.mount.appendChild(this.panel);
      this.panel.querySelector('.viz-module-exit').addEventListener('click', () => this.promptMicroSummary());
    }

    bindLifecycle() {
      this.trackInteraction('module_opened');
      window.addEventListener('beforeunload', () => {
        if (!this.state.completionLogged) {
          this.promptMicroSummary(true);
        }
      });
    }

    trackInteraction(action, detail = {}) {
      this.state.interactionCount += 1;
      this.state.interactions.push({ action, detail, at: new Date().toISOString() });

      this.options.checkpoints.forEach(cp => {
        if (!this.state.unlockedCheckpoints.has(cp.id) && cp.trigger({ action, detail, wrapper: this })) {
          this.state.unlockedCheckpoints.add(cp.id);
          const el = this.panel.querySelector(`[data-cp="${cp.id}"]`);
          if (el) el.classList.add('done');
          this.showToast(`Checkpoint: ${cp.label}`);
        }
      });

      this.persist();
      this.logToProgressTracker(action, detail);
    }

    promptMicroSummary(passive = false) {
      if (this.state.completionLogged) return;
      const summary = passive
        ? 'Session ended; user exited before writing summary.'
        : window.prompt('What changed in your understanding? (1-2 lines)') || 'No summary entered.';
      this.complete(summary);
    }

    complete(microSummary) {
      this.state.completionLogged = true;
      const payload = {
        moduleId: this.options.moduleId,
        chapterNumber: this.options.chapterNumber,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - this.state.startedAt,
        interactionCount: this.state.interactionCount,
        unlockedCheckpoints: [...this.state.unlockedCheckpoints],
        microSummary,
        keyInteractions: this.state.interactions.slice(-20)
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      this.logToProgressTracker('module_completed', payload);
      this.showToast('Reflection saved. Progress updated.');
    }

    logToProgressTracker(action, detail) {
      if (global.progressTracker && typeof global.progressTracker.trackVisualization === 'function' && this.options.chapterNumber) {
        global.progressTracker.trackVisualization(this.options.chapterNumber, `${this.options.moduleId}:${action}`);
      }
    }

    persist() {
      localStorage.setItem(`${this.storageKey}:session`, JSON.stringify({
        interactionCount: this.state.interactionCount,
        unlockedCheckpoints: [...this.state.unlockedCheckpoints],
        interactions: this.state.interactions.slice(-100)
      }));
    }

    showToast(text) {
      const toast = document.createElement('div');
      toast.className = 'viz-insight-toast';
      toast.textContent = text;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2200);
    }
  }

  global.VisualizationModuleWrapper = VisualizationModuleWrapper;
})(window);
