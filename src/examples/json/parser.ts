import { Token } from '$core/lexer';
import * as Liquid from '../../index';

/**
 * JSON Parser example.
 */

export const patterns = [
  new Liquid.Pattern('WHITESPACE', /^[\s\t]/, {
    ignored: true,
  }),
  // literal values
  new Liquid.Pattern('Number', /^(\+|\-)?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/, {
    groups: ['Literal'],
    transform: (lexeme) => Number(lexeme),
  }),
  new Liquid.Pattern('String', /^"[^"\n]*"$/, {
    groups: ['Literal'],
    transform: (lexeme) => lexeme.slice(1, -1),
  }),
  new Liquid.Pattern('Boolean', /^(true|false)$/, {
    groups: ['Literal'],
    transform: (lexeme) => lexeme === 'true',
  }),
  new Liquid.Pattern('Null', /^null$/, {
    groups: ['Literal'],
    transform: () => null,
  }),
  // punctuations
  new Liquid.Pattern('COMMA', ','),
  new Liquid.Pattern('COLON', ':'),
  new Liquid.Pattern('OP_BRACKET', '['),
  new Liquid.Pattern('CL_BRACKET', ']'),
  new Liquid.Pattern('OP_BRACE', '{'),
  new Liquid.Pattern('CL_BRACE', '}'),
];

export const grammar = new Liquid.Grammar(
  [
    new Liquid.GrammarProductionRule('Json', 'Object', (object) => {
      return object;
    }),
    new Liquid.GrammarProductionRule('Object', 'OP_BRACE ObjectItem CL_BRACE', (_, objectItem) => {
      return {
        type: 'Object',
        children: objectItem,
      };
    }),
    new Liquid.GrammarProductionRule('Object', 'OP_BRACE CL_BRACE', () => {
      return {
        type: 'Object',
        children: [],
      };
    }),
    new Liquid.GrammarProductionRule('ObjectItem', 'String COLON Value', (property: Token, _, value) => {
      return [
        {
          property: property.literal,
          value,
        },
      ];
    }),
    new Liquid.GrammarProductionRule(
      'ObjectItem',
      'String COLON Value COMMA ObjectItem',
      (property: Token, _, value, __, objectItem) => {
        return [
          {
            property: property.literal,
            value,
          },
          ...objectItem,
        ];
      },
    ),
    new Liquid.GrammarProductionRule('Value', ':Literal:', (literal: Token) => {
      return {
        type: 'Literal',
        value: literal.literal,
      };
    }),
    new Liquid.GrammarProductionRule('Value', 'Object', (object) => {
      return object;
    }),
    new Liquid.GrammarProductionRule('Value', 'Array', (array) => {
      return {
        type: 'Array',
        children: array,
      };
    }),
    new Liquid.GrammarProductionRule('Array', 'OP_BRACKET CL_BRACKET', () => {
      return [];
    }),
    new Liquid.GrammarProductionRule('Array', 'OP_BRACKET ArrayItem CL_BRACKET', (_, arrayItem) => {
      return arrayItem;
    }),
    new Liquid.GrammarProductionRule('ArrayItem', 'Value', (value) => {
      return [value];
    }),
    new Liquid.GrammarProductionRule('ArrayItem', 'Value COMMA ArrayItem', (value, _, arrayItem) => {
      return [value, ...arrayItem];
    }),
  ],
  patterns,
);

grammar.print();

export const parser = new Liquid.LALRParser(grammar, patterns);
