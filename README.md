# 🎹 Piano Waterfall

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tone.js](https://img.shields.io/badge/Tone.js-14.x-000000?logo=javascript)](https://tonejs.github.io)
[![Vitest](https://img.shields.io/badge/Tests-41%20passing-6E9F18?logo=vitest)](https://vitest.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-c8b4ff)](LICENSE)

> **Watch music come alive.** Piano Waterfall is a browser-based MIDI visualizer that transforms musical compositions into cascading neon waterfalls of falling notes, perfectly synchronized to a glowing interactive piano keyboard.

---

## Problem Statement

Watching music is often more magical than just hearing it. Piano teachers, music students, and music lovers have long used "falling notes" visualizers to understand compositions, learn pieces by watching key timing, and experience the beauty of musical structure made visible.

Existing tools are either locked behind desktop software, require complex setups, or sacrifice visual beauty for utility. Piano Waterfall is a zero-install, browser-native experience that brings concert-quality MIDI visualization to anyone with a URL — no plugins, no accounts, no paywalls.

Whether you're a student watching Beethoven's note patterns reveal themselves, a musician preparing a performance, or simply someone who finds beauty in the intersection of music and mathematics, Piano Waterfall gives you a window into the soul of a composition.

---

## Features

- 🎵 **5 preloaded classical pieces** — Für Elise, Moonlight Sonata, Pachelbel's Canon, Twinkle Twinkle, and Jingle Bells, all hand-encoded with multi-track support
- 📁 **Upload any MIDI file** — drag a `.mid` file and see it visualized instantly with full multi-track color coding
- 🎹 **Interactive 88-key piano** — click any key to hear it played, watch keys illuminate in sync with falling notes
- ✨ **Particle burst effects** — colorful particles explode from keys at the moment of impact
- 🎨 **4 visual themes** — Neon City, Synthwave, Deep Ocean, and Aurora with full color coordination across every element
- ⚡ **Speed control (0.25×–2×)** — slow down to learn, speed up to preview
- 🔊 **Real-time synthesis** — Tone.js polyphonic piano synthesis with reverb and multi-track support
- ⌨️ **Keyboard shortcuts** — Space to play/pause, Escape to stop
- 📱 **Fully responsive** — works from 320px mobile to 4K displays

---

## Tech Stack

| Technology | Purpose | Why Chosen |
|---|---|---|
| **Vite 5** | Build tool & dev server | Instant HMR, zero-config ES modules, fast builds |
| **Tone.js 14** | Audio synthesis engine | Industry-standard Web Audio abstraction, polyphonic synth |
| **@tonejs/midi** | MIDI file parsing | Best-in-class MIDI parser for the browser |
| **Canvas API** | Waterfall visualization | GPU-accelerated, fine-grained control over every pixel |
| **Vitest 1** | Test runner | Vite-native, fast, supports jsdom |
| **Nginx** | Production server | Lightweight, high-performance static file serving |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  Browser (SPA)                   │
│                                                  │
│  ┌─────────┐  ┌───────────┐  ┌──────────────┐   │
│  │  songs  │  │  midi.js  │  │  themes.js   │   │
│  │ (built- │  │ (MIDI     │  │ (color       │   │
│  │  in     │  │  parser)  │  │  palettes)   │   │
│  │  songs) │  └─────┬─────┘  └──────┬───────┘   │
│  └────┬────┘        │               │           │
│       │         note events     theme obj       │
│       └────────────►│               │           │
│                     ▼               ▼           │
│              ┌─────────────────────────────┐    │
│              │         ui.js (App)          │   │
│              │  Orchestrates all modules   │    │
│              └──┬──────────┬──────────┬────┘    │
│                 │          │          │          │
│                 ▼          ▼          ▼          │
│          ┌──────────┐ ┌─────────┐ ┌──────────┐  │
│          │visualizer│ │ piano   │ │ audio.js │  │
│          │  .js     │ │  .js    │ │(Tone.js) │  │
│          │(Canvas)  │ │(Canvas) │ │          │  │
│          └──────────┘ └─────────┘ └──────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Project Structure

```
piano-waterfall/
├── index.html              # Entry HTML with all CSS (single-file approach)
├── src/
│   ├── main.js             # App entry point, visibility handling
│   ├── ui.js               # App controller — wires all modules together
│   ├── visualizer.js       # Waterfall Canvas renderer + particle system
│   ├── piano.js            # Piano keyboard Canvas renderer
│   ├── audio.js            # Tone.js audio engine (synth, schedule, transport)
│   ├── midi.js             # MIDI file parsing utilities
│   ├── songs.js            # 5 preloaded songs as note event data
│   └── themes.js           # 4 visual color themes
├── tests/
│   ├── songs.test.js       # Song data validation (9 tests)
│   ├── midi.test.js        # MIDI utilities: note names, freq, validation (16 tests)
│   ├── themes.test.js      # Theme structure validation (8 tests)
│   └── visualizer.test.js  # Visualizer logic: sorting, clamping, colors (8 tests)
├── Dockerfile              # Multi-stage: deps → build → nginx
├── docker-compose.yml      # Production: port 3000
├── docker-compose.dev.yml  # Dev with hot reload: port 5173
├── nginx.conf              # Nginx with gzip, cache headers, SPA routing
├── vite.config.js          # Vite config with code splitting
├── .eslintrc.cjs           # ESLint rules
├── .prettierrc             # Prettier formatting
├── .env.example            # Documented environment variables
└── .gitignore              # Standard ignores
```

---

## Quick Start (Docker)

```bash
# Clone and run in one command
git clone https://github.com/AgastyaTeja1/project-2026-07-04-piano-waterfall
cd project-2026-07-04-piano-waterfall
cp .env.example .env
docker-compose up -d
```

Open **http://localhost:3000** in your browser.

---

## Local Dev Setup

**Prerequisites:** Node.js 20+, npm 9+

```bash
# 1. Clone
git clone https://github.com/AgastyaTeja1/project-2026-07-04-piano-waterfall
cd project-2026-07-04-piano-waterfall

# 2. Install
npm install

# 3. Start dev server (hot reload)
npm run dev
# → http://localhost:5173

# 4. Run tests
npm test

# 5. Build for production
npm run build

# 6. Preview production build
npm run preview
```

---

## Environment Variables

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `VITE_PORT` | No | `5173` | Dev server port | `3000` |
| `VITE_DEBUG` | No | `false` | Enable debug overlay with FPS | `true` |

---

## API / Module Documentation

Piano Waterfall has no HTTP API — it's a pure frontend application. Below is the internal module interface.

### `songs.js`

| Export | Signature | Description |
|---|---|---|
| `SONGS` | `Song[]` | Array of 5 preloaded songs |
| `getSongDuration` | `(notes: Note[]) => number` | Total duration in seconds |

### `midi.js`

| Export | Signature | Description |
|---|---|---|
| `parseMidiFile` | `(buf: ArrayBuffer) => Promise<MidiResult>` | Parse MIDI binary |
| `loadMidiFromFile` | `(file: File) => Promise<MidiResult>` | Load MIDI from File API |
| `isValidNote` | `(note: any) => boolean` | Validate note structure |
| `midiToNoteName` | `(midi: number) => string` | `60` → `"C4"` |
| `midiToFreq` | `(midi: number) => number` | `69` → `440.0` Hz |

### `audio.js`

| Export | Signature | Description |
|---|---|---|
| `initAudio` | `() => Promise<Tone>` | Initialize Tone.js (lazy) |
| `startAudio` | `() => Promise<void>` | Resume AudioContext |
| `scheduleNotes` | `(notes, offset?) => Promise<void>` | Schedule note playback |
| `playNote` | `(midi, dur?, vel?) => Promise<void>` | Play a single note |
| `stopAudio` | `() => Promise<void>` | Stop all playback |
| `setVolume` | `(vol: 0-1) => Promise<void>` | Set master volume |

### `themes.js`

| Export | Description |
|---|---|
| `THEMES` | Object containing all theme definitions |
| `THEME_NAMES` | Array of theme key strings |
| `getTheme(name)` | Get theme by name; falls back to 'neon' |

---

## Data Schema

### Note Object
```js
{
  time: number,      // Start time in seconds (>= 0)
  midi: number,      // MIDI note number (0–127)
  duration: number,  // Duration in seconds (> 0)
  velocity: number,  // Key velocity (0.0–1.0)
  track: number,     // Track index for color assignment (0–7)
}
```

### Song Object
```js
{
  id: string,        // Unique identifier (e.g., "fur-elise")
  name: string,      // Display name
  composer: string,  // Composer name
  notes: Note[],     // Array of note events (sorted by time)
}
```

### Theme Object
```js
{
  name: string,             // Display name
  background: string,       // CSS color for canvas background
  backgroundGradient: [string, string],  // Gradient start/end
  pianoWhite: string,       // White key color
  pianoBlack: string,       // Black key color
  pianoWhiteActive: string, // Active white key color
  pianoBlackActive: string, // Active black key color
  pianoRim: string,         // Piano border/rim color
  trackColors: [{           // Per-track colors (8 entries)
    base: string,           // Main note bar color
    glow: string,           // Glow/shadow color
  }],
  grid: string,             // Subtle grid line color (rgba)
  text: string,             // UI accent text color
}
```

---

## Deployment Guide

### Railway
```bash
railway init
railway up
```
Railway auto-detects the Dockerfile and deploys at your Railway URL.

### Fly.io
```bash
fly launch --dockerfile Dockerfile
fly deploy
```

### DigitalOcean App Platform
1. Create new App → GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy

### VPS (any Linux)
```bash
docker-compose up -d
# App runs on port 3000
# Add nginx/caddy reverse proxy for HTTPS
```

---

## Design System

### Implemented UI Trends

**1. Glassmorphism** — Header, sidebar, and playbar use `backdrop-filter: blur(16px)` with translucent `rgba` backgrounds and subtle border highlights, creating depth layers over the animated canvas.

**2. Gradient Accents** — The brand title, play button, and progress bar fill use multi-stop CSS gradients (`#c8b4ff → #6ef0ff`). Note bars use per-note gradients that shift from bright tip to glowing base.

**3. Micro-interactions** — Play button has `hover: scale(1.05)` with a glowing box-shadow transition. Song list items animate border-color and background on hover. Range slider thumbs scale on hover.

**4. Motion UI** — Note bars animate as they fall with per-note glow pulses. Particles burst from keys at note impact with gravity-affected trajectories and fade-out opacity.

**5. Dark Mode Native** — The entire app is dark-first by design, with four hand-crafted dark themes (Neon City, Synthwave, Deep Ocean, Aurora) switchable in real-time.

**6. Skeleton Loaders** — CSS `@keyframes shimmer` skeleton classes defined for any loading state (e.g., when parsing large uploaded MIDI files).

### Color Palette (Default: Neon City)
| Role | Color |
|---|---|
| Background | `#0a0a1a` |
| Surface | `rgba(255,255,255,0.06)` |
| Accent | `#c8b4ff` (purple) |
| Secondary | `#6ef0ff` (cyan) |
| Track 1 | `#ff6ec7` (pink) |
| Track 2 | `#6ef0ff` (cyan) |
| Track 3 | `#ffe46e` (gold) |
| Track 4 | `#a8ff6e` (lime) |

---

## Performance

- **Lazy imports** — Tone.js and @tonejs/midi are only loaded when first needed (audio init / MIDI upload)
- **Code splitting** — Vite produces 3 separate chunks: `tone`, `midi`, `index`; tone.js (~346KB) loads only on first play
- **Canvas optimization** — Visualizer renders only notes visible in the current time window; no off-screen overdraw
- **Particle limit** — Particle arrays are filtered in-place each frame; no GC pressure from particle creation after peak
- **requestAnimationFrame** — Single rAF loop drives both the visualizer and progress bar updates

---

## Security

- **No server** — fully static frontend, zero server-side attack surface
- **File validation** — uploaded MIDI files are validated by `isValidNote()` before rendering
- **No external requests** — all assets are bundled; CSP-safe with no CDN dependencies
- **Input sanitization** — all song name/composer strings are set via `textContent` (not `innerHTML`)

---

## Known Limitations

- Piano synthesis is oscillator-based (not sample-based), so it sounds "electronic" rather than a real grand piano
- Very large MIDI files (>10,000 notes) may cause the initial scheduling pass to pause the audio thread briefly
- Mobile touch support on the progress bar works but the small touch target requires careful tapping
- The 88-key piano layout is compressed on screens narrower than 600px; a scroll-based mobile layout is planned

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feature/my-feature`
2. Follow existing code style (no TypeScript, ES modules, 2-space indent)
3. Add tests for any new logic in `tests/`
4. Run `npm test` and `npm run build` — both must pass
5. Open a PR with a clear description of what changed and why

**Coding Standards:**
- Vanilla JavaScript (ES2022+)
- No external UI frameworks
- JSDoc comments only for public module exports
- Canvas rendering: always `ctx.shadowBlur = 0` after glow passes to avoid bleed

---

## License

MIT © 2026 Piano Waterfall Contributors
