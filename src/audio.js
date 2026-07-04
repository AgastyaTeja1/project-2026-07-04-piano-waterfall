/**
 * Audio engine using Tone.js for piano-like synthesis.
 * Uses polyphonic synthesis to emulate piano tones.
 */

let toneModule = null;
let synth = null;
let isStarted = false;

/** Initialize Tone.js and create the synthesizer */
export async function initAudio() {
  if (toneModule) return toneModule;
  toneModule = await import('tone');
  const Tone = toneModule;

  // Polyphonic synthesizer mimicking piano
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle',
      partials: [1, 0.5, 0.25, 0.1, 0.05],
    },
    envelope: {
      attack: 0.005,
      decay: 0.3,
      sustain: 0.2,
      release: 1.2,
    },
    volume: -8,
  }).toDestination();

  // Add reverb for depth
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
  synth.connect(reverb);

  return toneModule;
}

/** Start audio context (required after user interaction) */
export async function startAudio() {
  if (isStarted) return;
  const Tone = await initAudio();
  await Tone.start();
  isStarted = true;
}

/** Schedule all notes for playback */
export async function scheduleNotes(notes, startOffset = 0) {
  const Tone = await initAudio();
  if (!isStarted) await startAudio();

  Tone.Transport.stop();
  Tone.Transport.cancel();

  const now = Tone.now();

  for (const note of notes) {
    if (note.time < startOffset) continue;
    const scheduledTime = now + (note.time - startOffset);
    const freq = midiToFreqLocal(note.midi);
    const velocity = Math.max(0.1, Math.min(1, note.velocity ?? 0.75));
    const duration = Math.max(0.05, note.duration);

    Tone.Transport.schedule((time) => {
      try {
        synth.triggerAttackRelease(freq, duration, time, velocity);
      } catch (_) {
        // Skip notes that fail (voice stealing)
      }
    }, scheduledTime - now);
  }

  Tone.Transport.start();
}

/** Play a single note immediately (for piano key clicks) */
export async function playNote(midi, duration = 0.4, velocity = 0.75) {
  await startAudio();
  const freq = midiToFreqLocal(midi);
  try {
    synth.triggerAttackRelease(freq, duration, undefined, velocity);
  } catch (_) {
    // Ignore voice stealing errors
  }
}

/** Stop all playback */
export async function stopAudio() {
  if (!toneModule) return;
  toneModule.Transport.stop();
  toneModule.Transport.cancel();
  synth?.releaseAll();
}

/** Get current transport time in seconds */
export function getAudioTime() {
  if (!toneModule) return 0;
  return toneModule.Transport.seconds;
}

/** Set master volume (0-1) */
export async function setVolume(vol) {
  const Tone = await initAudio();
  Tone.getDestination().volume.value = Tone.gainToDb(Math.max(0, Math.min(1, vol)));
}

function midiToFreqLocal(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
