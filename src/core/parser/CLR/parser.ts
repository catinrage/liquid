import { Grammar } from '$core/grammar';
import LR1 from '../models/lr1';
import type { Pattern } from '$core/lexer/pattern';
import { CLRAutomaton } from './automaton';

export class CLRParser extends LR1.Parser {
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
    super(new CLRAutomaton(grammar), patterns, config);
  }
}
