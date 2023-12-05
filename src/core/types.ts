import { Expression, Statement, Variable } from './core'

interface Literal extends Expression {}

export class BooleanLiteral implements Literal {
  constructor(public value: boolean) {}
}

export class NumberLiteral implements Literal {
  constructor(public value: number) {}
}

export class ListLiteral implements Literal {
  constructor(public value: Array<Literal | Expression>) {}
}

export class FunctionLiteral implements Literal {
  constructor(public parameters: Variable[], public statements: Statement[], public sourceCode: string) {}
}