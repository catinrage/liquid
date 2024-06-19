import { Riz } from '../artifacts';

class Variable {
  private _value: unknown = null;
  constructor(public symbol: string) {
    this.symbol = symbol;
  }

  public get() {
    return this._value;
  }

  public set(value: unknown) {
    this._value = value;
  }
}

class Scope {
  public readonly id = Math.random().toString(36).slice(2);
  private readonly variables: Map<string, Variable> = new Map();

  public declare(name: string) {
    if (this.variables.has(name)) {
      throw new Error(`Variable '${name}' is already declared`);
    }
    const newVariable = new Variable(name);
    this.variables.set(name, newVariable);
    return newVariable;
  }

  public find(name: string): Variable | null {
    return this.variables.get(name) ?? null;
  }

  public has(name: string) {
    return this.variables.has(name);
  }
}

class Block {
  private readonly scope: Scope = new Scope();

  constructor(private _program: Riz.Program, private _parent: Block | null = null) {}

  /**
   * Runs the program block
   */
  protected _run() {
    for (const element of this._program.body) {
      if (element instanceof Riz.Block) {
        const block = new Block(element, this);
        block._run();
      } else {
        this._execute(element);
      }
    }
  }

  /**
   * Evaluates an expression
   */
  private _evaluate(expression: Riz.Types.Expression): any {
    switch (true) {
      case expression instanceof Riz.Expression.Literal:
        return expression.value;
      case expression instanceof Riz.Expression.Identifier:
        if (!this._find(expression.name)) {
          throw new Error(`Variable '${expression.name}' is not declared`);
        }
        return this._find(expression.name)?.get();
      case expression instanceof Riz.Expression.ExpressionUnary:
        const value = this._evaluate(expression.argument);
        switch (expression.operator) {
          case '-':
            return -value;
          case '+':
            return +value;
          case 'not':
            return !value;
          default:
            throw new Error(`Unknown operator ${expression.operator}`);
        }
      case expression instanceof Riz.Expression.ExpressionBinary:
        const lhs = this._evaluate(expression.lhs);
        const rhs = this._evaluate(expression.rhs);
        switch (expression.operator) {
          case '+':
            return lhs + rhs;
          case '-':
            return lhs - rhs;
          case '*':
            return lhs * rhs;
          case '/':
            return lhs / rhs;
          case '%':
            return lhs % rhs;
          case '==':
            return lhs == rhs;
          case '!=':
            return lhs != rhs;
          case '>':
            return lhs > rhs;
          case '<':
            return lhs < rhs;
          case '>=':
            return lhs >= rhs;
          case '<=':
            return lhs <= rhs;
          case 'and':
            return lhs && rhs;
          case 'or':
            return lhs || rhs;
          case 'xor':
            return (lhs || rhs) && !(lhs && rhs);
          default:
            throw new Error(`Unknown operator ${expression.operator}`);
        }
      case expression instanceof Riz.Expression.ExpressionAssignment:
        this._find(expression.identifier.name)?.set(this._evaluate(expression.expression));
        return this.scope.find(expression.identifier.name)?.get();
    }
  }

  /**
   * Evaluates a statement
   */
  private _execute(statement: Riz.Types.Statement): void {
    switch (true) {
      case statement instanceof Riz.Statement.StatementExpression:
        return this._evaluate(statement.expression);
      case statement instanceof Riz.Statement.StatementDeclaration:
        if (statement.init) {
          this.scope.declare(statement.identifier.name)?.set(this._evaluate(statement.init));
        } else {
          this.scope.declare(statement.identifier.name);
        }
        return;
      case statement instanceof Riz.Statement.StatementOutput:
        console.log(this._evaluate(statement.expression));
        return;
      case statement instanceof Riz.Statement.IfStatement:
        if (this._evaluate(statement.condition)) {
          const block = new Block(statement.consequent, this);
          block._run();
        }
        return;
      case statement instanceof Riz.Statement.ForStatement:
        for (; this._evaluate(statement.condition); this._execute(statement.update)) {
          const block = new Block(statement.block, this);
          block._run();
        }
        return;
      default:
        throw new Error(`Unknown statement ${statement}`);
    }
  }

  /**
   * Finds a variable, if not found in the current scope, it will look in the parent scope
   */
  private _find(name: string): Variable | null {
    if (this.scope.has(name)) {
      return this.scope.find(name);
    } else if (this._parent) {
      return this._parent._find(name);
    } else {
      return null;
    }
  }

  /**
   * Checks if a variable can be declared by checking if it already exists in the current scope
   */
  private _canBeDeclared(name: string): boolean {
    return !this.scope.has(name);
  }
}

export class RizRuntime extends Block {
  constructor(program: Riz.Program) {
    super(program);
  }

  public run() {
    super._run();
  }
}
