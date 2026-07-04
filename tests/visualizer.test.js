import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Visualizer } from '../src/visualizer.js';
import { getTheme } from '../src/themes.js';

// Mock canvas
function createMockCanvas(w = 800, h = 400) {
  return {
    width: w,
    height: h,
    getContext: () => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      roundRect: vi.fn(),
      arc: vi.fn(),
      createLinearGradient: () => ({
        addColorStop: vi.fn(),
      }),
      shadowColor: '',
      shadowBlur: 0,
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
    }),
  };
}

describe('Visualizer', () => {
  let viz;
  let canvas;
  let pianoCanvas;

  beforeEach(() => {
    canvas = createMockCanvas();
    pianoCanvas = createMockCanvas(800, 130);
    viz = new Visualizer(canvas, pianoCanvas, getTheme('neon'));
  });

  it('should construct without errors', () => {
    expect(viz).toBeDefined();
    expect(viz.notes).toEqual([]);
    expect(viz.currentTime).toBe(0);
  });

  it('should set notes and sort them by time', () => {
    const notes = [
      { time: 2, midi: 64, duration: 0.5, velocity: 0.8, track: 0 },
      { time: 0, midi: 60, duration: 1, velocity: 0.8, track: 0 },
      { time: 1, midi: 62, duration: 0.5, velocity: 0.8, track: 0 },
    ];
    viz.setNotes(notes);
    expect(viz.notes[0].time).toBe(0);
    expect(viz.notes[1].time).toBe(1);
    expect(viz.notes[2].time).toBe(2);
  });

  it('should update current time', () => {
    viz.setTime(5.5);
    expect(viz.currentTime).toBe(5.5);
  });

  it('should clamp speed between 0.25 and 3', () => {
    viz.setSpeed(0.1);
    expect(viz.speed).toBe(0.25);
    viz.setSpeed(10);
    expect(viz.speed).toBe(3);
    viz.setSpeed(1.5);
    expect(viz.speed).toBe(1.5);
  });

  it('should clamp lookahead between 1 and 10', () => {
    viz.setLookahead(0.5);
    expect(viz.lookahead).toBe(1);
    viz.setLookahead(20);
    expect(viz.lookahead).toBe(10);
    viz.setLookahead(4);
    expect(viz.lookahead).toBe(4);
  });

  it('should update theme', () => {
    const newTheme = getTheme('synthwave');
    viz.setTheme(newTheme);
    expect(viz.theme).toBe(newTheme);
  });

  it('should get track color cycling through theme colors', () => {
    const theme = getTheme('neon');
    const numColors = theme.trackColors.length;
    const c0 = viz.getTrackColor(0);
    const cN = viz.getTrackColor(numColors);
    expect(c0).toEqual(cN); // should cycle
    expect(c0).toHaveProperty('base');
    expect(c0).toHaveProperty('glow');
  });

  it('should render without throwing', () => {
    viz.setNotes([
      { time: 0, midi: 60, duration: 0.5, velocity: 0.8, track: 0 },
    ]);
    viz.setTime(0.25);
    expect(() => viz.render()).not.toThrow();
  });
});
