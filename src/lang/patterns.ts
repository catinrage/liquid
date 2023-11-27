import { Pattern } from '../common';

/**
 * Lexical pattern for characters to be omitted.
 *
 * @type {Pattern[]}
 */
export const omitted: Pattern[] = [new Pattern('OMITTED', /^[ \n\r\t]/)];

/**
 * Lexical patterns for literals used in the language interpreter.
 * Each pattern consists of a name, regex, and optional parser function.
 *
 * @type {Pattern[]}
 */
const literals: Pattern[] = [
  new Pattern('NIL', /^nil$/, ['Literal']),
  new Pattern('NUMBER', /^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/, ['Literal'], (lexeme) =>
    lexeme.includes('.') ? parseFloat(lexeme) : parseInt(lexeme),
  ),
  new Pattern('STRING', /^"[^"\n]*"/, ['Literal'], (lexeme) => lexeme.slice(1, -1)),
  // regex that catches true or false :
  new Pattern('Boolean', /^(true|false)$/, ['Literal']),
];

/**
 * Lexical patterns for operators grouped into categories: arithmetic, comparison, and logical.
 * Each category is represented as an array of `Pattern` objects.
 *
 * @typedef {Object} Operators
 * @property {Pattern[]} arithmetic - Lexical patterns for arithmetic operators.
 * @property {Pattern[]} comparison - Lexical patterns for comparison operators.
 * @property {Pattern[]} logical - Lexical patterns for logical operators.
 */
const operators: Record<string, Pattern[]> = {
  arithmetic: [
    new Pattern('PLUS', /^\+$/, ['Operator/Binary', 'Operator/Unary']),
    new Pattern('MINUS', /^-$/, ['Operator/Binary', 'Operator/Unary']),
    new Pattern('MULTIPLY', /^\*$/, ['Operator/Binary']),
    new Pattern('DIVIDE', /^\/$/, ['Operator/Binary']),
    new Pattern('MODULO', /^%$/, ['Operator/Binary']),
    new Pattern('POWER', /^\^$/, ['Operator/Binary']),
  ],
  comparison: [
    new Pattern('EQUAL', /^==$/, ['Operator/Binary', 'Operator/Comparison']),
    new Pattern('NOT_EQUAL', /^!=$/, ['Operator/Binary', 'Operator/Comparison']),
    new Pattern('LESS_THAN', /^<$/, ['Operator/Binary', 'Operator/Comparison']),
    new Pattern('LESS_THAN_OR_EQUAL', /^<=$/, ['Operator/Binary', 'Operator/Comparison']),
    new Pattern('GREATER_THAN', /^>$/, ['Operator/Binary', 'Operator/Comparison']),
    new Pattern('GREATER_THAN_OR_EQUAL', /^>=$/, ['Operator/Binary', 'Operator/Comparison']),
  ],
  logical: [
    new Pattern('AND', /^and$/, ['Operator/Binary', 'Operator/Logical']),
    new Pattern('OR', /^or$/, ['Operator/Binary', 'Operator/Logical']),
    new Pattern('XOR', /^xor$/, ['Operator/Binary', 'Operator/Logical']),
    new Pattern('NOT', [/^not$/, /^!$/], ['Operator/Unary', 'Operator/Logical']),
  ],
  assignment: [
    new Pattern('ASSIGN', /^=$/, ['Operator/Assignment']),
    new Pattern('PLUS_ASSIGN', /^\+=$/, ['Operator/Assignment']),
    new Pattern('MINUS_ASSIGN', /^-=$/, ['Operator/Assignment']),
    new Pattern('MULTIPLY_ASSIGN', /^\*=$/, ['Operator/Assignment']),
    new Pattern('DIVIDE_ASSIGN', /^\/=$/, ['Operator/Assignment']),
    new Pattern('MODULO_ASSIGN', /^%=$/, ['Operator/Assignment']),
  ],
};

/**
 * Lexical patterns for punctuation symbols used in the language interpreter.
 * Each `Pattern` represents a specific punctuation token.
 *
 * @type {Pattern[]}
 */
const punctuations: Pattern[] = [
  new Pattern('OPEN_PAREN', /^\($/),
  new Pattern('CLOSE_PAREN', /^\)$/),
  new Pattern('OPEN_BRACE', /^\{$/),
  new Pattern('CLOSE_BRACE', /^\}$/),
  new Pattern('OPEN_BRACKET', /^\[$/),
  new Pattern('CLOSE_BRACKET', /^\]$/),
  new Pattern('COMMA', /^,$/),
  new Pattern('DOT', /^\.$/),
  new Pattern('COLON', /^:$/),
  new Pattern('SEMICOLON', /^;$/),
  new Pattern('EOF', /^\0$/),
];

/**
 * Lexical patterns for keywords used in the language interpreter.
 * Each `Pattern` represents a specific keyword token.
 *
 * @type {Pattern[]}
 */
const keywords: Pattern[] = [
  new Pattern('DECLARE', /^declare$/),
  new Pattern('VARIABLE', [/^variable$/, /^var$/], ['Keyword/Declaration']),
  new Pattern('CONSTANT', [/^constant$/, /^const$/], ['Keyword/Declaration']),
  new Pattern('FUNCTION', /^function$/),
  new Pattern('RETURN', /^function$/),
  new Pattern('IF', /^if$/),
  new Pattern('ELSE', /^else$/),
  new Pattern('ELIF', /^elseif$/),
  new Pattern('FOR', /^for$/),
  new Pattern('IN', /^in$/),
  new Pattern('WHILE', /^while$/),
];

/**
 * Lexical patterns for identifiers used in the language interpreter.
 * Each `Pattern` represents an identifier token.
 *
 * @type {Pattern[]}
 */
const identifiers: Pattern[] = [new Pattern('IDENTIFIER', /^[a-zA-Z_][a-zA-Z0-9_]*/)];

/**
 * Lexical patterns for comments used in the language interpreter.
 * Each `Pattern` represents a comment token.
 *
 * @type {Pattern[]}
 */
const comments: Pattern[] = [new Pattern('COMMENT', [/^\/\/[^\n]*\n?/g, /^\/\*[\s\S]*?\*\//g], ['Junk'])];

/**
 * A unified collection of all lexical patterns, including literals, operators, punctuations, keywords, and identifiers.
 *
 * @type {Pattern[]}
 */
export default [
  ...omitted,
  ...literals,
  ...keywords,
  ...operators.arithmetic,
  ...operators.comparison,
  ...operators.logical,
  ...operators.assignment,
  ...punctuations,
  ...identifiers,
  ...comments,
] as const;
