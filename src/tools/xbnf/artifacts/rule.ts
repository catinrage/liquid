import { Grammar, GrammarProductionRule } from '$core/grammar';

import { Nodes } from '../lang/nodes';
import { xbnfParser } from '../lang/parser';

export class XbnfRule {
  public rules: GrammarProductionRule[] = [];
  public terminals: Set<string> = new Set();

  /**
   * The proxy is an entry point for the main rule, it preserves the action of the main rule.\
   * for example given the rule:\
   * S -> A | B & C\
   * the proxy called 'P' will be P -> S\
   * during the optimization phase, some rules will be removed and merged, the proxy is protected from optimization.
   */
  private _proxy: string = '';

  constructor(
    public readonly lhs: string,
    public readonly rhs: string,
    public action: (this: any[], ...data: any[]) => any,
  ) {
    try {
      const parsed = xbnfParser.parse(rhs);
      const { all, main } = this.parse(lhs, parsed, this.action);
      this.rules.push(...all);
      this._proxy = main.rhs[0];
      this._compress();
    } catch (error) {
      console.error(`Error while parsing the rule: ${lhs} -> ${rhs}`);
    }
  }

  /**
   * Generate a random symbol for the augmented grammar
   */
  private _generateRandomSymbol(): string {
    const length = 6;
    const charset = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
    return result;
  }

  /**
   * Removes and merges the rules to compress the rule-set
   * The final rule-set should be smaller and more optimized
   */
  private _compress(): void {
    /**
     * some left-hand-sides only have 1 definition
     * so we replace every occurrence of the LHS with the RHS
     * and remove the redundant rule
     *
     * @example :
     * X -> Y Z
     * if there is no other rule that has X as LHS, we should replace every occurrence of X with Y Z
     */
    const redundantRules = new Map<string, string[]>();
    for (const rule of this.rules.filter((r) => ![this.lhs, this._proxy].includes(r.lhs))) {
      if (this.rules.filter((r) => r.lhs === rule.lhs).length === 1) {
        redundantRules.set(rule.lhs, rule.rhs);
      }
    }
    for (const [redundant, replacement] of redundantRules) {
      for (const rule of this.rules) {
        rule.replace(redundant, replacement.join(' '));
      }
      // remove the placeholder rule
      this.rules = this.rules.filter((rule) => rule.lhs !== redundant);
    }

    /**
     * some left-hand-sides have the exact same definition,
     * we can keep one and remove the rest, and replace rest with the chosen LHS
     *
     * @example :
     * A -> P Q
     * B -> P Q
     * C -> P Q
     * in this case we keep the first rule (A) and replace B and C with A
     */

    // bring all the rules with the same RHS together
    const combinedRules: Record<string, string[]> = {};
    for (const rule of this.rules) {
      const key = rule.rhs.join(' ');
      if (combinedRules[key] === undefined) {
        combinedRules[key] = [rule.lhs];
      } else {
        combinedRules[key].push(rule.lhs);
      }
    }

    for (const combination of Object.values(combinedRules)) {
      const replacement = combination[0];
      const targets = combination.slice(1);
      for (const symbol of targets) {
        // if in every occurrence of the symbol, the replacement is also present we can remove the symbol
        const shouldRemove = Object.values(combinedRules).every((combination) => {
          return combination.includes(replacement) || !combination.includes(symbol);
        });
        if (!shouldRemove) continue;

        for (const rule of this.rules) {
          rule.replace(symbol, replacement);
        }
        // remove the placeholder rule
        this.rules = this.rules.filter((rule) => rule.lhs !== symbol);
      }
    }
  }

