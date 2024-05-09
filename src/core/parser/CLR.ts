import { Grammar, GrammarProductionRule } from '$core/grammar';

process.stdout.write('\x1Bc');

class CLRItemRule extends GrammarProductionRule {
  constructor(
    public readonly lhs: string,
    public readonly rhs: (string | symbol)[],
    public index = 0,
    public lookahead: (string | symbol)[] = [],
  ) {
    super(lhs, rhs);
  }

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
      this.lookahead.map((la) => la.toString()).join(','),
    );
  }

  public clone(): CLRItemRule {
    return new CLRItemRule(this.lhs, this.rhs, this.index, this.lookahead);
  }

  // returns the symbol at the current index
  public get nextSymbol(): string | undefined {
    const symbol = this.rhs[this.index];
    if (typeof symbol === 'symbol') return undefined;
    return symbol;
  }

  // returns the symbol after the current index
  public get nextNextSymbol(): string | undefined {
    const symbol = this.rhs[this.index + 1];
    if (typeof symbol === 'symbol') return undefined;
    return symbol;
  }

  public get completed(): boolean {
    return this.index >= this.rhs.length;
  }

  static compare(A: CLRItemRule, B: CLRItemRule): boolean {
    return (
      A.lhs === B.lhs &&
      A.rhs.map((s) => s.toString()).join('') === B.rhs.map((s) => s.toString()).join('') &&
      A.index === B.index &&
      A.lookahead.every((a) => B.lookahead.includes(a)) &&
      A.lookahead.length === B.lookahead.length
    );
  }
}

class CLRItem {
  /**
   * The automaton that this item belongs to
   */
  public readonly automaton: CLRAutomaton;
  /**
   * The grammar that this item belongs to
   */
  public grammar: Grammar | undefined;
  /**
   * The rules that this item is has expanded from
   */
  public readonly kernel: CLRItemRule[];
  /**
   * The rules that this item has
   */
  public _closure: CLRItemRule[] = [];
  /**
   * The items that this item can expand to
   */
  public _targets: Record<string, CLRItem> = {};
  /**
   * The unique id of this item
   */
  public readonly id: string = Math.random().toString(36).substring(10).toLocaleUpperCase();

  constructor(automaton: CLRAutomaton, kernel: CLRItemRule[]) {
    this.automaton = automaton;
    this.kernel = kernel;
    this._closure = kernel.map((rule) => rule.clone());
  }

  // returns a set (unique array) of all the symbols that can be expanded
  public get symbols(): string[] {
    return [
      ...new Set(this._closure.map((rule) => rule.nextSymbol).filter((symbol) => symbol !== undefined)),
    ] as string[];
  }

  // create the closure of the item
  public resolve(): void {
    const initialLength = this._closure.length;

    this._closure.forEach((rule) => {
      if (rule.nextSymbol) {
        if (this.automaton.variables.includes(rule.nextSymbol)) {
          // find all rules that have the next symbol as the lhs
          const nextRules = this.automaton.rules.filter((r) => r.lhs === rule.nextSymbol);
          for (const nextRule of nextRules) {
            // check if the exact rule is already in the item
            if (!this._closure.some((rule) => CLRItemRule.compare(rule, nextRule))) {
              this._closure.push(nextRule.clone());
            }
          }
        }
      }
    });
    if (this._closure.length > initialLength) {
      this.resolve();
    }

    this.grammar = new Grammar(this._closure);

    // add the lookahead to the rules
    this.grammar.variables.forEach((variable, index) => {
      const la: (string | symbol)[] = [];
      // get all rules that have this variable as the lhs and omit ones that are from the kernel, because their lookahead is already set
      const rules = this._closure.filter(
        (rule) => rule.lhs === variable && !this.kernel.some((r) => CLRItemRule.compare(r, rule)),
      );

      // get all rules that have this variable as next symbol
      const nextRules = this._closure.filter((rule) => rule.nextSymbol === variable);
      // add the lookahead to the rules
      nextRules.forEach((rule) => {
        if (rule.nextNextSymbol) {
          if (this.grammar?.isTerminal(rule.nextNextSymbol)) {
            la.push(rule.nextNextSymbol);
          } else {
            const beta = rule.rhs.slice(rule.index + 1) as string[];
            const firsts = this.grammar?.firstOfSequence(beta);
            if (firsts) {
              la.push(...firsts);
            }
          }
        } else {
          // rule.lookahead = [...rule.lookahead, ...la];
          la.push(...rule.lookahead);
        }
      });
      // add the lookahead to the rules
      rules.forEach((rule) => {
        rule.lookahead = [...new Set([...rule.lookahead, ...la])];
      });
    });
  }

