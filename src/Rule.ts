import { Evaluation } from './Evaluation'
import { Operator } from './Operator'

export abstract class Rule<Context> extends Operator<Context> {
  abstract get name(): string

  abstract satisfied(
    context: Context,
    evaluation: Evaluation<Context>,
  ): Promise<boolean>

  protected override async evaluate(
    evaluation: Evaluation<Context>,
  ): Promise<boolean> {
    return await this.satisfied(evaluation.context, evaluation)
  }

  static of<Context = unknown>(
    name: string,
    rule: (input: Context, evaluation: Evaluation<Context>) => Promise<boolean>,
  ): Rule<Context> {
    const Klass = class extends Rule<Context> {
      override get name(): string {
        return name
      }

      override async satisfied(
        context: Context,
        evaluation: Evaluation<Context>,
      ): Promise<boolean> {
        return await rule(context, evaluation)
      }
    }

    return new Klass()
  }

  static true = this.of('true', async () => true)

  static false = this.of('false', async () => false)
}
