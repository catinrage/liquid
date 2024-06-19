import { describe, test, expect } from 'vitest';
import { Grammar, GrammarProductionRule } from '../../src/core/grammar';
import patterns from '../common/patterns';

describe('Grammar Class', () => {
  const s1 = new Grammar([
    new GrammarProductionRule('S', ['a', 'A', 'b']),
    new GrammarProductionRule('A', ['a', 'A']),
    new GrammarProductionRule('A', ['a']),
  ]);

  const s2 = new Grammar([
    new GrammarProductionRule('E', ['E', '+', 'T']),
    new GrammarProductionRule('E', ['T']),
    new GrammarProductionRule('T', ['T', '*', 'F']),
    new GrammarProductionRule('T', ['F']),
    new GrammarProductionRule('F', ['(', 'E', ')']),
    new GrammarProductionRule('F', ['id']),
  ]);

  const s3 = new Grammar([
    new GrammarProductionRule('S', ['X', 'X']),
    new GrammarProductionRule('X', ['a', 'X']),
    new GrammarProductionRule('X', ['b']),
  ]);

  const s4 = new Grammar([
    new GrammarProductionRule('S', ['A', 'a', 'A', 'b']),
    new GrammarProductionRule('S', ['B', 'b', 'B', 'a']),
    new GrammarProductionRule('A', [Grammar.Signs.ε]),
    new GrammarProductionRule('B', [Grammar.Signs.ε]),
  ]);

  const s5 = new Grammar([
    new GrammarProductionRule('A', ['a', 'B', 'c', 'D']),
    new GrammarProductionRule('B', ['C']),
    new GrammarProductionRule('B', ['C', 'd', 'B']),
    new GrammarProductionRule('C', ['e']),
    new GrammarProductionRule('C', ['f']),
    new GrammarProductionRule('C', ['g', 'C']),
    new GrammarProductionRule('D', ['h']),
    new GrammarProductionRule('D', ['i']),
    new GrammarProductionRule('D', ['j']),
  ]);

  const s6 = new Grammar(
    [new GrammarProductionRule('S', ['NUMBER', ':Operator/Binary:', ':Operator/Assignment:'])],
    patterns,
  );

  test('properly returns an array of the variables used in the grammar', () => {
    expect(s1.variables).toEqual(['S', 'A']);
    expect(s2.variables).toEqual(['E', 'T', 'F']);
    expect(s3.variables).toEqual(['S', 'X']);
    expect(s4.variables).toEqual(['S', 'A', 'B']);
    expect(s5.variables).toEqual(['A', 'B', 'C', 'D']);
  });

  test('properly returns an array of the terminals used in the grammar', () => {
    expect(s1.terminals).toEqual(['a', 'b']);
    expect(s2.terminals).toEqual(['+', '*', '(', ')', 'id']);
    expect(s3.terminals).toEqual(['a', 'b']);
    expect(s4.terminals).toEqual(['a', 'b']);
    expect(s5.terminals).toEqual(['a', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
  });

  test('properly calculates and returns set of first symbols for each variable', () => {
    expect(s1.firsts).toEqual({
      S: ['a'],
      A: ['a'],
    });

    expect(s2.firsts).toEqual({
      E: ['(', 'id'],
      T: ['(', 'id'],
      F: ['(', 'id'],
    });

    expect(s3.firsts).toEqual({
      S: ['a', 'b'],
      X: ['a', 'b'],
    });

    expect(s4.firsts).toEqual({
      S: ['a', 'b'],
      A: [Grammar.Signs.ε],
      B: [Grammar.Signs.ε],
    });

    expect(s5.firsts).toEqual({
      A: ['a'],
      B: ['e', 'f', 'g'],
      C: ['e', 'f', 'g'],
      D: ['h', 'i', 'j'],
    });
  });

  test('properly calculates and returns set of follow symbols for each variable', () => {
    expect(s1.follows).toEqual({
      S: [Grammar.Signs.$],
      A: ['b'],
    });

    expect(s2.follows).toEqual({
      E: [Grammar.Signs.$, '+', ')'],
      T: [Grammar.Signs.$, '+', '*', ')'],
      F: [Grammar.Signs.$, '+', '*', ')'],
    });

    expect(s3.follows).toEqual({
      S: [Grammar.Signs.$],
      X: ['a', 'b', Grammar.Signs.$],
    });

    expect(s4.follows).toEqual({
      S: [Grammar.Signs.$],
      A: ['a', 'b'],
      B: ['b', 'a'],
    });

    expect(s5.follows).toEqual({
      A: [Grammar.Signs.$],
      B: ['c'],
      C: ['c', 'd'],
      D: [Grammar.Signs.$],
    });
  });

  test('properly calculates and returns the first set of a sequence of symbols', () => {
    expect(s1.firstOfSequence(['a', 'A', 'b'])).toEqual(['a']);
    expect(s1.firstOfSequence(['a', 'A'])).toEqual(['a']);
    expect(s1.firstOfSequence(['a'])).toEqual(['a']);

    expect(s2.firstOfSequence(['E', '+', 'T'])).toEqual(['(', 'id']);
    expect(s2.firstOfSequence(['T'])).toEqual(['(', 'id']);
    expect(s2.firstOfSequence(['F'])).toEqual(['(', 'id']);

    expect(s3.firstOfSequence(['a', 'X'])).toEqual(['a']);
    expect(s3.firstOfSequence(['b'])).toEqual(['b']);

    expect(s4.firstOfSequence(['a', 'b'])).toEqual(['a']);
    expect(s4.firstOfSequence(['b', 'A', 'b'])).toEqual(['b']);
    expect(s4.firstOfSequence(['A', 'B'])).toEqual([Grammar.Signs.ε]);

    expect(s5.firstOfSequence(['a', 'B', 'c', 'D'])).toEqual(['a']);
    expect(s5.firstOfSequence(['C', 'a'])).toEqual(['e', 'f', 'g']);
    expect(s5.firstOfSequence(['C', 'd', 'B'])).toEqual(['e', 'f', 'g']);
    expect(s5.firstOfSequence(['g', 'C'])).toEqual(['g']);
    expect(s5.firstOfSequence(['h'])).toEqual(['h']);
  });

  test('properly ungroups a grammar', () => {
    expect(s6.rules.length).toBe(8);
    // should not contain any rule with [Operator/Binary] or [Operator/Assignment] in its rhs
    expect(s6.rules.every((rule) => !rule.rhs.includes('[Operator/Binary]'))).toBe(true);
    expect(s6.rules.every((rule) => !rule.rhs.includes('[Operator/Assignment]'))).toBe(true);
  });
});
