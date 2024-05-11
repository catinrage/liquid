import { test, expect, describe } from 'vitest';
import Lexer from '$core/lexer';
import patterns from '../../lang/patterns';
import { Grammar } from '$core/grammar';

const L1 = new Lexer(`1 + "hello";`, patterns);
const L2 = new Lexer(`-6 + -8`, patterns);
const L3 = new Lexer(
  `t += 9;
let x = "this is a long string";`,
  patterns,
);

describe('Lexer/Tokenizer', () => {
  test('tokens length check', () => {
    expect(L1.tokens.length).toBe(5);
    expect(L2.tokens.length).toBe(6);
  });
  test('tokens type check', () => {
    expect(L1.tokens[0].type).toBe('NUMBER');
    expect(L1.tokens[1].type).toBe('PLUS');
    expect(L1.tokens[2].type).toBe('STRING');
    expect(L1.tokens[3].type).toBe('SEMICOLON');
    expect(L1.tokens[4].type).toBe(Grammar.SIGNS.EOI);
    expect(L2.tokens[0].type).toBe('MINUS');
    expect(L2.tokens[1].type).toBe('NUMBER');
    expect(L2.tokens[2].type).toBe('PLUS');
    expect(L2.tokens[3].type).toBe('MINUS');
    expect(L2.tokens[4].type).toBe('NUMBER');
    expect(L2.tokens[5].type).toBe(Grammar.SIGNS.EOI);
  });
  test('tokens lexeme check', () => {
    expect(L1.tokens[0].lexeme).toBe('1');
    expect(L1.tokens[1].lexeme).toBe('+');
    expect(L1.tokens[2].lexeme).toBe('"hello"');
    expect(L1.tokens[3].lexeme).toBe(';');
    expect(L1.tokens[4].lexeme).toBe('\0');
    expect(L2.tokens[0].lexeme).toBe('-');
    expect(L2.tokens[1].lexeme).toBe('6');
    expect(L2.tokens[2].lexeme).toBe('+');
    expect(L2.tokens[3].lexeme).toBe('-');
    expect(L2.tokens[4].lexeme).toBe('8');
    expect(L2.tokens[5].lexeme).toBe('\0');
  });
  test('tokens literal check', () => {
    expect(L1.tokens[0].literal).toBe(1);
    expect(L1.tokens[2].literal).toBe('hello');
    expect(L2.tokens[1].literal).toBe(6);
    expect(L2.tokens[4].literal).toBe(8);
  });
  test('tokens location start check', () => {
    expect(L1.tokens[0].start).toEqual(1);
    expect(L1.tokens[1].start).toEqual(3);
    expect(L1.tokens[2].start).toEqual(5);
    expect(L1.tokens[3].start).toEqual(12);
    expect(L1.tokens[4].start).toEqual(13);
    expect(L2.tokens[0].start).toEqual(1);
    expect(L2.tokens[1].start).toEqual(2);
    expect(L2.tokens[2].start).toEqual(4);
    expect(L2.tokens[3].start).toEqual(6);
    expect(L2.tokens[4].start).toEqual(7);
    expect(L2.tokens[5].start).toEqual(8);
    expect(L3.tokens[7].start).toEqual(17);
  });
  test('tokens location end check', () => {
    expect(L1.tokens[0].end).toEqual(2);
    expect(L1.tokens[1].end).toEqual(4);
    expect(L1.tokens[2].end).toEqual(12);
    expect(L1.tokens[3].end).toEqual(13);
    expect(L1.tokens[4].end).toEqual(13);
    expect(L2.tokens[0].end).toEqual(2);
    expect(L2.tokens[1].end).toEqual(3);
    expect(L2.tokens[2].end).toEqual(5);
    expect(L2.tokens[3].end).toEqual(7);
    expect(L2.tokens[4].end).toEqual(8);
    expect(L2.tokens[5].end).toEqual(8);
    expect(L3.tokens[7].end).toEqual(40);
  });
  test('expect error for missing "', () => {
    expect(() => {
      const LL = new Lexer(`"dad`, patterns);
    }).toThrow();
  });
  test('comment in the middle of string', () => {
    const LL = new Lexer(`x = "hello // some text"`, patterns);
    expect(LL.tokens[2].literal).toBe('hello // some text');
  });
  test('purging single line comments', () => {
    const LL = new Lexer(
      `// this is a comment
    x = 1 + 2;`,
      patterns,
    );
    expect(LL.tokens.length).toBe(7);
  });
  test('ultimate comment test', () => {
    const LL = new Lexer(
      `// some comment // dawd
x = "// hello" // hello "mester " // " 5 + 3;"
///`,
      patterns,
    );
    expect(LL.tokens.length).toBe(4);
  });
  test('multiline comment test', () => {
    const LL = new Lexer(
      `/* 
  this is a mult
  line comment
*/
x = y`,
      patterns,
    );
    expect(LL.tokens.length).toBe(4);
  });
});
