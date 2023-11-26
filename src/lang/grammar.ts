import { Grammar, Rule } from '../common';

export default new Grammar([
  new Rule(
    'Program',
    `
      Program Program                                                               |
      Statement                                                                     |
    `,
  ),

  new Rule(
    'Statement',
    `
      StatementVariableDeclaration                                                  |
      StatementFunctionDeclaration                                                  |
      StatementReturn                                                               |
      StatementAssignment                                                           |
      StatementExpression                                                           |
      StatementIf                                                                   |
      StatementFor                                                                  |
      StatementBlock                                                                |
      StatementWhile                                                                |
    `,
  ),

  new Rule(
    'StatementVariableDeclaration',
    `
      :DECLARE: :CONSTANT: :IDENTIFIER: :ASSIGN: Expression                         |
      :DECLARE: :VARIABLE: :IDENTIFIER:                                             |
      :DECLARE: :VARIABLE: :IDENTIFIER: :ASSIGN: Expression                         |
      :DECLARE: :REACTIVE: :IDENTIFIER:                                             |
      :DECLARE: :REACTIVE: :IDENTIFIER: :ASSIGN: Expression                         |
    `,
  ),

  new Rule(
    'StatementFunctionDeclaration',
    `
      :DECLARE: :FUNCTION: :IDENTIFIER: :OPEN_PAREN: FragmentFunctionParameters 
      :CLOSE_PAREN: StatementBlock                                                  |
    `,
  ),

  new Rule(
    'FragmentFunctionParameters',
    `
      :IDENTIFIER: :COMMA: FragmentFunctionParameters                               |
      :IDENTIFIER:                                                                  |
      _EPSILON_                                                                     |
    `,
  ),

  new Rule(
    'StatementReturn',
    `
      :RETURN:                                                                      |
      :RETURN: Expression                                                           |
    `,
  ),

  new Rule(
    'StatementAssignment',
    `
      StatementEqualAssignment                                                      |
      StatementNonEqualAssignment                                                   |
    `,
  ),

  /**
   *  @example: a = b = c = d / 4
   *  */
  new Rule(
    'StatementEqualAssignment',
    `
      :IDENTIFIER: :ASSIGN: StatementEqualAssignment                                |
      :IDENTIFIER: :ASSIGN: Expression                                              |
    `,
  ),

  /**
   *  @example: a += b * 6
   *  */
  new Rule(
    'StatementNonEqualAssignment',
    `
      :IDENTIFIER: [AssignmentOperator] Expression                                  |
    `,
  ),

  new Rule(
    'StatementExpression',
    `
      Expression                                                                    |
    `,
  ),

  new Rule(
    'Expression',
    `
      ExpressionFunctionCall                                                        |
      ExpressionBinary                                                              |
      ExpressionUnary                                                               |
      :OPEN_PAREN: Expression :CLOSE_PAREN:                                         |
      :IDENTIFIER:                                                                  |
      [Literal]                                                                     |
    `,
  ),

  new Rule(
    'ExpressionBinary',
    `
      Expression [BinaryOperator] Expression                                        |
    `,
  ),

  new Rule(
    'ExpressionUnary',
    `
      [UnaryOperator] Expression                                                    |
    `,
  ),

  new Rule(
    'ExpressionFunctionCall',
    `
      :IDENTIFIER: :OPEN_PAREN: FragmentFunctionCallArguments :CLOSE_PAREN:         |
    `,
  ),

  new Rule(
    'FragmentFunctionParameters',
    `
      Expression :COMMA: FragmentFunctionParameters                                 |
      Expression                                                                    |
      _EPSILON_                                                                     |
    `,
  ),

  new Rule(
    'StatementIf',
    `
      :IF: :OPEN_PAREN: Expression :CLOSE_PAREN: StatementBlock                     |
    `,
  ),

  new Rule(
    'StatementFor',
    `
      :FOR: :OPEN_PAREN: :IDENTIFIER: :IN: Expression :CLOSE_PAREN: StatementBlock  |
    `,
  ),

  new Rule(
    'StatementBlock',
    `
      :OPEN_BRACE: Program :CLOSE_BRACE:                                            |
    `,
  ),

  new Rule(
    'StatementWhile',
    `
      :WHILE: :OPEN_PAREN: Expression :CLOSE_PAREN: StatementBlock                  |
    `,
  ),
]);
