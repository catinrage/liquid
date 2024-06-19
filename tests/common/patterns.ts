import { Pattern } from '$core/lexer/pattern';

export default [
  // Ignored patterns
  new Pattern('WHITESPACE', /^[\s\t]/, {
    ignored: true,
  }),
  new Pattern('Comment', [/^\/\/[^\n]*\n?/g, /^\/\*[\s\S]*?\*\//g], {
    ignored: true,
  }),
  // Literal patterns
  new Pattern('NUMBER', /^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/, {
    transform: (lexeme) => (lexeme.includes('.') ? parseFloat(lexeme) : parseInt(lexeme)),
  }),
  new Pattern('STRING', [/^"[^"\n]*"/, /^'[^'\n]*'/], {
    transform: (lexeme) => lexeme.slice(1, -1),
  }),
  new Pattern('BOOLEAN', /^(true|false)$/),
  // Operator patterns
  new Pattern('PLUS', '+', {
    groups: ['Operator/Binary'],
  }),
  new Pattern('MINUS', '-', {
    groups: ['Operator/Binary'],
  }),
  new Pattern('TIMES', '*', {
    groups: ['Operator/Binary'],
  }),
  new Pattern('DIVIDE', '/', {
    groups: ['Operator/Binary'],
  }),
  new Pattern('ASSIGN', '=', {
    groups: ['Operator/Assignment'],
  }),
  new Pattern('ASSIGN', '+=', {
    groups: ['Operator/Assignment'],
    // note: if you'r going to add any more [Operator/Binary] or [Operator/Assignment] patterns, make sure to update the tests\
    // in tests/grammar/grammar.spec.ts, where we check the number of rules after ungrouping the grammar
  }),
  // Punctuation patterns
  new Pattern('SEMICOLON', ';'),
  // Keyword patterns
  new Pattern('LET', 'let', {
    groups: ['Keyword'],
  }),
  // Identifier pattern
  new Pattern('IDENTIFIER', /^[a-zA-Z_][a-zA-Z0-9_]*/),
] satisfies Pattern[];
