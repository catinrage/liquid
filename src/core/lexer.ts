import { Token, Pattern } from '../common';
import { wrapInArray, LiquidErrorInstance } from '../common/helpers';

/**
 * Represents a lexer that tokenizes input strings based on provided patterns.
 */
class Lexer {
  /**
   * The input string to be tokenized (source code).
   */
  private input: string;

  /**
   * The reference patterns used for tokenization.
   */
  private patterns: readonly Pattern[];

  /**
   * The tokens produced by the lexer.
   */
  public tokens: Token[] = [];

  /**
   * Creates a new instance of the Lexer class.
   * @param input The input string to be tokenized.
   * @param patterns The patterns used for tokenization.
   */
  constructor(input: string, patterns: readonly Pattern[]) {
    this.input = input;
    this.patterns = patterns;

    this.tokens = this.tokenize();
  }

  /**
   * Tokenizes a batch of the input string.
   * @param batch The batch of the input string to be tokenized.
   * @returns A Token object representing the tokenized batch, or null if no match is found.
   */
  private tokenizeBatch(batch: string, location: number): Token | null {
    for (const pattern of this.patterns) {
      for (const regex of wrapInArray(pattern.regex)) {
        const match = batch.match(regex);
        if (match) {
          return {
            type: pattern.name,
            groups: pattern.groups,
            lexeme: match[0],
            literal: pattern.parser(match[0]),
            start: location,
            end: location + match[0].length,
          };
        }
      }
    }
    return null;
  }

  /**
   * Tokenizes the entire input string, producing an array of tokens based on the provided patterns.
   * @returns An array of tokens.
   */
  tokenize(): Token[] {
    const tokens: Token[] = [];
    let location = 1;
    let stream: string = this.input;
    while (stream.length) {
      const omitted = this.patterns.find((pattern) => pattern.name === 'OMITTED');
      while (omitted && !Array.isArray(omitted.regex) && omitted.regex.test(stream[0])) {
        location++;
        stream = stream.slice(1);
      }
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
          throw LiquidErrorInstance('Lexer', `Invalid token \`${stream[0]}\``, location);
        }
      }
    }
    tokens.push({
      type: 'EOF',
      groups: [],
      lexeme: '\0',
      literal: {},
      start: location,
      end: location,
    });
    return this.purge(tokens);
  }

  /**
   * Removes all comment tokens from the token stream.
   * @param tokens The token stream to be purged.
   * @returns The purged token stream.
   */
  private purge(tokens: Token[]): Token[] {
    return tokens.filter((token) => token.type !== 'COMMENT');
  }
}

export default Lexer;
