import { App } from './ui.js';

const app = new App();

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Handle visibility change - pause when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden && app.isPlaying) {
    app.pause();
  }
});
