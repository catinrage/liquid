import type { SplitBySpace } from '$common/types';
import { Grammar, GrammarProductionRule } from '$core/grammar';
import chalk from 'chalk';

/**
 * This class represents a LR(0) item in the LR parsing algorithms.
 * An LR(0) item is a production rule from the grammar augmented with additional information.
 */
export class LR0Item extends GrammarProductionRule {
  /**
   * The index of the rule, which is the position of the dot in the right-hand side of the rule.
   */
  public readonly index: number;

  constructor(lhs: string, rhs: string | string[], index: number = 0, action?: (...data: any[]) => any) {
    super(lhs, rhs, action);
    this.index = index;
  }

  /**
   * Returns the next symbol in the rule if any (the symbol after the dot in the rule).
   */
  public get nextSymbol(): string | undefined {
    return this.rhs[this.index];
  }

  /**
   * Checks if the rule is completed or not.
   * A rule is completed if the index is at the end of the right-hand side.
   */
  public isCompleted(): boolean {
    return this.index >= this.rhs.length;
  }

  /**
   * Returns the rule in a human-readable format.
   */
  public toString(): string {
    return `${this.lhs} -> ${this.rhs.slice(0, this.index).join('')} . ${this.rhs
      .slice(this.index)
      .join('')}`;
  }

  /**
   * Checks if the rule is equal to given rule.
   */
  public isEqualTo(other: LR0Item): boolean {
    return (
      this.lhs === other.lhs &&
      this.rhs.map((s) => s.toString()).join('') === other.rhs.map((s) => s.toString()).join('') &&
      this.index === other.index
    );
  }
}

/**
 * This class represents a LR(1) item in the LR parsing algorithms.
 * An LR(1) item is a production rule from the grammar augmented with additional information
 */
export class LR1Item extends LR0Item {
  /**
   * The lookaheads of the rule, which are the symbols that can follow the rule.
   */
  public lookaheads: string[];

  constructor(
    lhs: string,
    rhs: string | string[],
    /**
     * The metadata of the rule. containing the index, lookaheads, and action.
     */
    metadata: {
      index?: number;
      lookaheads?: string[];
      action?: (...data: any[]) => any;
    } = {
      index: 0,
      lookaheads: [],
      action: undefined,
    },
  ) {
    super(lhs, Array.isArray(rhs) ? rhs : rhs.split(' '), metadata.index, metadata.action);
    this.lookaheads = metadata.lookaheads ?? [];
  }

  /**
   * Returns the symbol after the next symbol if any (the symbol after the dot in the rule).
   */
  public get nextNextSymbol(): string | undefined {
    return this.rhs[this.index + 1];
  }

  /**
   * Returns whether the rule is completed or not.
   * A rule is completed if the index is at the end of the right-hand side.
   */
  public isCompleted(): boolean {
    return this.index >= this.rhs.filter((symbol) => symbol !== Grammar.SIGNS.EPSILON).length;
  }

  /**
   * Returns a clone of the current rule.
   */
  public clone(): LR1Item {
    return new LR1Item(this.lhs, this.rhs, {
      index: this.index,
      // we need to clone the lookaheads because they are passed by reference
      lookaheads: [...this.lookaheads],
      action: this.action,
    });
  }

  /**
   * Returns the rule in a human-readable format.
   */
  public toString(): string {
    return `${this.lhs} -> ${this.rhs.slice(0, this.index).join(' ')}.${this.rhs
      .slice(this.index)
      .join(' ')} :: [${chalk.dim(this.lookaheads.join(', '))}]`;
  }

  /**
   * Check if the rule is equal to given rule.
   */
  public isEqualTo(other: LR1Item): boolean {
    return (
      this.lhs === other.lhs &&
      this.rhs.map((s) => s.toString()).join('') === other.rhs.map((s) => s.toString()).join('') &&
      this.index === other.index &&
      this.lookaheads.every((a) => other.lookaheads.includes(a)) &&
      this.lookaheads.length === other.lookaheads.length
    );
  }

  /**
   * Check if rule is equal to given rule without considering lookaheads.
   */
  public isEqualToWithoutLookaheads(other: LR1Item): boolean {
    return (
      this.lhs === other.lhs &&
      this.rhs.map((s) => s.toString()).join('') === other.rhs.map((s) => s.toString()).join('') &&
      this.index === other.index
    );
  }
}

/**
 * This class represents a LR(1) state in an LR automaton.
 */