  public parse(
    lhs: string,
    entity: Nodes.Expression.Type,
    action: (...data: any[]) => any = (...data) => data.flat(),
  ) {
    const entry = new GrammarProductionRule(lhs, [], action);
    const subs: GrammarProductionRule[] = [];
    switch (true) {
      case entity instanceof Nodes.Expression.Terminal: {
        entry.rhs.push(`'${entity.literal}'`);
        this.terminals.add(entity.literal);
        break;
      }
      case entity instanceof Nodes.Expression.Symbol: {
        entry.rhs.push(entity.name);
        break;
      }
      case entity instanceof Nodes.Expression.Conjunction: {
        const ent = this._generateRandomSymbol();
        for (const component of entity.components) {
          const aug = this._generateRandomSymbol();
          const { all } = this.parse(aug, component);
          subs.push(...all);
          entry.rhs.push(aug);
        }
        break;
      }
      case entity instanceof Nodes.Expression.Disjunction: {
        const ent = this._generateRandomSymbol();
        entry.rhs.push(ent);
        for (const alternative of entity.alternatives) {
          const { all } = this.parse(ent, alternative);
          subs.push(...all);
        }
        break;
      }
      case entity instanceof Nodes.Expression.Group: {
        const ent = this._generateRandomSymbol();
        entry.rhs.push(ent);
        const { all } = this.parse(ent, entity.expression);
        subs.push(...all);
        break;
      }
      case entity instanceof Nodes.Expression.QuantifiedExpression:
        switch (true) {
          case entity.quantifier instanceof Nodes.Quantifier.ZeroOrMore: {
            /**
             * S -> A*
             * is equivalent to
             * S -> A S | ε
             */
            // generate a random LHS string
            const ent = this._generateRandomSymbol();
            entry.rhs.push(ent);
            const aug = this._generateRandomSymbol();
            subs.push(new GrammarProductionRule(ent, `${aug} ${ent}`, (aug, ent) => [aug, ent].flat()));
            subs.push(new GrammarProductionRule(ent, Grammar.Signs.ε, () => []));
            const { all } = this.parse(aug, entity.expression);
            subs.push(...all);
            break;
          }
          case entity.quantifier instanceof Nodes.Quantifier.AtLeastOne:
            /**
             * S -> A+
             * is equivalent to
             * S -> A S | A
             */
            const ent = this._generateRandomSymbol();
            entry.rhs.push(ent);
            const aug = this._generateRandomSymbol();
            subs.push(new GrammarProductionRule(ent, `${aug} ${ent}`, (aug, ent) => [aug, ...ent].flat()));
            subs.push(new GrammarProductionRule(ent, aug));
            const { all } = this.parse(aug, entity.expression);
            subs.push(...all);
            break;
          case entity.quantifier instanceof Nodes.Quantifier.AtMostOne: {
            /**
             * S -> A?
             * is equivalent to
             * S -> A | ε
             */
            const ent = this._generateRandomSymbol();
            entry.rhs.push(ent);
            const aug = this._generateRandomSymbol();
            subs.push(new GrammarProductionRule(ent, aug));
            subs.push(new GrammarProductionRule(ent, Grammar.Signs.ε));
            const { all } = this.parse(aug, entity.expression);
            subs.push(...all);
            break;
          }
          case entity.quantifier instanceof Nodes.Quantifier.Exact: {
            /**
             * S -> A{3}
             * is equivalent to
             * S -> A A A
             */
            const ent = this._generateRandomSymbol();
            entry.rhs.push(ent);
            const aug = this._generateRandomSymbol();
            const rules = [];
            for (let i = 0; i < (entity.quantifier as Nodes.Quantifier.Exact).iteration; i++) {
              rules.push(aug);
            }
            if (rules.length === 0) {
              rules.push(Grammar.Signs.ε);
            }
            subs.push(new GrammarProductionRule(ent, rules.join(' '), (...rules) => rules.flat()));
            const { all } = this.parse(aug, entity.expression);
            subs.push(...all);
            break;
          }
          case entity.quantifier instanceof Nodes.Quantifier.Range: {
            const { min, max } = entity.quantifier;
            if (min !== undefined && max !== undefined) {
              /**
               * S -> A{1, 3}
               * is equivalent to
               * S -> A A A | A A | A
               */
              const ent = this._generateRandomSymbol();
              entry.rhs.push(ent);
              const aug = this._generateRandomSymbol();
              subs.push(new GrammarProductionRule(ent, `${aug}`, (...data) => data.flat()));
              for (let i = min; i <= max; i++) {
                const { all } = this.parse(
                  aug,
                  new Nodes.Expression.QuantifiedExpression(entity.expression, new Nodes.Quantifier.Exact(i)),
                );
                subs.push(...all);
              }
            } else if (min !== undefined) {
              /**
               * S -> A{3,}
               * it means at least 3 times or more
               * is equivalent to
               * S -> B
               * B -> A A A C
               * C -> A C | ε
               */
              const ent = this._generateRandomSymbol();
              entry.rhs.push(ent);
              const aug1 = this._generateRandomSymbol();
              const aug2 = this._generateRandomSymbol();
              // it consists of 2 rules, aug1 and aug2
              subs.push(new GrammarProductionRule(ent, `${aug1} ${aug2}`, (...data) => data.flat()));
              // aug1 goes to exact min times
              const { all: all1 } = this.parse(
                aug1,
                new Nodes.Expression.QuantifiedExpression(entity.expression, new Nodes.Quantifier.Exact(min)),
              );
              subs.push(...all1);
              // aug2 goes to 0 or more times
              const { all: all2 } = this.parse(
                aug2,
                new Nodes.Expression.QuantifiedExpression(
                  entity.expression,
                  new Nodes.Quantifier.ZeroOrMore(),
                ),
              );
              subs.push(...all2);
            } else if (max !== undefined) {
              /**
               * S -> A{,3}
               * it means at most 3 times
               * is equivalent to
               * S -> B
               * B -> A A A | A A | A | ε
               */
              const ent = this._generateRandomSymbol();
              entry.rhs.push(ent);
              const aug = this._generateRandomSymbol();
              subs.push(new GrammarProductionRule(ent, `${aug}`, (...data) => data.flat()));
              for (let i = 0; i <= max; i++) {
                const { all } = this.parse(
                  aug,
                  new Nodes.Expression.QuantifiedExpression(entity.expression, new Nodes.Quantifier.Exact(i)),
                );
                subs.push(...all);
              }
            }
            break;
          }
        }
    }

    return {
      main: entry,
      subs: subs,
      all: [entry, ...subs],
    };
  }

  toString() {
    return `${this.lhs} -> ${this.rhs}`;
  }
}
