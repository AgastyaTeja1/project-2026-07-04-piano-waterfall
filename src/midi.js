/**
 * MIDI file parsing utilities.
 * Converts parsed @tonejs/midi data into our internal note format.
 */

/** Parse a MIDI file ArrayBuffer into note events */
export async function parseMidiFile(arrayBuffer) {
  const { Midi } = await import('@tonejs/midi');
  const midi = new Midi(arrayBuffer);

  const notes = [];
  let trackIndex = 0;

  for (const track of midi.tracks) {
    if (track.notes.length === 0) continue;
    for (const note of track.notes) {
      notes.push({
        time: note.time,
        midi: note.midi,
        duration: note.duration,
        velocity: note.velocity,
        track: trackIndex,
      });
    }
    trackIndex++;
    if (trackIndex > 7) trackIndex = 7; // max 8 colors
  }

  // Sort by time
  notes.sort((a, b) => a.time - b.time);

  return {
    notes,
    name: midi.name || 'Uploaded MIDI',
    bpm: midi.header.tempos[0]?.bpm ?? 120,
    timeSignature: midi.header.timeSignatures[0] ?? { numerator: 4, denominator: 4 },
  };
}

/** Load MIDI from a File object */
export function loadMidiFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await parseMidiFile(e.target.result);
        result.name = file.name.replace(/\.midi?$/i, '');
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse MIDI file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/** Validate that a note object has required fields */
export function isValidNote(note) {
  return (
    typeof note.time === 'number' &&
    typeof note.midi === 'number' &&
    typeof note.duration === 'number' &&
    note.midi >= 0 &&
    note.midi <= 127 &&
    note.duration > 0
  );
}

/** Get MIDI note name from number (e.g., 60 => "C4") */
export function midiToNoteName(midi) {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  return names[midi % 12] + octave;
}

/** Get frequency in Hz from MIDI number */
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
