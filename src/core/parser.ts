import { Pattern, Token } from '../common';
import { LiquidErrorInstance } from '../common/helpers';
import type { Grammar } from '../common/types';

type Node = {
  payload: string;
  children: Node[];
};

export class CST {
  constructor(public root: Node) {}
}

/**
 * Represents a LL(1) parser.
 */
export class Parser {
  /**
   * The grammar to be used for parsing.
   */
  private grammar: Grammar;
  /**
   * The patterns to be used for parsing.
   */
  private patterns: readonly Pattern[];
  /**
   * The firsts for each variable in the grammar.
   */
  private firsts: Record<string, string[]>;
  /**
   * The follows for each variable in the grammar.
   */
  private follows: Record<string, string[]>;
  /**
   * The variables in the grammar.
   */
  private variables: string[];
  /**
   * The terminals in the grammar.
   */
  private terminals: string[];
  /**
   * The parsing table for the grammar.
   */
  private table: Record<string, Record<string, number>>;

  /**
   * Creates a new instance of the Parser class.
   * @param grammar The grammar to be used for parsing.
   */
  constructor(grammar: Grammar, patterns: readonly Pattern[]) {
    this.grammar = grammar;
    this.patterns = patterns;

    const { firsts, follows, variables, terminals } = this.derive(this.grammar);

    this.firsts = firsts;
    this.follows = follows;
    this.variables = variables;
    this.terminals = terminals;

    this.table = this.createTable(grammar, firsts, follows, terminals);
  }

