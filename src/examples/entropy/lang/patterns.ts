import { Pattern } from '$core/lexer';

export const patterns = [
  new Pattern('WHITESPACE', /^[\s\t]/, {
    ignored: true,
  }),
  // literal values
  new Pattern('Number', /^(\+|\-)?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/, {
    groups: ['Literal'],
    transform: (lexeme) => Number(lexeme),
  }),
  new Pattern('String', /^"[^"\n]*"$/, {
    groups: ['Literal'],
    transform: (lexeme) => lexeme.slice(1, -1),
  }),
  new Pattern('Boolean', /^(true|false)$/, {
    groups: ['Literal'],
    transform: (lexeme) => lexeme === 'true',
  }),
  new Pattern('Null', /^null$/, {
    groups: ['Literal'],
    transform: () => null,
  }),
  // identifiers
  new Pattern('Identifier', /^[a-zA-Z_][a-zA-Z0-9_]*$/),
];
