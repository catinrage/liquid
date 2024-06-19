import { GrammarProductionRule } from '$core/grammar/rule';
import { Riz } from '../../../artifacts';

export default [
  /**
   * IfStatement
   */
  new GrammarProductionRule(
    'ForStatement',
    'FOR OPEN_PAREN ExpressionStatement SEMICOLON ExpressionStatement CLOSE_PAREN Block',
    (_, __, condition, ___, update, ____, block) => {
      return new Riz.Statement.ForStatement(condition, update, block);
    },
  ),
  /**
   * Add to Statement
   */
  new GrammarProductionRule('Statement', 'ForStatement', (statement) => {
    return statement;
  }),
];
