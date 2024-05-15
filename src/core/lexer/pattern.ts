export type PatternNameType = string;
export type PatternIdentifierType = RegExp | string | (RegExp | string)[];
export type PatternGroupType = 'Ignored' | (string & Record<never, never>);
export type PatternTransformType = (lexeme: string) => unknown;
export type PatternPrecedenceType = number;
export type PatternAssociativityType = 'Left' | 'Right' | 'None';

/**
 * Represents a pattern used for matching lexemes and creating tokens.
 */
export class Pattern {
  /**
   * The name of the pattern.
   * This name is used to identify the pattern in the grammar & lexer.
   * @example 'NUMBER' | 'STRING' | 'PLUS' | 'MINUS' | 'ASSIGN'
   */
  public readonly name: PatternNameType;

  /**
   * The regular expression or string used for matching the lexeme.
   * can be a single or an array of them.
   * @example /^\d+$/ | /^"([^"]*)"$/
   */
  public readonly identifier: PatternIdentifierType;

  /**
   * The groups the pattern belongs to.
   * Grouping patterns can be useful when creating grammars.
   * Patterns with group 'Ignored' will be ignored by the lexer.
   * @example ['Literal'] | ['Operator/Binary'] | ['Operator/Unary']
   */
  public readonly groups: PatternGroupType[] = [];

  /**
   * The function used for transform the matched lexeme.
   * @example (lexeme) => parseInt(lexeme) ; for numbers
   * @example (lexeme) => lexeme.slice(1, -1) ; for strings to remove quotes
   */
  public readonly transform: PatternTransformType = (lexeme) => lexeme;

  /**
   * The precedence and associativity of the pattern.
   */
  public readonly precedence?: PatternPrecedenceType;
  public readonly associativity: PatternAssociativityType = 'None';

  constructor(
    name: PatternNameType,
    identifier: PatternIdentifierType,
    {
      groups,
      transform,
      associativity,
      precedence,
    }: {
      groups?: PatternGroupType[];
      transform?: PatternTransformType;
      precedence?: PatternPrecedenceType;
      associativity?: PatternAssociativityType;
    } = {},
  ) {
    this.name = name;
    this.identifier = identifier;
    if (groups) this.groups = groups;
    if (transform) this.transform = transform;
    if (precedence) this.precedence = precedence;
    if (associativity) this.associativity = associativity;
  }
}
