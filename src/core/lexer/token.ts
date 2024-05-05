import type { Pattern } from './pattern';

/**
 * Represents a token in the lexer.
 */
export class Token {
  constructor(
    /**
     * The type of the token.
     * @example 'Keyword' | 'Identifier' | 'Literal' | 'Operator'
     */
    public readonly type: string,
    /**
     * List of groups the token belongs to.
     * Grouping tokens can be useful when creating grammars.
     */
    public readonly groups: Pattern['groups'],
    /**
     * The lexeme of the token (the actual value that has been matched).
     * @example 'if' | 'else' | '123' | '+' | '"hello"'
     */
    public readonly lexeme: string,
    /**
     * The literal value of the token (parsed value).
     * @example 123 | true | false | 'hello'
     */
    public readonly literal: unknown,
    /**
     * The start location of the token.
     */
    public readonly start: number,
    /**
     * The end location of the token.
     */
    public readonly end: number,
  ) {}
}
