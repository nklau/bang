import fs from 'fs'
import { Token, error } from './core'
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
  const at = (character: string) => {
    return tokens[0]?.lexeme === character
  }

  const match = (character: string | undefined) => {
    if (character && !at(character)) {
      error(`Expected '${character}' but got '${tokens[0]?.lexeme}'`, tokens[0]?.line, tokens[0]?.column)
    }

    return tokens.shift()
  }
}