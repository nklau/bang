import fs from 'fs'
import { falseyFunction } from './core/constants'
import {
  AccessExpression,
  AdditiveExpression,
  AndExpression,
  BinaryExpression,
  Block,
  BreakStatement,
  CallExpression,
  Category,
  ComparisonExpression,
  ExponentialExpression,
  Expression,
  ImmediateFunction,
  IndexExpression,
  MatchCase,
  MatchExpression,
  MultiplicativeExpression,
  NaryExpression,
  NegationExpression,
  NegativeExpression,
  OrExpression,
  PostDecrementExpression,
  PostIncrementExpression,
  PreDecrementExpression,
  PreIncrementExpression,
  ReturnStatement,
  SpreadExpression,
  Statement,
  TernaryExpression,
  Token,
  Variable,
  VariableAssignment,
  error,
} from './core/core'
import {
  andOperator,
  equalityOperators,
  orOperator,
  additiveOperators,
  multiplicativeOperators,
  exponentialOperator,
  subtractOperator,
  negateOperator,
  spreadOperator,
  incrementOperator,
  decrementOperator,
} from './core/operators'
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
import {
  BooleanLiteral,
  FunctionLiteral,
  NumberLiteral,
  StringLiteral,
  FormattedStringLiteral,
  ObjectLiteral,
  ListLiteral,
  nil,
} from './core/types'
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

    console.log('Parser output:')
    console.dir(parse(tokenize(data)), { depth: null })
  })
}

