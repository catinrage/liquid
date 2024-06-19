import chalk from 'chalk';
import CLITable from 'cli-table3';

import LR0 from './lr0';
import { Grammar } from '$core/grammar';
import { type Token, Lexer } from '$core/lexer';
import type { Pattern, PatternAssociativityType, PatternPrecedenceType } from '$core/lexer/pattern';
import { LiquidParserError, LiquidSyntaxError } from '$core/error';

namespace LR1 {
  /**
   * The stack element of the LR(1) parsing table
   */
  export namespace ParserStackElement {
    export class State {
      constructor(public readonly id: number) {}
    }
    export class Terminal {
      constructor(public readonly token: Token) {}
    }
    export class Variable {
      public context: unknown[] = [];
      constructor(public symbol: string) {
        this.symbol = symbol;
      }
    }
  }

  /**
   * The action of the LR(1) parsing table
   */
  export namespace ParserTableAction {
    export class Goto {
      constructor(public readonly state: ParserStackElement.State) {}
    }
    export class Shift {
      constructor(public readonly state: ParserStackElement.State) {}
    }
    export class Reduce {
      constructor(public readonly rule: LR1.Item) {}
    }
    export class Accept {}
  }

  /**
   * This class represents a LR(1) item in the LR parsing algorithms.
   * An LR(1) item is a production rule from the grammar augmented with additional information
   */
  export class Item extends LR0.Item {
    /**
     * The lookahead set of the rule, meaning the set of terminals that can follow the rule.
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
     * @returns The symbol after the next symbol if any (the symbol after the dot in the rule).
     */
    public get nextNextSymbol(): string | undefined {
      return this.rhs[this.index + 1];
    }

    /**
     * @returns a Clone of the current rule.
     */
    public clone(): LR1.Item {
      return new LR1.Item(this.lhs, this.rhs, {
        index: this.index,
        // we need to clone the lookaheads because they are passed by reference
        lookaheads: [...this.lookaheads],
        action: this.action,
      });
    }

    /**
     * @returns The rule as string in a human-readable format.
     */
    public toString(): string {
      return `${this.lhs} -> ${this.rhs.slice(0, this.index).join(' ')} .${this.rhs
        .slice(this.index)
        .join(' ')} :: [${chalk.dim(this.lookaheads.join(', '))}]`;
    }

    /**
     * @param operand The rule to compare with
     * @param ignoreLookahead Whether to ignore the lookahead of the rule for comparison or not
     * @returns Whether the rule is equal to the given rule or not
     */
    public isEqualTo(operand: LR1.Item, ignoreLookahead = false): boolean {
      return (
        this.lhs === operand.lhs &&
        this.rhs.map((s) => s.toString()).join('') === operand.rhs.map((s) => s.toString()).join('') &&
        this.index === operand.index &&
        (ignoreLookahead ||
          (this.lookaheads.every((a) => operand.lookaheads.includes(a)) &&
            this.lookaheads.length === operand.lookaheads.length))
      );
    }
  }

  /**
   * This class represents a LR1 state in an LR1 automaton.
   */
  export abstract class State {
    /**
     * The closure of the state, the rules that this state has.
     */
    public readonly closure: LR1.Item[] = [];

    /**
     * The states that this state can expand to, using a specific symbols.
     */
    public transitions: Record<string, LR1.State> = {};

    /**
     * The unique id of this state.\
     * A state wont receive an id until it is registered in the automaton.
     */
    public id!: number;

    constructor(
      /**
       * The automaton that this state belongs to.
       */
      public readonly automaton: LR1.Automaton,
      /**
       * The kernel of the state, the rules that this state is resolved from.
       */
      public readonly kernel: LR1.Item[],
    ) {
      this.automaton = automaton;
      this.kernel = kernel;
      this.closure = kernel.map((rule) => rule.clone());
    }

    /**
     * @returns The set of symbols that are after the dot in the items of the state,
     * These symbols are the ones that the state can expand with
     */
    public get expandables(): string[] {
      return [
        ...new Set(
          this.closure
            .map((rule) => rule.nextSymbol)
            .filter((symbol) => symbol !== undefined)
            .filter((symbol) => symbol !== Grammar.Signs.ε),
        ),
      ] as string[];
    }

