/**
 * Waterfall visualizer — falling note bars synchronized to playback.
 * Notes fall from top to the piano keyboard below.
 */

const MIDI_MIN = 21; // A0
const MIDI_MAX = 108; // C8
const WHITE_KEYS_IN_OCTAVE = [0, 2, 4, 5, 7, 9, 11];

function isBlackKey(midi) {
  return !WHITE_KEYS_IN_OCTAVE.includes(midi % 12);
}

/** Particle effect for key press */
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = -(Math.random() * 3 + 1);
    this.life = 1;
    this.size = Math.random() * 4 + 2;
    this.decay = Math.random() * 0.04 + 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.life -= this.decay;
    this.size *= 0.97;
  }

  isDead() {
    return this.life <= 0 || this.size < 0.3;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}

export class Visualizer {
  constructor(canvas, pianoCanvas, theme) {
    this.canvas = canvas;
    this.pianoCanvas = pianoCanvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.notes = [];
    this.currentTime = 0;
    this.speed = 1; // playback speed multiplier
    this.lookahead = 4; // seconds of notes shown ahead
    this.particles = [];
    this.activeNotes = new Set();
    this.pianoKeyPositions = new Map(); // midi => { x, width }
    this.animFrameId = null;
    this.onNoteActivate = null; // callback(midi, color, glow)
    this.onNoteDeactivate = null; // callback(midi)
  }

  setTheme(theme) {
    this.theme = theme;
  }

  setNotes(notes) {
    this.notes = [...notes].sort((a, b) => a.time - b.time);
  }

  setTime(time) {
    this.currentTime = time;
  }

  setSpeed(speed) {
    this.speed = Math.max(0.25, Math.min(3, speed));
  }

  setLookahead(seconds) {
    this.lookahead = Math.max(1, Math.min(10, seconds));
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.buildPianoKeyMap();
  }

  /** Build a map of MIDI -> screen x position from the piano canvas layout */
  buildPianoKeyMap() {
    if (!this.pianoCanvas) return;
    const totalWhiteKeys = 52;
    const whiteKeyWidth = this.pianoCanvas.width / totalWhiteKeys;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    let whiteIndex = 0;
    let lastWhiteX = 0;

    for (let midi = MIDI_MIN; midi <= MIDI_MAX; midi++) {
      const pc = midi % 12;
      const isBlack = !WHITE_KEYS_IN_OCTAVE.includes(pc);

      if (!isBlack) {
        const x = whiteIndex * whiteKeyWidth;
        this.pianoKeyPositions.set(midi, { x, width: whiteKeyWidth - 1, isBlack: false });
        lastWhiteX = x;
        whiteIndex++;
      } else {
        this.pianoKeyPositions.set(midi, {
          x: lastWhiteX + (whiteKeyWidth - 1) - blackKeyWidth * 0.5,
          width: blackKeyWidth,
          isBlack: true,
        });
      }
    }
  }

  getTrackColor(trackIndex) {
    const colors = this.theme.trackColors;
    return colors[trackIndex % colors.length];
  }

  /** Get screen x and width for a MIDI note bar */
  getNoteRect(midi) {
    const pos = this.pianoKeyPositions.get(midi);
    if (!pos) return null;

    // Scale piano x positions to visualizer canvas width
    const scaleX = this.canvas.width / this.pianoCanvas.width;
    return {
      x: pos.x * scaleX,
      width: pos.width * scaleX,
      isBlack: pos.isBlack,
    };
  }

  /** Convert note time to canvas y position */
  timeToY(noteTime) {
    const relativeTime = noteTime - this.currentTime;
    const pixelsPerSecond = this.canvas.height / (this.lookahead / this.speed);
    return this.canvas.height - relativeTime * pixelsPerSecond;
  }