export const parse = (tokens: Token[]) => {
  let token: Token | undefined = tokens[0]
  let sourceCode: string[] = []

  const at = (expected: string | undefined) => {
    return token?.category === expected || token?.lexeme === expected
  }

  const atAny = (of: string[]) => {
    return of.some(expected => token?.category === expected || token?.lexeme === expected)
  }

  const lookUntil = (character: string) => {
    const index = tokens.findIndex(t => t.lexeme === character)
    return index ? tokens.slice(0, index) : []
  }

  const matchUntil = (character: string, subtokens?: Token[]) => {
    const index = (subtokens ?? tokens).findIndex(t => t.lexeme === character)
    return (subtokens ?? tokens).splice(0, index)
  }

  const match = (expected: string | undefined, throws = false) => {
    if (!at(expected) && throws) {
      error(`Expected '${expected}' but got '${token?.lexeme}'`, token?.line ?? 0, token?.column ?? 0)
    }

    return throws || at(expected) ? next() : undefined
  }

  const next = () => {
    const prevToken = tokens.shift()
    token = tokens[0]
    sourceCode.push(token?.lexeme ?? '')
    return prevToken
  }

  const skipWhitespace = (skipNewLines: boolean = true) => {
    while (token?.category === Category.whitespace && (skipNewLines || token?.lexeme !== '\n')) {
      next()
    }
  }

  const prependToTokens = (...toPrepend: Token[]) => {
    tokens.unshift(...toPrepend)
    token = tokens[0]
  }

  const contains = (tokens: Token[], character: string) => {
    return tokens.some(token => token.lexeme === character)
  }

  const callFailable = (failable: (...args: any[]) => Statement, backup: (...args: any[]) => Statement): Statement => {
    try {
      return failable()
    } catch {
      return backup()
    }
  }

  const parseBlock = () => {
    skipWhitespace()

    const statements: Statement[] = []
    while (tokens.length > 0) {
      statements.push(parseStatement())
      skipWhitespace()
    }

    return new Block(statements)
  }

  const parseStatement = (): Statement => {
    if (!token) {
      error('Expected statement', 0, 0)
    }

    const statementTypes = {
      [Category.id]: parseAssignment, // this could also be a return
      [Category.keyword]: parseKeywordStatement,
      [Category.number]: parseReturnStatement,
      [Category.object]: parseReturnStatement,
      [Category.operator]: parseReturnStatement,
      [Category.structure]: parseLiteralExpression, // TODO should this be a return?
      [Category.whitespace]: () => error(`Unexpected whitespace`, token?.line ?? 0, token?.column ?? 0),
    }

    skipWhitespace()
    return statementTypes[token.category]()
  }

  const parseAssignment = (isLocal = false, isConst = false): Statement => {
    const variable = parseAssignmentTarget(isLocal, isConst)

    skipWhitespace()

    let operator, expression
    if ((operator = match(Category.operator, isConst)?.lexeme)) {
      skipWhitespace()
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
        return new AccessExpression(variable, match(Category.id, true)!.lexeme)
      } else if (structure.lexeme === '[') {
        const left = parseExpression(matchUntil(':')) ?? 0
        next()
        skipWhitespace()
        const right = parseExpression(matchUntil(']')) ?? Infinity
        next()

        return new IndexExpression(variable, left, right)
      }
    }
    // think this might also catch x -> x?
    // TODO check for function calls () and repeating . or [] ops

    return variable
  }

  const parseKeywordStatement = (): Statement => {
    return {
      [localKeyword]: () => parseAssignment(!!next(), !!match(constKeyword)),
      [constKeyword]: () => parseAssignment(false, !!next()),
      [returnKeyword]: () => {
        next()
        skipWhitespace(false)
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
      nil: () => new ReturnStatement(),
    }[token!.lexeme]!()
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

    skipWhitespace()

    const condition = parseExpression(expression)
    const matchCases: MatchCase[] = []

    skipWhitespace()

    let cs = match(caseKeyword, true)
    while (cs) {
      let caseTestCondition = matchUntil(':')
      const caseTestConditions = new ListLiteral([])

      while (contains(caseTestCondition, ',')) {
        skipWhitespace()
        caseTestConditions.value.push(parseExpression(matchUntil(',', caseTestCondition)))
      }

      skipWhitespace()
      const lastCaseTest = parseExpression(caseTestCondition)
      skipWhitespace()
      const colon = match(':', true)

      if (lastCaseTest === nil) {
        error(`Match expression requires a test expression following 'cs'`, colon!.line, colon!.column)
      }

      caseTestConditions.value.push(lastCaseTest)

      skipWhitespace()
      const openingCsBracket = match('{')
      skipWhitespace()
      const caseFunction = parseFunctionLiteral(matchUntil('}')) // TODO what if they don't use brackets
      if (openingCsBracket) {
        skipWhitespace()
        match('}', true)
      }

      matchCases.push(new MatchCase(caseTestConditions, caseFunction))

      skipWhitespace()
      cs = match(caseKeyword)
    }

    if (match(defaultKeyword)) {
      skipWhitespace()
      match(':', true)
      skipWhitespace()
      const openingDefaultBracket = match('{')
      skipWhitespace()
      const caseFunction = parseFunctionLiteral(matchUntil('}')) // TODO may not use brackets here
      if (openingDefaultBracket) {
        skipWhitespace()
        match('}', true)
      }

      return new MatchExpression(condition, matchCases, caseFunction)
    }

    return new MatchExpression(condition, matchCases)
  }

  const parseExpression = (expression?: Token[]): Expression | typeof nil => {
    if (expression) {
      prependToTokens(...expression)
    }

    skipWhitespace()

    const left = parseCompareExpression()
    const trueBlock: Statement[] = []
    let trueBlockSourceCode: string[] = []
    const falseBlock = []
    let falseBlockSourceCode: string[] = []

    skipWhitespace()
    sourceCode = trueBlockSourceCode
    while (match('?') && !at(':')) {
      skipWhitespace()
      trueBlock.push(callFailable(parseImmediateFunction, parseStatement))
    }

    skipWhitespace()
    sourceCode = falseBlockSourceCode
    while (match(':')) {
      skipWhitespace()
      falseBlock.push(callFailable(parseImmediateFunction, parseStatement))
    }

    let falseFunction = falseyFunction
    if (falseBlock.length > 0) {
      falseFunction = new FunctionLiteral([], falseBlock, falseBlockSourceCode.join(''))
    }

    return trueBlock.length > 0
      ? new TernaryExpression(left, new FunctionLiteral([], trueBlock, trueBlockSourceCode.join('')), falseFunction)
      : left
  }

  const parseBinaryExpression = (
    parseInnerExpression: () => Expression,
    operator: string,
    expressionType: { new (left: Expression, right: Expression): BinaryExpression }
  ): Expression => {
    let left = parseInnerExpression()

    skipWhitespace()
    while (match(operator)) {
      skipWhitespace()
      const right = parseInnerExpression()
      left = new expressionType(left, right)
    }

    return left
  }

  const parseNaryExpression = (
    parseInnerExpression: () => Expression,
    operators: string[],
    expressionType: { new (operands: (Expression | string)[]): NaryExpression }
  ): Expression => {
    const operands: (Expression | string)[] = [parseInnerExpression()]
    skipWhitespace()

    while (atAny(operators)) {
      skipWhitespace()
      const operator = match(Category.operator, true)!.lexeme
      skipWhitespace()
      operands.push(operator, parseInnerExpression())
    }

    return operands.length > 1 ? new expressionType(operands) : operands[0]
  }

  const parseImmediateFunction = (): ImmediateFunction => {
    throw new Error('unimplemented')
  }

  const parseCompareExpression = (): Expression => {
    return parseNaryExpression(parseOrExpression, equalityOperators, ComparisonExpression)
  }

  const parseOrExpression = (): Expression => {
    return parseBinaryExpression(parseAndExpression, orOperator, OrExpression)
  }

  const parseAndExpression = (): Expression => {
    return parseBinaryExpression(parseAdditiveExpression, andOperator, AndExpression)
  }

  const parseAdditiveExpression = (): Expression => {
    return parseNaryExpression(parseMultiplicativeExpression, additiveOperators, AdditiveExpression)
  }

  const parseMultiplicativeExpression = (): Expression => {
    return parseNaryExpression(parseExponentialExpression, multiplicativeOperators, MultiplicativeExpression)
  }

  const parseExponentialExpression = (): Expression => {
    return parseNaryExpression(parseNegativeOrSpreadExpression, [exponentialOperator], ExponentialExpression)
  }

  const parseNegativeOrSpreadExpression = (): Expression => {
    let expression

    if (match(subtractOperator)) {
      skipWhitespace()
      expression = new NegativeExpression(parseNegativeOrSpreadExpression())
    } else if (match(negateOperator)) {
      skipWhitespace()
      expression = new NegationExpression(parseNegativeOrSpreadExpression())
    } else if (match(spreadOperator)) {
      skipWhitespace()
      expression = new SpreadExpression(parseNegativeOrSpreadExpression())
    }

    return expression ?? parseIncrementDecrementExpression()
  }

  const parseIncrementDecrementExpression = (): Expression => {
    let expression

    if (match(incrementOperator)) {
      skipWhitespace()
      expression = new PreIncrementExpression(parseCallOrSelectExpression())
    } else if (match(decrementOperator)) {
      skipWhitespace()
      expression = new PreDecrementExpression(parseCallOrSelectExpression())
    } else {
      expression = parseCallOrSelectExpression()

      if (match(incrementOperator)) {
        skipWhitespace()
        expression = new PostIncrementExpression(expression)
      } else if (match(decrementOperator)) {
        skipWhitespace()
        expression = new PostDecrementExpression(expression)
      }
    }

    return expression
  }

  const parseCallOrSelectExpression = (): Expression => {
    let expression = parseLiteralExpression()
    skipWhitespace()

    while (at('(') || at('[') || at('.')) {
      const operator = next()!.lexeme
      skipWhitespace()

      if (operator === '(') {
        const args: Expression[] = []

        while (!at(')')) {
          args.push(parseStatement())
          skipWhitespace()
        }

        match(')', true)
        expression = new CallExpression(expression, args)
      } else if (operator === '[') {
        if (match(':')) {
          skipWhitespace()
          let rightIndex

          if (match(']')) {
            skipWhitespace()
            rightIndex = Infinity
          } else {
            skipWhitespace()
            rightIndex = parseStatement()
            skipWhitespace()
            match(']', true)
          }

          expression = new IndexExpression(expression, 0, rightIndex)
        } else {
          const leftIndex = parseStatement()
          skipWhitespace()
          let rightIndex = null

          if (match(':')) {
            skipWhitespace()
            if (match(']')) {
              rightIndex = Infinity
            } else {
              rightIndex = parseStatement()
              skipWhitespace()
              match(']', true)
            }
          }

          expression = new IndexExpression(expression, leftIndex, rightIndex)
        }
      } else if (operator === '.') {
        const selector = match(Category.id, true)!.lexeme
        expression = new AccessExpression(expression, selector)
      }
      skipWhitespace()
    }

    return expression ?? parseLiteralExpression()
  }

  const parseLiteralExpression = (): Expression => {
    switch (token?.category) {
      case Category.structure: {
        // structure can be: '"$[]{}\(),?: ->
        switch (token?.lexeme) {
          case '"': 
          case "'": {
            return parseStringLiteral()
          }
          case '$': {
            return parseFormattedStringLiteral()
          }
          case '[': {
            return parseListLiteral()
          }
          case '{': {
            return callFailable(parseObjectLiteral, parseImmediateFunction)
          }
          case '(': {
            next()
            skipWhitespace()
            if (at(')')) {
              error(`Unexpected token )`, token?.line, token?.column)
            }

            const exp = parseStatement()

            skipWhitespace()
            match(')', true)

            return exp
          }
          default: {
            error(`Unexpected token ${token?.lexeme}`, token?.line, token?.column)
          }
        }

        // throw new Error('unimplemented object, list, immediate function, or function literal parsing')
      }
      case Category.number: {
        return parseNumberLiteral()
      }
      case Category.id: {
        return parseAssignmentTarget(false, false)
      }

    }
    // TODO: what if I just try/catch every single one
    // string (structure with ids inside)
    // number
    // object
    // immediate function
    // list
    // function
    // id
    // match??
    // parenthesized exp??
    throw new Error(`unexpected literal expression ${token?.category}`)
  }

  const parseNumberLiteral = (): NumberLiteral => {
    return new NumberLiteral(+match(Category.number, true)!.lexeme)
  }

  const parseFormattedStringLiteral = (): FormattedStringLiteral => {
    match('$', true)
    if (!atAny(["'", '"'])) {
      match("'", true)
    }

    let stringValue = []
    const quoteType = match(Category.structure, true)?.lexeme

    while (!at(quoteType)) {
      if (at('{')) {
        stringValue.push(parseExpression(matchUntil('}')))
      }
      stringValue.push(new StringLiteral(next()?.lexeme ?? ''))
    }

    match(quoteType, true)
    return new FormattedStringLiteral(stringValue)
  }

  const parseStringLiteral = (): StringLiteral => {
    if (!atAny(["'", '"'])) {
      match("'", true)
    }

    let stringValue = ''
    const quoteType = match(Category.structure, true)?.lexeme

    while (!at(quoteType)) {
      stringValue += next()?.lexeme ?? ''
    }

    match(quoteType, true)
    return new StringLiteral(stringValue)
  }

  const parseObjectLiteral = (): ObjectLiteral => {
    match('{', true)
    skipWhitespace()
    if (at('}')) {
      match('}', true)
      return new ObjectLiteral([])
    }

    prependToTokens(new Token(Category.structure, ',', 0, 0))
    const keyValuePairs: [StringLiteral, Expression][] = []

    while (!at('}')) {
      match(',', true)
      skipWhitespace()
      const key = parseStringLiteral()
      skipWhitespace()
      match(':', true)
      skipWhitespace()
      keyValuePairs.push([key, parseExpression()])
      skipWhitespace()
    }

    match('}', true)
    return new ObjectLiteral(keyValuePairs)
  }

  const parseListLiteral = (): ListLiteral => {
    match('[', true)
    skipWhitespace()
    if (at(']')) {
      match(']', true)
      return new ListLiteral([])
    }

    prependToTokens(new Token(Category.structure, ',', 0, 0))
    const expressions: Expression[] = []

    while (!at(']')) {
      match(',', true)
      skipWhitespace()
      expressions.push(parseExpression())
      skipWhitespace()
    }

    match(']', true)
    return new ListLiteral(expressions)
  }

  const parseFunctionLiteral = (expression?: Token[]): FunctionLiteral => {
    const parameters: Variable[] = []

    if (at(Category.id)) {
      parameters.push(new Variable(match(Category.id, true)!.lexeme, true, false))
    } else {
      match('(', true)
      prependToTokens(new Token(Category.structure, ',', 0, 0))

      while (!at(')')) {
        match(',', true)
        parameters.push(new Variable(match(Category.id, true)!.lexeme, true, false))
      }

      match(')', true)
    }

    match('->', true)

    const functionStatements: Statement[] = []
    if (match('{')) {
      skipWhitespace()
      while (!at('}')) {
        functionStatements.push(parseStatement())
        skipWhitespace()
      }

      match('}', true)
    } else {
      match(returnKeyword)
      skipWhitespace(false)
      functionStatements.push(parseReturnStatement(matchUntil('\n')))
    }

    return new FunctionLiteral(parameters, functionStatements, `(${parameters.join(', ')}) -> {\n\t${functionStatements.join('\n\t')}\n}`)
  }

  return parseBlock()
}
