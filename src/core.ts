export enum Category {
  id
}

export class Token {
  constructor(category: string, lexeme: string, line: number, column: number) {
    Object.assign(this, { category, lexeme, line, column })
  }
}