import type { Pattern } from './pattern';
import type { Token } from './token';
import { wrapInArray } from '$common/helpers';
import { Grammar } from '$core/grammar';
import { LiquidLexerError } from '$core/error';

/**
 * Represents a lexer that tokenizes input strings based on provided patterns.
 */
class Lexer {
  constructor(
    /**
     * The reference patterns used for tokenization.
     * Patterns at the beginning of the list have higher priority.
     */
    private _patterns: readonly Pattern[],
  ) {}

  /**
   * Tokenizes a batch of the input string.
   * @param batch The batch of the input string to be tokenized.
   * @param location The location of the batch in the input string.
   * @returns A Token object representing the tokenized batch, or null if no match is found.
   */
  private tokenizeBatch(batch: string, location: number): Token | null {
    for (const pattern of this._patterns) {
      for (const id of wrapInArray(pattern.identifier)) {
        if (id instanceof RegExp) {
          const match = batch.match(id);
          if (match) {
            return {
              type: pattern.name,
              groups: pattern.groups,
              lexeme: match[0],
              precedence: pattern.precedence,
              associativity: pattern.associativity,
              literal: pattern.transform(match[0]),
              start: location,
              end: location + match[0].length,
            };
          }
        } else {
          if (batch === id) {
            return {
              type: pattern.name,
              groups: pattern.groups,
              lexeme: id,
              precedence: pattern.precedence,
              associativity: pattern.associativity,
              literal: pattern.transform(id),
              start: location,
              end: location + id.length,
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Tokenizes the entire input string, producing an array of tokens based on the provided patterns.
   * @param input The input string to be tokenized.
   * @returns An array of tokens.
   * @throws LiquidLexerError if an invalid token is encountered.
   */
  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let location = 1;
    let stream: string = input;
    while (stream.length) {
      let cursor = 1;
      let longestMatch: Token | null = null;
      while (cursor <= stream.length) {
        const batch = stream.slice(0, cursor);
        const token = this.tokenizeBatch(batch, location);
        if (token && (!longestMatch || token.lexeme.length > longestMatch?.lexeme.length)) {
          longestMatch = token;
        }
        cursor++;
      }
      if (longestMatch) {
        tokens.push(longestMatch);
        location += longestMatch.lexeme.length;
        stream = stream.slice(longestMatch.lexeme.length);
      } else {
        if (stream.length) {
          throw new LiquidLexerError(`Invalid token \`${stream[0]}\``, location);
        }
      }
    }
    tokens.push({
      type: Grammar.SIGNS.EOF,
      groups: [],
      lexeme: '\0',
      literal: {},
      precedence: -Infinity,
      associativity: 'None',
      start: location,
      end: location,
    });
    return this.purge(tokens);
  }

  /**
   * Removes all tokens that belong to group `Ignored` from the token stream.
   * @param tokens The token stream to be purged.
   * @returns The purged token stream.
   */
  private purge(tokens: Token[]): Token[] {
    return tokens.filter((token) => !token.groups.includes('Ignored'));
  }
}

export default Lexer;
