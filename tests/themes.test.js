import { describe, it, expect } from 'vitest';
import { THEMES, THEME_NAMES, getTheme } from '../src/themes.js';

describe('THEMES', () => {
  it('should have at least 3 themes', () => {
    expect(Object.keys(THEMES).length).toBeGreaterThanOrEqual(3);
  });

  it('each theme should have required color fields', () => {
    for (const [name, theme] of Object.entries(THEMES)) {
      expect(theme.name, `${name} missing name`).toBeDefined();
      expect(theme.background, `${name} missing background`).toBeDefined();
      expect(theme.pianoWhite, `${name} missing pianoWhite`).toBeDefined();
      expect(theme.pianoBlack, `${name} missing pianoBlack`).toBeDefined();
      expect(Array.isArray(theme.trackColors), `${name} trackColors not array`).toBe(true);
      expect(theme.trackColors.length, `${name} too few trackColors`).toBeGreaterThanOrEqual(4);
    }
  });

  it('each track color should have base and glow', () => {
    for (const theme of Object.values(THEMES)) {
      for (const color of theme.trackColors) {
        expect(color).toHaveProperty('base');
        expect(color).toHaveProperty('glow');
      }
    }
  });
});

describe('THEME_NAMES', () => {
  it('should list all theme keys', () => {
    expect(THEME_NAMES).toEqual(Object.keys(THEMES));
  });
});

describe('getTheme', () => {
  it('should return neon theme for "neon"', () => {
    const theme = getTheme('neon');
    expect(theme.name).toBe('Neon City');
  });

  it('should return synthwave theme for "synthwave"', () => {
    const theme = getTheme('synthwave');
    expect(theme.name).toBe('Synthwave');
  });

  it('should fall back to neon for unknown theme', () => {
    const theme = getTheme('unknown-theme-xyz');
    expect(theme.name).toBe('Neon City');
  });

  it('should return ocean theme for "ocean"', () => {
    const theme = getTheme('ocean');
    expect(theme.name).toBe('Deep Ocean');
  });
});
