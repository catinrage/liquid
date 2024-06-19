import { Grammar } from '$core/grammar';
import LR1 from '../models/lr1';

/**
 * This class represents a CLR state in an CLR automaton.
 */
class CLRState extends LR1.State {
  constructor(automaton: CLRAutomaton, kernel: LR1.Item[]) {
    super(automaton, kernel);
  }

  /**
   * Expands the item, meaning it calculates the items that this item can expand to using a specific symbol
   */
  public expand() {
    for (const symbol of this.expandables) {
      // get all rules that have this symbol after the dot
      const rules = this.closure.filter((rule) => rule.nextSymbol === symbol);
      // update rules and move the index
      const newKernel: LR1.Item[] = [];
      rules.forEach((rule) => {
        // create a new rule with the index moved forward
        newKernel.push(
          new LR1.Item(rule.lhs, rule.rhs, {
            index: rule.index + 1,
            lookaheads: rule.lookaheads,
            action: rule.action,
          }),
        );
      });
      // get the state that has the same kernel, it might or might not exist
      const stateWithSameKernel = this.automaton.findStateByKernel(newKernel);
      // if it doesn't exist, register it
      if (stateWithSameKernel === undefined) {
        // create a new item with the new rules
        const newState = new CLRState(this.automaton, newKernel);
        this.transitions[symbol] = newState;
        this.automaton.register(newState);
      } else {
        // if the item already exists, just add a reference to it
        this.transitions[symbol] = stateWithSameKernel;
      }
    }
  }
}

/**
 * This class represents a CLR automaton, constructed from a grammar object.
 */
export class CLRAutomaton extends LR1.Automaton {
  /**
   * The list of states in the automaton.
   */
  public readonly states: CLRState[] = [];

  constructor(
    /**
     * The Grammar object, its used only to get data from the rules.
     */
    public readonly grammar: Grammar,
  ) {
    super(grammar);
    this.populate(new CLRState(this, [this.rules[0]]));
  }
}
