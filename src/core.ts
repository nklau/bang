export enum Category {
  id = 'id',
  keyword = 'keyword',
  number = 'number',
  structure = 'structure',
  object = 'object',
  operator = 'operator',
}

export class Token {
  category: Category
  lexeme: string
  line: number
  column: number

  constructor(category: Category, lexeme: string, line: number, column: number) {
    this.category = category
    this.lexeme = lexeme
    this.line = line
    this.column = column
  }
}

export function error(message: string, line: number, column: number): never {
  throw new Error(`Line ${line ?? "-"}, Column ${column ?? "-"}: ${message}`)
}