export class LR1State {
  /**
   * The automaton that this state belongs to.
   */
  private _automaton: LR1Automaton;

  /**
   * The kernel of the state, the rules that this state is resolved from.
   */
  public readonly kernel: LR1Item[];

  /**
   * The closure of the state, the rules that this state has.
   */
  public readonly closure: LR1Item[] = [];

  /**
   * The items that this state can expand to.
   */
  public readonly targets: Record<string, LR1State> = {};

  /**
   * This property is used to store the grammar of the item
   * It is used to calculate the lookahead of the rules using the first set of the grammar
   */
  private _grammar: Grammar | undefined;

  /**
   * The unique id of this state.
   */
  public id!: number;

  constructor(automaton: LR1Automaton, kernel: LR1Item[]) {
    this._automaton = automaton;
    this.kernel = kernel;
    this.closure = kernel.map((rule) => rule.clone());
  }

  /**
   * Returns the set of symbols that are after the dot in the rules of the item
   * These symbols are the ones that the item can expand with
   */
  public get expandables(): string[] {
    return [
      ...new Set(
        this.closure
          .map((rule) => rule.nextSymbol)
          .filter((symbol) => symbol !== undefined)
          .filter((symbol) => symbol !== Grammar.SIGNS.EPSILON),
      ),
    ] as string[];
  }

  /**
   * Resolves the item, meaning it calculates the closure of the item
   */
  public resolve(): void {
    const initialLength = this.closure.length;

    this.closure.forEach((rule) => {
      if (rule.nextSymbol) {
        if (this._automaton.grammar.isVariable(rule.nextSymbol)) {
          // find all rules that have the next symbol as the lhs
          const newRules = this._automaton.rules.filter((r) => r.lhs === rule.nextSymbol);
          for (const newRule of newRules) {
            // check if the exact rule is already in the item
            if (!this.closure.some((rule) => rule.isEqualTo(newRule))) {
              this.closure.push(newRule.clone());
            }
          }
        }
      }
    });
    // if the closure has changed, it means new rules have been added, so we need to resolve again
    if (this.closure.length > initialLength) {
      this.resolve();
    }

    // after the closure is calculated, we need to calculate the lookahead of the rules
    this._grammar = new Grammar(this.closure);
    // calculate the lookahead for each variable present in this item (this.grammar includes all the rules of this specific item only)
    this._grammar.variables.forEach((variable) => {
      const lookaheads: string[] = [];
      // get all rules that have this variable as the lhs and omit ones that are from the kernel, because their lookahead is already set
      const rules = this.closure.filter(
        (rule) => rule.lhs === variable && !this.kernel.some((r) => r.isEqualTo(rule)),
      );

      // get all rules that have this variable as next symbol
      const nextRules = this.closure.filter((rule) => rule.nextSymbol === variable);
      // add the lookahead for this rules
      // if there exists a rule such as : A -> α.Bβ, a
      // and B -> γ, then FIRST(βa)
      nextRules.forEach((rule) => {
        if (rule.nextNextSymbol) {
          if (this._grammar?.isTerminal(rule.nextNextSymbol)) {
            lookaheads.push(rule.nextNextSymbol);
          } else {
            const beta = rule.rhs.slice(rule.index + 1) as string[];
            const firsts = this._grammar?.firstOfSequence(beta);
            if (firsts) {
              lookaheads.push(...firsts);
            }
          }
        } else {
          lookaheads.push(...rule.lookaheads);
        }
      });
      // add the lookahead to the rules
      rules.forEach((rule) => {
        rule.lookaheads = [...new Set([...rule.lookaheads, ...lookaheads])];
      });
    });
  }

  /**
   * Expands the item, meaning it calculates the items that this item can expand to using a specific symbol
   */
  public expand() {
    for (const symbol of this.expandables) {
      // get all rules that have this symbol after the dot
      const rules = this.closure.filter((rule) => rule.nextSymbol === symbol);
      // update rules and move the index
      const newKernel: LR1Item[] = [];
      rules.forEach((rule) => {
        // create a new rule with the index moved forward
        newKernel.push(
          new LR1Item(rule.lhs, rule.rhs, {
            index: rule.index + 1,
            lookaheads: rule.lookaheads,
            action: rule.action,
          }),
        );
      });
      // create a new item with the new rules
      const newState = new LR1State(this._automaton, newKernel);
      // check if this item already exists in the automaton
      if (!this._automaton.states.some((item) => item.hasAllRules(newKernel))) {
        // if it doesn't exist, register it
        this.targets[symbol] = newState;
        this._automaton.register(newState);
      } else {
        // if the item already exists, just add a reference to it
        this.targets[symbol] = this._automaton.states.find((item) => item.hasAllRules(newKernel))!;
      }
    }
  }

