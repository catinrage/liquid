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
  private _rhs: string[];

  /**
   * The semantic action of the rule, which is a function that is called when the rule is reduced.
   * This is used to evaluate a value from the rule.
   */
  public action: (this: any[], ...data: any[]) => any;

  /**
   * Special semantic actions used in the grammar.
   */
  static Actions = {
    PASS: () => {
      return (...data: any[]) => {
        if (data.length === 1) {
          return data[0];
        } else {
          return data;
        }
      };
    },
  };

  constructor(
    lhs: string,
    rhs: string | string[],
    action: (...data: any[]) => any = GrammarProductionRule.Actions.PASS(),
  ) {
    this.lhs = lhs;
    this._rhs = Array.isArray(rhs) ? rhs : this.split(rhs);
    this.action = action;
  }

  /**
   * @returns the right-hand side of the rule.
   */
  public get rhs() {
    return this._rhs;
  }

  /**
   * @param rhs The right-hand side of the rule.
   * @returns The right-hand side of the rule splitted by spaces.
   */
  split(rhs: string): string[] {
    return rhs.split(' ');
  }

  /**
   * Replaces the symbols in the right-hand side of the rule with the given replacement.
   * @param target The symbol to replace.
   * @param replacement The symbol to replace with.
   */
  replace(target: string, replacement: string): GrammarProductionRule {
    this._rhs = this._rhs.map((symbol) => {
      return symbol === target ? replacement : symbol;
    });
    this._rhs = this.split(this._rhs.join(' '));
    return this;
  }

  /**
   * @returns the rule in a human-readable format.
   */
  toString(): string {
    return `${this.lhs} -> ${this.rhs.join(' ')}`;
  }

  /**
   * Checks if the rule is equal to given rule.
   * @param other The rule to compare with.
   * @returns True if the rules are equal, false otherwise.
   */
  isEqualTo(other: GrammarProductionRule): boolean {
    return this.lhs === other.lhs && this.rhs.join(' ') === other.rhs.join(' ');
  }
}
