import { Grammar, GrammarProductionRule } from '$core/grammar';
import { Riz } from '../../artifacts';

import ExpressionStatement from './statements/expression';
import DeclarationStatement from './statements/declaration';
import OutputStatement from './statements/output';
import IfStatement from './statements/if';
import patterns from '../patterns';

export default new Grammar(
  [
    /**
     * Program
     */
    new GrammarProductionRule('Program', 'Body', (body) => {
      return new Riz.Program(body);
    }),
    new GrammarProductionRule('Program', Grammar.SIGNS.EPSILON, () => {
      return new Riz.Program();
    }),
    /**
     * Body
     */
    new GrammarProductionRule('Body', 'Statement SEMICOLON', (statement) => {
      return [statement];
    }),
    new GrammarProductionRule('Body', 'Statement SEMICOLON Body', (statement, _, body) => {
      return [statement, ...body];
    }),
    new GrammarProductionRule('Body', 'Block Body', (block, body) => {
      return [...block, ...body];
    }),
    new GrammarProductionRule('Body', 'Block', (block) => {
      return [block];
    }),
    new GrammarProductionRule('Block', 'OPEN_BRACE Body CLOSE_BRACE', (_, body) => {
      return new Riz.Block(body);
    }),
    /**
     * Statements
     */
    ...ExpressionStatement,
    ...DeclarationStatement,
    ...OutputStatement,
    ...IfStatement,
  ],
  patterns,
);
