import { describe, it, expect } from 'vitest';
import {
  randomPosition,
  rectsOverlap,
  randomPositionAvoiding,
  noButtonLabel,
  yesButtonScale,
  formatDateLabel,
  formatMessage,
  resolvePlace,
  maskTime,
  normalizeTime,
  isValidTime,
  placeMessageText,
  placeSummaryText,
} from '../js/lib.js';

describe('randomPosition', () => {
  const viewport = { width: 400, height: 800 };
  const button = { width: 100, height: 50 };

  it('keeps the button fully inside the viewport with padding', () => {
    for (const r of [0, 0.25, 0.5, 0.999]) {
      const { x, y } = randomPosition(viewport, button, 16, () => r);
      expect(x).toBeGreaterThanOrEqual(16);
      expect(y).toBeGreaterThanOrEqual(16);
      expect(x + button.width).toBeLessThanOrEqual(viewport.width - 16);
      expect(y + button.height).toBeLessThanOrEqual(viewport.height - 16);
    }
  });

  it('falls back to padding when the viewport is too small', () => {
    expect(randomPosition({ width: 50, height: 40 }, button, 16, () => 0.5)).toEqual({ x: 16, y: 16 });
  });
});

describe('rectsOverlap', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };

  it('detects overlap and respects gap', () => {
    expect(rectsOverlap(a, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(rectsOverlap(a, { x: 15, y: 0, width: 10, height: 10 })).toBe(false);
    expect(rectsOverlap(a, { x: 15, y: 0, width: 10, height: 10 }, 6)).toBe(true);
  });
});

describe('randomPositionAvoiding', () => {
  it('skips spots that cover the avoided rect', () => {
    const values = [0, 0, 0.99, 0.99];
    const rand = () => values.shift();
    const avoid = { x: 0, y: 0, width: 150, height: 150 };
    const pos = randomPositionAvoiding({ width: 400, height: 800 }, { width: 100, height: 50 }, 16, avoid, rand);
    expect(rectsOverlap({ ...pos, width: 100, height: 50 }, avoid, 12)).toBe(false);
  });
});

describe('noButtonLabel', () => {
  it('starts with the plain label', () => {
    expect(noButtonLabel(0)).toBe('Ні');
  });

  it('cycles through labels without running out', () => {
    expect(typeof noButtonLabel(1000)).toBe('string');
    expect(noButtonLabel(1)).not.toBe('Ні');
  });
});

describe('yesButtonScale', () => {
  it('grows with each attempt and caps', () => {
    expect(yesButtonScale(0)).toBe(1);
    expect(yesButtonScale(2)).toBeGreaterThan(yesButtonScale(1));
    expect(yesButtonScale(100)).toBe(1.8);
  });
});

describe('formatDateLabel', () => {
  it('formats ISO date in Ukrainian with weekday', () => {
    expect(formatDateLabel('2026-10-20')).toBe('вівторок, 20 жовтня');
  });
});

describe('formatMessage', () => {
  it('includes date, time and place', () => {
    const msg = formatMessage({ dateLabel: 'вівторок, 20 жовтня', time: '18:00', place: 'Парк Шевченка' });
    expect(msg).toContain('вівторок, 20 жовтня');
    expect(msg).toContain('18:00');
    expect(msg).toContain('Парк Шевченка');
    expect(msg).not.toContain('Побажання');
  });

  it('adds trimmed wish only when provided', () => {
    const msg = formatMessage({ dateLabel: 'd', time: 't', place: 'p', wish: '  какао  ' });
    expect(msg).toContain('Побажання: какао');
  });
});

describe('resolvePlace', () => {
  const park = { name: 'Парк Шевченка', coords: [1, 2] };

  it('prefers typed text over the map pick', () => {
    expect(resolvePlace(park, '  біля ЦУМу ')).toEqual({ name: 'біля ЦУМу', typed: true });
  });

  it('falls back to the map pick when text is blank', () => {
    expect(resolvePlace(park, '   ')).toBe(park);
  });

  it('returns null when nothing is chosen', () => {
    expect(resolvePlace(null, '')).toBeNull();
  });
});

describe('place texts', () => {
  const custom = { name: 'Твоє місце на карті', coords: [48.1, 35.2], custom: true };

  it('uses a Google Maps link for a custom map point in the message', () => {
    expect(placeMessageText(custom)).toBe('точка на карті https://www.google.com/maps?q=48.1,35.2');
  });

  it('uses the name for preset and typed places', () => {
    expect(placeMessageText({ name: 'Парк Глоби' })).toBe('Парк Глоби');
    expect(placeSummaryText({ name: 'біля ЦУМу', typed: true })).toBe('біля ЦУМу');
  });

  it('shows a friendly label for a custom point in the summary', () => {
    expect(placeSummaryText(custom)).toBe('твоє місце на карті');
  });
});

describe('maskTime', () => {
  it('keeps only digits and inserts a colon after hours', () => {
    expect(maskTime('1')).toBe('1');
    expect(maskTime('18')).toBe('18');
    expect(maskTime('183')).toBe('18:3');
    expect(maskTime('1830')).toBe('18:30');
    expect(maskTime('18:30')).toBe('18:30');
  });

  it('drops letters and extra digits', () => {
    expect(maskTime('1a8b3c0d9')).toBe('18:30');
  });
});

describe('normalizeTime', () => {
  it('completes short inputs', () => {
    expect(normalizeTime('9')).toBe('09:00');
    expect(normalizeTime('18')).toBe('18:00');
    expect(normalizeTime('930')).toBe('09:30');
    expect(normalizeTime('18:30')).toBe('18:30');
  });

  it('leaves empty input empty', () => {
    expect(normalizeTime('')).toBe('');
  });
});

describe('isValidTime', () => {
  it('accepts real times only', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('18:60')).toBe(false);
    expect(isValidTime('18:3')).toBe(false);
  });
});
