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
    Object.assign(this, {category, lexeme, line, column})
  }
}

export class Block {
  statements: Statement[]

  constructor(statements: Statement[]) {
    this.statements = statements
  }
}

export class Statement { }

export class VariableDeclaration extends Statement {
  target: Variable
  expression: Expression

  constructor(target: Variable, expression: Expression | object = nil) {
    super()
    this.target = target
    this.expression = expression
  }
}

export class Variable { }

export class Expression { }

const nil = {}