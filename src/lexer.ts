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

export const tokenize = (program: string) => {
  return program.split(/\r?\n/).map((line, lineNumber) => tokenizeLine([...line, "\n"], lineNumber))
}

const tokenizeLine = (line: string[], lineNumber: number): Token[] => {
  const tokens: Token[] = []
  let fullStr = line.join('')

  for (let i = 0; i < line.length;) {
    while (/^[ \t]/.test(line[i])) i++

    // TODO how to account for multiline comment this way?
    // end of line or start of comment
    if (line[i] === '\n' || `${line[i]}${line[i + 1]}` === '//') break

    let category: Category
    let match
    let str = fullStr.slice(i)

    if (match = /^(?:cst|locl|T|F|inf|pi|mtch|cs|dft|nil|brk|rtn)/.exec(str)) { // TODO should nil/bools be their own tokens?
      category = Category.keyword
    } else if (match = /^[a-zA-Z_]\w*/.exec(str)) {
      category = Category.id
    } else if (match = /^\d*\.?\d+/.exec(str)) {
      category = Category.number
    } else if (match = /^["'{}[\](),?:$\\]|^->/.exec(str)) { // /^(["'])(?:\\\1|(?!\1).)*\1/
      category = Category.structure
    } else if (match = /^(?:\+\+|--|&&|\|\||[=!<>]=|[.@!-^*/%+-<>=])/.exec(str)) {
      category = Category.operator
    } else {
      error(`Unexpected character: '${line[i]}'`, lineNumber + 1, i)
    }

    tokens.push(new Token(category, match[0], lineNumber + 1, i + 1))
    i += match[0].length
  }

  return tokens
}