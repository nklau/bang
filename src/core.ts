export enum Category {
  id
}

export class Token {
  constructor(category: Category, lexeme: string, line: number, column: number) {
    Object.assign(this, { category, lexeme, line, column })
  }
}

export function error(message: string, line: number, column: number) {
  throw new Error(`Line ${line ?? "-"}, Column ${column ?? "-"}: ${message}`)
}