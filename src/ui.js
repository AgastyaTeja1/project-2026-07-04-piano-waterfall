/**
 * UI controller — manages controls, state, and wires together
 * the visualizer, piano, and audio engine.
 */

import { Visualizer } from './visualizer.js';
import { PianoRenderer, getKeyAtPoint } from './piano.js';
import { startAudio, scheduleNotes, stopAudio, playNote, setVolume, getAudioTime } from './audio.js';
import { loadMidiFromFile } from './midi.js';
import { SONGS, getSongDuration } from './songs.js';
import { THEMES, THEME_NAMES, getTheme } from './themes.js';

const PIANO_HEIGHT = 130;
const DEFAULT_THEME = 'neon';

export class App {
  constructor() {
    this.currentSong = SONGS[0];
    this.theme = getTheme(DEFAULT_THEME);
    this.isPlaying = false;
    this.playStartTime = 0; // performance.now() when play started
    this.playStartOffset = 0; // song time offset when play started
    this.volume = 0.8;
    this.speed = 1;
    this.lookahead = 4;

    this.vizCanvas = null;
    this.pianoCanvas = null;
    this.visualizer = null;
    this.pianoRenderer = null;

    this.dragStartX = null;
  }

  init() {
    this.buildUI();
    this.buildCanvases();
    this.loadSong(this.currentSong);
    this.bindEvents();
    this.startRenderLoop();
  }

  buildUI() {
    document.body.innerHTML = `
      <div id="app">
        <header class="header glass">
          <div class="brand">
            <span class="brand-icon">🎹</span>
            <span class="brand-title">Piano Waterfall</span>
          </div>
          <div class="header-controls">
            <div class="theme-pills" id="theme-pills"></div>
            <label class="upload-btn btn-outline" for="midi-upload" title="Upload MIDI file">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload MIDI
            </label>
            <input type="file" id="midi-upload" accept=".mid,.midi" style="display:none">
          </div>
        </header>

        <main class="main-area">
          <aside class="song-list glass">
            <h3 class="sidebar-title">Songs</h3>
            <ul id="song-list" class="songs"></ul>
            <div class="sidebar-divider"></div>
            <h3 class="sidebar-title">Settings</h3>
            <div class="setting-row">
              <label>Speed</label>
              <div class="slider-wrap">
                <input type="range" id="speed-slider" min="0.25" max="2" step="0.05" value="1">
                <span id="speed-val">1×</span>
              </div>
            </div>
            <div class="setting-row">
              <label>Volume</label>
              <div class="slider-wrap">
                <input type="range" id="vol-slider" min="0" max="1" step="0.02" value="0.8">
                <span id="vol-val">80%</span>
              </div>
            </div>
            <div class="setting-row">
              <label>Lookahead</label>
              <div class="slider-wrap">
                <input type="range" id="lookahead-slider" min="2" max="8" step="0.5" value="4">
                <span id="lookahead-val">4s</span>
              </div>
            </div>
          </aside>

          <section class="viz-section">
            <div id="song-info" class="song-info">
              <span class="song-name">Loading...</span>
              <span class="song-composer"></span>
            </div>
            <canvas id="viz-canvas"></canvas>
            <canvas id="piano-canvas"></canvas>
          </section>
        </main>

        <footer class="playbar glass">
          <div class="playbar-left">
            <button id="btn-play" class="btn-play" title="Play / Pause">
              <svg id="play-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              <svg id="pause-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style="display:none">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            </button>
            <button id="btn-stop" class="btn-icon" title="Stop">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <rect x="4" y="4" width="16" height="16"/>
              </svg>
            </button>
          </div>

          <div class="progress-wrap">
            <span id="time-current" class="time-label">0:00</span>
            <div id="progress-bar" class="progress-bar">
              <div id="progress-fill" class="progress-fill"></div>
              <div id="progress-handle" class="progress-handle"></div>
            </div>
            <span id="time-total" class="time-label">0:00</span>
          </div>

          <div class="playbar-right">
            <span id="note-count" class="note-count"></span>
          </div>
        </footer>

        <div id="toast" class="toast" aria-live="polite"></div>
      </div>
    `;

    // Build theme pills
    const pills = document.getElementById('theme-pills');
    THEME_NAMES.forEach((name) => {
      const btn = document.createElement('button');
      btn.className = 'theme-pill' + (name === DEFAULT_THEME ? ' active' : '');
      btn.textContent = THEMES[name].name;
      btn.dataset.theme = name;
      btn.addEventListener('click', () => this.setTheme(name));
      pills.appendChild(btn);
    });

    // Build song list
    this.buildSongList();
  }

