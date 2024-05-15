import { Grammar } from '$core/grammar';
import Lexer from '$core/lexer';
import type Pattern from '$core/lexer/pattern';
import type { PatternAssociativityType, PatternPrecedenceType } from '$core/lexer/pattern';
import type { Token } from '$core/lexer/token';
import { LR1Automaton, LR1Item } from '.';

/**
 * The stack element of the LR(1) parsing table
 */
namespace LR1ParseTableStackElement {
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
namespace LR1ParseTableAction {
  export class Goto {
    constructor(public readonly state: LR1ParseTableStackElement.State) {}
  }
  export class Shift {
    constructor(public readonly state: LR1ParseTableStackElement.State) {}
  }
  export class Reduce {
    constructor(public readonly rule: LR1Item) {}
  }
  export class Accept {}
}

export class LR1Parser<
  TSymbols extends string = string,
  TVariables extends TSymbols = TSymbols,
  TTerminals extends string = Exclude<TSymbols, TVariables>,
> {
  /**
   * The automaton of the parser
   */
  public readonly automaton: LR1Automaton;

  /**
   * The lexer of the parser
   */
  public readonly lexer: Lexer;

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

  private _operators: Partial<
    Record<
      string,
      {
        associativity?: PatternAssociativityType;
        precedence?: PatternPrecedenceType;
      }
    >
  > = {};

  constructor(automaton: LR1Automaton<TSymbols, TVariables, TTerminals>, patterns: Pattern[]) {
    this.automaton = automaton;
    this.lexer = new Lexer(patterns);
    for (const pattern of patterns) {
      if (pattern.associativity) {
        if (!this._operators[pattern.name]) this._operators[pattern.name] = {};
        this._operators[pattern.name]!.associativity = pattern.associativity;
      }
      if (pattern.precedence) {
        if (!this._operators[pattern.name]) this._operators[pattern.name] = {};
        this._operators[pattern.name]!.precedence = pattern.precedence;
      }
    }
    this._generateParseTable();
  }

  /**
   * Generates the parsing table using the automaton
   */
  private _generateParseTable() {
    for (const state of this.automaton.states) {
      this.parsingTable[state.id] = {};

      // for each terminal in the grammar, if there is a target for this terminal, add a shift action
      for (const terminal of this.automaton.grammar.terminals) {
        if (state.targets[terminal]) {
          this.parsingTable[state.id][terminal] = new LR1ParseTableAction.Shift(
            new LR1ParseTableStackElement.State(state.targets[terminal].id),
          );
        }
      }

      // for each variable in the grammar, if there is a target for this variable, add a goto action
      for (const variable of this.automaton.grammar.variables) {
        if (state.targets[variable]) {
          this.parsingTable[state.id][variable] = new LR1ParseTableAction.Goto(
            new LR1ParseTableStackElement.State(state.targets[variable].id),
          );
        }
      }

      // if the rule is completed, add a reduce action for each lookahead of the rule
      for (const rule of state.closure.filter((rule) => rule.isCompleted())) {
        // calc rule's precedence based on its operators
        const rulePrecedence = rule.rhs.reduce((acc, symbol: string) => {
          if (this._operators[symbol]) {
            return Math.max(acc, this._operators[symbol]?.precedence ?? 0);
          }
          return acc;
        }, 0);

        if (rule.lhs === Grammar.SIGNS.AUG) {
          // if the rule is the start rule, add an accept action
          this.parsingTable[state.id][Grammar.SIGNS.EOF] = new LR1ParseTableAction.Accept();
          continue;
        }
        for (const lookahead of rule.lookaheads) {
          // get the precedence of the lookahead (operator/terminal)
          const lookaheadPrecedence = this._operators[lookahead]?.precedence || 0;
          // if the cell is already filled, it means there is a conflict
          // we try to fix it if associativity and precedence are defined
          if (this.parsingTable[state.id][lookahead]) {
            if (this.parsingTable[state.id][lookahead] instanceof LR1ParseTableAction.Reduce) {
              throw new Error(`Grammar is not LR(1), Reduce-Reduce conflict {S${state.id}, ${lookahead}\}`);
            } else if (this.parsingTable[state.id][lookahead] instanceof LR1ParseTableAction.Shift) {
              if (this._operators[lookahead]?.associativity === 'None') {
                throw new Error(`Grammar is not LR(1), Shift-Reduce conflict {S${state.id}, ${lookahead}\}`);
              } else if (this._operators[lookahead]?.associativity === 'Right') {
                // if its left associative, we don't replace the shift with reduce
                continue;
              } else if (this._operators[lookahead]?.associativity === 'Left') {
                if (lookaheadPrecedence > rulePrecedence) {
                  // if the lookahead has higher precedence, we don't replace the shift with reduce
                  continue;
                } else if (lookaheadPrecedence === rulePrecedence) {
                  // if the precedences are equal, we replace the shift with reduce
                }
              }
            }
          }
          this.parsingTable[state.id][lookahead] = new LR1ParseTableAction.Reduce(rule);
        }
      }
    }
  }

  /**
   * Parses the input using the parsing table
   */
  public parse<TOutput = any>(
    input: string,
  ):
    | {
        accepted: false;
        error: string;
      }
    | {
        accepted: true;
        output: TOutput;
      } {
    // initiate the stack with the state 0 in it
    const stack: (
      | LR1ParseTableStackElement.State
      | LR1ParseTableStackElement.Variable
      | LR1ParseTableStackElement.Terminal
    )[] = [new LR1ParseTableStackElement.State(this.automaton.states[0].id)];

    let action:
      | LR1ParseTableAction.Goto
      | LR1ParseTableAction.Shift
      | LR1ParseTableAction.Reduce
      | LR1ParseTableAction.Accept
      | undefined;

    const tokens = this.lexer.tokenize(input);

    while (!(action instanceof LR1ParseTableAction.Accept)) {
      const token = tokens.at(0) as Token;
      const state = stack.at(-1) as LR1ParseTableStackElement.State;

      // the action to be taken
      action = this.parsingTable[state.id][token.type];

      if (!action) {
        // each token has a group, for each group, check if there is an action
        // because grammars can use group instead of token type
        for (const group of token.groups) {
          action = this.parsingTable[state.id][`[${group}]`];
          if (action) break;
        }
      }

      // if there is no action, input is not accepted
      if (!action) {
        return {
          accepted: false,
          error: `Unexpected token ${token.type} at ${token.start}`,
        };
      }

      // if action is shift, do these steps:
      // 1- push the terminal to the stack
      // 2- push the state to the stack
      // 3- remove the terminal from the input
      if (action instanceof LR1ParseTableAction.Shift) {
        stack.push(new LR1ParseTableStackElement.Terminal(token));
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
      if (action instanceof LR1ParseTableAction.Reduce) {
        const rule = action.rule;
        const poppedElements: (
          | LR1ParseTableStackElement.State
          | LR1ParseTableStackElement.Variable
          | LR1ParseTableStackElement.Terminal
        )[] = [];
        for (let i = 0; i < 2 * rule.rhs.filter((symbol) => symbol !== Grammar.SIGNS.EPSILON).length; i++) {
          poppedElements.push(stack.pop()!);
        }

        const state = stack[stack.length - 1] as LR1ParseTableStackElement.State;

        let variable = new LR1ParseTableStackElement.Variable(rule.lhs);

        for (const element of poppedElements) {
          if (element instanceof LR1ParseTableStackElement.State) continue;
          if (element instanceof LR1ParseTableStackElement.Variable) {
            variable.context.push(element.context);
          }
          if (element instanceof LR1ParseTableStackElement.Terminal) {
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
      output: (stack[1] as LR1ParseTableStackElement.Variable).context as any,
    };
  }
}
