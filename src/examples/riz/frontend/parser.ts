import { LALRParser } from '$core/parser';
import grammar from './grammar';
import patterns from './patterns';

export const lp = new LALRParser(grammar, patterns, {
  maxIterations: 500,
});