  /**
   * Returns whether the item has a specific rule or not
   */
  public hasRule(rule: LR1Item): boolean {
    return this.kernel.some((r) => r.isEqualTo(rule));
  }

  /**
   * Returns whether the item has all the rules in given the array or not
   */
  public hasAllRules(rules: LR1Item[]): boolean {
    return rules.every((rule) => this.hasRule(rule));
  }

  /**
   * Prints the item in a human-readable format
   */
  public print() {
    console.log(chalk.bold.greenBright(`State ID : ${this.id} `));
    console.log(chalk.dim.white('--------------'));
    console.log(chalk.dim('Kernel : '));
    this.kernel.forEach((rule) => console.log(chalk.redBright(rule.toString())));
    console.log(chalk.dim('Derived : '));
    this.closure
      .filter((rule) => !this.kernel.some((r) => r.isEqualTo(rule)))
      .forEach((rule) => console.log(rule.toString()));
  }

  /**
   * Checks if the state is equal to another state
   * Two items are equal if all their kernels rules are equal
   */
  public isEqualTo(other: LR1State): boolean {
    return this.kernel.every((rule) => other.kernel.some((r) => r.isEqualTo(rule)));
  }

  /**
   * Checks if the state is equal to another state without considering lookahead
   */
  public isEqualToWithoutLookaheads(other: LR1State): boolean {
    return this.kernel.every((rule) => other.kernel.some((r) => r.isEqualToWithoutLookaheads(rule)));
  }
}

/**
 * This class represents a LR(1) automaton in the LR parsing algorithms.
 */
export class LR1Automaton {
  /**
   * The set of rules (grammar) of the language for the parser.
   */
  public readonly rules: LR1Item[];

  /**
   * The list of states in the automaton.
   */
  public states: LR1State[] = [];

  /**
   * The Grammar object, its used only to get data from the rules.
   */
  public readonly grammar: Grammar;

  /**
   * The type of the parser, it can be CLR or LALR.
   */
  public readonly type: 'CLR' | 'LALR';

  /**
   * The unique id counter for the items.
   */
  private _idGeneratorCounter = 0;

  constructor(type: 'CLR' | 'LALR', grammar: Grammar) {
    this.type = type;

    this.rules = [
      new LR1Item(Grammar.SIGNS.AUG, [grammar.rules[0].lhs], {
        index: 0,
        lookaheads: [Grammar.SIGNS.EOF],
      }),
      ...grammar.rules.map((rule) => {
        return new LR1Item(rule.lhs, rule.rhs, {
          index: 0,
          lookaheads: [],
          action: rule.action,
        });
      }),
    ];
    this.grammar = grammar;
    this._init();
  }

  /**
   * Converts the automaton to a LALR automaton.
   */
  private _convertToLALR() {
    const mergedStates: LR1State[] = [];
    for (const state of this.states) {
      // check if the current state exists on the merged states
      const existingState = mergedStates.find((s) => s.isEqualToWithoutLookaheads(state));

      if (existingState) {
        // if it exists, merge the lookaheads
        state.closure.forEach((rule) => {
          const existingRule = existingState.closure.find((r) => r.isEqualToWithoutLookaheads(rule));
          if (existingRule) {
            existingRule.lookaheads = [...new Set([...existingRule.lookaheads, ...rule.lookaheads])];
          } else {
            existingState.closure.push(rule);
          }
        });
        state.id = existingState.id;
      } else {
        // if it doesn't exist, add it to the merged states
        mergedStates.push(state);
      }
    }
    this.states = mergedStates;
  }

  /**
   * Initializes the automaton by creating the first item.
   * All the other items will be created recursively.
   */
  private _init() {
    // create the first item, its I0 in the algorithm
    this.register(new LR1State(this, [this.rules[0]]));
    if (this.type === 'LALR') {
      this._convertToLALR();
    }
  }

  /**
   * Generates unique id for states.
   */
  private _generateId() {
    return this._idGeneratorCounter++;
  }

  /**
   * Registers an item in the automaton, adds it to the list of items.
   * It resolves the item and expands it.
   */
  public register(item: LR1State) {
    item.id = this._generateId();
    this.states.push(item);
    item.resolve();
    item.expand();
  }
}
