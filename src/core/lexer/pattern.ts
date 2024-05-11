/**
 * Represents a pattern used for matching and parsing lexemes.
 */
export class Pattern {
  constructor(
    /**
     * The name of the pattern.
     * This name is used to identify the pattern in the grammar & lexer.
     * Patterns with the name 'OMITTED' are used ignored by the lexer.
     * @example 'NUMBER' | 'STRING' | 'PLUS' | 'MINUS' | 'ASSIGN'
     */
    public readonly name: 'OMITTED' | (string & Record<never, never>),

    /**
     * The regular expression used for matching the lexeme.
     * can be a single regex or an array of them.
     * @example /^\d+$/ | /^"([^"]*)"$/
     */
    public readonly regex: RegExp | RegExp[],

    /**
     * The groups the pattern belongs to.
     * Grouping patterns can be useful when creating grammars.
     * @example ['Literal'] | ['Operator/Binary'] | ['Operator/Unary']
     */
    public readonly groups: (
      | 'Keyword/Declaration'
      | 'Operator/Binary'
      | 'Operator/Unary'
      | 'Operator/Logical'
      | 'Operator/Assignment'
      | 'Operator/Comparison'
      | 'Literal'
      | 'Punctuation'
      | 'Junk'
    )[] = [],

    /**
     * The function used for parsing the matched lexeme.
     * @example (lexeme) => parseInt(lexeme) ; for numbers
     * @example (lexeme) => lexeme.slice(1, -1) ; for strings to remove quotes
     */
    public readonly parser: (lexeme: string) => unknown = () => ({}),
  ) {}
}
