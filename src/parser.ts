import fs from 'fs'
import { Token } from './core'
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
  let token: Token = tokens[0]

  const at = (character: string) => {
    return token.lexeme === character
  }
}