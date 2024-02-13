/**
 * Represents the location of a code element.
 */
export type Location = {
  line: number;
  column: number;
};

/**
 * Represents the program structure.
 */
export interface Program {
  type: 'Program';
  body: Statement[];
}

/**
 * Represents a production rule in the grammar.
 */
export type Production = {
  lhs: string;
  rhs: string[];
  // a function that returns a node
  parser?: (nodes: Node[]) => Node;
};

/**
 * Represents the grammar.
 */
export type Grammar = Production[];

/**
 * Represents a node in the program.
 *
 * @property type The type of the node.
 */
export type Node = {
  type: string;
};

/**
 * Represents a statement in the program.
 */
export type Statement = StatementExpression | StatementIf | StatementFor | StatementLet | StatementBlock;

/**
 * Represents a block statement.
 */
export interface StatementBlock extends Node {
  type: 'StatementBlock';
  body: Statement[];
}

/**
 * Represents a let statement.
 */
export interface StatementLet extends Node {
  type: 'StatementLet';
  identifier: Identifier;
  expression: Expression;
}

/**
 * Represents an if statement.
 */
export interface StatementIf extends Node {
  type: 'StatementIf';
  test: Expression;
  consequent: StatementBlock;
  alternate: StatementBlock | StatementIf;
}

/**
 * Represents a for statement.
 */
export interface StatementFor extends Node {
  type: 'StatementFor';
  identifier: Identifier;
  expression: Expression;
  body: Statement[];
}

/**
 * Represents an expression interface.
 */
export type ExpressionInterface = Node;

/**
 * Represents an expression statement.
 */
export interface StatementExpression extends ExpressionInterface {
  type: 'StatementExpression';
  expression: Expression;
}

/**
 * Represents a assignments expression.
 */
export interface ExpressionAssignment extends ExpressionInterface {
  type: 'ExpressionAssignment';
  operator: string;
  left: Expression;
  right: Expression;
}

/**
 * Represents a binary expression.
 */
export interface ExpressionBinary extends ExpressionInterface {
  type: 'ExpressionBinary';
  operator: string;
  left: Expression;
  right: Expression;
}

/**
 * Represents a unary expression.
 */
export interface ExpressionUnary extends ExpressionInterface {
  type: 'ExpressionUnary';
  operator: string;
  argument: Expression;
}

/**
 * Represents an identifier expression.
 */
export interface Identifier extends ExpressionInterface {
  type: 'Identifier';
  name: string;
}

/**
 * Represents a literal expression.
 */
export interface Literal extends ExpressionInterface {
  type: 'Literal';
  value: unknown;
  raw: string;
}

/**
 * Represents an expression.
 */
export type Expression = ExpressionAssignment | ExpressionBinary | ExpressionUnary | Identifier | Literal;

export type ExpressionPrimary = Identifier | Literal;
