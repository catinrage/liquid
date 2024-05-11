export class GrammarProductionRule {
  constructor(
    /**
     * The left-hand side of the rule.
     */
    public readonly lhs: string,
    /**
     * The right-hand side of the rule.
     */
    public readonly rhs: string[],
  ) {}
}

export class Grammar {
  /**
   * Special signs used in the grammar.
   */
  static readonly SIGNS = {
    // Epsilon sign (aka λ sign in some grammars)
    EPSILON: '__LIQUID_RESERVED_EPSILON__',
    // End of input sign (aka $ sign in some grammars)
    EOI: '__LIQUID_RESERVED_EOI__',
    // The augmented start symbol sign
    AUG: `__LIQUID_RESERVED_AUG__`,
  } as const;

  constructor(
    /**
     * List of production rules in the grammar.
     */
    public readonly rules: GrammarProductionRule[],
  ) {}

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
    follows[this.rules[0].lhs].push(Grammar.SIGNS.EOI);
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
