import { test, expect, describe } from 'vitest';

import { Grammar } from '$core/grammar';
import { Lexer } from '$core/lexer';
import patterns from '../common/patterns';
import { read } from '../common/utils';

export const lexer = new Lexer(patterns);

const T1 = lexer.tokenize(read('./samples/s1'));
const T2 = lexer.tokenize(read('./samples/s2'));
const T3 = lexer.tokenize(read('./samples/s3'));

describe('Lexer/Tokenizer', () => {
  test('tokens length check', () => {
    expect(T1.length).toBe(5);
    expect(T2.length).toBe(6);
  });
  test('tokens type check', () => {
    expect(T1[0].type).toBe('NUMBER');
    expect(T1[1].type).toBe('PLUS');
    expect(T1[2].type).toBe('STRING');
    expect(T1[3].type).toBe('SEMICOLON');
    expect(T1[4].type).toBe(Grammar.Signs.$);
    expect(T2[0].type).toBe('MINUS');
    expect(T2[1].type).toBe('NUMBER');
    expect(T2[2].type).toBe('PLUS');
    expect(T2[3].type).toBe('MINUS');
    expect(T2[4].type).toBe('NUMBER');
    expect(T2[5].type).toBe(Grammar.Signs.$);
  });
  test('tokens lexeme check', () => {
    expect(T1[0].lexeme).toBe('1');
    expect(T1[1].lexeme).toBe('+');
    expect(T1[2].lexeme).toBe('"hello"');
    expect(T1[3].lexeme).toBe(';');
    expect(T1[4].lexeme).toBe('\0');
    expect(T2[0].lexeme).toBe('-');
    expect(T2[1].lexeme).toBe('6');
    expect(T2[2].lexeme).toBe('+');
    expect(T2[3].lexeme).toBe('-');
    expect(T2[4].lexeme).toBe('8');
    expect(T2[5].lexeme).toBe('\0');
  });
  test('tokens literal check', () => {
    expect(T1[0].literal).toBe(1);
    expect(T1[2].literal).toBe('hello');
    expect(T2[1].literal).toBe(6);
    expect(T2[4].literal).toBe(8);
  });
  test('tokens location start check', () => {
    expect(T1[0].start).toEqual({
      line: 1,
      character: 1,
    });
    expect(T1[1].start).toEqual({
      line: 1,
      character: 3,
    });
    expect(T1[2].start).toEqual({
      line: 1,
      character: 5,
    });
    expect(T1[3].start).toEqual({
      line: 1,
      character: 12,
    });
    expect(T1[4].start).toEqual({
      line: 1,
      character: 13,
    });
    expect(T2[0].start).toEqual({
      line: 1,
      character: 1,
    });
    expect(T2[1].start).toEqual({
      line: 1,
      character: 2,
    });
    expect(T2[2].start).toEqual({
      line: 1,
      character: 4,
    });
    expect(T2[3].start).toEqual({
      line: 1,
      character: 6,
    });
    expect(T2[4].start).toEqual({
      line: 1,
      character: 7,
    });
    expect(T2[5].start).toEqual({
      line: 1,
      character: 8,
    });
    expect(T3[7].start).toEqual({
      line: 2,
      character: 9,
    });
  });
  test('tokens location end check', () => {
    expect(T1[0].end).toEqual({
      line: 1,
      character: 2,
    });
    expect(T1[1].end).toEqual({
      line: 1,
      character: 4,
    });
    expect(T1[2].end).toEqual({
      line: 1,
      character: 12,
    });
    expect(T1[3].end).toEqual({
      line: 1,
      character: 13,
    });
    expect(T1[4].end).toEqual({
      line: 1,
      character: 13,
    });
    expect(T2[0].end).toEqual({
      line: 1,
      character: 2,
    });
    expect(T2[1].end).toEqual({
      line: 1,
      character: 3,
    });
    expect(T2[2].end).toEqual({
      line: 1,
      character: 5,
    });
    expect(T2[3].end).toEqual({
      line: 1,
      character: 7,
    });
    expect(T2[4].end).toEqual({
      line: 1,
      character: 8,
    });
    expect(T2[5].end).toEqual({
      line: 1,
      character: 8,
    });
    expect(T3[7].end).toEqual({
      line: 2,
      character: 32,
    });
  });
  test('expect error for missing "', () => {
    expect(() => {
      const LL = lexer.tokenize(`"hello`);
    }).toThrow();
  });
  test('comment in the middle of string', () => {
    const LL = lexer.tokenize(`x = "hello // some text"`);
    expect(LL[2].literal).toBe('hello // some text');
  });
});
