// Simple local leaderboard stored in localStorage
class Leaderboard {
  constructor() {
    this.key = 'aion-leaderboard';
    this.entries = this.load();
    this.initUI();
  }

  load() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.entries));
  }

  updateScore(name, score) {
    const existing = this.entries.find(e => e.name === name);
    if (existing) {
      existing.score = score;
    } else {
      this.entries.push({ name, score });
    }
    this.entries.sort((a, b) => b.score - a.score);
    this.save();
    this.render();
  }

  getTop(n = 5) {
    return this.entries.slice(0, n);
  }

  initUI() {
    this.container = document.createElement('div');
    this.container.id = 'leaderboard';
    this.container.className = 'leaderboard';
    document.body.appendChild(this.container);
    this.render();
  }

  render() {
    if (!this.container) return;
    const list = this.getTop().map(e => `<li>${e.name}: ${e.score}</li>`).join('');
    this.container.innerHTML = `<h3>Leaderboard</h3><ol>${list}</ol>`;
  }
}

window.Leaderboard = Leaderboard;
window.addEventListener('DOMContentLoaded', () => {
  window.leaderboard = new Leaderboard();
});
