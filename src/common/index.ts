/**
 * Represents a rule in the grammar.
 */
export class Rule {
  constructor(public readonly lhs: string, public readonly rhs: string) {}
}

/**
 * Represents a grammar.
 */
export class Grammar {
  /**
   * An array of variables in the grammar.
   * @example ['E', 'T', 'F']
   */
  private variables: string[] = [];

  constructor(private readonly rules: Rule[]) {
    for (const rule of rules) {
      this.process(rule);
    }
  }

  /**
   * Processes a rule and adds its left-hand side symbol to the variables array if it doesn't already exist.
   * @param rule - The rule to process.
   */
  private process(rule: Rule): void {
    if (!this.variables.includes(rule.lhs)) {
      this.variables.push(rule.lhs);
    }
  }
}
