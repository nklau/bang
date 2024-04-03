import { Expression, StatementExpression, Variable } from './core'

export interface Literal extends Expression {}

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

export const isBooleanLiteral = (expression: any): expression is BooleanLiteral => {
  return expression instanceof BooleanLiteral
}
// TODO

export class BooleanLiteral implements Literal {
  constructor(public value: boolean) {}

  static type = 'bool'

  srcCode = () => new StringLiteral(this.value ? 'T' : 'F')
}

export class NumberLiteral implements Literal {
  constructor(public value: number) {}

  static type = 'num'

  srcCode = () => new StringLiteral(String(this.value))
}

export class StringLiteral implements Literal {
  constructor(public value: string) {}

  static type = 'str'

  srcCode = () => this
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
}

export class ObjectLiteral implements Literal {
  constructor(public value: [StringLiteral, Expression][]) {}

  static type = 'obj'

  srcCode = () =>
    new StringLiteral(`{ ${this.value.map(([key, val]) => `${key.value}: ${val.srcCode()}`).join(', ')} }`)
}

export class ListLiteral implements Literal {
  constructor(public value: (Literal | Expression)[]) {}

  static type = 'list'

  srcCode = () => new StringLiteral(`[${this.value.map(val => val.srcCode()).join(', ')}]`)
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
}

export const nil = {
  type: 'nil',
  srcCode: () => new StringLiteral('nil'),
}