  spawnParticles(midi, color) {
    const rect = this.getNoteRect(midi);
    if (!rect) return;
    const y = this.canvas.height;
    const cx = rect.x + rect.width / 2;
    for (let i = 0; i < 8; i++) {
      this.particles.push(new Particle(cx, y, color));
    }
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const theme = this.theme;

    // Background with gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, theme.backgroundGradient[0]);
    bg.addColorStop(1, theme.backgroundGradient[1]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines (subtle horizontal)
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    const gridStep = H / 8;
    for (let y = 0; y < H; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Render notes in two passes: white key notes, then black key notes
    const visibleNotes = this.notes.filter(
      (note) => note.time < this.currentTime + this.lookahead && note.time + note.duration > this.currentTime - 0.2
    );

    const newActive = new Set();

    const renderPass = (blackOnly) => {
      for (const note of visibleNotes) {
        const rect = this.getNoteRect(note.midi);
        if (!rect || rect.isBlack !== blackOnly) continue;

        const color = this.getTrackColor(note.track);
        const yBottom = this.timeToY(note.time);
        const noteHeight = Math.max(4, (note.duration / (this.lookahead / this.speed)) * H);
        const yTop = yBottom - noteHeight;

        // Is this note currently being played?
        const isActive = note.time <= this.currentTime && note.time + note.duration >= this.currentTime;
        if (isActive) {
          newActive.add(note.midi);
        }

        // Only draw if visible
        if (yBottom < 0 || yTop > H) continue;

        // Draw note bar with rounded corners and glow
        const cornerR = Math.min(rect.width * 0.3, 6);

        // Glow
        ctx.shadowColor = color.glow;
        ctx.shadowBlur = isActive ? 20 : 10;

        // Gradient fill
        const grad = ctx.createLinearGradient(rect.x, yTop, rect.x, yBottom);
        if (isActive) {
          grad.addColorStop(0, color.glow + 'ff');
          grad.addColorStop(0.3, color.base + 'ff');
          grad.addColorStop(1, color.base + '88');
        } else {
          grad.addColorStop(0, color.base + 'ff');
          grad.addColorStop(1, color.glow + 'cc');
        }
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.roundRect(rect.x + 1, Math.max(0, yTop), rect.width - 2, Math.min(H, yBottom) - Math.max(0, yTop), cornerR);
        ctx.fill();

        // Shiny top highlight
        if (!isActive) {
          ctx.shadowBlur = 0;
          const hlGrad = ctx.createLinearGradient(rect.x, yTop, rect.x, yTop + noteHeight * 0.3);
          hlGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
          hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = hlGrad;
          ctx.beginPath();
          ctx.roundRect(rect.x + 1, Math.max(0, yTop), rect.width - 2, Math.min(noteHeight * 0.3, H), cornerR);
          ctx.fill();
        }
      }
    };

    renderPass(false); // white key notes
    ctx.shadowBlur = 0;
    renderPass(true); // black key notes on top

    // Handle note activation/deactivation
    for (const midi of newActive) {
      if (!this.activeNotes.has(midi)) {
        const note = visibleNotes.find((n) => n.midi === midi && n.time <= this.currentTime);
        if (note) {
          const color = this.getTrackColor(note.track);
          this.onNoteActivate?.(midi, color.base, color.glow);
          this.spawnParticles(midi, color.glow);
        }
      }
    }

    for (const midi of this.activeNotes) {
      if (!newActive.has(midi)) {
        this.onNoteDeactivate?.(midi);
      }
    }
    this.activeNotes = newActive;

    // Render particles
    ctx.shadowBlur = 0;
    this.particles = this.particles.filter((p) => {
      p.update();
      if (!p.isDead()) {
        p.draw(ctx);
        return true;
      }
      return false;
    });

    // Playhead glow line at bottom
    const phGrad = ctx.createLinearGradient(0, H - 3, 0, H);
    phGrad.addColorStop(0, theme.text + '88');
    phGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = phGrad;
    ctx.fillRect(0, H - 3, W, 3);
  }

  startLoop(getTime) {
    const frame = () => {
      this.currentTime = getTime();
      this.render();
      this.animFrameId = requestAnimationFrame(frame);
    };
    this.animFrameId = requestAnimationFrame(frame);
  }

  stopLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.activeNotes.forEach((midi) => this.onNoteDeactivate?.(midi));
    this.activeNotes.clear();
  }
}
