export enum Category {
  id = 'id',
  keyword = 'keyword',
  number = 'number',
  structure = 'structure',
  object = 'object',
  operator = 'operator',
}

export class Token {
  constructor(category: Category, lexeme: string, line: number, column: number) {
    Object.assign(this, { category, lexeme, line, column })
  }
}

export function error(message: string, line: number, column: number): never {
  throw new Error(`Line ${line ?? "-"}, Column ${column ?? "-"}: ${message}`)
}