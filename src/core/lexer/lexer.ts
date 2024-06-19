import type { Pattern } from './pattern';
import type { Token } from './token';
import { wrapInArray } from '$common/helpers';
import { Grammar } from '$core/grammar';
import { LiquidSyntaxError } from '$core/error';

export type TokenLocation = {
  line: number;
  character: number;
};

/**
 * Represents a lexer that tokenizes input strings based on provided patterns.
 */
class Lexer {
  private _cache: Map<string, Token> = new Map();

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
  private _tokenizeBatch(batch: string, location: TokenLocation): Token | null {
    for (const pattern of this._patterns) {
      for (const id of wrapInArray(pattern.identifier)) {
        if (id instanceof RegExp) {
          const match = batch.match(id);
          if (match) {
            const token = {
              type: pattern.name,
              groups: pattern.groups,
              lexeme: match[0],
              precedence: pattern.precedence,
              associativity: pattern.associativity,
              ignored: pattern.ignored,
              literal: pattern.transform(match[0]),
              start: location,
              end: {
                line: location.line,
                character: location.character + match[0].length,
              },
            };
            return token;
          }
        } else {
          if (batch === id) {
            const token = {
              type: pattern.name,
              groups: pattern.groups,
              lexeme: id,
              precedence: pattern.precedence,
              associativity: pattern.associativity,
              ignored: pattern.ignored,
              literal: pattern.transform(id),
              start: location,
              end: {
                line: location.line,
                character: location.character + id.length,
              },
            };
            return token;
          }
        }
      }
    }
    return null;
  }

  /**
   * Removes all tokens that belong to group `Ignored` from the token stream.
   * @param tokens The token stream to be purged.
   * @returns The purged token stream.
   */
  private _purge(tokens: Token[]): Token[] {
    return tokens.filter((token) => !token.ignored);
  }

  /**
   * Tokenizes the entire input string, producing an array of tokens based on the provided patterns.
   * The way it works is by repeatedly tokenizing the input string in batches, starting from the beginning.
   * There are 2 scenarios:
   * 1. If the match is found it tries to match again with 1 more character added to the batch.
   * if it fails to match further, then the previous match is considered the token.
   * 2. If no match is fund, it adds characters to the batch until a match is found.
   * if no match is found until the end of the input string, then an error is thrown.
   *
   * @param input The input string to be tokenized.
   * @returns An array of tokens.
   * @throws LiquidLexerError if an invalid token is encountered.
   */
  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let location: TokenLocation = {
      line: 1,
      character: 1,
    };
    let stream: string = input;
    while (stream.length) {
      let cursor = 1;
      let match: Token | null = null;
      while (cursor <= stream.length) {
        const batch = stream.slice(0, cursor);
        const token = this._tokenizeBatch(batch, location);
        if (token && (!match || token.lexeme.length > match.lexeme.length)) {
          match = token;
        } else {
          if (match) {
            break;
          }
        }
        cursor++;
      }
      if (match) {
        tokens.push(match);
        // if the match contains newlines, update the location
        if ((match.lexeme.match(/\n/g) || []).length) {
          location.line += (match.lexeme.match(/\n/g) || []).length;
          location.character = match.lexeme.length - match.lexeme.lastIndexOf('\n') - 1;
        }
        location = {
          line: location.line,
          character: location.character + match.lexeme.length,
        };
        stream = stream.slice(match.lexeme.length);
      } else {
        throw new LiquidSyntaxError(`Invalid token \`${stream[0]}\``, location);
      }
    }
    tokens.push({
      // equivalent to Grammar.Signs.$
      type: Grammar.Signs.eof,
      groups: [],
      lexeme: '\0',
      literal: {},
      precedence: -Infinity,
      associativity: 'None',
      ignored: false,
      start: location,
      end: location,
    });
    // remove ignored tokens
    return this._purge(tokens);
  }
}

export default Lexer;
