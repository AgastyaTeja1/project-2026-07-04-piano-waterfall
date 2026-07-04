import { describe, it, expect } from 'vitest';
import { SONGS, getSongDuration } from '../src/songs.js';

describe('SONGS', () => {
  it('should have at least 4 preloaded songs', () => {
    expect(SONGS.length).toBeGreaterThanOrEqual(4);
  });

  it('each song should have required fields', () => {
    for (const song of SONGS) {
      expect(song).toHaveProperty('id');
      expect(song).toHaveProperty('name');
      expect(song).toHaveProperty('composer');
      expect(song).toHaveProperty('notes');
      expect(Array.isArray(song.notes)).toBe(true);
    }
  });

  it('each note should have valid fields', () => {
    for (const song of SONGS) {
      for (const note of song.notes) {
        expect(typeof note.time).toBe('number');
        expect(typeof note.midi).toBe('number');
        expect(typeof note.duration).toBe('number');
        expect(note.midi).toBeGreaterThanOrEqual(0);
        expect(note.midi).toBeLessThanOrEqual(127);
        expect(note.duration).toBeGreaterThan(0);
        expect(note.time).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('songs should not be empty', () => {
    for (const song of SONGS) {
      expect(song.notes.length).toBeGreaterThan(0);
    }
  });

  it('Für Elise should exist', () => {
    const furElise = SONGS.find((s) => s.id === 'fur-elise');
    expect(furElise).toBeDefined();
    expect(furElise.notes.length).toBeGreaterThan(20);
  });
});

describe('getSongDuration', () => {
  it('should return 0 for empty notes', () => {
    expect(getSongDuration([])).toBe(0);
  });

  it('should return max(time + duration)', () => {
    const notes = [
      { time: 0, midi: 60, duration: 1, velocity: 0.8, track: 0 },
      { time: 2, midi: 62, duration: 3, velocity: 0.8, track: 0 },
    ];
    expect(getSongDuration(notes)).toBe(5); // 2 + 3
  });

  it('should handle single note', () => {
    const notes = [{ time: 1.5, midi: 60, duration: 2, velocity: 0.8, track: 0 }];
    expect(getSongDuration(notes)).toBe(3.5);
  });

  it('should return positive duration for each song', () => {
    for (const song of SONGS) {
      const dur = getSongDuration(song.notes);
      expect(dur).toBeGreaterThan(0);
    }
  });
});