  // expand the item, meaning create new items that can be reached from this item
  public expand() {
    for (const symbol of this.symbols) {
      // get all rules that have this symbol
      const rules = this._closure.filter((rule) => rule.nextSymbol === symbol);
      // update rules and move the index
      const newRules: CLRItemRule[] = [];
      rules.forEach((rule) => {
        newRules.push(new CLRItemRule(rule.lhs, rule.rhs, rule.index + 1, rule.lookahead));
      });
      // create a new item with the new rules
      const newItem = new CLRItem(this.automaton, newRules);
      // check if this item already exists in the automaton
      if (!this.automaton.items.some((item) => item.hasAll(newRules))) {
        this._targets[symbol] = newItem;
        this.automaton.registerItem(newItem);
        // console.log(`Item ${this.id} -> ${symbol} -> ${newItem.id}`);
        newItem.resolve();
        newItem.expand();
      } else {
        this._targets[symbol] = this.automaton.items.find((item) => item.hasAll(newRules))!;
        // console.log(`Item ${this.id} -> ${symbol} -> ${this._targets[symbol].id}`);
      }
    }
  }

  public print(): void {
    console.log('Item:', this.id);
    this._closure.forEach((rule) => rule.print());
  }

  public has(rule: CLRItemRule): boolean {
    return this.kernel.some((r) => CLRItemRule.compare(r, rule));
  }

  public hasAll(rules: CLRItemRule[]): boolean {
    return rules.every((rule) => this.has(rule));
  }

  public get completed(): boolean {
    return this._closure.every((rule) => rule.completed);
  }

  static compare(A: CLRItem, B: CLRItem): boolean {
    return A.kernel.every((rule) => B.kernel.some((r) => CLRItemRule.compare(rule, r)));
  }
}

class CLRAutomaton {
  public readonly rules: CLRItemRule[] = [];
  public readonly grammar: Grammar;

  public items: CLRItem[] = [];

  constructor(grammar: CLRItemRule[]) {
    this.rules = [new CLRItemRule('_', [grammar[0].lhs], 0, [Grammar.SIGNS.EOI]), ...grammar];
    this.grammar = new Grammar(this.rules);

    const item = new CLRItem(this, [this.rules[0]]);
    this.registerItem(item);
    item.resolve();
    item.expand();
  }

  public registerItem(item: CLRItem) {
    this.items.push(item);
  }

  public get variables(): string[] {
    return [...new Set(this.rules.map((rule) => rule.lhs))];
  }
}

function find(automaton: CLRAutomaton, path: string): CLRItem {
  let x = automaton.items[0];
  for (const p of path.split(' ')) {
    x = x._targets[p];
  }
  return x;
}

const a1 = new CLRAutomaton([
  new CLRItemRule('S', ['A', 'a', 'A', 'b']),
  new CLRItemRule('S', ['B', 'b', 'B', 'a']),
  new CLRItemRule('A', [Grammar.SIGNS.EPSILON]),
  new CLRItemRule('B', [Grammar.SIGNS.EPSILON]),
]);

// a1.items.forEach((item) => {
//   item.print();
//   console.log('\n');
// });

console.log('================\n');

const a2 = new CLRAutomaton([
  new CLRItemRule('E', ['E', '+', 'E']),
  new CLRItemRule('E', ['E', '*', 'E']),
  new CLRItemRule('E', ['id']),
]);

// console.log('================\n');

// a2.items.forEach((item) => {
//   item.print();
//   console.log('\n');
// });

console.log('================\n');

const a3 = new CLRAutomaton([
  new CLRItemRule('E', ['E', '+', 'T']),
  new CLRItemRule('E', ['T']),
  new CLRItemRule('T', ['id', '(', 'E', ')']),
  new CLRItemRule('T', ['id']),
]);

console.timeEnd('x');
console.log('================\n');
console.log(a3.items.length);

// a3.items.forEach((item) => {
//   item.print();
//   console.log('\n');
// });

if (a1.items.length !== 10) {
  throw new Error('Invalid number of items');
}

if (a2.items.length !== 7) {
  throw new Error('Invalid number of items');
}

if (a3.items.length !== 16) {
  throw new Error('Invalid number of items');
}
