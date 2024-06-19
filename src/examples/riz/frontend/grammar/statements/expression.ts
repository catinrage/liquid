import { GrammarProductionRule } from '$core/grammar/rule';
import type { Token } from '$core/lexer/token';
import { Riz } from '../../../artifacts';

export default [
  /**
   * ExpressionStatement
   */
  new GrammarProductionRule('ExpressionStatement', 'AssignmentExpression', (assignment) => {
    return new Riz.Statement.StatementExpression(assignment);
  }),
  new GrammarProductionRule(
    'AssignmentExpression',
    'IDENTIFIER :Operator/Assignment: ExpressionStatement',
    (id, operator, expression) => {
      return new Riz.Expression.ExpressionAssignment(
        operator.lexeme,
        new Riz.Expression.Identifier(id.lexeme),
        expression,
      );
    },
  ),
  new GrammarProductionRule('ExpressionStatement', 'BinaryExpression'),
  new GrammarProductionRule('ExpressionStatement', 'UnaryExpression'),
  new GrammarProductionRule('ExpressionStatement', 'UpdateExpression'),
  /**
   * BinaryExpression
   */
  new GrammarProductionRule(
    'BinaryExpression',
    'ExpressionStatement :Operator/Binary: ExpressionStatement',
    (lhs, operator: Token, rhs) => {
      return new Riz.Expression.ExpressionBinary(operator.lexeme, lhs, rhs);
    },
  ),
  /**
   * UnaryExpression
   */
  new GrammarProductionRule(
    'UnaryExpression',
    ':Operator/Unary: UnaryExpression',
    (operator: Token, expression) => {
      return new Riz.Expression.ExpressionUnary(operator.lexeme, expression);
    },
  ),
  new GrammarProductionRule('UnaryExpression', 'PrimaryExpression'),
  /**
   * PrimaryExpression
   */
  new GrammarProductionRule(
    'PrimaryExpression',
    'OPEN_PAREN ExpressionStatement CLOSE_PAREN',
    (_, expression) => {
      return expression;
    },
  ),
  new GrammarProductionRule('PrimaryExpression', 'Variable', (variable) => {
    return variable;
  }),
  new GrammarProductionRule('Variable', 'IDENTIFIER', (id: Token) => {
    return new Riz.Expression.Identifier(id.lexeme);
  }),
  new GrammarProductionRule('PrimaryExpression', 'NUMBER', (number: Token) => {
    return new Riz.Expression.Literal(number.literal as number);
  }),
  /**
   * UpdateExpression
   */
  // new GrammarProductionRule(
  //   'UpdateExpression',
  //   'ExpressionStatement [Operator/Update]',
  //   (expression, operator: Token) => {
  //     return new Riz.Expression.ExpressionUnary(operator.lexeme, expression);
  //   },
  // ),
  /**
   * Add to Statement
   */
  new GrammarProductionRule('Statement', 'ExpressionStatement', (output) => {
    return output;
  }),
];
