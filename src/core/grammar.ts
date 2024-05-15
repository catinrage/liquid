import type { Pattern } from './lexer/pattern';

/**
 * Represents a production rule in a context-free grammar.
 */
export class GrammarProductionRule {
  /**
   * The left-hand side of the rule.
   */
  public readonly lhs: string;

  /**
   * The right-hand side of the rule.
   */
  public readonly rhs: string[];

  /**
   * The semantic action of the rule, which is a function that is called when the rule is reduced.
   * This is used to evaluate a value from the rule.
   */
  public action: (...data: any[]) => any;

  /**
   * Special semantic actions used in the grammar.
   */
  static ACTIONS = {
    PASS: (index: number = 0) => {
      return (...data: any[]) => data[index];
    },
  };

  constructor(
    lhs: string,
    rhs: string | string[],
    action: (...data: any[]) => any = GrammarProductionRule.ACTIONS.PASS(),
  ) {
    this.lhs = lhs;
    this.rhs = Array.isArray(rhs) ? rhs : rhs.split(' ');
    this.action = action;
  }

  /**
   * Returns the rule in a human-readable format.
   */
  toString(): string {
    return `${this.lhs} -> ${this.rhs.join(' ')}`;
  }

  /**
   * Checks if the rule is equal to given rule.
   */
  isEqualTo(other: GrammarProductionRule) {
    return this.lhs === other.lhs && this.rhs.join(' ') === other.rhs.join(' ');
  }
}

/**
 * Represents a context-free grammar.
 */
export class Grammar {
  /**
   * Special signs used in the grammar.
   */
  static readonly SIGNS = {
    // Epsilon sign (aka λ sign in some grammars)
    EPSILON: '__LIQUID_RESERVED_EPSILON__',
    // End of file sign (aka $ sign in some grammars)
    EOF: '__LIQUID_RESERVED_EOF__',
    // The augmented start symbol sign (aka S' sign in some grammars)
    AUG: `__LIQUID_RESERVED_AUG__`,
  } as const;

  constructor(
    /**
     * List of production rules in the grammar.
     */
    public readonly rules: GrammarProductionRule[],
    /**
     * Array of patterns used in the grammar.
     * These patterns are used to populate rules that use groups instead of token names.
     */
    public readonly patterns: Pattern[] = [],
  ) {
    if (patterns.length) {
      for (const rule of this.rules) {
        if (rule.rhs.findIndex((symbol) => symbol.startsWith('[') && symbol.endsWith(']')) >= 0) {
          const populated = this._populate(rule);
          this.rules.push(...populated);
        }
      }
      // remove all rules that contain groups
      this.rules = this.rules.filter((rule) => {
        return rule.rhs.every((r) => !r.startsWith('['));
      });
    }
  }

  private _populate(rule: GrammarProductionRule): GrammarProductionRule[] {
    // check if rule contains a group
    // groups are used in a grammar in `[GroupName]` format
    const groupIndex = rule.rhs.findIndex((symbol, index) => symbol.startsWith('[') && symbol.endsWith(']'));
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
        populated.push(...this._populate(new GrammarProductionRule(rule.lhs, newRhs, rule.action)));
      }

      return [...populated];
    } else {
      return [rule];
    }
  }

  /**
   * Returns the list of variables (non-terminals) in the grammar.
   */
  public get variables(): string[] {
    return [...new Set(this.rules.map((rule) => rule.lhs))];
  }

  /**
   * Returns the list of terminals in the grammar.
   */
  public get terminals(): string[] {
    return [
      ...new Set(this.rules.flatMap((rule) => rule.rhs).filter((symbol) => symbol !== Grammar.SIGNS.EPSILON)),
    ].filter((symbol) => !this.isVariable(symbol as string));
  }

  /**
   * Checks if a symbol is a terminal.
   */
  public isTerminal(symbol: string) {
    return this.terminals.includes(symbol);
  }

  /**
   * Checks if a symbol is a variable.
   */
  public isVariable(symbol: string) {
    return this.variables.includes(symbol as string);
  }

  /**
   * Returns the first set of each variable in the grammar.
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
            if (firstsOfSymbol.includes(Grammar.SIGNS.EPSILON)) {
              const oldLength = firsts[lhs].length;
              firsts[lhs] = [
                ...new Set([
                  ...firsts[lhs],
                  ...firstsOfSymbol.filter((first) => first !== Grammar.SIGNS.EPSILON),
                ]),
              ];
              if (firsts[lhs].length !== oldLength) {
                changed = true;
              }
              if (i === rhs.length - 1 && firstsOfSymbol.includes(Grammar.SIGNS.EPSILON)) {
                if (!firsts[lhs].includes(Grammar.SIGNS.EPSILON)) {
                  firsts[lhs].push(Grammar.SIGNS.EPSILON);
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
   * Returns the first set of a sequence of symbols.
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
        if (firstsOfSymbol.includes(Grammar.SIGNS.EPSILON)) {
          firsts.push(...firstsOfSymbol.filter((first) => first !== Grammar.SIGNS.EPSILON));
          if (sequence.indexOf(symbol) === sequence.length - 1) {
            if (!firsts.includes(Grammar.SIGNS.EPSILON)) {
              firsts.push(Grammar.SIGNS.EPSILON);
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
   * Returns the follow set of each variable in the grammar.
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
    follows[this.rules[0].lhs].push(Grammar.SIGNS.EOF);
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
                if (firstsOfNext.includes(Grammar.SIGNS.EPSILON)) {
                  // Check if firstOfNext is defined
                  const oldLength = follows[symbol].length;
                  follows[symbol] = [
                    ...new Set([
                      ...follows[symbol],
                      ...follows[nextSymbol],
                      ...firstsOfNext.filter((first) => first !== Grammar.SIGNS.EPSILON),
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
}