    /**
     * Compute and apply the closure of the LR1 item, it also calculates the lookahead for the rules.
     */
    public resolve(): void {
      this._computeClosure();
      this._computeLookaheads();
    }

    /**
     * Compute the closure of the state.
     */
    private _computeClosure(): void {
      const insertingItems = [...this.kernel];
      while (insertingItems.length > 0) {
        const item = insertingItems.shift()!;
        if (item.nextSymbol && this.automaton.grammar.isVariable(item.nextSymbol)) {
          const newItems = this.automaton.findRuleWithLeftHandSideOf(item.nextSymbol);
          for (const newItem of newItems) {
            if (!this.closure.some((rule) => rule.isEqualTo(newItem))) {
              this.closure.push(newItem.clone());
              insertingItems.push(newItem.clone());
            }
          }
        }
      }
    }

    /**
     * Compute the lookaheads of the items in the state.
     */
    private _computeLookaheads(): void {
      // if there exists a item such as : A -> α.Bβ, a
      // then lookahead of  B -> γ will be FIRST(βa)
      // when B -> γ lookahead is updated, we need to update items that are derived from it
      // so we create a queue to process the items as we go
      const processingQueue = [...this.kernel];
      while (processingQueue.length > 0) {
        const processingItem = processingQueue.shift()!;
        let lookaheads: string[] = [];

        // the next symbol in the item
        const nextSymbol = processingItem.nextSymbol;
        // if item is completed, skip it
        if (!nextSymbol) continue;
        // PerformanceTimer.timer('Lookaheads Init').start();
        // lets get all items that their lhs is the next symbol of the current item
        const itemsWithNextSymbolAsLHS = this.closure
          .filter((item) => this.kernel.some((kernelItem) => !kernelItem.isEqualTo(item, true)))
          .filter((item) => item.lhs === nextSymbol);
        // PerformanceTimer.timer('Lookaheads Init').pause();

        // check if the lookaheads are already computed
        if (this.automaton.cache.lookaheads[processingItem.toString()]) {
          // PerformanceTimer.timer('Lookaheads Cache Hit').start();
          lookaheads = this.automaton.cache.lookaheads[processingItem.toString()];
          // PerformanceTimer.timer('Lookaheads Cache Hit').pause();
        } else {
          // PerformanceTimer.timer('Lookaheads Cache Miss').start();

          // formula for lookaheads:
          // if there exists a item such as : A -> α.Bβ, a
          // then lookahead of  B -> γ will be FIRST(βa)
          const beta = processingItem.rhs.slice(processingItem.index + 1) as string[];
          const firstsOfBeta = this.automaton.grammar.firstOfSequence(beta);

          if (beta.length === 0 || firstsOfBeta.includes(Grammar.Signs.ε)) {
            lookaheads.push(
              ...processingItem.lookaheads,
              ...firstsOfBeta.filter((first) => first !== Grammar.Signs.ε),
            );
          } else {
            lookaheads.push(...firstsOfBeta);
          }

          // cache the lookaheads for the item
          this.automaton.cache.lookaheads[processingItem.toString()] = lookaheads;
          // PerformanceTimer.timer('Lookaheads Cache Miss').pause();
        }

        // PerformanceTimer.timer('Lookaheads Set').start();
        // add the lookaheads to the items
        itemsWithNextSymbolAsLHS.forEach((item) => {
          const itemLookaheadsLengthBefore = item.lookaheads.length;
          item.lookaheads = [...new Set([...item.lookaheads, ...lookaheads])];
          if (item.lookaheads.length !== itemLookaheadsLengthBefore) {
            processingQueue.push(item);
          }
        });
        // PerformanceTimer.timer('Lookaheads Set').pause();
      }
    }

    /**
     * Expand the state to its targets.\
     * Meaning it calculates the items that this state can expand to using a specific symbol.
     */
    public abstract expand(): void;

