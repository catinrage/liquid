import { test, expect, describe } from 'vitest';

import { LALRAutomaton } from '$core/parser/LALR/automaton';
import { grammar as jsonGrammar } from '$examples/json/parser.ts';
import { Grammar } from '$core/grammar';

describe('LR1 Automaton', () => {
  const jsonAutomaton = new LALRAutomaton(jsonGrammar);

  describe('Json Grammar', () => {
    test('Number of states check', () => {
      expect(jsonAutomaton.states.length).toEqual(25);
    });

    test('State 0', () => {
      // [Json → • Object, $]
      // [Object → • OP_BRACE ObjectItem CL_BRACE, $]
      // [Object → • OP_BRACE CL_BRACE, $]
      // [• Json, $]
      const s0 = jsonAutomaton.states[0];
      expect(s0).toBeDefined();
      expect(s0.closure.length).toEqual(4);
      // check for closure
      expect(s0.closure.map((item) => item.lhs).sort()).toStrictEqual(
        ['__LIQUID_RESERVED_AUG__', 'Json', 'Object', 'Object'].sort(),
      );
      // check for lookaheads
      for (const item of s0.closure) {
        expect(item.lookaheads).toStrictEqual([Grammar.Signs.eof]);
      }
      // check for expandables
      expect(s0.expandables.sort()).toEqual(['Json', 'Object', 'OP_BRACE'].sort());
    });

    test('State 0 -> OP_BRACE', () => {
      // [Object → OP_BRACE • ObjectItem CL_BRACE, CL_BRACKET / COMMA / CL_BRACE / $]
      // [Object → OP_BRACE • CL_BRACE, CL_BRACKET / COMMA / CL_BRACE / $]
      // [ObjectItem → • String COLON Value, CL_BRACE]
      // [ObjectItem → • String COLON Value COMMA ObjectItem, CL_BRACE]
      const s = jsonAutomaton.states[0].transitions['OP_BRACE'];
      expect(s).toBeDefined();
      expect(s.closure.length).toEqual(4);
      // check for closure
      expect(s.closure.map((item) => item.lhs).sort()).toStrictEqual(
        ['Object', 'Object', 'ObjectItem', 'ObjectItem'].sort(),
      );
      // check for lookaheads
      expect(s.closure[0].lookaheads.sort()).toStrictEqual(
        ['CL_BRACE', 'CL_BRACKET', 'COMMA', Grammar.Signs.eof].sort(),
      );
      expect(s.closure[1].lookaheads.sort()).toStrictEqual(
        ['CL_BRACE', 'CL_BRACKET', 'COMMA', Grammar.Signs.eof].sort(),
      );
      expect(s.closure[2].lookaheads).toStrictEqual(['CL_BRACE']);
      expect(s.closure[3].lookaheads).toStrictEqual(['CL_BRACE']);
    });

    test('State 0 -> OP_BRACE -> String -> Colon', () => {
      // [ObjectItem → String COLON • Value, CL_BRACE]
      // [ObjectItem → String COLON • Value COMMA ObjectItem, CL_BRACE]
      // [Object → • OP_BRACE ObjectItem CL_BRACE, CL_BRACE / COMMA]
      // [Object → • OP_BRACE CL_BRACE, CL_BRACE / COMMA]
      // [Value → • Object, CL_BRACE / COMMA]
      // [Value → • Array, CL_BRACE / COMMA]
      // [Array → • OP_BRACKET CL_BRACKET, CL_BRACE / COMMA]
      // [Array → • OP_BRACKET ArrayItem CL_BRACKET, CL_BRACE / COMMA]
      // [Value → • Number, CL_BRACE / COMMA]
      // [Value → • String, CL_BRACE / COMMA]
      // [Value → • Boolean, CL_BRACE / COMMA]
      // [Value → • Null, CL_BRACE / COMMA]
      const s = jsonAutomaton.states[0].transitions['OP_BRACE'].transitions['String'].transitions['COLON'];
      expect(s).toBeDefined();
      expect(s.closure.length).toEqual(12);
      // check for closure
      expect(s.closure.map((item) => item.lhs).sort()).toStrictEqual(
        [
          'Array',
          'Array',
          'Object',
          'Object',
          'ObjectItem',
          'ObjectItem',
          'Value',
          'Value',
          'Value',
          'Value',
          'Value',
          'Value',
        ].sort(),
      );
      // check for lookaheads
      expect(s.closure[0].lookaheads).toStrictEqual(['CL_BRACE']);
      expect(s.closure[1].lookaheads).toStrictEqual(['CL_BRACE']);
      expect(s.closure[2].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[3].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[4].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[5].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[6].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[7].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[8].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[9].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[10].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
      expect(s.closure[11].lookaheads.sort()).toStrictEqual(['CL_BRACE', 'COMMA'].sort());
    });
  });
});
