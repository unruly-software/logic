import type { Operator } from './Operator'
import { Rule } from './Rule'

/**
 * Represents a single evaluation of a tree of operators.
 */
export class Evaluation<Context = unknown> {
  constructor(
    public context: Context,
    private evaluatedRules: Map<Rule<Context>, Evaluation<Context>> = new Map(),
  ) {}

  wasSatisfied: boolean

  private issues: string[] = []

  addIssue(issue: string) {
    this.issues.push(issue)
  }

  getRuleIssues() {
    const structure: {
      [ruleName: string]: {
        result: boolean
        issues: string[]
      }
    } = {}

    const evaluatedRules = Array.from(this.evaluatedRules.entries())
    for (const [rule, evaluation] of evaluatedRules) {
      structure[rule.name] = {
        result: evaluation.wasSatisfied,
        issues: evaluation.issues,
      }
    }
    return structure
  }

  getFailedRuleIssues() {
    return Object.values(this.getRuleIssues())
      .map((v) => (v.result ? [] : v.issues))
      .flat()
  }

  protected static async start<Context>(
    root: Operator<Context>,
    context: Context,
  ): Promise<Evaluation<Context>> {
    const rootEvaluation = new Evaluation(context)
    await rootEvaluation.evaluate(root)
    return rootEvaluation
  }

  protected async evaluate(operator: Operator<Context>): Promise<boolean> {
    if (operator instanceof Rule) {
      if (this.evaluatedRules.has(operator)) {
        return this.evaluatedRules.get(operator).wasSatisfied
      }
      const subEvaluation = new Evaluation(this.context, this.evaluatedRules)
      const result = await operator['evaluate'](subEvaluation)
      subEvaluation.wasSatisfied = result
      this.evaluatedRules.set(operator, subEvaluation)
      return result
    }

    const result = await operator['evaluate'](this)
    this.wasSatisfied = result

    return result
  }

  toString() {
    return `Evaluation<${this.wasSatisfied}>`
  }

  toJSON() {
    return `Evaluation<${this.wasSatisfied}>`
  }
}
