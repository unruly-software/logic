import { Evaluation } from './Evaluation'

type MergeContext<A, B> = A & B

type ContextParams<T> = unknown extends T ? [] : [T]

export abstract class Operator<Context = unknown> {
  abstract name: string

  protected abstract evaluate(evaluation: Evaluation<Context>): Promise<boolean>

  async isSatisfied(...args: ContextParams<Context>): Promise<boolean> {
    const evaluation = await Evaluation['start'](this, args[0] ?? null)
    return evaluation.wasSatisfied
  }

  explain(...args: ContextParams<Context>): Promise<Evaluation<Context>> {
    return Evaluation['start'](this, args[0] ?? null)
  }

  or<T>(rule: Operator<T>) {
    return new OrOperator<MergeContext<T, Context>>(this as any, rule as any)
  }

  orNot<T>(rule: Operator<T>) {
    return new OrOperator<MergeContext<T, Context>>(
      this as any,
      rule.notThis() as any,
    )
  }

  xor<T>(rule: Operator<T>) {
    return new XorOperator<MergeContext<T, Context>>(this as any, rule as any)
  }

  and<T>(rule: Operator<T>) {
    return new AndOperator<MergeContext<T, Context>>(this as any, rule as any)
  }

  andNot<T>(rule: Operator<T>) {
    return new AndOperator<MergeContext<T, Context>>(
      this as any,
      rule.notThis() as any,
    )
  }

  notThis<T>() {
    return new NotOperator<MergeContext<T, Context>>(this as any)
  }

  toJSON() {
    return this.name
  }

  toString() {
    return this.name
  }
}

export class OrOperator<Context> extends Operator<Context> {
  constructor(
    private left: Operator<Context>,
    private right: Operator<Context>,
  ) {
    super()
  }

  override get name() {
    return `(${this.left.name} or ${this.right.name})`
  }

  protected override async evaluate(
    evaluation: Evaluation<Context>,
  ): Promise<boolean> {
    const [left, right] = await Promise.all([
      evaluation['evaluate'](this.left),
      evaluation['evaluate'](this.right),
    ])
    return left || right
  }
}

export class AndOperator<Context> extends Operator<Context> {
  override get name() {
    return `(${this.left.name} and ${this.right.name})`
  }
  constructor(
    private left: Operator<Context>,
    private right: Operator<Context>,
  ) {
    super()
  }
  protected override async evaluate(
    evaluation: Evaluation<Context>,
  ): Promise<boolean> {
    const left = await evaluation['evaluate'](this.left)
    if (!left) {
      return false
    }
    return await evaluation['evaluate'](this.right)
  }
}

export class NotOperator<Context> extends Operator<Context> {
  override get name() {
    return `not ${this.left.name}`
  }

  constructor(private left: Operator<Context>) {
    super()
  }

  protected override async evaluate(
    evaluation: Evaluation<Context>,
  ): Promise<boolean> {
    return !(await evaluation['evaluate'](this.left))
  }
}

export class XorOperator<Context> extends Operator<Context> {
  override get name() {
    return `(${this.left.name} xor ${this.right.name})`
  }
  constructor(
    private left: Operator<Context>,
    private right: Operator<Context>,
  ) {
    super()
  }
  protected override async evaluate(
    evaluation: Evaluation<Context>,
  ): Promise<boolean> {
    const [left, right] = await Promise.all([
      evaluation['evaluate'](this.left),
      evaluation['evaluate'](this.right),
    ])
    return left !== right
  }
}
