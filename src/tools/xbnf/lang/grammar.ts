import { Grammar, GrammarProductionRule } from '$core/grammar';
import type { Token } from '$core/lexer';

import { patterns } from './patterns';
import { Nodes } from './nodes';

export const grammar = new Grammar(
  [
    new GrammarProductionRule('Rule', 'Expression', (expression: Nodes.Expression.Type) => {
      return expression;
    }),
    // Expression
    new GrammarProductionRule('Expression', 'Terminal', (terminal: Token) => {
      return new Nodes.Expression.Terminal(terminal.literal as string);
    }),
    new GrammarProductionRule('Expression', 'Symbol', (symbol: Token) => {
      return new Nodes.Expression.Symbol(symbol.lexeme);
    }),
    new GrammarProductionRule('Expression', 'Conjunction'),
    new GrammarProductionRule('Expression', 'Disjunction'),
    new GrammarProductionRule('Expression', 'Group'),
    new GrammarProductionRule('Expression', 'QuantifiedExpression'),
    // Conjunction
    new GrammarProductionRule('Conjunction', 'Expression Ampersand Expression', (lhs, _, rhs) => {
      if (lhs instanceof Nodes.Expression.Conjunction) {
        return new Nodes.Expression.Conjunction([...lhs.components, rhs]);
      }
      return new Nodes.Expression.Conjunction([lhs, rhs]);
    }),
    // Disjunction
    new GrammarProductionRule('Disjunction', 'Expression Pipe Expression', (lhs, _, rhs) => {
      if (lhs instanceof Nodes.Expression.Disjunction) {
        return new Nodes.Expression.Disjunction([...lhs.alternatives, rhs]);
      }
      return new Nodes.Expression.Disjunction([lhs, rhs]);
    }),
    // Group
    new GrammarProductionRule('Group', 'LeftParenthesis Expression RightParenthesis', (_, expression) => {
      return new Nodes.Expression.Group(expression);
    }),
    // QuantifiedExpression
    new GrammarProductionRule(
      'QuantifiedExpression',
      'QuantifiableExpression Quantifier',
      (entity, quantifier) => {
        return new Nodes.Expression.QuantifiedExpression(entity, quantifier);
      },
    ),
    // QuantifiableExpression
    new GrammarProductionRule('QuantifiableExpression', 'Terminal', (terminal: Token) => {
      return new Nodes.Expression.Terminal(terminal.literal as string);
    }),
    new GrammarProductionRule('QuantifiableExpression', 'Symbol', (symbol: Token) => {
      return new Nodes.Expression.Symbol(symbol.lexeme);
    }),

    new GrammarProductionRule('QuantifiableExpression', 'Group'),
    // Quantifier
    new GrammarProductionRule('Quantifier', 'Asterisk', () => {
      return new Nodes.Quantifier.ZeroOrMore();
    }),
    new GrammarProductionRule('Quantifier', 'Plus', () => {
      return new Nodes.Quantifier.AtLeastOne();
    }),
    new GrammarProductionRule('Quantifier', 'QuestionMark', () => {
      return new Nodes.Quantifier.AtMostOne();
    }),
    new GrammarProductionRule('Quantifier', 'LeftCurlyBrace Number RightCurlyBrace', (_, number: Token) => {
      return new Nodes.Quantifier.Exact(number.literal as number);
    }),
    new GrammarProductionRule(
      'Quantifier',
      'LeftCurlyBrace Number Comma RightCurlyBrace',
      (_, number: Token) => {
        return new Nodes.Quantifier.Range(number.literal as number, undefined);
      },
    ),
    new GrammarProductionRule(
      'Quantifier',
      'LeftCurlyBrace Comma Number RightCurlyBrace',
      (_, __, number: Token) => {
        return new Nodes.Quantifier.Range(undefined, number.literal as number);
      },
    ),
    new GrammarProductionRule(
      'Quantifier',
      'LeftCurlyBrace Number Comma Number RightCurlyBrace',
      (_, min: Token, __, max: Token) => {
        return new Nodes.Quantifier.Range(min.literal as number, max.literal as number);
      },
    ),
  ],
  patterns,
);
