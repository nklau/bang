import { isEqual } from '../interpreter'
import { Expression, StatementExpression, Variable } from './core'

export interface Literal extends Expression {
  bool: BooleanLiteral
}

export const isLiteral = (expression: any): expression is Literal => {
  return (
    expression instanceof BooleanLiteral ||
    expression instanceof NumberLiteral ||
    expression instanceof StringLiteral ||
    expression instanceof FormattedStringLiteral ||
    expression instanceof ObjectLiteral ||
    expression instanceof ListLiteral ||
    expression instanceof FunctionLiteral
  )
}

export class BooleanLiteral implements Literal {
  constructor(public value: boolean) {}

  static type = 'bool'

  srcCode = () => new StringLiteral(this.value ? 'T' : 'F')

  not = (): BooleanLiteral => {
    return new BooleanLiteral(!this.value)
  }

  get bool() {
    return this
  }
}

export class NumberLiteral implements Literal {
  constructor(public value: number) {}

  static type = 'num'

  srcCode = () => new StringLiteral(String(this.value))

  get bool() {
    return new BooleanLiteral(this.value !== 0)
  }
}

export class StringLiteral implements Literal {
  constructor(public value: string) {}

  static type = 'str'

  srcCode = () => this

  get bool() {
    return new BooleanLiteral(this.value.length > 0)
  }
}

export class FormattedStringLiteral implements Literal {
  constructor(public value: Expression[]) {}

  static type = 'str'

  srcCode = () =>
    new StringLiteral(
      this.value
        .map(expression => (expression instanceof StringLiteral ? expression.value : `{${expression.srcCode()}}`))
        .join('')
    )

  get bool() {
    return new BooleanLiteral(this.value.length > 0)
  }
}

export class ObjectLiteral implements Literal {
  constructor(public value: [StringLiteral, Expression][]) {}

  static type = 'obj'

  srcCode = () =>
    new StringLiteral(`{ ${this.value.map(([key, val]) => `${key.value}: ${val.srcCode()}`).join(', ')} }`)

  get bool() {
    return new BooleanLiteral(this.value.length > 0)
  }
}

export class ListLiteral implements Literal {
  constructor(public value: (Literal | Expression)[]) {}

  static type = 'list'

  srcCode = () => new StringLiteral(`[${this.value.map(val => val.srcCode()).join(', ')}]`)

  get = (index: NumberLiteral): Expression => {
    return this.value[index.value] ?? nil
  }

  idxOf = (expression: Expression): NumberLiteral => {
    return new NumberLiteral(this.value.findIndex(e => isEqual(e, expression)))
  }

  has = (expression: Expression): BooleanLiteral => {
    return new BooleanLiteral(this.idxOf(expression).value > -1)
  }

  delIdx = (index: NumberLiteral): BooleanLiteral => {
    if (index.value > -1 && index.value < this.value.length) {
      this.value.splice(index.value, 1)
      return new BooleanLiteral(true)
    }

    return new BooleanLiteral(false)
  }

  del = (expression: Expression): BooleanLiteral => {
    return this.delIdx(this.idxOf(expression))
  }

  prepend = (expression: Expression): void => {
    this.value.unshift(expression)
  }

  add = (expression: Expression): void => {
    this.value.push(expression)
  }

  flat = (): ListLiteral => {
    return new ListLiteral(
      this.value.reduce((acc: Expression[], expression) => {
        if (expression instanceof ListLiteral) {
          expression.value.forEach(e => acc.push(e))
        } else {
          acc.push(expression)
        }
        return acc
      }, [])
    )
  }

  get bool() {
    return new BooleanLiteral(this.value.length > 0)
  }
}

export class FunctionLiteral implements Literal {
  constructor(
    public parameters: Variable[],
    public statements: StatementExpression[]
  ) {}

  static type = 'func'

  srcCode = () =>
    new StringLiteral(
      `(${this.parameters.map(parameter => parameter.srcCode()).join(', ')}) -> {\n\t${this.statements
        .map(statement => statement.srcCode())
        .join('\n\t')}\n}`
    )

  get bool() {
    return new BooleanLiteral(this.parameters.length > 0 && this.statements.length > 0)
  }
}

export const nil = {
  type: 'nil',
  srcCode: () => new StringLiteral('nil'),
  bool: () => new BooleanLiteral(false),
}

export const inf = new NumberLiteral(Infinity)