    /**
     * @param targetRule The rule to check if it exists in the item
     * @param ignoreLookahead Whether to ignore the lookahead of the rule for comparison or not
     * @returns Whether the item has the rule or not.
     */
    public hasRule(targetRule: LR1.Item, ignoreLookahead = false): boolean {
      return this.kernel.some((rule) => rule.isEqualTo(targetRule, ignoreLookahead));
    }

    /**
     * @param rules The rules to check if they exist in the item
     * @param ignoreLookahead Whether to ignore the lookahead of the rule for comparison or not
     * @returns Whether the item has all the rules in given the array or not.
     */
    public hasAllRules(rules: LR1.Item[], ignoreLookahead = false): boolean {
      return rules.every((rule) => this.hasRule(rule, ignoreLookahead));
    }

    /**
     * Prints the item in a human-readable format.
     */
    public print(): void {
      console.log(chalk.bold.greenBright(`State ID : ${this.id} `));
      console.log(chalk.dim.white('--------------'));
      console.log(chalk.dim('Kernel : '));
      this.kernel.forEach((rule) => console.log(chalk.redBright(rule.toString())));
      console.log(chalk.dim('Derived : '));
      this.closure
        .filter((rule) => !this.kernel.some((r) => rule.isEqualTo(r, false)))
        .forEach((rule) => console.log(rule.toString()));
    }
  }

  /**
   * This class represents a LR1 automaton, constructed from a grammar object.
   */
  export abstract class Automaton {
    /**
     * The set of LR1 items in the automaton.
     * LR1 items are constructed from the grammar object.
     */
    public readonly rules: LR1.Item[] = [];

    /**
     * The list of states in the automaton.
     */
    public abstract readonly states: LR1.State[];

    /**
     * The cache object for the automaton.
     */
    public cache: {
      // caches the lookaheads for each item in the grammar
      // similar items will have the same lookaheads
      lookaheads: Record<string, string[]>;
    } = {
      lookaheads: {},
    };

    /**
     * The unique id counter for the items.
     */
    private _idGeneratorCounter = 0;

    /**
     * The list of new states that are generated during the population of the automaton.
     */
    protected _newStates: LR1.State[] = [];

    constructor(
      /**
       * The Grammar object to construct the automaton from.
       */
      public readonly grammar: Grammar,
    ) {
      this.rules = [
        new LR1.Item(Grammar.Signs.AUG, [this.grammar.rules[0].lhs], {
          index: 0,
          lookaheads: [Grammar.Signs.$],
        }),
        ...this.grammar.rules.map((rule) => {
          return new LR1.Item(rule.lhs, rule.rhs, {
            index: 0,
            lookaheads: [],
            action: rule.action,
          });
        }),
      ];
    }

    /**
     * Populates the automaton with the states starting from the given state.
     * @param from The state to start the population from
     */
    public populate(from: LR1.State): void {
      this.register(from);
      // a flag to check that any new states were populated

      while (this._newStates.length > 0) {
        const state = this._newStates.shift()!;
        state.expand();
      }
    }

    /**
     * @returns A unique id for the states in the automaton.
     */
    private _generateId(): number {
      return this._idGeneratorCounter++;
    }

    /**
     * @param lhs The left-hand side of the rule to find
     * @returns The rules that have the left-hand side of the given rule.
     */
    public findRuleWithLeftHandSideOf(lhs: string): LR1.Item[] {
      return this.rules.filter((rule) => rule.lhs === lhs);
    }

    /**
     * @param kernel The rule set to check if they exist in the state
     * @param ignoreLookahead Whether to ignore the lookahead of the rule for comparison or not
     * @returns The state that has all the given rules in the kernel, it might or might not exist
     */
    public findStateByKernel(kernel: LR1.Item[], ignoreLookahead = false): LR1.State | undefined {
      return this.states.find((item) => item.hasAllRules(kernel, ignoreLookahead));
    }

    /**
     * Registers an state in the automaton, adds it to the list of registered states.
     * @param state The state to register
     */
    public register(state: LR1.State): void {
      state.id = this._generateId();
      this.states.push(state);
      state.resolve();
      this._newStates.push(state);
    }
  }

