import { assignmentOperator } from './operators'
import { FunctionLiteral, ListLiteral, nil } from './types'

type AssignmentTarget = AccessExpression | IndexExpression | Variable

export interface Statement {}
export interface Expression {}
export interface BinaryExpression extends Expression {}

export enum Category {
  id = 'id',
  keyword = 'keyword',
  number = 'number',
  structure = 'structure',
  object = 'object',
  operator = 'operator',
}

export function error(message: string, line: number, column: number): never {
  throw new Error(`Line ${line ?? '-'}, Column ${column ?? '-'}: ${message}`)
}

export class Token {
  constructor(
    public category: Category,
    public lexeme: string,
    public line: number,
    public column: number
  ) {}
}

export class Block {
  constructor(public statements: Statement[]) {}
}

export class VariableAssignment implements Statement {
  constructor(
    public target: AssignmentTarget,
    public operator: string = assignmentOperator,
    public expression: Expression | object = nil
  ) {}
}

export class Variable {
  constructor(
    public id: string,
    public local: boolean,
    public readOnly: boolean
  ) {}
}

export class ReturnStatement implements Statement {
  constructor(public expression: Expression = nil) {}
}

export class BreakStatement implements Statement {}

export class IndexExpression implements Expression {
  constructor(
    public target: Variable,
    public leftIndex: Expression,
    public rightIndex: Expression
  ) {}
}

export class MatchExpression implements Expression {
  constructor(
    public condition: Expression,
    public cases: MatchCase[],
    public defaultCase: FunctionLiteral = new FunctionLiteral([], [new ReturnStatement()], '() -> nil')
  ) {}
}

export class MatchCase {
  constructor(
    public matchValue: ListLiteral,
    public functionValue: FunctionLiteral
  ) {}
}

export class AccessExpression implements BinaryExpression {
  constructor(
    public left: Variable,
    public right: Variable
  ) {}
}

export class TernaryExpression implements Expression {
  constructor(
    public condition: Expression,
    public trueBlock: FunctionLiteral,
    public falseBlock: FunctionLiteral
  ) {}
}
