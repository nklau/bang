import fs from 'fs'
import { Category, Token, error } from './core'

export default function tokenizeFile() {
  if (process.argv.length < 3) {
    console.log(`Usage: ts-node ${process.argv[1]} <filename.bang>`)
    process.exit(1)
  }
  
  fs.readFile(process.argv[2], 'utf8', (err, data) => {
    if (err) {
      throw err
    }
  
    tokenize(data)
  })
}

const tokenize = (program: string) => {
  let lineNumber = 1
  return program.split(/\r?\n/).map(line => tokenizeLine([...line, "\n"], lineNumber++))
}

const tokenizeLine = (line: string[], lineNumber: number): Token[] => {
  const tokens: Token[] = []

  for (let i = 0; i < line.length;) {
    while (/[ \t]/.test(line[i])) i++

    // TODO how to account for multiline comment this way?
    // end of line or start of comment
    if (line[i] === '\n' || `${line[i]}${line[i + 1]}` === '//') break

    let category: Category
    let start = i
    let match

    if (match = /^[a-zA-Z_]\w*/.exec(line.join())) {
      category = Category.id
    } else if (match = /cst|locl|T|F|inf|pi|mtch|cs|dft|nil|brk|rtn/A.exec(line.join())) {
      category = Category.keyword
    } else {
      error(`Unexpected character: '${line[start]}'`, lineNumber, start)
    }
    
    i += match[0].length
    tokens.push(new Token(category, match[0], lineNumber, start + 1))
  }

  return tokens
}