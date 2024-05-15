export namespace Riz {
  export namespace Types {
    export type Expression =
      | Statement.StatementExpression
      | Expression.ExpressionAssignment
      | Expression.ExpressionBinary
      | Expression.ExpressionUnary
      | Expression.Literal
      | Expression.Identifier;
    export type Statement =
      | Statement.StatementExpression
      | Statement.StatementDeclaration
      | Statement.StatementOutput
      | Statement.IfStatement;

    export type Element = Types.Statement | Riz.Block;
  }

  abstract class Artifact {}

  export namespace Expression {
    export class ExpressionAssignment extends Artifact {
      constructor(
        public operator: string,
        public identifier: Riz.Expression.Identifier,
        public expression: Riz.Statement.StatementExpression,
      ) {
        super();
      }
    }

    export class ExpressionBinary extends Artifact {
      constructor(
        public operator: string,
        public lhs: Riz.Expression.ExpressionUnary,
        public rhs: Riz.Expression.ExpressionUnary,
      ) {
        super();
      }
    }

    export class ExpressionUnary extends Artifact {
      constructor(public operator: string, public argument: Riz.Statement.StatementExpression) {
        super();
      }
    }
    export class Literal extends Artifact {
      constructor(public value: number | string) {
        super();
      }
    }

    export class Identifier extends Artifact {
      constructor(public name: string) {
        super();
      }
    }
  }

  export namespace Statement {
    export class StatementExpression extends Artifact {
      constructor(public expression: Riz.Types.Expression) {
        super();
      }
    }
    export class StatementDeclaration extends Artifact {
      constructor(
        public identifier: Riz.Expression.Identifier,
        public init?: Riz.Statement.StatementExpression,
      ) {
        super();
      }
    }
    export class StatementOutput extends Artifact {
      constructor(public expression: Riz.Types.Expression) {
        super();
      }
    }
    export class IfStatement extends Artifact {
      constructor(public condition: Riz.Types.Expression, public consequent: Riz.Block) {
        super();
      }
    }
  }

  export class Block extends Artifact {
    constructor(public body: Riz.Types.Element[] = []) {
      super();
    }
  }

  export class Program extends Artifact {
    constructor(public body: Riz.Types.Element[] = []) {
      super();
    }
  }
}
