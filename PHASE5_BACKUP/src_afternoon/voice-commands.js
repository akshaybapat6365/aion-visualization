// Voice command manager using Web Speech API
class VoiceCommandManager {
  constructor(commands = {}) {
    this.commands = commands;
    this.recognition = null;
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.onresult = event => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      Object.entries(this.commands).forEach(([phrase, callback]) => {
        if (transcript.includes(phrase.toLowerCase())) {
          callback();
        }
      });
    };
  }

  start() {
    if (this.recognition) this.recognition.start();
  }

  stop() {
    if (this.recognition) this.recognition.stop();
  }
}

window.VoiceCommandManager = VoiceCommandManager;
