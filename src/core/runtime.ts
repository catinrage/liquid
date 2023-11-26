// it executes the AST, but for now the AST is very simple, it only has binary expressions, unary expressions, and literals
// make it log the result of the program to the console
/**
 * 
 * example AST : 
 * {
  type: "Program",
  body: [
    {
      type: "ExpressionStatement",
      expression: {
        type: "BinaryExpression",
        operator: "PLUS",
        left: {
          type: "BinaryExpression",
          operator: "PLUS",
          left: {
            type: "Literal",
            value: 1,
            raw: "1"
          },
          right: {
            type: "Literal",
            value: 2,
            raw: "2"
          }
        },
        right: {
          type: "Literal",
          value: 3,
          raw: "3"
        }
      }
    }
  ]
}
 */

import { Expression, Program } from '../common/types';

class Runtime {
  constructor(private readonly ast: Program) {}

  run() {
    return this.evaluate(this.ast.body[0].expression);
  }

  private evaluate(node: Expression) {
    if (node.type === 'Program') {
      return this.evaluate(node.body[0]);
    } else if (node.type === 'ExpressionStatement') {
      return this.evaluate(node.expression);
    } else if (node.type === 'BinaryExpression') {
      if (node.operator === 'PLUS') {
        return this.evaluate(node.left) + this.evaluate(node.right);
      } else if (node.operator === 'MINUS') {
        return this.evaluate(node.left) - this.evaluate(node.right);
      } else if (node.operator === 'MULTIPLY') {
        return this.evaluate(node.left) * this.evaluate(node.right);
      } else if (node.operator === 'DIVIDE') {
        return this.evaluate(node.left) / this.evaluate(node.right);
      }
    } else if (node.type === 'UnaryExpression') {
      if (node.operator === 'MINUS') {
        return -this.evaluate(node.argument);
      }
    } else if (node.type === 'Literal') {
      return node.value;
    }
  }
}
