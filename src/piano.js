/**
 * Piano keyboard renderer on Canvas.
 * Draws 88-key piano from A0 (MIDI 21) to C8 (MIDI 108).
 */

const MIDI_MIN = 21; // A0
const MIDI_MAX = 108; // C8

// White key pattern for one octave (C D E F G A B)
const WHITE_KEYS_IN_OCTAVE = [0, 2, 4, 5, 7, 9, 11];
// Black keys relative offsets within an octave
const BLACK_KEY_OFFSETS = {
  1: 0.6,  // C#
  3: 1.6,  // D#
  6: 3.6,  // F#
  8: 4.6,  // G#
  10: 5.6, // A#
};

/** Count white keys from MIDI 21 to a given MIDI number */
function whiteKeysBefore(midi) {
  let count = 0;
  for (let m = MIDI_MIN; m < midi; m++) {
    const pc = m % 12;
    if (WHITE_KEYS_IN_OCTAVE.includes(pc)) count++;
  }
  return count;
}

function isBlackKey(midi) {
  const pc = midi % 12;
  return !WHITE_KEYS_IN_OCTAVE.includes(pc);
}

/** Build layout data for all 88 keys */
function buildKeyLayout(totalWidth, whiteKeyHeight, blackKeyHeight) {
  const totalWhiteKeys = 52; // A0 to C8 has 52 white keys
  const whiteKeyWidth = totalWidth / totalWhiteKeys;
  const blackKeyWidth = whiteKeyWidth * 0.6;

  const keys = [];
  let whiteIndex = 0;

  for (let midi = MIDI_MIN; midi <= MIDI_MAX; midi++) {
    const pc = midi % 12;
    const isBlack = !WHITE_KEYS_IN_OCTAVE.includes(pc);

    if (!isBlack) {
      keys.push({
        midi,
        isBlack: false,
        x: whiteIndex * whiteKeyWidth,
        width: whiteKeyWidth - 1,
        height: whiteKeyHeight,
      });
      whiteIndex++;
    } else {
      // Black key sits between the previous and next white keys
      const prevWhite = keys[keys.length - 1];
      const octaveOffset = BLACK_KEY_OFFSETS[pc] ?? 0;
      const x =
        prevWhite.x + prevWhite.width - blackKeyWidth / 2 + (blackKeyWidth * 0.06) * (octaveOffset - Math.floor(octaveOffset));
      keys.push({
        midi,
        isBlack: true,
        x: prevWhite.x + prevWhite.width - blackKeyWidth * 0.5,
        width: blackKeyWidth,
        height: blackKeyHeight,
      });
    }
  }

  return { keys, whiteKeyWidth };
}

/** Find which key was clicked given x, y coordinates on the keyboard canvas */
export function getKeyAtPoint(x, y, layout, whiteKeyHeight, blackKeyHeight) {
  // Check black keys first (they're on top)
  for (const key of layout.keys) {
    if (!key.isBlack) continue;
    if (x >= key.x && x <= key.x + key.width && y >= 0 && y <= key.height) {
      return key.midi;
    }
  }
  // Then white keys
  for (const key of layout.keys) {
    if (key.isBlack) continue;
    if (x >= key.x && x <= key.x + key.width && y >= 0 && y <= key.height) {
      return key.midi;
    }
  }
  return null;
}

export class PianoRenderer {
  constructor(canvas, theme) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.activeKeys = new Map(); // midi => { color, glow }
    this.layout = null;
  }

  setTheme(theme) {
    this.theme = theme;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    const whiteH = height;
    const blackH = height * 0.62;
    this.layout = buildKeyLayout(width, whiteH, blackH);
    this.render();
  }

  activateKey(midi, color, glow) {
    this.activeKeys.set(midi, { color, glow });
  }

  deactivateKey(midi) {
    this.activeKeys.delete(midi);
  }

  clearKeys() {
    this.activeKeys.clear();
  }

  getLayout() {
    return this.layout;
  }

  render() {
    if (!this.layout) return;
    const ctx = this.ctx;
    const { keys } = this.layout;
    const h = this.canvas.height;
    const blackH = h * 0.62;
    const theme = this.theme;

    ctx.clearRect(0, 0, this.canvas.width, h);

    // Draw rim/background
    ctx.fillStyle = theme.pianoRim;
    ctx.fillRect(0, 0, this.canvas.width, h);

    // Draw white keys first
    for (const key of keys) {
      if (key.isBlack) continue;
      const active = this.activeKeys.get(key.midi);

      if (active) {
        // Glowing active key
        const grad = ctx.createLinearGradient(key.x, 0, key.x, h);
        grad.addColorStop(0, active.color);
        grad.addColorStop(0.5, active.color + 'cc');
        grad.addColorStop(1, theme.pianoWhiteActive);
        ctx.fillStyle = grad;

        // Glow effect
        ctx.shadowColor = active.glow;
        ctx.shadowBlur = 15;
      } else {
        const grad = ctx.createLinearGradient(key.x, 0, key.x, h);
        grad.addColorStop(0, theme.pianoWhite);
        grad.addColorStop(1, '#c8c8d4');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(key.x, 2, key.width, h - 4, [0, 0, 4, 4]);
      ctx.fill();

      // Border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Draw black keys on top
    for (const key of keys) {
      if (!key.isBlack) continue;
      const active = this.activeKeys.get(key.midi);

      if (active) {
        const grad = ctx.createLinearGradient(key.x, 0, key.x, blackH);
        grad.addColorStop(0, active.color);
        grad.addColorStop(1, active.glow);
        ctx.fillStyle = grad;
        ctx.shadowColor = active.glow;
        ctx.shadowBlur = 12;
      } else {
        const grad = ctx.createLinearGradient(key.x, 0, key.x, blackH);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, theme.pianoBlack);
        ctx.fillStyle = grad;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(key.x, 0, key.width, blackH, [0, 0, 3, 3]);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
