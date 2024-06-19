import { Grammar } from '$core/grammar';
import LR1 from '../models/lr1';

/**
 * This class represents a LALR state in an LALR automaton.
 */
export class LALRState extends LR1.State {
  constructor(public automaton: LALRAutomaton, kernel: LR1.Item[]) {
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

      // find the state that has the same kernel without considering lookaheads, it might or might not exist
      const stateWithSameKernel = this.automaton.findStateByKernel(newKernel, true) as LALRState | undefined;
      // create a new item with the new rules
      // if it doesn't exist, register it
      const newState = new LALRState(this.automaton, newKernel);
      if (stateWithSameKernel === undefined) {
        this.transitions[symbol] = newState;
        this.automaton.register(newState);
        // console.log(`new state ${newState.id} from ${this.id} with symbol ${symbol}`);
      } else {
        // if the item already exists, just add a reference to it and combine the lookaheads
        this.transitions[symbol] = stateWithSameKernel;
        // find the state that has the same kernel exactly, don't ignore lookaheads
        const stateWithSameKernelExact = this.automaton.findStateByKernel(newKernel, false) as
          | LALRState
          | undefined;

        // if the state with the same kernel also has the same lookaheads, it does not change anything
        if (stateWithSameKernelExact?.id !== stateWithSameKernel.id) {
          // compute newStates lookaheads so existing rules can be updated with them
          newState.resolve();
          stateWithSameKernel._updateLookaheads(newState);
        }
      }
    }
  }

  /**
   * Updates the lookaheads of the rules in the closure with the lookaheads of the reference state.
   * @param reference The state to update the lookaheads from.
   */
  private _updateLookaheads(reference: LALRState): void {
    let changed = false;
    for (const item of reference.closure) {
      const existingItemInClosure = this.closure.find((r) => r.isEqualTo(item, true));
      if (!existingItemInClosure) continue;
      const existingItemInKernel = this.kernel.find((r) => r.isEqualTo(item, true));
      const newLookaheads = [...new Set([...existingItemInClosure.lookaheads, ...item.lookaheads])];
      if (newLookaheads.length !== existingItemInClosure.lookaheads.length) {
        changed = true;
        existingItemInClosure.lookaheads = newLookaheads;
        // update the lookaheads in the kernel as well, its not needed but it makes debugging easier
        if (existingItemInKernel) existingItemInKernel.lookaheads = newLookaheads;
      }
    }
    // if the lookaheads changed, you have to expand the state again
    // because all target states have to be updated as well
    if (changed) {
      this.expand();
    }
  }
}

/**
 * This class represents a LALR automaton, constructed from a grammar object.
 */
export class LALRAutomaton extends LR1.Automaton {
  /**
   * The list of states in the automaton.
   */
  public readonly states: LALRState[] = [];

  constructor(
    /**
     * The Grammar object, its used only to get data from the rules.
     */
    public readonly grammar: Grammar,
  ) {
    super(grammar);
    // create the first item, its I0 in the algorithm
    this.populate(new LALRState(this, [this.rules[0]]));
  }
}
