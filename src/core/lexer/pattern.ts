export type PatternNameType = string;
export type PatternIdentifierType = RegExp | string | (RegExp | string)[];
export type PatternGroupType = string;
export type PatternTransformType = (lexeme: string) => unknown;
export type PatternPrecedenceType = number;
export type PatternAssociativityType = 'Left' | 'Right' | 'None';
export type PatternIgnoredType = boolean;

export type PatternMetadataType = {
  /**
   * The groups the pattern belongs to.
   * Grouping patterns can be useful when creating grammars.
   * @example ['Literal'] | ['Operator/Binary'] | ['Operator/Unary']
   */
  groups?: PatternGroupType[];

  /**
   * The function used for transform the matched lexeme.
   * The return value of this function will be set as token's literal value.
   * @example (lexeme) => parseInt(lexeme) ; for numbers
   * @example (lexeme) => lexeme.slice(1, -1) ; for strings to remove quotes
   */
  transform?: PatternTransformType;

  /**
   * The precedence of the pattern, used for operator precedence.
   * This value is used in parsing to determine the order of operations.
   */
  precedence?: PatternPrecedenceType;

  /**
   * The associativity of the pattern, used for operator associativity.
   * This value is used in parsing to determine the order of operations.
   */
  associativity?: PatternAssociativityType;

  /**
   * Whether the pattern should be ignored, ignored patterns are skipped during lexing.
   */
  ignored?: PatternIgnoredType;
};

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

  /**
   * Whether the pattern should be ignored, ignored patterns are skipped during lexing.
   */
  public readonly ignored: PatternIgnoredType = false;

  constructor(
    /**
     * The name of the pattern.
     * This name is used to identify the pattern in the grammar & lexer.
     * @example 'NUMBER' | 'STRING' | 'PLUS' | 'MINUS' | 'ASSIGN'
     */
    name: PatternNameType,
    /**
     * The regular expression or string used for matching the lexeme.
     * can be a single or an array of them.
     * @example /^\d+$/ | /^"([^"]*)"$/
     */
    identifier: PatternIdentifierType,
    /**
     * Some extra properties for the pattern.
     */
    metadata?: PatternMetadataType,
  );

  constructor(
    /**
     * The name of the pattern.
     * This name is used to identify the pattern in the grammar & lexer.
     * @example 'NUMBER' | 'STRING' | 'PLUS' | 'MINUS' | 'ASSIGN'
     */
    name: PatternNameType,
    /**
     * Some extra properties for the pattern.
     */
    metadata?: PatternMetadataType,
  );

  constructor(
    name: PatternNameType,
    identifierOrMetadata?: PatternIdentifierType | PatternMetadataType,
    metadata?: PatternMetadataType,
  ) {
    if (metadata) {
      this.identifier = identifierOrMetadata as PatternIdentifierType;
    } else {
      if (
        Array.isArray(identifierOrMetadata) ||
        typeof identifierOrMetadata === 'string' ||
        identifierOrMetadata instanceof RegExp
      ) {
        this.identifier = identifierOrMetadata;
      } else {
        metadata = identifierOrMetadata;
        this.identifier = name;
      }
    }
    this.name = name;
    this.groups = metadata?.groups ?? this.groups;
    this.transform = metadata?.transform ?? this.transform;
    this.precedence = metadata?.precedence ?? this.precedence;
    this.associativity = metadata?.associativity ?? this.associativity;
    this.ignored = metadata?.ignored ?? this.ignored;
  }
}
