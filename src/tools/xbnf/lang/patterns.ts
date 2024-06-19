import { Pattern } from '$core/lexer';

export const patterns = [
  new Pattern('WHITESPACE', /^[\s\t]/, {
    ignored: true,
  }),
  new Pattern('Terminal', [/^'([^']+)'/, /^"([^"]+)"/], {
    transform: (lexeme) => lexeme.slice(1, -1),
  }),
  new Pattern('Number', /^\d+/, {
    transform: (lexeme) => Number(lexeme),
  }),
  new Pattern('Symbol', /^[a-zA-Z_]\w*$/),
  // punctuations
  new Pattern('Asterisk', /^\*$/),
  new Pattern('Plus', /^\+$/),
  new Pattern('QuestionMark', /^\?$/),
  new Pattern('LeftCurlyBrace', /^\{$/),
  new Pattern('RightCurlyBrace', /^\}$/),
  new Pattern('LeftParenthesis', /^\($/),
  new Pattern('RightParenthesis', /^\)$/),
  new Pattern('Pipe', /^\|$/, {
    associativity: 'Left',
    precedence: 0,
  }),
  new Pattern('Ampersand', '&', {
    associativity: 'Left',
    precedence: 1,
  }),
];
