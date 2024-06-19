export namespace Nodes {
  export namespace Quantifier {
    export class ZeroOrMore {}
    export class AtLeastOne {}
    export class AtMostOne {}
    export class Exact {
      constructor(public readonly iteration: number) {}
    }
    export class Range {
      constructor(public readonly min?: number, public readonly max?: number) {}
    }

    export type Type = ZeroOrMore | AtLeastOne | AtMostOne | Exact | Range;
  }
  export namespace Expression {
    /**
     * example: 'a'
     */
    export class Terminal {
      constructor(public readonly literal: string) {}
    }
    /**
     * example: A
     */
    export class Symbol {
      constructor(public readonly name: string) {}
    }
    /**
     * example: A & B & C
     */
    export class Conjunction {
      constructor(public readonly components: Expression.Type[]) {}
    }
    /**
     * example: A | B | C
     */
    export class Disjunction {
      constructor(public readonly alternatives: Expression.Type[]) {}
    }
    /**
     * example: (A | B) & (C | D)
     */
    export class Group {
      constructor(public readonly expression: Expression.Type) {}
    }
    /**
     * example: U* | U+ | U? | U{3} | U{3,} | U{,3} | U{3, 5}
     */
    export class QuantifiedExpression {
      constructor(public readonly expression: Expression.Type, public readonly quantifier: Quantifier.Type) {}
    }
    export type Type = Terminal | Symbol | Conjunction | Disjunction | Group | QuantifiedExpression;
  }
}
