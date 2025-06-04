class PersonalizationEngine {
  constructor(storageKey = 'aion-personalization') {
    this.storageKey = storageKey;
    this.userProfile = this.loadPreferences();
  }

  loadPreferences() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {
        psychologicalType: null,
        preferredVisualStyle: 'abstract',
        readingProgress: {},
        interactionHistory: [],
        symbolPreferences: []
      };
    } catch (e) {
      console.error('Failed to load personalization', e);
      return {
        psychologicalType: null,
        preferredVisualStyle: 'abstract',
        readingProgress: {},
        interactionHistory: [],
        symbolPreferences: []
      };
    }
  }

  savePreferences() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.userProfile));
    } catch (e) {
      console.error('Failed to save personalization', e);
    }
  }

  adaptVisualization(chapter) {
    document.body.dataset.visualStyle = this.userProfile.preferredVisualStyle;
  }

  setPreference(key, value) {
    this.userProfile[key] = value;
    this.savePreferences();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.personalization = new PersonalizationEngine();
});
