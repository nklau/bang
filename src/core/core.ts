import { assignmentOperator } from './operators'

export interface Statement { }
export interface Expression { }
export interface BinaryExpression extends Expression { }

export enum Category {
  id = 'id',
  keyword = 'keyword',
  number = 'number',
  structure = 'structure',
  object = 'object',
  operator = 'operator',
}

export function error(message: string, line: number, column: number): never {
  throw new Error(`Line ${line ?? "-"}, Column ${column ?? "-"}: ${message}`)
}

export class Token {
  category!: Category
  lexeme!: string
  line!: number
  column!: number

  constructor(category: Category, lexeme: string, line: number, column: number) {
    Object.assign(this, { category, lexeme, line, column })
  }
}

export class Block {
  statements: Statement[]

  constructor(statements: Statement[]) {
    this.statements = statements
  }
}

export class VariableAssignment implements Statement {
  target: Variable
  operator: string
  expression: Expression

  constructor(target: Variable, operator: string = assignmentOperator, expression: Expression | object = nil) {
    this.target = target
    this.operator = operator
    this.expression = expression
  }
}

export class Variable {
  id!: string
  local!: boolean
  readOnly!: boolean

  constructor(id: string, local: boolean, readOnly: boolean) {
    Object.assign(this, { id, local, readOnly })
  }
}

const nil = {}