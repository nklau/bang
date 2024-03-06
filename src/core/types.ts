import { Expression, StatementExpression, Variable } from './core'

interface Literal extends Expression {}

export class BooleanLiteral implements Literal {
  constructor(public value: boolean) {}

  srcCode = () => new StringLiteral(this.value ? 'T' : 'F')
}

export class NumberLiteral implements Literal {
  constructor(public value: number) {}

  srcCode = () => new StringLiteral(String(this.value))
}

export class StringLiteral implements Literal {
  constructor(public value: string) {}

  srcCode = () => this
}

export class FormattedStringLiteral implements Literal {
  constructor(public value: Expression[]) {}

  srcCode = () =>
    new StringLiteral(
      this.value
        .map(expression => (expression instanceof StringLiteral ? expression.value : `{${expression.srcCode()}}`))
        .join('')
    )
}

export class ObjectLiteral implements Literal {
  constructor(public value: [StringLiteral, Expression][]) {}

  srcCode = () =>
    new StringLiteral(`{ ${this.value.map(([key, val]) => `${key.value}: ${val.srcCode()}`).join(', ')} }`)
}

export class ListLiteral implements Literal {
  constructor(public value: (Literal | Expression)[]) {}

  srcCode = () => new StringLiteral(`[${this.value.map(val => val.srcCode()).join(', ')}]`)
}

export class FunctionLiteral implements Literal {
  constructor(
    public parameters: Variable[],
    public statements: StatementExpression[]
  ) {}

  srcCode = () =>
    new StringLiteral(
      `(${this.parameters.map(parameter => parameter.srcCode()).join(', ')}) -> {\n\t${this.statements
        .map(statement => statement.srcCode())
        .join('\n\t')}\n}`
    )
}

export const nil = {
  srcCode: () => new StringLiteral('nil'),
}