  /**
   * derives these values from the grammar: firsts, follows, variables, terminals
   * @param grammar - the grammar to derive from
   * @returns an object containing firsts, follows, variables, terminals
   */
  private derive(grammar: Grammar) {
    const variables = [...new Set(grammar.map((production) => production.lhs))];
    const terminals = grammar
      .map((production) => production.rhs)
      .flat()
      .filter((symbol) => !variables.includes(symbol))
      .filter((symbol) => symbol !== '_EPS_')
      .filter((symbol, index, arr) => arr.indexOf(symbol) === index);

    const firsts: Record<string, string[]> = {};
    const follows: Record<string, string[]> = {};

    for (const variable of variables) {
      firsts[variable] = [];
      follows[variable] = [];
    }

    // calculate first sets
    let changed = true;
    while (changed) {
      changed = false;
      for (const production of grammar) {
        const { lhs, rhs } = production;
        for (let i = 0; i < rhs.length; i++) {
          const symbol = rhs[i];
          if (!variables.includes(symbol)) {
            if (!firsts[lhs].includes(symbol)) {
              firsts[lhs].push(symbol);
              changed = true;
            }
            break;
          } else {
            const firstsOfSymbol = firsts[symbol];
            if (firstsOfSymbol.includes('_EPS_')) {
              const oldLength = firsts[lhs].length;
              firsts[lhs] = [
                ...new Set([...firsts[lhs], ...firstsOfSymbol.filter((first) => first !== '_EPS_')]),
              ];
              if (firsts[lhs].length !== oldLength) {
                changed = true;
              }
            } else {
              const oldLength = firsts[lhs].length;
              firsts[lhs] = [...new Set([...firsts[lhs], ...firstsOfSymbol])];
              if (firsts[lhs].length !== oldLength) {
                changed = true;
              }
              break;
            }
          }
        }
      }
    }

    // calculate follow sets
    follows[grammar[0].lhs].push('EOF');
    changed = true;
    while (changed) {
      changed = false;
      for (const production of grammar) {
        const { lhs, rhs } = production;
        for (let i = 0; i < rhs.length; i++) {
          const symbol = rhs[i];
          if (variables.includes(symbol)) {
            if (i === rhs.length - 1) {
              const oldLength = follows[symbol].length;
              follows[symbol] = [...new Set([...follows[symbol], ...follows[lhs]])];
              if (follows[symbol].length !== oldLength) {
                changed = true;
              }
            } else {
              if (variables.includes(rhs[i + 1])) {
                const firstsOfNext = firsts[rhs[i + 1]];
                if (firstsOfNext.includes('_EPS_')) {
                  // Check if firstOfNext is defined
                  const oldLength = follows[symbol].length;
                  follows[symbol] = [
                    ...new Set([
                      ...follows[symbol],
                      ...follows[rhs[i + 1]],
                      ...firstsOfNext.filter((first) => first !== '_EPS_'),
                    ]),
                  ];
                  if (follows[symbol].length !== oldLength) {
                    changed = true;
                  }
                } else {
                  // Check if firstOfNext is defined
                  const oldLength = follows[symbol].length;
                  follows[symbol] = [...new Set([...follows[symbol], ...firstsOfNext])];
                  if (follows[symbol].length !== oldLength) {
                    changed = true;
                  }
                }
              } else {
                if (!follows[symbol].includes(rhs[i + 1])) {
                  follows[symbol].push(rhs[i + 1]);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }

    return { firsts, follows, variables, terminals };
  }

  /**
   * calculates the firsts of a production rule (a series of symbols)
   * @param production - an array of terminals
   * @returns the firsts of the production
   * @example calcFirsts('AB')
   * @example calcFirsts('AxP')
   */
  private calcFirsts(production: string[], derivedFirsts: Record<string, string[]>, terminals: string[]) {
    const calculatedFirsts: string[] = [];
    if (production.length === 1 && production[0] === '_EPS_') {
      return ['_EPS_'];
    }
    for (const symbol of production) {
      if (terminals.includes(symbol)) {
        calculatedFirsts.push(symbol);
        break;
      } else {
        const firstsOfSymbol = derivedFirsts[symbol];
        if (firstsOfSymbol.includes('_EPS_')) {
          calculatedFirsts.push(...firstsOfSymbol.filter((first) => first !== '_EPS_'));
        } else {
          calculatedFirsts.push(...firstsOfSymbol);
          break;
        }
      }
    }
    return calculatedFirsts;
  }

  /**
   * generates the parsing table
   * @returns the parsing table
   */
  private createTable(
    grammar: Grammar,
    derivedFirsts: Record<string, string[]>,
    follows: Record<string, string[]>,
    terminals: string[],
  ) {
    const table: Record<string, Record<string, number>> = {};

    for (const [pn, production] of grammar.entries()) {
      const { lhs, rhs } = production;
      if (!table[lhs]) table[lhs] = {};
      for (const terminal of [...terminals, 'EOF']) {
        if (!table[lhs][terminal]) table[lhs][terminal] = -1;
      }

      for (const first of this.calcFirsts(rhs, derivedFirsts, terminals)) {
        if (first !== '_EPS_') {
          if (table[lhs][first] === -1) {
            table[lhs][first] = pn;
          } else {
            throw new Error('Grammar is not LL(1)');
          }
        } else {
          for (const follow of follows[lhs]) {
            if (table[lhs][follow] === -1) {
              table[lhs][follow] = pn;
            } else {
              throw new Error('Grammar is not LL(1)');
            }
          }
        }
      }
    }

    return table;
  }

  /**
   * parses an input string
   * @param input - the input string to parse
   * @returns true if the input is accepted by the grammar
   * TODO: make this a pure function
   */
  public parse(input: Token[]): CST | boolean {
    const parseTree = new CST({
      payload: this.variables[0],
      children: [],
    });
    const currentNode = parseTree.root;
    const stack = ['EOF'];
    let i = 0;
    stack.push(this.variables[0]);
    while (stack.length > 0) {
      const token = input[i];
      const top = stack.pop() as string;
      if (
        !this.variables.includes(token.type) &&
        !this.terminals.includes(token.type) &&
        token.type !== 'EOF'
      ) {
        if (!token.groups.some((group) => this.terminals.includes(`[${group}]`))) {
          throw LiquidErrorInstance('Parser', `Undefined token \`${token.type}\``, token.start);
        }
      }
      if (this.variables.includes(top)) {
        let reference = this.table[top][token.type];
        if (reference === -1 || reference === undefined) {
          for (const group of token.groups) {
            reference = this.table[top][`[${group}]`] ?? -1;
            if (reference !== -1) break;
          }
        }
        if (reference === -1) {
          return false;
        } else {
          const pn = reference;
          const production = this.grammar[pn];
          if (production.rhs[0] !== '_EPS_') stack.push(...production.rhs.toReversed());
          for (const symbol of production.rhs) {
            const newNode: Node = {
              payload: symbol,
              children: [],
            };
            currentNode.children.push(newNode);
          }
        }
      } else {
        if (top !== token.type && !token.groups.map((group) => `[${group}]`).includes(top)) {
          throw LiquidErrorInstance('Parser', `Unexpected token \`${token.type}\``, token.start);
        } else {
          i++;
          // add the token to the parse tree
          currentNode.children.push({
            payload: token.lexeme,
            children: [],
          });
        }
      }
    }
    return parseTree;
  }
}
