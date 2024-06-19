import { GrammarProductionRule } from '$core/grammar/rule';
import { Riz } from '../../../artifacts';

export default [
  /**
   * DeclarationStatement
   */
  new GrammarProductionRule('DeclarationStatement', 'VAR IDENTIFIER', (_, id) => {
    return new Riz.Statement.StatementDeclaration(new Riz.Expression.Identifier(id.lexeme));
  }),
  new GrammarProductionRule(
    'DeclarationStatement',
    'VAR IDENTIFIER ASSIGN ExpressionStatement',
    (_, id, __, expression) => {
      return new Riz.Statement.StatementDeclaration(new Riz.Expression.Identifier(id.lexeme), expression);
    },
  ),
  /**
   * Add to Statement
   */
  new GrammarProductionRule('Statement', 'DeclarationStatement', (output) => {
    return output;
  }),
];
