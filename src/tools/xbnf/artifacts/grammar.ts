import { Grammar, GrammarProductionRule } from '$core/grammar';
import { Pattern } from '$core/lexer';

import { XbnfRule } from './rule';

export class XbnfGrammar extends Grammar {
  constructor(xbnfRules: XbnfRule[], patterns: Pattern[] = []) {
    const derivedRules: GrammarProductionRule[] = [];
    const derivedTerminalPatterns: Pattern[] = [];
    for (const rule of xbnfRules) {
      derivedRules.push(...rule.rules);
      derivedTerminalPatterns.push(
        ...Array(...rule.terminals).map((terminal) => new Pattern(`'${terminal}'`, terminal)),
      );
    }
    super(derivedRules, [...derivedTerminalPatterns, ...patterns]);
  }
}

export { XbnfRule };

// export const jsonPatterns = [
//   new Pattern('WHITESPACE', /^[\s\t]/, {
//     ignored: true,
//   }),
//   // literal values
//   new Pattern('Number', /^(\+|\-)?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/, {
//     groups: ['Literal'],
//     transform: (lexeme) => Number(lexeme),
//   }),
//   new Pattern('String', /^"[^"\n]*"$/, {
//     groups: ['Literal'],
//     transform: (lexeme) => lexeme.slice(1, -1),
//   }),
//   new Pattern('Boolean', /^(true|false)$/, {
//     groups: ['Literal'],
//     transform: (lexeme) => lexeme === 'true',
//   }),
//   new Pattern('Null', /^null$/, {
//     groups: ['Literal'],
//     transform: () => null,
//   }),
// ];

// const jsonGrammar = new XbnfGrammar(
//   [
//     new XbnfRule('Json', `Value`),
//     new XbnfRule('Object', `'{' & ObjectItem? & '}'`),
//     new XbnfRule('ObjectItem', `Pair & (',' & Pair)*`),
//     new XbnfRule('Pair', `String & ':' & Value`),
//     new XbnfRule('Array', `'[' & ArrayItem? & ']'`),
//     new XbnfRule('ArrayItem', `Value & (',' & Value)*`),
//     new XbnfRule('Value', `String | Number | Boolean | Null | Object | Array`),
//   ],
//   jsonPatterns,
// );

// const parser = new LALRParser(jsonGrammar);

// const json = `
//   {
//     "name": "John Doe",
//     "age": 30,
//     "isStudent": false,
//     "grades": [90, 80, 70],
//     "address": {
//       "street": "123 Main St",
//       "city": "Springfield",
//       "state": "IL",
//       "zip": "62701"
//     },
//     "role": null,
//     "nicknames": ["Johnny", "JD"]
//   }
// `;

// console.time('parse');
// const result = parser.parse(json);
// console.timeEnd('parse');
// console.log(result.accepted);
