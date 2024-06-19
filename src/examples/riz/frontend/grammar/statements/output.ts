import { GrammarProductionRule } from '$core/grammar/rule';
import type { Token } from '$core/lexer/token';
import { Riz } from '../../../artifacts';

export default [
  /**
   * Output Statement
   */
  new GrammarProductionRule(
    'OutputStatement',
    'GREATER_THAN GREATER_THAN ExpressionStatement',
    (_, __, expression) => {
      return new Riz.Statement.StatementOutput(expression);
    },
  ),
  /**
   * Add to Statement
   */
  new GrammarProductionRule('Statement', 'OutputStatement', (output) => {
    return output;
  }),
];
