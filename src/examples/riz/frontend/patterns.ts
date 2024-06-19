import { Pattern } from '$core/lexer/pattern';

/**
 * Lexical pattern for characters to be omitted.
 */
export const whitespace: Pattern[] = [
  new Pattern('WHITESPACE', /^[\s\t]/, {
    ignored: true,
  }),
];

/**
 * Lexical patterns for literals used in the language interpreter.
 * Each pattern consists of a name, regex, and optional parser function.
 */
const literals: Pattern[] = [
  new Pattern('NIL', /^nil$/, {
    groups: ['Literal'],
  }),
  new Pattern('NUMBER', /^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/, {
    groups: ['Literal'],
    transform: (lexeme) => (lexeme.includes('.') ? parseFloat(lexeme) : parseInt(lexeme)),
  }),
  new Pattern('STRING', [/^"[^"\n]*"/, /^'[^'\n]*'/], {
    groups: ['Literal'],
    transform: (lexeme) => lexeme.slice(1, -1),
  }),
  new Pattern('BOOLEAN', /^(true|false)$/, {
    groups: ['Literal'],
  }),
];

/**
 * Lexical patterns for operators grouped into categories: arithmetic, comparison, and logical.
 * Each category is represented as an array of `Pattern` objects.
 *
 * @property {Pattern[]} arithmetic - Lexical patterns for arithmetic operators.
 * @property {Pattern[]} comparison - Lexical patterns for comparison operators.
 * @property {Pattern[]} logical - Lexical patterns for logical operators.
 */
const operators: Record<string, Pattern[]> = {
  arithmetic: [
    new Pattern('PLUS', '+', {
      groups: ['Operator/Binary', 'Operator/Unary'],
      associativity: 'Left',
      precedence: 3,
    }),
    new Pattern('MINUS', '-', {
      groups: ['Operator/Binary', 'Operator/Unary'],
      associativity: 'Left',
      precedence: 3,
    }),
    new Pattern('TIMES', '*', {
      groups: ['Operator/Binary'],
      associativity: 'Left',
      precedence: 4,
    }),
    new Pattern('DIVIDE', '/', {
      groups: ['Operator/Binary'],
      associativity: 'Left',
      precedence: 4,
    }),
    new Pattern('MODULO', '%', {
      groups: ['Operator/Binary'],
      associativity: 'Left',
      precedence: 4,
    }),
    new Pattern('POWER', '^', {
      groups: ['Operator/Binary'],
      associativity: 'Right',
      precedence: 5,
    }),
  ],
  comparison: [
    new Pattern('EQUAL', '==', {
      groups: ['Operator/Binary', 'Operator/Comparison'],
      associativity: 'Left',
      precedence: 2,
    }),
    new Pattern('NOT_EQUAL', '!=', {
      groups: ['Operator/Binary', 'Operator/Comparison'],
      associativity: 'Left',
      precedence: 2,
    }),
    new Pattern('LESS_THAN', '<', {
      groups: ['Operator/Binary', 'Operator/Comparison'],
      associativity: 'Left',
      precedence: 2,
    }),
    new Pattern('LESS_THAN_OR_EQUAL', '<=', {
      groups: ['Operator/Binary', 'Operator/Comparison'],
      associativity: 'Left',
      precedence: 2,
    }),
    new Pattern('GREATER_THAN', '>', {
      groups: ['Operator/Binary', 'Operator/Comparison'],
      associativity: 'Left',
      precedence: 2,
    }),
    new Pattern('GREATER_THAN_OR_EQUAL', '>=', {
      groups: ['Operator/Binary', 'Operator/Comparison'],
      associativity: 'Left',
      precedence: 2,
    }),
  ],
  logical: [
    new Pattern('AND', 'and', {
      groups: ['Operator/Binary', 'Operator/Logical'],
      associativity: 'Left',
      precedence: 1,
    }),
    new Pattern('OR', 'or', {
      groups: ['Operator/Binary', 'Operator/Logical'],
      associativity: 'Left',
      precedence: 1,
    }),
    new Pattern('XOR', 'xor', {
      groups: ['Operator/Binary', 'Operator/Logical'],
      associativity: 'Left',
      precedence: 1,
    }),
    new Pattern('NOT', ['not', '!'], {
      groups: ['Operator/Unary', 'Operator/Logical'],
      associativity: 'Left',
      precedence: 1,
    }),
  ],
  assignment: [
    new Pattern('ASSIGN', '=', {
      groups: ['Operator/Assignment'],
    }),
    new Pattern('PLUS_ASSIGN', '+=', {
      groups: ['Operator/Assignment'],
    }),
    new Pattern('MINUS_ASSIGN', '-=', {
      groups: ['Operator/Assignment'],
    }),
    new Pattern('MULTIPLY_ASSIGN', '*=', {
      groups: ['Operator/Assignment'],
    }),
    new Pattern('DIVIDE_ASSIGN', '/=', {
      groups: ['Operator/Assignment'],
    }),
    new Pattern('MODULO_ASSIGN', '%=', {
      groups: ['Operator/Assignment'],
    }),
    new Pattern('POWER_ASSIGN', '^=', {
      groups: ['Operator/Assignment'],
    }),
    new Pattern('REACTIVE_ASSIGN', ':=', {
      groups: ['Operator/Assignment'],
    }),
  ],
};

/**
 * Lexical patterns for punctuation symbols used in the language interpreter.
 * Each `Pattern` represents a specific punctuation token.
 */
const punctuations: Pattern[] = [
  new Pattern('OPEN_PAREN', '('),
  new Pattern('CLOSE_PAREN', ')'),
  new Pattern('OPEN_BRACE', '{'),
  new Pattern('CLOSE_BRACE', '}'),
  new Pattern('OPEN_BRACKET', '['),
  new Pattern('CLOSE_BRACKET', ']'),
  new Pattern('COMMA', ','),
  new Pattern('DOT', '.'),
  new Pattern('COLON', ':'),
  new Pattern('SEMICOLON', ';'),
  new Pattern('PIPE', '|'),
  new Pattern('ARROW', '-->'),
];

/**
 * Lexical patterns for keywords used in the language interpreter.
 * Each `Pattern` represents a specific keyword token.
 */
const keywords: Pattern[] = [
  new Pattern('VAR', 'var', {
    groups: ['Keyword/Declaration'],
  }),
  new Pattern('IF', 'if', {
    groups: ['Keyword/Declaration'],
  }),
  new Pattern('FOR', 'for', {
    groups: ['Keyword/Declaration'],
  }),
];

/**
 * Lexical patterns for identifiers used in the language interpreter.
 * Each `Pattern` represents an identifier token.
 */
const identifiers: Pattern[] = [new Pattern('IDENTIFIER', /^[a-zA-Z_][a-zA-Z0-9_]*/)];

/**
 * Lexical patterns for comments used in the language interpreter.
 * Each `Pattern` represents a comment token.
 */
const comments: Pattern[] = [
  new Pattern('COMMENT', [/^\#[^\n]*\n?/g], {
    ignored: true,
  }),
];

/**
 * A unified collection of all lexical patterns, including literals, operators, punctuations, keywords, and identifiers.
 */
export default [
  ...whitespace,
  ...literals,
  ...keywords,
  ...operators.arithmetic,
  ...operators.comparison,
  ...operators.logical,
  ...operators.assignment,
  ...punctuations,
  ...identifiers,
  ...comments,
];
