import { describe, it, expect } from 'vitest';
import { isValidNote, midiToNoteName, midiToFreq } from '../src/midi.js';

describe('isValidNote', () => {
  it('should return true for a valid note', () => {
    expect(isValidNote({ time: 0, midi: 60, duration: 1, velocity: 0.8, track: 0 })).toBe(true);
  });

  it('should return false for missing time', () => {
    expect(isValidNote({ midi: 60, duration: 1 })).toBe(false);
  });

  it('should return false for invalid midi (> 127)', () => {
    expect(isValidNote({ time: 0, midi: 128, duration: 1 })).toBe(false);
  });

  it('should return false for invalid midi (< 0)', () => {
    expect(isValidNote({ time: 0, midi: -1, duration: 1 })).toBe(false);
  });

  it('should return false for zero duration', () => {
    expect(isValidNote({ time: 0, midi: 60, duration: 0 })).toBe(false);
  });

  it('should return false for negative duration', () => {
    expect(isValidNote({ time: 0, midi: 60, duration: -0.5 })).toBe(false);
  });
});

describe('midiToNoteName', () => {
  it('should return C4 for MIDI 60', () => {
    expect(midiToNoteName(60)).toBe('C4');
  });

  it('should return A4 for MIDI 69', () => {
    expect(midiToNoteName(69)).toBe('A4');
  });

  it('should return C#4 for MIDI 61', () => {
    expect(midiToNoteName(61)).toBe('C#4');
  });

  it('should return A0 for MIDI 21', () => {
    expect(midiToNoteName(21)).toBe('A0');
  });

  it('should return C8 for MIDI 108', () => {
    expect(midiToNoteName(108)).toBe('C8');
  });

  it('should handle middle octaves correctly', () => {
    expect(midiToNoteName(48)).toBe('C3');
    expect(midiToNoteName(72)).toBe('C5');
  });
});

describe('midiToFreq', () => {
  it('should return 440 for A4 (MIDI 69)', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 1);
  });

  it('should return 261.63 for C4 (MIDI 60)', () => {
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
  });

  it('should double for each octave up', () => {
    const a4 = midiToFreq(69);
    const a5 = midiToFreq(81);
    expect(a5 / a4).toBeCloseTo(2, 4);
  });

  it('should return positive frequencies for all MIDI values 0-127', () => {
    for (let m = 0; m <= 127; m++) {
      expect(midiToFreq(m)).toBeGreaterThan(0);
    }
  });
});