  /**
   * This class represents a LR1 parser.
   */
  export abstract class Parser {
    /**
     * The LR1 automaton of the parser
     */
    private readonly _automaton: LR1.Automaton;

    /**
     * The lexer of the parser
     */
    private readonly _lexer: Lexer;

    /**
     * The parsing table of the automaton
     */
    private readonly _parsingTable: {
      [key: string]: {
        [key: string]: (
          | ParserTableAction.Goto
          | ParserTableAction.Shift
          | ParserTableAction.Reduce
          | ParserTableAction.Accept
        )[];
      };
    } = {};

    /**
     * Stores properties of the operators such as associativity and precedence
     */
    private _operatorsProperty: Partial<
      Record<
        string,
        {
          associativity?: PatternAssociativityType;
          precedence?: PatternPrecedenceType;
        }
      >
    > = {};

    public config: {
      maxIterations: number;
      debug: boolean;
      favor: 'Shift' | 'Reduce' | 'None';
    } = {
      maxIterations: 5000,
      debug: false,
      favor: 'None',
    };

    constructor(automaton: LR1.Automaton, patterns: Pattern[], config?: Partial<Parser['config']>) {
      this.config = { ...this.config, ...config };
      this._automaton = automaton;
      this._lexer = new Lexer(patterns);
      this._generateOperatorsProperty(patterns);
      this._generateParseTable();
    }

    /**
     * Generates the operators property from the patterns
     * @param patterns The patterns to generate the operators property from
     */
    private _generateOperatorsProperty(patterns: Pattern[]) {
      for (const pattern of patterns) {
        if (pattern.associativity) {
          if (!this._operatorsProperty[pattern.name]) this._operatorsProperty[pattern.name] = {};
          this._operatorsProperty[pattern.name]!.associativity = pattern.associativity;
        }
        if (pattern.precedence) {
          if (!this._operatorsProperty[pattern.name]) this._operatorsProperty[pattern.name] = {};
          this._operatorsProperty[pattern.name]!.precedence = pattern.precedence;
        }
      }
    }

    /**
     * Generates the parsing table using the automaton
     */
    private _generateParseTable() {
      for (const state of this._automaton.states) {
        this._parsingTable[state.id] = {};

        // initialize the table with empty arrays
        for (const terminal of this._automaton.grammar.terminals) {
          this._parsingTable[state.id][terminal] = [];
        }
        for (const variable of this._automaton.grammar.variables) {
          this._parsingTable[state.id][variable] = [];
        }
        this._parsingTable[state.id][Grammar.Signs.$] = [];

        // for each terminal in the grammar, if there is a target for this terminal, add a shift action
        for (const terminal of this._automaton.grammar.terminals) {
          if (state.transitions[terminal]) {
            this._parsingTable[state.id][terminal].push(
              new ParserTableAction.Shift(new ParserStackElement.State(state.transitions[terminal].id)),
            );
          }
        }

        // for each variable in the grammar, if there is a target for this variable, add a goto action
        for (const variable of this._automaton.grammar.variables) {
          if (state.transitions[variable]) {
            this._parsingTable[state.id][variable].push(
              new ParserTableAction.Goto(new ParserStackElement.State(state.transitions[variable].id)),
            );
          }
        }

        // if the rule is completed, add a reduce action for each lookahead of the rule
        for (const rule of state.closure.filter((rule) => rule.isCompleted())) {
          // calc rule's precedence based on its operators
          const rulePrecedence = rule.rhs.reduce((acc, symbol: string) => {
            if (this._operatorsProperty[symbol]) {
              return Math.max(acc, this._operatorsProperty[symbol]?.precedence ?? 0);
            }
            return acc;
          }, 0);

          if (rule.lhs === Grammar.Signs.AUG) {
            // if the rule is the start rule, add an accept action
            this._parsingTable[state.id][Grammar.Signs.$].push(new ParserTableAction.Accept());
            continue;
          }
          for (const lookahead of rule.lookaheads) {
            this._parsingTable[state.id][lookahead].push(new ParserTableAction.Reduce(rule));
          }
        }
      }
      this._resolveConflicts();
    }

