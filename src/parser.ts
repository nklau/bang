import fs from 'fs'
import {
  AccessExpression,
  Block,
  Category,
  Expression,
  IndexExpression,
  Statement,
  Token,
  Variable,
  VariableAssignment,
  error,
} from './core/core'
import { constKeyword, localKeyword } from './core/keywords'
import { tokenize } from './lexer'

export default function parseFile() {
  if (process.argv.length < 3) {
    console.log(`Usage: ts-node ${process.argv[1]} <filename.bang>`)
    process.exit(1)
  }

  fs.readFile(process.argv[2], 'utf8', (err, data) => {
    if (err) {
      throw err
    }

    parse(tokenize(data))
  })
}

export const parse = (tokens: Token[]) => {
  let token: Token | undefined = tokens[0]

  const at = (expected: string | undefined) => {
    return token?.category === expected || token?.lexeme === expected
  }

  const lookUntil = (character: string) => {
    const index = tokens.findIndex(t => t.lexeme === character)
    return index ? tokens.slice(0, index) : []
  }

  const match = (expected: string | undefined, throws = true) => {
    if (!at(expected) && throws) {
      error(`Expected '${expected}' but got '${token?.lexeme}'`, token?.line ?? 0, token?.column ?? 0)
    }

    return throws ? (token = tokens.shift()) : at(expected) ? next() : undefined
  }

  const next = () => {
    return (token = tokens.shift())
  }

  const parseBlock = () => {
    while ((match('\n'), false)) continue

    const statements: Statement[] = []
    while (tokens.length > 0) {
      statements.push(parseStatement())
    }

    return new Block(statements)
  }

  const parseStatement = (): Statement => {
    if (!token) {
      error('Expected statement', 0, 0)
    }

    const statementTypes = {
      [Category.id]: parseAssignment,
      [Category.keyword]: parseAssignment,
      [Category.number]: parseReturnStatement,
      [Category.object]: parseReturnStatement,
      [Category.operator]: parseReturnStatement,
      [Category.structure]: parseReturnStatement,
    }

    return statementTypes[token.category]()
  }

  const parseAssignment = (): Statement => {
    let isLocal = !!match(localKeyword, false)
    let isConst = !!match(constKeyword, false)

    const variable = parseAssignmentTarget(isLocal, isConst)

    let operator, expression
    if ((operator = match(Category.operator, isConst)?.lexeme)) {
      expression = parseExpression()
    }

    return new VariableAssignment(variable, operator, expression)
  }

  const parseAssignmentTarget = (isLocal = false, isConst = false): AccessExpression | IndexExpression | Variable => {
    const variable = new Variable(match(Category.id)!.lexeme, isLocal, isConst)

    const structure = match(Category.structure, false)
    if (structure) {
      if (isConst) {
        error(
          `Cannot make ${structure.lexeme === '[' ? 'list element' : 'object field'} constant`,
          structure.line,
          structure.column
        )
      }

      if (structure.lexeme === '.') {
        return new AccessExpression(variable, new Variable(match(Category.id)!.lexeme, false, false))
      } else if (structure.lexeme === '[') {
        return new IndexExpression(
          variable,
          parseExpression(lookUntil(':')) ?? 0,
          parseExpression(lookUntil(']')) ?? Infinity
        )
      }
    }

    return variable
  }

  const parseReturnStatement = (): Statement => {
    throw new Error('unimplemented')
  }

  const parseExpression = (expression?: Token[]): Expression | undefined => {
    if (!expression) return
    // TODO make sure to call next() or match() to remove from tokens
    throw new Error('unimplemented')
  }

  return parseBlock()
}
