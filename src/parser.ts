import fs from 'fs'
import { Block, Statement, Token, error } from './core'
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

  const at = (character: string) => {
    return token?.lexeme === character
  }

  const lookUntil = (character: string) => {
    return tokens.slice(0, tokens.findIndex(t => t.lexeme === character))
  }

  const match = (character: string | undefined) => {
    if (character && !at(character)) {
      error(`Expected '${character}' but got '${token?.lexeme}'`, token?.line ?? 0, token?.column ?? 0)
    }

    return token = tokens.shift()
  }

  const next = () => {
    return token = tokens.shift()
  }

  const parseBlock = () => {
    while (at('\n')) next()

    const statements: Statement[] = []
    while (tokens.length > 0) {
      statements.push(parseStatement())
    }

    return new Block(statements)
  }

  const parseStatement = (): Statement => {
    return new Statement()
  }

  return parseBlock()
}