    /**
     * Resolves the conflicts in the parsing table based on the operators properties
     */
    private _resolveConflicts(): void {
      for (const state of this._automaton.states) {
        for (const terminal of this._automaton.grammar.terminals) {
          if (this._parsingTable[state.id][terminal].length > 1) {
            const actions = this._parsingTable[state.id][terminal];
            const shiftActions = actions.filter((action) => action instanceof ParserTableAction.Shift);
            const reduceActions = actions.filter((action) => action instanceof ParserTableAction.Reduce);
            if (shiftActions.length > 0 && reduceActions.length > 0) {
              const shiftAction = shiftActions[0] as ParserTableAction.Shift;
              const reduceAction = reduceActions[0] as ParserTableAction.Reduce;
              const shiftPrecedence = this._operatorsProperty[terminal]?.precedence || 0;
              const reducePrecedence = reduceAction.rule.rhs.reduce((acc, symbol: string) => {
                if (this._operatorsProperty[symbol]) {
                  return Math.max(acc, this._operatorsProperty[symbol]?.precedence ?? 0);
                }
                return acc;
              }, 0);
              if (shiftPrecedence === reducePrecedence) {
                if (
                  this._operatorsProperty[terminal]?.associativity === 'Left' ||
                  this.config.favor === 'Reduce'
                ) {
                  this._parsingTable[state.id][terminal] = [new ParserTableAction.Reduce(reduceAction.rule)];
                } else if (
                  this._operatorsProperty[terminal]?.associativity === 'Right' ||
                  this.config.favor === 'Shift'
                ) {
                  this._parsingTable[state.id][terminal] = [new ParserTableAction.Shift(shiftAction.state)];
                } else {
                  // if associativity is none, we throw an error
                  throw new LiquidParserError(
                    `Grammar is not LR(1), Shift-Reduce conflict {S${state.id}, ${terminal}}`,
                  );
                }
              } else if (shiftPrecedence > reducePrecedence) {
                this._parsingTable[state.id][terminal] = [new ParserTableAction.Shift(shiftAction.state)];
              } else {
                this._parsingTable[state.id][terminal] = [new ParserTableAction.Reduce(reduceAction.rule)];
              }
            }
            if (reduceActions.length > 1) {
              const reducePrecedences = reduceActions.map((action) => {
                return (action as ParserTableAction.Reduce).rule.rhs.reduce((acc, symbol: string) => {
                  if (this._operatorsProperty[symbol]) {
                    return Math.max(acc, this._operatorsProperty[symbol]?.precedence ?? 0);
                  }
                  return acc;
                }, 0);
              });
              if (new Set(reducePrecedences).size !== 1) {
                throw new LiquidParserError(
                  `Grammar is not LR(1), Reduce-Reduce conflict {S${state.id}, ${terminal}}`,
                );
              } else {
                this._parsingTable[state.id][terminal] = [
                  reduceActions[reducePrecedences.indexOf(Math.max(...reducePrecedences))],
                ];
              }
            }
          }
        }
      }
    }

