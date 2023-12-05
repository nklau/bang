import fs from 'fs'
import { nil } from './core/constants'
import {
  AccessExpression,
  Block,
  BreakStatement,
  Category,
  Expression,
  IndexExpression,
  MatchCase,
  MatchExpression,
  ReturnStatement,
  Statement,
  Token,
  Variable,
  VariableAssignment,
  error,
} from './core/core'
import {
  breakKeyword,
  caseKeyword,
  constKeyword,
  defaultKeyword,
  falseKeyword,
  infinityKeyword,
  localKeyword,
  matchKeyword,
  piKeyword,
  returnKeyword,
  trueKeyword,
} from './core/keywords'
import { BooleanLiteral, FunctionLiteral, NumberLiteral, ListLiteral } from './core/types'
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

  const matchUntil = (character: string, subtokens?: Token[]) => {
    const index = (subtokens ?? tokens).findIndex(t => t.lexeme === character)
    return index ? (subtokens ?? tokens).splice(0, index) : []
  }

  const match = (expected: string | undefined, throws = false) => {
    if (!at(expected) && throws) {
      error(`Expected '${expected}' but got '${token?.lexeme}'`, token?.line ?? 0, token?.column ?? 0)
    }

    return throws ? (token = tokens.shift()) : at(expected) ? next() : undefined
  }

  const next = () => {
    return (token = tokens.shift())
  }

  const contains = (tokens: Token[], character: string) => {
    return tokens.some(token => token.lexeme === character)
  }

  const parseBlock = () => {
    while (match('\n')) continue

    const statements: Statement[] = []
    while (tokens.length > 0) {
      statements.push(parseStatement())
      while (match('\n')) continue
    }

    return new Block(statements)
  }

  const parseStatement = (): Statement => {
    if (!token) {
      error('Expected statement', 0, 0)
    }

    const statementTypes = {
      [Category.id]: parseAssignment,
      [Category.keyword]: parseKeywordStatement,
      [Category.number]: parseReturnStatement,
      [Category.object]: parseReturnStatement,
      [Category.operator]: parseReturnStatement,
      [Category.structure]: parseReturnStatement,
    }

    return statementTypes[token.category]()
  }

  const parseAssignment = (isLocal = false, isConst = false): Statement => {
    const variable = parseAssignmentTarget(isLocal, isConst)

    let operator, expression
    if ((operator = match(Category.operator, isConst)?.lexeme)) {
      expression = parseExpression()
    }

    return new VariableAssignment(variable, operator, expression)
  }

  const parseAssignmentTarget = (isLocal: boolean, isConst: boolean): AccessExpression | IndexExpression | Variable => {
    const variable = new Variable(match(Category.id, true)!.lexeme, isLocal, isConst)

    const structure = match(Category.structure)
    if (structure) {
      if (isConst) {
        error(
          `Cannot make ${structure.lexeme === '[' ? 'list element' : 'object field'} constant`,
          structure.line,
          structure.column
        )
      }

      if (structure.lexeme === '.') {
        return new AccessExpression(variable, new Variable(match(Category.id, true)!.lexeme, false, false))
      } else if (structure.lexeme === '[') {
        const left = parseExpression(matchUntil(':')) ?? 0
        next()
        const right = parseExpression(matchUntil(']')) ?? Infinity
        next()

        return new IndexExpression(variable, left, right)
      }
    }

    return variable
  }

  const parseKeywordStatement = (): Statement => {
    return {
      [localKeyword]: () => parseAssignment(!!next(), !!match(constKeyword)),
      [constKeyword]: () => parseAssignment(false, !!next()),
      [returnKeyword]: () => {
        next()
        return parseReturnStatement(matchUntil('\n'))
      },
      [breakKeyword]: () => new BreakStatement(),
      [trueKeyword]: () => new BooleanLiteral(true),
      [falseKeyword]: () => new BooleanLiteral(false),
      [infinityKeyword]: () => new NumberLiteral(Infinity),
      [piKeyword]: () => new NumberLiteral(Math.PI),
      [matchKeyword]: () => {
        next()
        return parseMatchExpression(matchUntil('{'))
      },
      [caseKeyword]: () => {
        error(`'cs' keyword cannot be used outside of a 'mtch' expression`, token!.line, token!.column)
      },
      [defaultKeyword]: () => {
        error(`'dft' keyword cannot be used outside of a 'mtch' expression`, token!.line, token!.column)
      },
      'nil': () => new ReturnStatement(),
    }[token!.lexeme]!() // TODO replace the !
  }

  const parseReturnStatement = (expression?: Token[]): Statement => {
    return new ReturnStatement(parseExpression(expression))
  }

  const parseMatchExpression = (expression?: Token[]): Statement => {
    const openingBracket = match('{', true)
    if (!expression) {
      error(
        `Match expression requires a test expression following 'mtch'`,
        openingBracket!.line,
        openingBracket!.column
      )
    }

    const condition = parseExpression(expression)
    const matchCases: MatchCase[] = []

    let cs = match(caseKeyword, true)
    while (cs) {
      let caseTestCondition = matchUntil(':')
      const caseTestConditions = new ListLiteral([])

      while (contains(caseTestCondition, ',')) {
        caseTestConditions.value.push(parseExpression(matchUntil(',', caseTestCondition)))
      }

      const lastCaseTest = parseExpression(caseTestCondition)
      const colon = match(':', true)

      if (lastCaseTest === nil) {
        error(`Match expression requires a test expression following 'cs'`, colon!.line, colon!.column)
      }

      caseTestConditions.value.push(lastCaseTest)

      const openingCsBracket = match('{')
      const caseFunction = parseFunctionLiteral(matchUntil('}')) // TODO what if they don't use brackets
      if (openingCsBracket) {
        match('}', true)
      }

      matchCases.push(new MatchCase(caseTestConditions, caseFunction))

      cs = match(caseKeyword)
    }

    if (match(defaultKeyword)) {
      match(':', true)
      const openingDefaultBracket = match('{')
      const caseFunction = parseFunctionLiteral(matchUntil('}')) // TODO may not use brackets here
      if (openingDefaultBracket) {
        match('}', true)
      }

      return new MatchExpression(condition, matchCases, caseFunction)
    }

    return new MatchExpression(condition, matchCases)
  }

  const parseExpression = (expression?: Token[]): Expression | typeof nil => {
    if (!expression) return nil
    // TODO make sure to call next() or match() to remove from tokens
    throw new Error('unimplemented')
  }

  const parseFunctionLiteral = (expression?: Token[]): FunctionLiteral => {
    throw new Error('unimplemented')
  }

  return parseBlock()
}
