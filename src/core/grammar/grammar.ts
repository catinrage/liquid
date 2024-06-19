import chalk from 'chalk';

import type { Pattern } from '../lexer/pattern';
import { GrammarProductionRule } from './rule';

/**
 * Represents a context-free grammar.
 */
export class Grammar {
  /**
   * Special signs used in the grammar.
   */
  static readonly Signs = {
    // Epsilon sign (aka λ sign in some grammars)
    ε: '__LIQUID_RESERVED_EPSILON__',
    epsilon: '__LIQUID_RESERVED_EPSILON__',
    // End of file sign (aka $ sign in some grammars)
    $: '__LIQUID_RESERVED_EOF__',
    eof: '__LIQUID_RESERVED_EOF__',
    // LHS of augmented rule in LR(1) states
    AUG: `__LIQUID_RESERVED_AUG__`,
  } as const;

  constructor(
    /**
     * List of production rules in the grammar.\
     * Final array of rules may vary from the input rules due to the rules ungrouping.
     */
    public readonly rules: GrammarProductionRule[],
    /**
     * Array of patterns used in the grammar.
     * These patterns are used to ungroup rules that use groups instead of token names.
     */
    public readonly patterns: Pattern[] = [],
  ) {
    if (patterns.length > 0) {
      for (const rule of this.rules) {
        // check if the rule contains a group, and if so, populate the rule
        if (rule.rhs.findIndex((symbol) => symbol.startsWith(':') && symbol.endsWith(':')) >= 0) {
          const populated = this._ungroup(rule);
          this.rules.push(...populated);
        }
      }
      // remove all rules that contain groups
      this.rules = this.rules.filter((rule) => {
        return rule.rhs.every((r) => !r.startsWith(':'));
      });
    }
  }

  /**
   * Some rules in the grammar may contain groups instead of token names.
   * For each pattern that matches contains the group, populates the rule with the pattern name.\
   * For example, if the rule is `A -> [G]`, and patterns `B` and `C` both belong to group `G`, the rule will be populated to `A -> B | C`.
   * @param rule The rule to populate.
   * @returns The array of populated rules.
   */
  private _ungroup(rule: GrammarProductionRule): GrammarProductionRule[] {
    // check if rule contains a group
    // groups are used in a grammar in `[GroupName]` format
    const groupIndex = rule.rhs.findIndex((symbol, index) => symbol.startsWith(':') && symbol.endsWith(':'));
    if (groupIndex !== -1) {
      const group = rule.rhs[groupIndex].slice(1, -1);
      // find the pattern that matches the group
      const patterns = this.patterns.filter((pattern) => pattern.groups.includes(group));
      const populated = [];
      // populate the rule with the patterns
      for (const pattern of patterns) {
        // replace the group with the pattern name and populate the rule again
        const newRhs = [...rule.rhs];
        newRhs.splice(groupIndex, 1, pattern.name);
        populated.push(...this._ungroup(new GrammarProductionRule(rule.lhs, newRhs, rule.action)));
      }
      // return the populated rules
      return [...populated];
    } else {
      // if no group is found, return the rule as is
      return [rule];
    }
  }

  /**
   * Inspects the grammar for errors and warnings.
   * @param print Whether to print the inspection results to the console.
   * @returns The inspection results if `print` is `false`.
   */
  public inspect(print: boolean = true): void | { errors: string[]; warnings: string[] } {
    const result: {
      errors: string[];
      warnings: string[];
    } = {
      errors: [],
      warnings: [],
    };

    // check if every symbols in the rules are either a variable or exists in the patterns
    for (const rule of this.rules) {
      for (const symbol of rule.rhs) {
        if (
          !this.isVariable(symbol) &&
          !this.patterns.find((pattern) => pattern.name === symbol) &&
          symbol !== Grammar.Signs.ε
        ) {
          result.errors.push(
            `Symbol '${symbol}' in rule '${rule.lhs} -> ${rule.rhs.join(' ')}' is not defined.`,
          );
        }
      }
    }

    // check for unreachable variables
    const reachableVariables = new Set<string>();
    const stack = [this.start];
    while (stack.length > 0) {
      const variable = stack.pop() as string;
      reachableVariables.add(variable);
      for (const rule of this.rules) {
        if (rule.lhs === variable) {
          for (const symbol of rule.rhs) {
            if (this.isVariable(symbol) && !reachableVariables.has(symbol)) {
              stack.push(symbol);
            }
          }
        }
      }
    }
    for (const variable of this.variables) {
      if (!reachableVariables.has(variable)) {
        result.warnings.push(`Variable '${variable}' is unreachable.`);
      }
    }

    if (print) {
      console.log(chalk.bold('Grammar Inspection Result:'));
      if (result.errors.length > 0) {
        console.error(chalk.bgRed.black('Errors:'));
        result.errors.forEach((error) => console.error(chalk.red(error)));
      }
      if (result.warnings.length > 0) {
        console.error(chalk.bgYellow.black('Warnings:'));
        result.warnings.forEach((warning) => console.error(chalk.yellow(warning)));
        console.log();
      }
      if (result.errors.length === 0 && result.warnings.length === 0) {
        console.log(chalk.bgGreenBright.black('Grammar seems fine.'));
      }
    } else {
      return result;
    }
  }

  /**
   * @returns The start variable of the grammar.
   */
  public get start() {
    return this.rules[0].lhs;
  }

