import fs from 'fs'
import { Category, Token, error } from './core/core'
import util from 'util'

export default function tokenizeFile(fileName: string) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      throw err
    }

    console.log('Lexer output:')

    for (const token of tokenize(data)) {
      console.log(`${util.inspect(token, { colors: true, breakLength: Infinity })},`)
    }
  })
}

export const tokenize = (program: string) => {
  let flags = { inComment: false }
  return program.split(/\r?\n/).flatMap((line, lineNumber) => tokenizeLine([...line, '\n'], lineNumber, flags))
}

const tokenizeLine = (line: string[], lineNumber: number, flags: { inComment: boolean }): Token[] => {
  const tokens: Token[] = []
  let fullStr = line.join('')

  for (let i = 0; i < line.length; ) {
    while (/^[ \t]/.test(line[i])) {
      tokens.push(new Token(Category.whitespace, line[i], lineNumber + 1, i + 1))
      i++
    }
    let match

    if (`${line[i]}${line[i + 1]}` === '/*') {
      i += 2
      flags.inComment = true
    }

    if (flags.inComment && (match = /^.*\*\//.exec(fullStr.slice(i)))) {
      i += match[0].length
      flags.inComment = false
    }

    if (`${line[i]}${line[i + 1]}` === '//' || flags.inComment) break
    if (line[i] === '\n') {
      tokens.push(new Token(Category.whitespace, line[i], lineNumber + 1, i + 1))
      return tokens
    }

    let category: Category
    let str = fullStr.slice(i)

    if ((match = /^(?:cst|locl|T|F|inf|pi|mtch|cs|dft|nil|brk|rtn)/.exec(str))) {
      category = Category.keyword
    } else if ((match = /^[a-zA-Z_]\w*/.exec(str))) {
      category = Category.id
    } else if ((match = /^\d*\.?\d+/.exec(str))) {
      category = Category.number
    } else if ((match = /^["'{}[\](),?:$\\]|^->/.exec(str))) {
      category = Category.structure
    } else if ((match = /^(?:\+\+|--|&&|\|\||[=!<>]=|[.@!-^*/%+-<>=])=?/.exec(str))) {
      category = Category.operator
    } else {
      error(`Unexpected character: '${line[i]}'`, lineNumber + 1, i)
    }

    tokens.push(new Token(category, match[0], lineNumber + 1, i + 1))
    i += match[0].length
  }

  return tokens
}
