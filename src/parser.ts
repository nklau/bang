import fs from 'fs'
import { Block, Statement, Token, error } from './core/core'
import { local } from './core/keywords'
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

  const at = (character: string | undefined) => {
    return token?.lexeme === character
  }

  const lookUntil = (character: string) => {
    return tokens.slice(0, tokens.findIndex(t => t.lexeme === character))
  }

  const match = (character: string | undefined, throws = false) => {
    if (!at(character) && throws) {
      if (throws) {
        error(`Expected '${character}' but got '${token?.lexeme}'`, token?.line ?? 0, token?.column ?? 0)
      }
    }

    if (!throws) {
      const atChar = at(character)
      if (atChar) next()
      return atChar
    }

    return token = tokens.shift()
  }

  const next = () => {
    return token = tokens.shift()
  }

  const parseBlock = () => {
    while (match('\n')) continue

    const statements: Statement[] = []
    while (tokens.length > 0) {
      statements.push(parseStatement())
    }

    return new Block(statements)
  }

  const parseStatement = (): Statement => {
    const statementLexemes = lookUntil('\n')
    let isLocal = false

    if (at(local)) {
      isLocal = true
      match(local)
    }
    
    throw new Error('unimplemented')
  }

  return parseBlock()
}