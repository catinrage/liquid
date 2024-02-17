/**
 * Represents a token in the lexer.
 */
export class Token {
  /**
   * Creates a new Token instance.
   * @param type The type of the token.
   * @param groups List of groups the token belongs to.
   * @param lexeme The lexeme of the token.
   * @param literal The literal value of the token.
   * @param start The start location of the token.
   * @param end The end location of the token.
   */
  constructor(
    public type: string,
    public groups: Pattern['groups'],
    public lexeme: string,
    public literal: unknown,
    public start: number,
    public end: number,
  ) {}
}

/**
 * Represents a pattern used for matching and parsing lexemes.
 */
export class Pattern {
  /**
   * Creates a new instance of the Pattern class.
   * @param name The name of the pattern.
   * @param regex The regular expression used for matching.
   * @param groups The terms used for grouping patterns.
   * @param parser The function used for parsing the matched lexeme.
   */
  constructor(
    public readonly name: 'OMITTED' | (string & Record<never, never>),
    public readonly regex: RegExp | RegExp[],
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
    public readonly parser: (lexeme: string) => unknown = () => ({}),
  ) {}
}

/**
 * Represents a rule in the grammar.
 */
export class Rule {
  constructor(public readonly lhs: string, public readonly rhs: string) {}
}

/**
 * Represents a grammar.
 */
export class Grammar {
  /**
   * An array of symbols.
   */
  private symbols: string[] = [];

  constructor(private readonly rules: Rule[]) {
    for (const rule of rules) {
      this.process(rule);
    }
  }

  /**
   * Processes a rule and adds its left-hand side symbol to the symbols array if it doesn't already exist.
   * @param rule - The rule to process.
   */
  private process(rule: Rule) {
    if (!this.symbols.includes(rule.lhs)) {
      this.symbols.push(rule.lhs);
    }
  }
}
