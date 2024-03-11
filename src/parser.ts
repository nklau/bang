import fs from 'fs'
import { falseyFunction, inf } from './core/constants'
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
  StatementExpression,
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
  arrow,
  assignmentOperator,
  assignmentOperators,
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
  let editedTokens: Token[] = []
  let token: Token | undefined = tokens[0]

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
    const matched = (subtokens ?? tokens).splice(0, index)
    editedTokens.push(...matched)
    return matched
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

    if (prevToken?.isFromSrcCode) {
      editedTokens.push(prevToken)
    }

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

  const callFailable = (
    failable: (...args: any[]) => StatementExpression,
    backup: (...args: any[]) => StatementExpression
  ): StatementExpression => {
    editedTokens = []
    try {
      return failable()
    } catch {
      prependToTokens(...editedTokens)
      return backup()
    }
  }

  const parseBlock = () => {
    skipWhitespace()

    const statements: StatementExpression[] = []
    while (tokens.length > 0) {
      statements.push(parseStatement())
      skipWhitespace()
    }

    return new Block(statements)
  }

  const parseStatement = (expression?: Token[]): StatementExpression => {
    if (!token) {
      error('Expected statement', 0, 0)
    }

    if (expression) {
      prependToTokens(...expression)
    }

    skipWhitespace()
    return callFailable(parseAssignment, parseExpression)
  }

  const parseAssignment = (isLocal = false, isConst = false): StatementExpression => {
    const variable = parseAssignmentTarget(isLocal, isConst)

    skipWhitespace()

    let operator, expression

    if ((operator = match(arrow))) {
      error('Function detected', token?.line ?? 0, token?.column ?? 0)
    }

    if (!atAny(assignmentOperators)) {
      error(`Invalid assignment operator ${token?.lexeme}`, token?.line ?? 0, token?.column ?? 0)
    }

    if (((operator = match(Category.operator, isConst)?.lexeme), true)) {
      skipWhitespace()
      expression = parseExpression()
    }

    return new VariableAssignment(variable, operator, expression)
  }

  const parseAssignmentTarget = (
    isLocal: boolean = false,
    isConst: boolean = false
  ): AccessExpression | IndexExpression | Variable => {
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
        return new AccessExpression(variable, new StringLiteral(match(Category.id, true)!.lexeme))
      } else if (structure.lexeme === '[') {
        const left = parseExpression(matchUntil(':')) ?? 0
        next()
        skipWhitespace()
        const right = parseExpression(matchUntil(']')) ?? inf
        next()

        return new IndexExpression(variable, left, right)
      }
    }
    // think this might also catch x -> x?
    // TODO check for function calls () and repeating . or [] ops

    return variable
  }

  const parseKeywordStatement = (): StatementExpression => {
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
      [infinityKeyword]: () => inf,
      [piKeyword]: () => new NumberLiteral(Math.PI),
      [matchKeyword]: () => {
        return parseMatchExpression()
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

  const parseReturnStatement = (expression?: Token[]): StatementExpression => {
    return new ReturnStatement(parseExpression(expression))
  }

  const parseMatchCase = (): MatchCase => {
    match(caseKeyword, true)
    skipWhitespace(false)

    const testMatches: Expression[] = []
    while (!at(':')) {
      testMatches.push(parseExpression(matchUntil(':')))
      skipWhitespace()
    }

    match(':', true)
    skipWhitespace()

    const statements: StatementExpression[] = []
    if (match('{')) {
      skipWhitespace()

      while (!at('}')) {
        statements.push(parseStatement())
        skipWhitespace()
      }

      match('}', true)
    } else {
      statements.push(parseStatement())
    }

    return new MatchCase(new ListLiteral(testMatches), new ImmediateFunction(statements))
  }

  const parseDefaultMatchCase = (): ImmediateFunction => {
    match(defaultKeyword, true)
    skipWhitespace(false)
    match(':', true)
    skipWhitespace()

    const statements: StatementExpression[] = []
    if (match('{')) {
      skipWhitespace()

      while (!at('}')) {
        statements.push(parseStatement())
        skipWhitespace()
      }

      match('}', true)
    } else {
      statements.push(parseStatement())
    }

    return new ImmediateFunction(statements)
  }

  const parseMatchExpression = (): StatementExpression => {
    match(matchKeyword, true)
    skipWhitespace(false)
    const condition = parseExpression()
    skipWhitespace()
    const openingBracket = match('{', true)
    if (!condition) {
      error(
        `Match expression requires a test expression following 'mtch'`,
        openingBracket!.line,
        openingBracket!.column
      )
    }

    skipWhitespace()

    const matchCases: MatchCase[] = []
    while (!at('}') && !at(defaultKeyword)) {
      matchCases.push(parseMatchCase())
      skipWhitespace()
    }

    let defaultCase
    try {
      defaultCase = parseDefaultMatchCase()
    } catch {}

    match('}', true)

    return new MatchExpression(condition, matchCases, defaultCase)
  }

  const parseExpression = (expression?: Token[]): Expression | typeof nil => {
    if (expression) {
      prependToTokens(...expression)
    }

    skipWhitespace()

    const left = callFailable(parseKeywordStatement, parseCompareExpression)
    const trueBlock: StatementExpression[] = []
    const falseBlock: StatementExpression[] = []

    skipWhitespace()
    while (match('?') && !at(':')) {
      skipWhitespace()
      trueBlock.push(callFailable(parseImmediateFunction, parseStatement))
    }

    skipWhitespace()

    // TODO: fix ternaries
    // while (match(':')) {
    //   skipWhitespace()
    //   try {
    //     falseBlock.push(callFailable(parseImmediateFunction, parseStatement))
    //     console.log('block pushed')
    //   } catch {
    //     console.log('pushing tokens')
    //     prependToTokens(...editedTokens)
    //     editedTokens = []
    //   }
    // }

    let falseFunction = falseyFunction
    if (falseBlock.length > 0) {
      falseFunction = new FunctionLiteral([], falseBlock)
    }

    return trueBlock.length > 0 ? new TernaryExpression(left, new FunctionLiteral([], trueBlock), falseFunction) : left
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
      const operator = match(Category.operator, true)!.lexeme
      skipWhitespace()
      operands.push(operator, parseInnerExpression())
      skipWhitespace()
    }

    return operands.length > 1 ? new expressionType(operands) : (operands[0] as Expression)
  }

  const parseImmediateFunction = (): ImmediateFunction => {
    match('{', true)

    skipWhitespace()
    const statements: StatementExpression[] = []
    while (!at('}')) {
      statements.push(parseStatement())
      skipWhitespace()
    }

    match('}', true)
    return new ImmediateFunction(statements)
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
            rightIndex = inf
          } else {
            skipWhitespace()
            rightIndex = parseStatement()
            skipWhitespace()
            match(']', true)
          }

          expression = new IndexExpression(expression, new NumberLiteral(0), rightIndex)
        } else {
          const leftIndex = parseStatement()
          skipWhitespace()
          let rightIndex = null

          if (match(':')) {
            skipWhitespace()
            if (match(']')) {
              rightIndex = inf
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
        expression = new AccessExpression(expression, new StringLiteral(selector))
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
            return callFailable(parseFunctionLiteral, parseParenthesizedExpression)
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
        return callFailable(parseFunctionLiteral, parseAssignmentTarget)
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
    throw new Error(`unexpected literal expression ${token?.category} ${token?.lexeme}`)
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

    prependToTokens(new Token(Category.structure, ',', 0, 0, false))
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

    prependToTokens(new Token(Category.structure, ',', 0, 0, false))
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

  const parseParenthesizedExpression = (): Expression => {
    next()
    skipWhitespace()
    if (at(')')) {
      error(`Unexpected token )`, token?.line ?? 0, token?.column ?? 0)
    }

    const exp = parseStatement()

    skipWhitespace()
    match(')', true)

    return exp
  }

  const parseFunctionLiteral = (): FunctionLiteral => {
    const parameters: Variable[] = []

    if (at(Category.id)) {
      parameters.push(new Variable(match(Category.id, true)!.lexeme, true, false))
    } else {
      match('(', true)
      skipWhitespace()

      if (!at(')')) {
        prependToTokens(new Token(Category.structure, ',', 0, 0, false))
      }

      while (!at(')')) {
        match(',', true)
        skipWhitespace()
        parameters.push(new Variable(match(Category.id, true)!.lexeme, true, false))
        skipWhitespace()
      }

      match(')', true)
    }

    skipWhitespace()
    match(arrow, true)
    skipWhitespace()

    const functionStatements: StatementExpression[] = []
    if (match('{')) {
      skipWhitespace()
      while (!at('}')) {
        functionStatements.push(parseStatement())
        skipWhitespace()
      }

      match('}', true)
    } else {
      if (match(returnKeyword)) {
        skipWhitespace(false)
        functionStatements.push(at('\n') ? new ReturnStatement() : parseReturnStatement(matchUntil('\n')))
      } else {
        functionStatements.push(parseStatement(matchUntil('\n')))
      }
    }

    return new FunctionLiteral(parameters, functionStatements)
  }

  return parseBlock()
}