  buildSongList() {
    const list = document.getElementById('song-list');
    list.innerHTML = '';
    SONGS.forEach((song, i) => {
      const li = document.createElement('li');
      li.className = 'song-item' + (song.id === this.currentSong.id ? ' active' : '');
      li.innerHTML = `
        <div class="song-item-name">${song.name}</div>
        <div class="song-item-composer">${song.composer}</div>
      `;
      li.addEventListener('click', () => {
        this.stop();
        this.loadSong(song);
        document.querySelectorAll('.song-item').forEach((el) => el.classList.remove('active'));
        li.classList.add('active');
      });
      list.appendChild(li);
    });
  }

  buildCanvases() {
    this.vizCanvas = document.getElementById('viz-canvas');
    this.pianoCanvas = document.getElementById('piano-canvas');
    this.visualizer = new Visualizer(this.vizCanvas, this.pianoCanvas, this.theme);
    this.pianoRenderer = new PianoRenderer(this.pianoCanvas, this.theme);

    this.onResize();
  }

  onResize() {
    const section = document.querySelector('.viz-section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const infoH = document.getElementById('song-info')?.offsetHeight || 0;
    const vizH = rect.height - PIANO_HEIGHT - infoH - 8;
    const W = rect.width;

    this.vizCanvas.width = W;
    this.vizCanvas.height = Math.max(200, vizH);
    this.pianoCanvas.width = W;
    this.pianoCanvas.height = PIANO_HEIGHT;

    this.visualizer.resize(W, this.vizCanvas.height);
    this.pianoRenderer.resize(W, PIANO_HEIGHT);

    // Rebuild key map after resize
    this.visualizer.buildPianoKeyMap();
  }

  loadSong(song) {
    this.currentSong = song;
    this.visualizer.setNotes(song.notes);

    const duration = getSongDuration(song.notes);
    document.getElementById('time-total').textContent = formatTime(duration);
    document.getElementById('song-name') && (document.querySelector('.song-name').textContent = song.name);
    document.querySelector('.song-name').textContent = song.name;
    document.querySelector('.song-composer').textContent = song.composer;
    document.getElementById('note-count').textContent = `${song.notes.length} notes`;

    this.playStartOffset = 0;
    this.visualizer.setTime(0);
    this.pianoRenderer.clearKeys();
    this.pianoRenderer.render();
    this.updateProgress(0, duration);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    document.getElementById('btn-play').addEventListener('click', () => {
      if (this.isPlaying) this.pause();
      else this.play();
    });

    document.getElementById('btn-stop').addEventListener('click', () => this.stop());

    document.getElementById('speed-slider').addEventListener('input', (e) => {
      this.speed = parseFloat(e.target.value);
      this.visualizer.setSpeed(this.speed);
      document.getElementById('speed-val').textContent = `${this.speed.toFixed(2)}×`;
    });

    document.getElementById('vol-slider').addEventListener('input', (e) => {
      this.volume = parseFloat(e.target.value);
      setVolume(this.volume);
      document.getElementById('vol-val').textContent = `${Math.round(this.volume * 100)}%`;
    });

    document.getElementById('lookahead-slider').addEventListener('input', (e) => {
      this.lookahead = parseFloat(e.target.value);
      this.visualizer.setLookahead(this.lookahead);
      document.getElementById('lookahead-val').textContent = `${this.lookahead}s`;
    });

    document.getElementById('midi-upload').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        this.showToast('Loading MIDI file…');
        const result = await loadMidiFromFile(file);
        this.stop();
        const song = { id: 'uploaded', name: result.name, composer: 'Uploaded', notes: result.notes };
        SONGS.push(song);
        this.buildSongList();
        this.loadSong(song);
        this.showToast(`Loaded: ${result.name} (${result.notes.length} notes)`);
      } catch (err) {
        this.showToast(`Error: ${err.message}`, 'error');
      }
      e.target.value = '';
    });

    // Progress bar scrubbing
    const progressBar = document.getElementById('progress-bar');
    progressBar.addEventListener('mousedown', (e) => this.scrubStart(e));
    progressBar.addEventListener('touchstart', (e) => this.scrubStart(e.touches[0]), { passive: true });

    // Piano keyboard click-to-play
    this.pianoCanvas.addEventListener('click', async (e) => {
      const rect = this.pianoCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const layout = this.pianoRenderer.getLayout();
      if (!layout) return;
      const midi = getKeyAtPoint(x, y, layout, PIANO_HEIGHT, PIANO_HEIGHT * 0.62);
      if (midi !== null) {
        await startAudio();
        playNote(midi, 0.5, 0.8);
        const color = this.visualizer.getTrackColor(0);
        this.pianoRenderer.activateKey(midi, color.base, color.glow);
        this.pianoRenderer.render();
        setTimeout(() => {
          this.pianoRenderer.deactivateKey(midi);
          this.pianoRenderer.render();
        }, 500);
      }
    });

    // Wire visualizer callbacks to piano renderer
    this.visualizer.onNoteActivate = (midi, color, glow) => {
      this.pianoRenderer.activateKey(midi, color, glow);
      this.pianoRenderer.render();
    };
    this.visualizer.onNoteDeactivate = (midi) => {
      this.pianoRenderer.deactivateKey(midi);
      this.pianoRenderer.render();
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); this.isPlaying ? this.pause() : this.play(); }
      if (e.code === 'Escape') this.stop();
    });
  }

  scrubStart(e) {
    const bar = document.getElementById('progress-bar');
    const duration = getSongDuration(this.currentSong.notes);
    const doScrub = (evt) => {
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, (evt.clientX ?? evt.touches?.[0]?.clientX) - rect.left));
      const t = (x / rect.width) * duration;
      this.seekTo(t);
    };
    doScrub(e);
    const onMove = (evt) => doScrub(evt.touches ? evt.touches[0] : evt);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  }

  async play() {
    await startAudio();
    await setVolume(this.volume);
    const offset = this.playStartOffset;
    const notesFromOffset = this.currentSong.notes.filter((n) => n.time >= offset - 0.1);
    await scheduleNotes(notesFromOffset, offset);
    this.playStartTime = performance.now();
    this.isPlaying = true;
    this.updatePlayBtn();
  }

  pause() {
    this.playStartOffset = this.currentSongTime();
    stopAudio();
    this.isPlaying = false;
    this.updatePlayBtn();
  }

  stop() {
    stopAudio();
    this.isPlaying = false;
    this.playStartOffset = 0;
    this.visualizer.setTime(0);
    this.pianoRenderer.clearKeys();
    this.pianoRenderer.render();
    this.updatePlayBtn();
    this.updateProgress(0, getSongDuration(this.currentSong.notes));
  }

  seekTo(time) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) { stopAudio(); this.isPlaying = false; }
    this.playStartOffset = time;
    this.visualizer.setTime(time);
    this.updateProgress(time, getSongDuration(this.currentSong.notes));
    if (wasPlaying) this.play();
  }

  currentSongTime() {
    if (!this.isPlaying) return this.playStartOffset;
    const elapsed = (performance.now() - this.playStartTime) / 1000;
    return this.playStartOffset + elapsed * this.speed;
  }

  setTheme(name) {
    this.theme = getTheme(name);
    this.visualizer.setTheme(this.theme);
    this.pianoRenderer.setTheme(this.theme);
    document.querySelectorAll('.theme-pill').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === name);
    });
    this.pianoRenderer.render();
  }

  updatePlayBtn() {
    document.getElementById('play-icon').style.display = this.isPlaying ? 'none' : '';
    document.getElementById('pause-icon').style.display = this.isPlaying ? '' : 'none';
  }

  updateProgress(current, total) {
    const pct = total > 0 ? Math.min(1, current / total) : 0;
    document.getElementById('progress-fill').style.width = `${pct * 100}%`;
    document.getElementById('progress-handle').style.left = `${pct * 100}%`;
    document.getElementById('time-current').textContent = formatTime(current);
  }

  startRenderLoop() {
    const tick = () => {
      const t = this.currentSongTime();
      const duration = getSongDuration(this.currentSong.notes);

      // Auto-stop at end
      if (this.isPlaying && t >= duration + 1) {
        this.stop();
      }

      this.visualizer.setTime(t);
      this.visualizer.render();
      this.updateProgress(Math.min(t, duration), duration);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

function formatTime(secs) {
  if (!isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