    /**
     * Parses the input using the parsing table and yields the output
     * @param input The input string to parse
     * @returns The output of the parsing
     */
    public parse<TOutput = any>(input: string) {
      const CST = {};

      // initiate the stack with the state 0 in it
      const stack: (ParserStackElement.State | ParserStackElement.Variable | ParserStackElement.Terminal)[] =
        [new ParserStackElement.State(this._automaton.states[0].id)];

      let action:
        | ParserTableAction.Goto
        | ParserTableAction.Shift
        | ParserTableAction.Reduce
        | ParserTableAction.Accept
        | undefined;

      const tokens = this._lexer.tokenize(input);

      let iteration = 0;

      while (!(action instanceof ParserTableAction.Accept)) {
        iteration++;
        if (iteration > this.config.maxIterations) {
          throw new LiquidParserError('Max iterations reached');
        }

        const token = tokens.at(0) as Token;
        const state = stack.at(-1) as ParserStackElement.State;

        // the action to be taken
        action = this._parsingTable[state.id][token.type][0];

        // if there is no action, input is not accepted
        if (!action) {
          const expected = [
            ...new Set(
              Object.keys(this._parsingTable[state.id])
                .map((symbol) => {
                  if (this._automaton.grammar.isVariable(symbol))
                    return this._automaton.grammar.firsts[symbol];
                  return `${symbol}`;
                })
                .flat(),
            ),
          ].filter((symbol) => symbol !== Grammar.Signs.ε && symbol !== Grammar.Signs.$);
          this._automaton.grammar.firsts;
          throw new LiquidSyntaxError(`Unexpected token \`${token.lexeme}\``, token.start, expected);
        }

        // if action is shift, do these steps:
        // 1- push the terminal to the stack
        // 2- push the state to the stack
        // 3- remove the terminal from the input
        if (action instanceof ParserTableAction.Shift) {
          stack.push(new ParserStackElement.Terminal(token));
          stack.push(action.state);
          tokens.shift();
          continue;
        }

        // if action is reduce, do these steps:
        // 1- get the rule of the action (shift action comes with the rule)
        // 2- pop 2 * len(rule.rhs) from the stack
        // 3- push the lhs of the rule to the stack
        // 4- push the goto of the state and lhs to the stack
        // 5- apply the action of the rule to the context of the lhs
        if (action instanceof ParserTableAction.Reduce) {
          const rule = action.rule;
          const poppedElements: (
            | ParserStackElement.State
            | ParserStackElement.Variable
            | ParserStackElement.Terminal
          )[] = [];
          for (let i = 0; i < 2 * rule.rhs.filter((symbol) => symbol !== Grammar.Signs.ε).length; i++) {
            poppedElements.push(stack.pop()!);
          }
          const state = stack[stack.length - 1] as ParserStackElement.State;
          let variable = new ParserStackElement.Variable(rule.lhs);

          for (const element of poppedElements) {
            if (element instanceof ParserStackElement.State) continue;
            if (element instanceof ParserStackElement.Variable) {
              variable.context.push(element.context);
            }
            if (element instanceof ParserStackElement.Terminal) {
              variable.context.push(element.token);
            }
          }

          // if this rule has an action function, apply it to the context of the variable
          if (rule.action) variable.context = rule.action.apply(variable.context, variable.context.reverse());

          stack.push(variable);
          stack.push((this._parsingTable[state.id][rule.lhs][0] as ParserTableAction.Goto).state);

          continue;
        }
      }

      return (stack[1] as ParserStackElement.Variable).context as any;
    }

    public printTable(): void {
      const terminals = this._automaton.grammar.terminals;
      const variables = this._automaton.grammar.variables;
      const table = new CLITable({
        head: ['State', ...terminals, '$', ...variables],
        style: {
          head: ['blue', 'bold'],
        },
      });
      Object.keys(this._parsingTable).forEach((state) => {
        const row = [chalk.italic(state)];
        [...terminals, Grammar.Signs.$].forEach((terminal, index) => {
          const actions = this._parsingTable[state][terminal];
          let cell = [];
          for (const action of actions) {
            switch (true) {
              case action instanceof ParserTableAction.Shift:
                cell.push(chalk.yellow(`S${action.state.id}`));
                break;
              case action instanceof ParserTableAction.Reduce:
                let rn = 0;
                // get the rule number
                this._automaton.grammar.rules.forEach((rule, index) => {
                  if (rule.isEqualTo(action.rule)) rn = index;
                });
                cell.push(chalk.rgb(156, 39, 176)(`R${rn}`));
                break;
              case action instanceof ParserTableAction.Accept:
                cell.push(chalk.green.bold('ACC'));
                break;
            }
          }
          row.push(cell.length > 1 ? chalk.bgRgb(239, 83, 80)(cell.join('/')) : cell[0]);
        });
        variables.forEach((variable, index) => {
          const action = this._parsingTable[state][variable];
          let cell = '';
          switch (true) {
            case action instanceof ParserTableAction.Goto:
              cell = chalk.white(`${action.state.id}`);
              break;
          }
          row.push(cell);
        });
        table.push(row);
      });

      console.log(table.toString());
    }
  }
}

export default LR1;
