import { Grammar } from '$core/grammar';
import { GrammarProductionRule } from '$core/grammar/rule';

namespace LR0 {
  /**
   * This class represents a LR(0) item in the LR parsing algorithms.
   * An LR(0) item is a production rule from the grammar augmented with additional information.
   */
  export class Item extends GrammarProductionRule {
    /**
     * The index of the LR0 rule is the position of the dot in the right-hand side of the rule.
     */
    public readonly index: number;

    constructor(lhs: string, rhs: string | string[], index: number = 0, action?: (...data: any[]) => any) {
      super(lhs, rhs, action);
      this.index = index;
    }

    /**
     * @returns The next symbol in the rule if any (the symbol after the dot in the rule).\
     * It might be empty.
     */
    public get nextSymbol(): string | undefined {
      return this.rhs[this.index];
    }

    /**
     * A rule is completed if the index is at the end of the right-hand side.
     * @returns True if the rule is completed, false otherwise.
     */
    public isCompleted(): boolean {
      return this.index >= this.rhs.filter((symbol) => symbol !== Grammar.Signs.ε).length;
    }

    /**
     * @returns The rule as string in a human-readable format.
     */
    public toString(): string {
      return `${this.lhs} -> ${this.rhs.slice(0, this.index).join('')} . ${this.rhs
        .slice(this.index)
        .join('')}`;
    }

    /**
     * @param operand The LR(0) item to compare with.
     * @returns True if the two LR(0) items are equal, false otherwise.
     */
    public isEqualTo(operand: Item): boolean {
      return (
        this.lhs === operand.lhs &&
        this.rhs.map((s) => s.toString()).join('') === operand.rhs.map((s) => s.toString()).join('') &&
        this.index === operand.index
      );
    }
  }
}

export default LR0;
