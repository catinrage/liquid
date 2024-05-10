import { Grammar, GrammarProductionRule } from '$core/grammar';

process.stdout.write('\x1Bc');

class LR1ItemRule extends GrammarProductionRule {
  constructor(
    public readonly lhs: string,
    public readonly rhs: string[],
    public index = 0,
    public lookaheads: string[] = [],
    // semantic action
    public action: (...data: string[]) => any = () => {},
  ) {
    super(lhs, rhs);

    // console.log(this.action.toString());
  }

  /**
   * Prints the rule in a human-readable format.
   */
  public print(): void {
    console.log(
      this.lhs +
        ' -> ' +
        this.rhs
          .map((s) => s.toString())
          .slice(0, this.index)
          .join('') +
        '.' +
        this.rhs
          .map((s) => s.toString())
          .slice(this.index)
          .join(''),
      '|',
      this.lookaheads.map((la) => la.toString()).join(','),
    );
  }

  /**
   * Returns a clone of the current rule.
   */
  public clone(): LR1ItemRule {
    return new LR1ItemRule(this.lhs, this.rhs, this.index, this.lookaheads, this.action);
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
  static areEqual(A: LR1ItemRule, B: LR1ItemRule): boolean {
    return (
      A.lhs === B.lhs &&
      A.rhs.map((s) => s.toString()).join('') === B.rhs.map((s) => s.toString()).join('') &&
      A.index === B.index &&
      A.lookaheads.every((a) => B.lookaheads.includes(a)) &&
      A.lookaheads.length === B.lookaheads.length
    );
  }
}

class LR1Item {
  /**
   * The automaton that this item belongs to
   */
  private _automaton: LR1Automaton;

  /**
   * The rules that this item is has expanded from
   */
  private _kernel: LR1ItemRule[];

  /**
   * The rules that this item has
   */
  public closure: LR1ItemRule[] = [];

  /**
   * The items that this item can expand to
   */
  public targets: Record<string, LR1Item> = {};

  /**
   * This property is used to store the grammar of the item
   * It is used to calculate the lookahead of the rules using the first set of the grammar
   */
  private grammar: Grammar | undefined;

  /**
   * The unique id of this item
   */
  public readonly id: string = Math.random().toString(36).substring(6).toLocaleUpperCase();

  constructor(automaton: LR1Automaton, kernel: LR1ItemRule[]) {
    this._automaton = automaton;
    this._kernel = kernel;
    this.closure = kernel.map((rule) => rule.clone());
  }

  /**
   * Returns the set of symbols that are after the dot in the rules of the item
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
            if (!this.closure.some((rule) => LR1ItemRule.areEqual(rule, newRule))) {
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

    this.grammar = new Grammar(this.closure);
    // calculate the lookahead for each variable present in this item (this.grammar includes all the rules of this specific item only)
    this.grammar.variables.forEach((variable) => {
      const lookaheads: string[] = [];
      // get all rules that have this variable as the lhs and omit ones that are from the kernel, because their lookahead is already set
      const rules = this.closure.filter(
        (rule) => rule.lhs === variable && !this._kernel.some((r) => LR1ItemRule.areEqual(r, rule)),
      );

      // get all rules that have this variable as next symbol
      const nextRules = this.closure.filter((rule) => rule.nextSymbol === variable);
      // add the lookahead for this rules
      // if there exists a rule such as : A -> α.Bβ, a
      // and B -> γ, then FIRST(βa)
      nextRules.forEach((rule) => {
        if (rule.nextNextSymbol) {
          if (this.grammar?.isTerminal(rule.nextNextSymbol)) {
            lookaheads.push(rule.nextNextSymbol);
          } else {
            const beta = rule.rhs.slice(rule.index + 1) as string[];
            const firsts = this.grammar?.firstOfSequence(beta);
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
      const newKernel: LR1ItemRule[] = [];
      rules.forEach((rule) => {
        // create a new rule with the index moved forward
        newKernel.push(new LR1ItemRule(rule.lhs, rule.rhs, rule.index + 1, rule.lookaheads, rule.action));
      });
      // create a new item with the new rules
      const newItem = new LR1Item(this._automaton, newKernel);
      // check if this item already exists in the automaton
      if (!this._automaton.items.some((item) => item.hasAllRules(newKernel))) {
        // if it doesn't exist, register it
        this.targets[symbol] = newItem;
        this._automaton.register(newItem);
      } else {
        // if the item already exists, just add a reference to it
        this.targets[symbol] = this._automaton.items.find((item) => item.hasAllRules(newKernel))!;
      }
    }
  }

  /**
   * Returns whether the item has a specific rule or not
   */
  public hasRule(rule: LR1ItemRule): boolean {
    return this._kernel.some((r) => LR1ItemRule.areEqual(r, rule));
  }

  /**
   * Returns whether the item has all the rules in given the array or not
   */
  public hasAllRules(rules: LR1ItemRule[]): boolean {
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
   * Prints the item in a human-readable format
   */
  public print(): void {
    console.log('Item:', this.id);
    this.closure.forEach((rule) => rule.print());
  }

  /**
   * Compares two items and returns whether they are equal or not
   * Two items are equal if all their kernels rules are equal
   */
  static areEqual(A: LR1Item, B: LR1Item): boolean {
    return A._kernel.every((rule) => B._kernel.some((r) => LR1ItemRule.areEqual(rule, r)));
  }
}

class Goto {
  constructor(public readonly state: string) {}
}

class Shift {
  constructor(public readonly state: string) {}
}

class Reduce {
  constructor(public readonly rule: LR1ItemRule) {}
}

class Accept {}

class LR1Automaton {
  public readonly rules: LR1ItemRule[] = [];
  public readonly grammar: Grammar;
  public readonly parsingTable: {
    [key: string]: {
      [key: string]: Goto | Shift | Reduce | Accept | undefined;
    };
  } = {};

