import fs from 'fs'
import { Block, Category, Statement, Token, error } from './core/core'
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
    return tokens.slice(0, tokens.findIndex(t => t.lexeme === character))
  }

  const match = (expected: string | undefined, throws = true) => {
    if (!at(expected) && throws) {
      error(`Expected '${expected}' but got '${token?.lexeme}'`, token?.line ?? 0, token?.column ?? 0)
    }

    return throws ? token = tokens.shift() : at(expected) ? next() : undefined
  }

  const next = () => {
    return token = tokens.shift()
  }

  const parseBlock = () => {
    while (match('\n'), false) continue

    const statements: Statement[] = []
    while (tokens.length > 0) {
      statements.push(parseStatement())
    }

    return new Block(statements)
  }

  const parseStatement = (): Statement => {
    const statementLexemes = lookUntil('\n')

    let isLocal = !!match(localKeyword, false)
    let isConst = !!match(constKeyword, false)

    const id = match(Category.id)
    const operator = match(Category.operator)
    
    throw new Error('unimplemented')
  }

  return parseBlock()
}