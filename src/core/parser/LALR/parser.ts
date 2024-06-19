import { Grammar } from '$core/grammar';
import LR1 from '../models/lr1';
import type { Pattern } from '$core/lexer/pattern';
import { LALRAutomaton } from './automaton';

export class LALRParser extends LR1.Parser {
  constructor(
    /**
     * The grammar to parse.
     */
    grammar: Grammar,
    /**
     * The patterns to match.
     */
    patterns: Pattern[] = grammar.patterns,
    /**
     * The configuration of the parser.
     */
    config: Partial<LR1.Parser['config']> = {},
  ) {
    super(new LALRAutomaton(grammar), patterns, config);
  }
}