  public items: LR1Item[] = [];

  constructor(grammar: LR1ItemRule[]) {
    this.rules = [new LR1ItemRule('AUG', [grammar[0].lhs], 0, [Grammar.SIGNS.EOI]), ...grammar];
    this.grammar = new Grammar(this.rules);
    this.init();
    this.generateParseTable();
  }

  /**
   * Initializes the automaton by creating the first item
   * All the other items will be created recursively
   */
  public init() {
    // create the first item, its I0 in the algorithm
    this.register(new LR1Item(this, [this.rules[0]]));
  }

  /**
   * Registers an item in the automaton, adds it to the list of items2
   * It resolves the item and expands it
   */
  public register(item: LR1Item) {
    this.items.push(item);
    item.resolve();
    item.expand();
  }

  /**
   * Generates the parsing table using the items
   */
  public generateParseTable() {
    // now lets create the parsing table
    for (const item of this.items) {
      this.parsingTable[item.id] = {};
      for (const terminal of this.grammar.terminals) {
        if (item.targets[terminal]) {
          this.parsingTable[item.id][terminal] = new Shift(item.targets[terminal].id);
        }
      }
      for (const variable of this.grammar.variables) {
        if (item.targets[variable]) {
          this.parsingTable[item.id][variable] = new Goto(item.targets[variable].id);
        }
      }

      for (const rule of item.closure) {
        if (rule.lhs === 'AUG') {
          this.parsingTable[item.id][Grammar.SIGNS.EOI] = new Accept();
        } else {
          if (rule.completed) {
            for (const lookahead of rule.lookaheads) {
              if (this.parsingTable[item.id][lookahead]) {
                throw new Error('Invalid grammar, multiple actions for the same symbol');
              }
              this.parsingTable[item.id][lookahead] = new Reduce(rule);
            }
          }
        }
      }
    }
  }

  /**
   * Parses the input using the parsing table
   */
  public parse(input: string[]) {
    const stack: string[] = [this.items[0].id];

    let action: Goto | Shift | Reduce | Accept | undefined;

    while (!(action instanceof Accept)) {
      const symbol = input[0];
      action = this.parsingTable[stack[stack.length - 1]][symbol];

      if (!action) {
        return false;
      }

      if (action instanceof Shift) {
        stack.push(symbol);
        stack.push(action.state);
        input.shift();

        continue;
      }

      if (action instanceof Reduce) {
        const rule = action.rule;

        const popped: string[] = [];
        for (let i = 0; i < 2 * rule.rhs.length; i++) {
          popped.push(stack.pop()!);
        }
        const state = stack[stack.length - 1];
        stack.push(rule.lhs);
        stack.push((this.parsingTable[state][rule.lhs] as Goto).state);

        continue;
      }

      if (action instanceof Goto) {
        stack.push(symbol);
        stack.push(action.state);

        continue;
      }
    }

    return true;
  }
}

// const a1 = new LR1Automaton([
//   new LR1ItemRule('S', ['A', 'a', 'A', 'b']),
//   new LR1ItemRule('S', ['B', 'b', 'B', 'a']),
//   new LR1ItemRule('A', [Grammar.SIGNS.EPSILON]),
//   new LR1ItemRule('B', [Grammar.SIGNS.EPSILON]),
// ]);

// a1.items.forEach((item) => {
//   item.print();
//   console.log('\n');
// });

// prettier-ignore
// const a2 = new LR1Automaton([
//   new LR1ItemRule('E', ['E', '+', 'T']),
//   new LR1ItemRule('T', ['a'])
// ]);

// a2.items.forEach((item) => {
//   item.print();
//   console.log('\n');
// });

// const a3 = new LR1Automaton([
//   new LR1ItemRule('E', ['E', '+', 'T']),
//   new LR1ItemRule('E', ['T']),
//   new LR1ItemRule('T', ['T', '*', 'F']),
//   new LR1ItemRule('T', ['F']),
//   new LR1ItemRule('F', ['(', 'E', ')']),
//   new LR1ItemRule('F', ['id']),
// ]);

const a3 = new LR1Automaton([
  new LR1ItemRule('E', ['E', '+', 'T'], 0, [], ($0, $1, $2) => {
    // console.log({$0, $1, $2});
    console.log(`at E -> E + T`);
    
  }),
  new LR1ItemRule('E', ['T'], 0, [], ($0) => {
    // console.log({$0});
    console.log(`at E -> T`);
  }),
  new LR1ItemRule('T', ['1'], 0, [], ($0) => {
  //  console.log({$0}); 
  console.log(`at T -> 1`);
  
  })
]);

console.log(a3.parse(['1', '+', '1', Grammar.SIGNS.EOI]));

// a3.items.forEach((item) => {
//   item.print();
//   console.log('\n');
// });

// const a4 = new LR1Automaton([
//   new LR1ItemRule('S', ['X', 'X']),
//   new LR1ItemRule('X', ['a', 'X']),
//   new LR1ItemRule('X', ['b']),
// ]);

// a4.items.forEach((item) => {
//   item.print();
//   console.log('\n');
// });

// if (a1.items.length !== 10) {
//   throw new Error('Invalid number of items');
// }

// if (a2.items.length !== 7) {
//   throw new Error('Invalid number of items');
// }

// if (a3.items.length !== 16) {
//   throw new Error('Invalid number of items');
// }
