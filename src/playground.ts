import * as Liquid from '.';
import { GrammarProductionRule } from '.';

const patterns = [
  new Liquid.Pattern('Whitespace', /^[\s\t]/, {
    ignored: true,
  }),
  new Liquid.Pattern('Number', /^(\+|\-)?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/, {
    groups: ['Literal'],
    transform: (lexeme) => Number(lexeme),
  }),
  new Liquid.Pattern('Plus', /^\+$/, {
    groups: ['Operator'],
    associativity: 'Left',
  }),
  new Liquid.Pattern('Minus', /^\-$/, {
    groups: ['Operator'],
    associativity: 'Left',
  }),
];

const grammar = new Liquid.Grammar(
  [
    new GrammarProductionRule('S', 'S Plus S'),
    new GrammarProductionRule('S', 'S Minus S'),
    new GrammarProductionRule('S', 'Number'),
  ],
  patterns,
);

const parser = new Liquid.LALRParser(grammar, patterns);

const res = parser.parse('1 + 2 - 6');

parser.printTable();

console.dir(res, {
  depth: null,
});
