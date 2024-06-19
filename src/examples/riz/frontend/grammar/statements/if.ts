import { GrammarProductionRule } from '$core/grammar/rule';
import { Riz } from '../../../artifacts';

export default [
  /**
   * IfStatement
   */
  new GrammarProductionRule(
    'IfStatement',
    'IF OPEN_PAREN ExpressionStatement CLOSE_PAREN Block',
    (_, __, expression, ___, block) => {
      return new Riz.Statement.IfStatement(expression, block);
    },
  ),
  /**
   * Add to Statement
   */
  new GrammarProductionRule('Statement', 'IfStatement', (statement) => {
    return statement;
  }),
];
