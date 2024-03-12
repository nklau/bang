import { breakKeyword, returnKeyword } from './keywords'
import {
  addOperator,
  andOperator,
  assignmentOperator,
  decrementOperator,
  incrementOperator,
  negateOperator,
  orOperator,
  spreadOperator,
  subtractOperator,
} from './operators'
import { FunctionLiteral, ListLiteral, StringLiteral, nil } from './types'

export type AssignmentTarget = AccessExpression | IndexExpression | Variable

export interface StatementExpression {
  srcCode: () => StringLiteral
}
export interface Expression extends StatementExpression {}
export interface UnaryExpression extends Expression {
  operand: Expression
}
export interface BinaryExpression extends Expression {
  left: Expression
  right: Expression
}
export class NaryExpression implements Expression {
  constructor(public operands: (Expression | string)[]) {}

  srcCode = () =>
    new StringLiteral(
      this.operands.map(operand => (typeof operand === 'string' ? operand : operand.srcCode())).join(' ')
    )
}

export enum Category {
  id = 'id',
  keyword = 'keyword',
  number = 'number',
  structure = 'structure',
  object = 'object',
  operator = 'operator',
  whitespace = 'whitespace',
}

export function error(message: string, line: number, column: number): never {
  throw new Error(`Line ${line ?? '-'}, Column ${column ?? '-'}: ${message}`)
}

export class Token {
  constructor(
    public category: Category,
    public lexeme: string,
    public line: number,
    public column: number,
    public isFromSrcCode: boolean = true
  ) {}
}

export class Block {
  constructor(public statements: StatementExpression[]) {}
}

export class VariableAssignment implements StatementExpression {
  constructor(
    public target: AssignmentTarget,
    public operator: string = assignmentOperator,
    public expression: Expression = nil
  ) {}

  srcCode = () => new StringLiteral(`${this.target.srcCode()} ${this.operator} ${this.expression.srcCode()}`)
}

export class Variable implements Expression {
  constructor(
    public id: string,
    public local: boolean,
    public readOnly: boolean
  ) {}

  srcCode = () => new StringLiteral(this.id)
}

export class ReturnStatement implements StatementExpression {
  constructor(public expression: Expression = nil) {}

  srcCode = () => new StringLiteral(`${returnKeyword} ${this.expression.srcCode()}`)
}

export class BreakStatement implements StatementExpression {
  srcCode = () => new StringLiteral(breakKeyword)
}

export class IndexExpression implements Expression {
  constructor(
    public target: Expression,
    public leftIndex: Expression | null,
    public rightIndex: Expression | null
  ) {}

  srcCode = () =>
    new StringLiteral(
      `${this.target.srcCode()}[${this.leftIndex?.srcCode() ?? ''}:${this.rightIndex?.srcCode() ?? ''}]`
    )
}

export class MatchExpression implements Expression {
  constructor(
    public condition: Expression,
    public cases: MatchCase[],
    public defaultCase: FunctionLiteral = new FunctionLiteral([], [new ReturnStatement(nil)])
  ) {}

  srcCode = () => {
    throw new Error('unimplemented')
  }
}

export class MatchCase {
  constructor(
    public matchValue: ListLiteral,
    public functionValue: FunctionLiteral
  ) {}
}

export class NegativeExpression implements UnaryExpression {
  constructor(public operand: Expression) {}

  srcCode = () => new StringLiteral(`${subtractOperator}${this.operand.srcCode()}`)
}

export class NegationExpression implements UnaryExpression {
  constructor(public operand: Expression) {}

  srcCode = () => new StringLiteral(`${negateOperator}${this.operand.srcCode()}`)
}

export class SpreadExpression implements UnaryExpression {
  constructor(public operand: Expression) {}

  srcCode = () => new StringLiteral(`${spreadOperator}${this.operand.srcCode()}`)
}

export class PreIncrementExpression implements UnaryExpression {
  constructor(public operand: Expression) {}

  srcCode = () => new StringLiteral(`${incrementOperator}${this.operand.srcCode()}`)
}

export class PreDecrementExpression implements UnaryExpression {
  constructor(public operand: Expression) {}

  srcCode = () => new StringLiteral(`${decrementOperator}${this.operand.srcCode()}`)
}

export class PostIncrementExpression implements UnaryExpression {
  constructor(public operand: Expression) {}

  srcCode = () => new StringLiteral(`${this.operand.srcCode()}${incrementOperator}`)
}

export class PostDecrementExpression implements UnaryExpression {
  constructor(public operand: Expression) {}

  srcCode = () => new StringLiteral(`${this.operand.srcCode()}${decrementOperator}`)
}

export class CallExpression implements UnaryExpression {
  constructor(
    public operand: Expression,
    public args: Expression[]
  ) {}

  srcCode = () => new StringLiteral(`${this.operand.srcCode()}(${this.args.map(arg => arg.srcCode()).join(', ')})`)
}

export class AccessExpression implements BinaryExpression {
  constructor(
    public left: Expression,
    public right: Expression
  ) {}

  srcCode = () => new StringLiteral(`${this.left.srcCode()}.${this.right.srcCode()}`)
}

export class OrExpression implements BinaryExpression {
  constructor(
    public left: Expression,
    public right: Expression
  ) {}

  srcCode = () => new StringLiteral(`${this.left.srcCode()} ${orOperator} ${this.right.srcCode()}`)
}

export class AndExpression implements BinaryExpression {
  constructor(
    public left: Expression,
    public right: Expression
  ) {}

  srcCode = () => new StringLiteral(`${this.left.srcCode()} ${andOperator} ${this.right.srcCode()}`)
}

export class AdditiveExpression extends NaryExpression {}

export class ComparisonExpression extends NaryExpression {}

export class MultiplicativeExpression extends NaryExpression {}

export class ExponentialExpression extends NaryExpression {}

export class TernaryExpression implements Expression {
  constructor(
    public condition: Expression,
    public trueBlock: FunctionLiteral,
    public falseBlock: FunctionLiteral
  ) {}

  srcCode = () =>
    new StringLiteral(`(${this.condition.srcCode()}) ? ${this.trueBlock.srcCode()} : ${this.falseBlock.srcCode()}`)
}

export class ImmediateFunction implements Expression {
  constructor(public statements: StatementExpression[]) {}

  srcCode = () => new StringLiteral(`{\n\t${this.statements.map(statement => statement.srcCode()).join('\n\t')}\n}`)
}
