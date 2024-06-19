import { test, expect, describe } from 'vitest';

import LR0 from '$core/parser/models/lr0';

describe('LR0 Item', () => {
  const i0 = new LR0.Item('E', ['E', '+', 'T']);
  const i1 = new LR0.Item('E', ['E', '+', 'T'], 2);
  const i2 = new LR0.Item('E', ['E', '+', 'T', '*', 'F'], 5);
  const i3 = new LR0.Item('E', ['E', '+', 'T', '*', 'F', '/', 'G', '^', 'H'], 5, () => 0);

  test('Completeness', () => {
    expect(i0.isCompleted()).toBe(false);
    expect(i1.isCompleted()).toBe(false);
    expect(i2.isCompleted()).toBe(true);
    expect(i3.isCompleted()).toBe(false);
  });

  test('Next symbol', () => {
    expect(i0.nextSymbol).toBe('E');
    expect(i1.nextSymbol).toBe('T');
    expect(i2.nextSymbol).toBe(undefined);
    expect(i3.nextSymbol).toBe('/');
  });

  test('String representation', () => {
    expect(i0.toString().replaceAll(' ', '')).toBe('E->.E+T');
    expect(i1.toString().replaceAll(' ', '')).toBe('E->E+.T');
    expect(i2.toString().replaceAll(' ', '')).toBe('E->E+T*F.');
    expect(i3.toString().replaceAll(' ', '')).toBe('E->E+T*F./G^H');
  });

  test('Equality', () => {
    expect(i0.isEqualTo(new LR0.Item('E', ['E', '+', 'T']))).toBe(true);
    expect(i1.isEqualTo(new LR0.Item('E', ['E', '+', 'T'], 2))).toBe(true);
    expect(i2.isEqualTo(new LR0.Item('E', ['E', '+', 'T', '*', 'F'], 5))).toBe(true);
    expect(i3.isEqualTo(new LR0.Item('E', ['E', '+', 'T', '*', 'F', '/', 'G', '^', 'H'], 5, () => 0))).toBe(
      true,
    );
    expect(i0.isEqualTo(new LR0.Item('E', ['E', '+', 'T'], 2))).toBe(false);
    expect(i1.isEqualTo(new LR0.Item('E', ['E', '+', 'T']))).toBe(false);
  });
});
