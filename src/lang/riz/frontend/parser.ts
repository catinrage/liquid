import grammar from './grammar';
import { LR1Automaton } from '$core/parser';
import { LR1Parser } from '$core/parser/LR1';
import patterns from './patterns';

// console.dir(
//   { grammar },
//   {
//     depth: null,
//   },
// );

const automaton = new LR1Automaton('CLR', grammar);
const parser = new LR1Parser(automaton, patterns);

export default parser;
