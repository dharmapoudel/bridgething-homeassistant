import { describe, expect, test } from 'bun:test';
import { hsvToRgb, rgbToHex, rgbToHsv } from './color';

describe('hsvToRgb', () => {
  test('primary colors', () => {
    expect(hsvToRgb(0, 100, 100)).toEqual([255, 0, 0]);
    expect(hsvToRgb(120, 100, 100)).toEqual([0, 255, 0]);
    expect(hsvToRgb(240, 100, 100)).toEqual([0, 0, 255]);
  });

  test('white, black, and gray', () => {
    expect(hsvToRgb(0, 0, 100)).toEqual([255, 255, 255]);
    expect(hsvToRgb(200, 50, 0)).toEqual([0, 0, 0]);
    expect(hsvToRgb(0, 0, 50)).toEqual([128, 128, 128]);
  });

  test('hue wraps around 360', () => {
    expect(hsvToRgb(360, 100, 100)).toEqual(hsvToRgb(0, 100, 100));
  });
});

describe('rgbToHsv', () => {
  test('round-trips through hsvToRgb', () => {
    for (const [h, s, v] of [
      [0, 100, 100],
      [35, 60, 80],
      [180, 25, 90],
      [300, 100, 42],
    ] as const) {
      const [r, g, b] = hsvToRgb(h, s, v);
      const [h2, s2, v2] = rgbToHsv(r, g, b);
      expect(Math.abs(h2 - h) <= 1).toBe(true);
      expect(Math.abs(s2 - s) <= 1).toBe(true);
      expect(Math.abs(v2 - v) <= 1).toBe(true);
    }
  });

  test('achromatic colors have zero saturation', () => {
    expect(rgbToHsv(128, 128, 128)[1]).toBe(0);
  });
});

describe('rgbToHex', () => {
  test('formats uppercase hex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
    expect(rgbToHex(160, 106, 72)).toBe('#A06A48');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });
});
