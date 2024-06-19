import type { Token } from '$core/lexer';
import { XbnfGrammar, XbnfRule } from '$tools/xbnf';

import { patterns } from './patterns';
import { entropy } from './ast';

export const grammar = new XbnfGrammar(
  [
    new XbnfRule('Program', `Machine*`, (machines) => {
      return new entropy.lang.ast.Program(machines);
    }),
    new XbnfRule('Machine', `'Machine' & Identifier & ':' & MachineBody`, (_, id: Token, __, body) => {
      return new entropy.lang.ast.Machine(id.lexeme, body);
    }),
    new XbnfRule('MachineBody', `(State | Routine)*`, (data) => {
      return new entropy.lang.ast.MachineBody(data);
    }),
    new XbnfRule(
      'State',
      `'initial'? & 'state' & Identifier & ':' & StateBody`,
      (initial, _, id: Token, __, body) => {
        return new entropy.lang.ast.State(id.lexeme, Boolean(initial[0]), body);
      },
    ),
    new XbnfRule('StateBody', `Event*`, (events) => {
      return new entropy.lang.ast.StateBody(events);
    }),
    new XbnfRule(
      'Event',
      `'on' & Identifier & ':' & EventBody`,
      (_, id: Token, __, body) => new entropy.lang.ast.Event(id.lexeme, body),
    ),
    new XbnfRule('EventBody', `Action*`, (actions) => {
      return new entropy.lang.ast.EventBody(actions);
    }),
    new XbnfRule('Action', `'goto' & Identifier`, (_, id: Token) => {
      return new entropy.lang.ast.Action('goto', id.lexeme);
    }),
    new XbnfRule('Action', `'pass'`, function () {
      return new entropy.lang.ast.Action('pass');
    }),
    new XbnfRule('Routine', `'routine' & Identifier & ':' & RoutineBody`, function () {
      return new entropy.lang.ast.Routine(this[1].lexeme, this[3]);
    }),
    new XbnfRule('RoutineBody', `Action*`, (actions) => {
      return new entropy.lang.ast.RoutineBody(actions);
    }),
  ],
  patterns,
);
