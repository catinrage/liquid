import { test, expect, describe } from 'vitest';

import LR1 from '$core/parser/models/lr1';

describe('LR1 Item', () => {
  const i0 = new LR1.Item('E', ['E'], {
    index: 0,
    lookaheads: ['+', '*', '/', '^'],
  });
  const i1 = new LR1.Item('E', ['E', '+', 'T'], {
    index: 2,
    lookaheads: ['*', '/', '^'],
  });
  const i2 = new LR1.Item('E', ['E', '+', 'T', '*', 'F'], {
    index: 1,
    lookaheads: ['/', '^'],
  });
  const i3 = new LR1.Item('E', ['E', '+', 'T', '*', 'F', '/', 'G', '^', 'H'], {
    index: 4,
    lookaheads: [],
  });

  test('Next Next Symbol', () => {
    expect(i0.nextNextSymbol).toBe(undefined);
    expect(i1.nextNextSymbol).toBe(undefined);
    expect(i2.nextNextSymbol).toBe('T');
    expect(i3.nextNextSymbol).toBe('/');
  });
});