  /**
   * @returns An array of variables in the grammar.
   */
  public get variables(): string[] {
    return [...new Set(this.rules.map((rule) => rule.lhs))];
  }

  /**
   * @returns An array of terminals in the grammar.
   */
  public get terminals(): string[] {
    return [
      ...new Set(this.rules.flatMap((rule) => rule.rhs).filter((symbol) => symbol !== Grammar.Signs.ε)),
    ].filter((symbol) => !this.isVariable(symbol as string));
  }

  /**
   * @param symbol The symbol to check.
   * @returns `true` if the given symbol is a terminal, `false` otherwise.
   */
  public isTerminal(symbol: string): boolean {
    return this.terminals.includes(symbol);
  }

  /**
   * @param symbol The symbol to check.
   * @returns `true` if the given symbol is a variable, `false` otherwise.
   */
  public isVariable(symbol: string): boolean {
    return this.variables.includes(symbol as string);
  }

  /**
   * The first set of a variable is the set of terminals that can start a string derived from the variable.
   * @returns The first set of each variable in the grammar.
   */
  public get firsts(): Record<string, string[]> {
    const { variables } = this;
    // create an empty placeholder for the firsts set
    let firsts: Record<string, string[]> = {};
    // initial the set
    for (const variable of variables) {
      firsts[variable] = [];
    }
    // calculate first sets
    let changed = true;
    while (changed) {
      changed = false;
      for (const rule of this.rules) {
        const { lhs, rhs } = rule;
        for (let i = 0; i < rhs.length; i++) {
          const symbol = rhs[i];
          if (!this.isVariable(symbol)) {
            if (!firsts[lhs].includes(symbol)) {
              firsts[lhs].push(symbol);
              changed = true;
            }
            break;
          } else {
            const firstsOfSymbol = firsts[symbol];
            if (firstsOfSymbol.includes(Grammar.Signs.ε)) {
              const oldLength = firsts[lhs].length;
              firsts[lhs] = [
                ...new Set([...firsts[lhs], ...firstsOfSymbol.filter((first) => first !== Grammar.Signs.ε)]),
              ];
              if (firsts[lhs].length !== oldLength) {
                changed = true;
              }
              if (i === rhs.length - 1 && firstsOfSymbol.includes(Grammar.Signs.ε)) {
                if (!firsts[lhs].includes(Grammar.Signs.ε)) {
                  firsts[lhs].push(Grammar.Signs.ε);
                  changed = true;
                }
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
    return firsts;
  }

  /**
   * @param sequence The sequence of symbols to get the first set of.
   * @returns The first set of the sequence as an array of terminals.
   */
  public firstOfSequence(sequence: string[]): string[] {
    const firsts: string[] = [];
    for (const symbol of sequence) {
      if (!this.isVariable(symbol)) {
        if (!firsts.includes(symbol)) {
          firsts.push(symbol);
        }
        break;
      } else {
        const firstsOfSymbol = this.firsts[symbol];
        if (firstsOfSymbol.includes(Grammar.Signs.ε)) {
          firsts.push(...firstsOfSymbol.filter((first) => first !== Grammar.Signs.ε));
          if (sequence.indexOf(symbol) === sequence.length - 1) {
            if (!firsts.includes(Grammar.Signs.ε)) {
              firsts.push(Grammar.Signs.ε);
            }
          }
        } else {
          firsts.push(...firstsOfSymbol);
          break;
        }
      }
    }
    return firsts;
  }

  /**
   * The follow set of a variable is the set of terminals that can follow the variable in a derivation.
   * @returns The follow set of each variable in the grammar.
   */
  public get follows(): Record<string, string[]> {
    const { variables, firsts } = this;
    // create an empty placeholder for the follows set
    const follows: Record<string, string[]> = {};
    // initial the set
    for (const variable of variables) {
      follows[variable] = [];
    }
    // calculate follow sets
    follows[this.rules[0].lhs].push(Grammar.Signs.$);
    let changed = true;
    while (changed) {
      changed = false;
      for (const production of this.rules) {
        const { lhs, rhs } = production;
        for (let i = 0; i < rhs.length; i++) {
          const symbol = rhs[i];
          if (this.isVariable(symbol)) {
            if (i === rhs.length - 1) {
              const oldLength = follows[symbol].length;
              follows[symbol] = [...new Set([...follows[symbol], ...follows[lhs]])];
              if (follows[symbol].length !== oldLength) {
                changed = true;
              }
            } else {
              const nextSymbol = rhs[i + 1];
              if (this.isVariable(nextSymbol)) {
                const firstsOfNext = firsts[nextSymbol];
                if (firstsOfNext.includes(Grammar.Signs.ε)) {
                  // Check if firstOfNext is defined
                  const oldLength = follows[symbol].length;
                  follows[symbol] = [
                    ...new Set([
                      ...follows[symbol],
                      ...follows[nextSymbol],
                      ...firstsOfNext.filter((first) => first !== Grammar.Signs.ε),
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
                if (!follows[symbol].includes(nextSymbol)) {
                  follows[symbol].push(nextSymbol);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
    return follows;
  }

  public print() {
    this.rules.forEach((rule) => {
      console.log(
        `${chalk.green.bold(rule.lhs)} -> ${rule.rhs
          .map((symbol) => (this.isVariable(symbol) ? chalk.blue.bold(symbol) : chalk.yellowBright(symbol)))
          .join(' ')}`,
      );
    });
  }
}
