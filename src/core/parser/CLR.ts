import { Grammar, GrammarProductionRule } from '$core/grammar';
import Lexer from '$core/lexer';
import type { Token } from '$core/lexer/token';
import { password } from 'bun';
import patterns from '../../lang/patterns';

process.stdout.write('\x1Bc');

/**
 * This class represents a LR(1) item in the CLR parsing algorithm.
 * An LR(1) item is a production rule from the grammar augmented with additional information
 */
export class LR1Item extends GrammarProductionRule {
  /**
   * The index of the rule, which is the position of the dot in the rule.
   */
  public index: number;

  /**
   * The lookaheads of the rule, which are the symbols that can follow the rule.
   */
  public lookaheads: string[];

  /**
   * The semantic action of the rule, which is a function that is called when the rule is reduced.
   * This is used to evaluate a value from the rule.
   */
  public action: (...data: any[]) => any;

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
      action: () => {},
    },
  ) {
    super(lhs, Array.isArray(rhs) ? rhs : rhs.split(' '));
    this.index = metadata.index ?? 0;
    this.lookaheads = metadata.lookaheads ?? [];
    this.action = metadata.action ?? (() => {});
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
   * Returns the symbol after the current index if any (the symbol after the dot in the rule).
   */
  public get nextSymbol(): string | undefined {
    return this.rhs[this.index];
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
  public get completed(): boolean {
    return this.index >= this.rhs.length;
  }

  /**
   * Compares two rules and returns whether they are equal or not.
   */
  static areEqual(A: LR1Item, B: LR1Item): boolean {
    return (
      A.lhs === B.lhs &&
      A.rhs.map((s) => s.toString()).join('') === B.rhs.map((s) => s.toString()).join('') &&
      A.index === B.index &&
      A.lookaheads.every((a) => B.lookaheads.includes(a)) &&
      A.lookaheads.length === B.lookaheads.length
    );
  }
}

export class LR1State {
  /**
   * The parser that this item belongs to
   */
  private _parser: CLRParser;

  /**
   * The rules that this item is has expanded from
   */
  private _kernel: LR1Item[];

  /**
   * The rules that this item has
   */
  public readonly closure: LR1Item[] = [];

  /**
   * The items that this item can expand to
   */
  public readonly targets: Record<string, LR1State> = {};

  /**
   * This property is used to store the grammar of the item
   * It is used to calculate the lookahead of the rules using the first set of the grammar
   */
  private _grammar: Grammar | undefined;

  /**
   * The unique id of this item
   */
  public readonly id: string = Math.random().toString(36).substring(6).toLocaleUpperCase();

  constructor(automaton: CLRParser, kernel: LR1Item[]) {
    this._parser = automaton;
    this._kernel = kernel;
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
        if (this._parser.grammar.isVariable(rule.nextSymbol)) {
          // find all rules that have the next symbol as the lhs
          const newRules = this._parser.rules.filter((r) => r.lhs === rule.nextSymbol);
          for (const newRule of newRules) {
            // check if the exact rule is already in the item
            if (!this.closure.some((rule) => LR1Item.areEqual(rule, newRule))) {
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
        (rule) => rule.lhs === variable && !this._kernel.some((r) => LR1Item.areEqual(r, rule)),
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
      const newItem = new LR1State(this._parser, newKernel);
      // check if this item already exists in the automaton
      if (!this._parser.states.some((item) => item.hasAllRules(newKernel))) {
        // if it doesn't exist, register it
        this.targets[symbol] = newItem;
        this._parser.register(newItem);
      } else {
        // if the item already exists, just add a reference to it
        this.targets[symbol] = this._parser.states.find((item) => item.hasAllRules(newKernel))!;
      }
    }
  }

  /**
   * Returns whether the item has a specific rule or not
   */
  public hasRule(rule: LR1Item): boolean {
    return this._kernel.some((r) => LR1Item.areEqual(r, rule));
  }

  /**
   * Returns whether the item has all the rules in given the array or not
   */
  public hasAllRules(rules: LR1Item[]): boolean {
    return rules.every((rule) => this.hasRule(rule));
  }

  /**
   * Returns whether if all the rules in the item are completed or not
   * If all the rules are completed, it means the item is completed
   */
  public get completed(): boolean {
    return this.closure.every((rule) => rule.completed);
  }

  /**
   * Compares two items and returns whether they are equal or not
   * Two items are equal if all their kernels rules are equal
   */
  static areEqual(A: LR1State, B: LR1State): boolean {
    return A._kernel.every((rule) => B._kernel.some((r) => LR1Item.areEqual(rule, r)));
  }
}

namespace LR1ParseTableAction {
  export class Goto {
    constructor(public readonly state: State) {}
  }

  export class Shift {
    constructor(public readonly state: State) {}
  }

  export class Reduce {
    constructor(public readonly rule: LR1Item) {}
  }

  export class Accept {}
}

class State {
  constructor(public readonly id: string) {}
}

class Terminal {
  constructor(public readonly token: Token) {}
}

class Variable {
  public context: any[] = [];

  constructor(public symbol: string) {
    this.symbol = symbol;
  }
}

export class CLRParser {
  /**
   * The set of rules (grammar) of the language for the parser
   */
  public readonly rules: LR1Item[] = [];

  /**
   * The Grammar object, its used only to get data from the rules
   */
  public readonly grammar: Grammar;

  /**
   * The parsing table of the automaton
   */
  public readonly parsingTable: {
    [key: string]: {
      [key: string]:
        | LR1ParseTableAction.Goto
        | LR1ParseTableAction.Shift
        | LR1ParseTableAction.Reduce
        | LR1ParseTableAction.Accept
        | undefined;
    };
  } = {};

  /**
   * The list of items in the automaton
   */
  public states: LR1State[] = [];

  constructor(
    rules: LR1Item[],
    /**
     * The associativity of the terminals in the grammar
     */
    public associativity: {
      [key: string]: 'Left' | 'Right';
    } = {},
  ) {
    this.rules = [
      new LR1Item(Grammar.SIGNS.AUG, [rules[0].lhs], {
        index: 0,
        lookaheads: [Grammar.SIGNS.EOI],
      }),
      ...rules,
    ];
    this.grammar = new Grammar(this.rules);
    this.init();
    this.generateParseTable();
  }

  /**
   * Initializes the automaton by creating the first item
   * All the other items will be created recursively
   */
  private init() {
    // create the first item, its I0 in the algorithm
    this.register(new LR1State(this, [this.rules[0]]));
  }

  /**
   * Registers an item in the automaton, adds it to the list of items2
   * It resolves the item and expands it
   */
  public register(item: LR1State) {
    this.states.push(item);
    item.resolve();
    item.expand();
  }

  /**
   * Generates the parsing table using the items
   */
  private generateParseTable() {
    for (const item of this.states) {
      this.parsingTable[item.id] = {};
      for (const terminal of this.grammar.terminals) {
        if (item.targets[terminal]) {
          this.parsingTable[item.id][terminal] = new LR1ParseTableAction.Shift(
            new State(item.targets[terminal].id),
          );
        }
      }
      for (const variable of this.grammar.variables) {
        if (item.targets[variable]) {
          this.parsingTable[item.id][variable] = new LR1ParseTableAction.Goto(
            new State(item.targets[variable].id),
          );
        }
      }
      for (const rule of item.closure) {
        if (rule.lhs === Grammar.SIGNS.AUG) {
          this.parsingTable[item.id][Grammar.SIGNS.EOI] = new LR1ParseTableAction.Accept();
        } else {
          if (rule.completed) {
            for (const lookahead of rule.lookaheads) {
              if (this.parsingTable[item.id][lookahead]) {
                if (this.parsingTable[item.id][lookahead] instanceof LR1ParseTableAction.Reduce) {
                  throw new Error('Grammar is not LR(1), Reduce-Reduce conflict');
                } else if (this.parsingTable[item.id][lookahead] instanceof LR1ParseTableAction.Shift) {
                  if (this.associativity[lookahead] === undefined) {
                    throw new Error('Grammar is not LR(1), Shift-Reduce conflict');
                  } else if (this.associativity[lookahead] === 'Left') {
                    // if its left associative, we don't replace the shift with reduce
                    continue;
                  }
                }
              }
              this.parsingTable[item.id][lookahead] = new LR1ParseTableAction.Reduce(rule);
            }
          }
        }
      }
    }
  }

  /**
   * Parses the input using the parsing table
   */
  public parse<T = any>(
    input: Token[],
  ):
    | {
        accepted: false;
      }
    | {
        accepted: true;
        output: T;
      } {
    // initiate the stack with the state 0 in it
    const stack: (State | Variable | Terminal)[] = [new State(this.states[0].id)];

    let action:
      | LR1ParseTableAction.Goto
      | LR1ParseTableAction.Shift
      | LR1ParseTableAction.Reduce
      | LR1ParseTableAction.Accept
      | undefined;

    while (!(action instanceof LR1ParseTableAction.Accept)) {
      const token = input.at(0) as Token;
      const state = stack.at(-1) as State;

      // the action to be taken
      action = this.parsingTable[state.id][token.type];

      // if there is no action, input is not accepted
      if (!action) {
        return {
          accepted: false,
        };
      }

      // if action is shift, do these steps:
      // 1- push the terminal to the stack
      // 2- push the state to the stack
      // 3- remove the terminal from the input
      if (action instanceof LR1ParseTableAction.Shift) {
        stack.push(new Terminal(token));
        stack.push(action.state);
        input.shift();
        continue;
      }

      // if action is reduce, do these steps:
      // 1- get the rule of the action (shift action comes with the rule)
      // 2- pop 2 * len(rule.rhs) from the stack
      // 3- push the lhs of the rule to the stack
      // 4- push the goto of the state and lhs to the stack
      // 5- apply the action of the rule to the context of the lhs
      if (action instanceof LR1ParseTableAction.Reduce) {
        const rule = action.rule;
        const poppedElements: (State | Variable | Terminal)[] = [];
        for (let i = 0; i < 2 * rule.rhs.length; i++) {
          poppedElements.push(stack.pop()!);
        }

        const state = stack[stack.length - 1] as State;

        let variable = new Variable(rule.lhs);

        for (const element of poppedElements) {
          if (element instanceof State) continue;
          if (element instanceof Variable) {
            variable.context.push(element.context);
          }
          if (element instanceof Terminal) {
            variable.context.push(element.token);
          }
        }

        // if this rule has an action function, apply it to the context of the variable
        if (rule.action) variable.context = rule.action(...variable.context.reverse());

        stack.push(variable);
        stack.push((this.parsingTable[state.id][rule.lhs] as LR1ParseTableAction.Goto).state);

        continue;
      }
    }

    return {
      accepted: true,
      output: (stack[1] as Variable).context as any,
    };
  }
}
