import { Pattern, Token } from '../common';
import { LiquidErrorInstance } from '../common/helpers';
import { Expression, StatementExpression, Program } from '../common/types';

/**
 * Represents a Parser class that is responsible for parsing tokens into an abstract syntax tree (AST).
 */
export default class Parser {
  public program: Program;

  /**
   * Constructs a new instance of the Parser class.
   * @param tokens - An array of tokens to be parsed.
   * @param patterns - An array of patterns used for parsing.
   */
  constructor(private tokens: Token[], private patterns: readonly Pattern[]) {
    this.program = {
      type: 'Program',
      body: [],
    };
  }

  /**
   * Returns the next token without consuming it.
   * @returns The next token.
   * @throws Error if there are no more tokens.
   */
  private next(): Token & {
    is: (flag: NonNullable<ConstructorParameters<typeof Pattern>[2]>[number]) => boolean;
  } {
    if (this.tokens.length === 0) {
      throw new Error('Unexpected end of input');
    }
    return {
      ...this.tokens[0],
      is: (group: NonNullable<ConstructorParameters<typeof Pattern>[2]>[number]) => {
        return this.patterns
          .filter((pattern) => pattern.groups.includes(group))
          .map((pattern) => pattern.name)
          .includes(this.tokens[0].type);
      },
    };
  }

  /**
   * Returns the next token and consumes it.
   * @returns The next token.
   * @throws Error if there are no more tokens or if the next token is of type 'EOF'.
   */
  private advance(): Token {
    if (this.next().type === 'EOF') {
      throw new Error('Unexpected end of input');
    }
    return this.tokens.shift() as unknown as Token;
  }

  /**
   * Expects a token of the specified types and returns it.
   * If the token type does not match any of the specified types, an error is thrown.
   * @param types - An array of token types to expect.
   * @returns The expected token.
   * @throws {LiquidErrorInstance} If the token type does not match any of the specified types.
   */
  private expect(types: string[]): Token {
    const token = this.next();
    if (types.includes(token.type)) {
      return this.advance();
    }
    throw LiquidErrorInstance(
      'Parser',
      `Expected token of type ${types.join(' or ')}, but got ${token.type}`,
      token.start,
    );
  }

  /**
   * Parses the tokens into an abstract syntax tree (AST).
   */
  parse(): void {
    while (this.next().type !== 'EOF') {
      this.program.body.push(this.parseStatementExpression());
    }
  }

  /**
   * Parses an expression statement.
   * @returns The parsed expression statement.
   */
  private parseStatementExpression(): StatementExpression {
    const expression = this.parseExpression();
    return {
      type: 'StatementExpression',
      expression,
    };
  }

  /**
   * Parses an expression.
   * @returns The parsed expression.
   */
  private parseExpression(): Expression {
    return this.parseBinaryExpression();
  }

  /**
   * Parses a binary expression.
   * @returns The parsed binary expression.
   */
  private parseBinaryExpression(): Expression {
    let left = this.parseUnaryExpression();
    while (this.next().is('Operator/Binary')) {
      const operator = this.advance();
      const right = this.parseUnaryExpression();
      left = {
        type: 'ExpressionBinary',
        operator: operator.type,
        left,
        right,
      };
    }
    return left;
  }

  /**
   * Parses a unary expression.
   * @returns The parsed unary expression.
   */
  private parseUnaryExpression(): Expression {
    if (this.next().is('Operator/Unary')) {
      const operator = this.advance();
      const argument = this.parseUnaryExpression();
      return {
        type: 'ExpressionUnary',
        operator: operator.type,
        argument,
      };
    }
    return this.parsePrimaryExpression();
  }

  /**
   * Parses a primary expression.
   * @returns The parsed primary expression.
   * @throws LiquidErrorInstance if the next token is unexpected.
   */
  private parsePrimaryExpression(): Expression {
    if (this.next().is('Literal')) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: token.literal,
        raw: token.lexeme,
      };
    }
    if (this.next().type === 'IDENTIFIER') {
      const token = this.advance();
      return {
        type: 'Identifier',
        name: token.lexeme,
      };
    }
    if (this.next().type === 'OPEN_PAREN') {
      this.advance();
      const expression = this.parseExpression();
      this.expect(['CLOSE_PAREN']);
      return expression;
    }
    throw LiquidErrorInstance('Parser', `Unexpected token ${this.next().type}`, this.next().start);
  }
}

/** G1:
 * Program -> Expression :SEMICOLON: Expression | Expression :SEMICOLON:
 * Expression -> ExpressionBinary | ExpressionUnary | PrimaryExpression
 * ExpressionBinary -> Expression [BinaryOperator] Expression
 * ExpressionUnary -> [UnaryOperator] Expression
 * PrimaryExpression -> [Literal] | :IDENTIFIER: | :OPEN_PAREN: Expression :CLOSE_PAREN:
 */
