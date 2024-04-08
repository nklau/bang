import fs from 'fs'
import {
  AdditiveExpression,
  Block,
  CallExpression,
  Expression,
  NaryExpression,
  StatementExpression,
  Variable,
  VariableAssignment,
} from './core/core'
import {
  NumberLiteral,
  isLiteral,
  Literal,
  BooleanLiteral,
  StringLiteral,
  FormattedStringLiteral,
  ObjectLiteral,
  ListLiteral,
  FunctionLiteral,
  nil,
} from './core/types'
import {
  addAssignmentOperator,
  addOperator,
  additiveOperators,
  andAssignmentOperator,
  divideAssignmentOperator,
  exponentialAssignmentOperator,
  modulusAssignmentOperator,
  multiplyAssignmentOperator,
  negateAssignmentOperator,
  orAssignmentOperator,
  spreadAssignmentOperator,
  subtractAssignmentOperator,
  subtractOperator,
} from './core/operators'
import { parse } from './parser'
import { tokenize } from './lexer'
import { falseKeyword, trueKeyword } from './core/keywords'

export default function runFile(fileName: string) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      throw err
    }

    console.log('Interpreter output:')
    run(parse(tokenize(data)))
  })
}

export const run = (program: Block) => {
  const context = new Map<Variable, StatementExpression>()

  /* var names will be suffixed with _0, _1, _2, etc in JS. This is because
  JS has reserved keywords that Bang! does not have. */

  const varName = (mapping => {
    return (entity: Variable) => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size)
      }

      return `${entity.id}_${mapping.get(entity)}`
    }
  })(new Map())

  const assignVariable = (variable: Variable, value: StatementExpression) => {
    // TODO: check const/local restrictions
    context.set(variable, runStatement(value))
  }

  const runStatement = (expression: StatementExpression): any => {
    if (expression instanceof VariableAssignment) {
      runVariableAssignment(expression)
    }

    if (expression instanceof CallExpression) {
      runCallExpression(expression)
    }

    if (expression instanceof NaryExpression) {
      return interpretNaryExpression(expression)
    }

    return expression
  }

  const runVariableAssignment = (expression: VariableAssignment): void => {
    expression = interpretAssignmentOperator(expression)

    if (expression.target instanceof Variable) {
      assignVariable(expression.target, expression.expression)
    }
    // TODO: expression.target instanceof AccessExpression, expression.target instanceof IndexExpression
  }

  const interpretAssignmentOperator = (expression: VariableAssignment): VariableAssignment => {
    // TODO: update as interpret functions are written for all types of operations
    switch (expression.operator) {
      case spreadAssignmentOperator: {
        break
      }
      case negateAssignmentOperator: {
        break
      }
      case exponentialAssignmentOperator: {
        break
      }
      case multiplyAssignmentOperator: {
        break
      }
      case divideAssignmentOperator: {
        break
      }
      case modulusAssignmentOperator: {
        break
      }
      case addAssignmentOperator: {
        break
      }
      case subtractAssignmentOperator: {
        break
      }
      case andAssignmentOperator: {
        break
      }
      case orAssignmentOperator: {
        break
      }
    }

    return expression
  }

  const runCallExpression = (expression: CallExpression): Expression => {
    const [operand, args] = [expression.operand, expression.args]
    if (operand instanceof Variable) {
      if (operand.id === 'prt') {
        console.log(args.map(arg => getPrtValue(runStatement(arg))).join(' '))

        // const output: string[] = []
        // args.forEach(arg => {
        //   const out = runStatement(arg).value
        //   if (out) {
        //     console.log(out)
        //   }
        // })
      }
      // TODO
    }
    return nil
  }

  const interpretNaryExpression = (expression: NaryExpression): Expression => {
    if (expression instanceof AdditiveExpression) {
      return interpretAdditiveExpression(expression)
    }
    return expression
  }

  const interpretAdditiveExpression = (expression: AdditiveExpression): Expression => {
    // constructor(public operands: (Expression | string)[]) {}
    // for (const operand of expression.operands) {
    // }
    const operands = expression.operands
    if (containsType(operands, FunctionLiteral.type)) {
      throw new Error('unimplemented function addition')
    }

    if (containsType(operands, ListLiteral.type)) {
    }

    if (containsType(operands, StringLiteral.type)) {
      return stringAddition(operands)
    }

    if (containsType(operands, NumberLiteral.type)) {
      return numericalAddition(operands)
    }

    if (containsType(operands, BooleanLiteral.type)) {
      return booleanAddition(operands)
    }

    return nil
  }

  const containsType = (operands: (Expression | string)[], type: StringLiteral | string) => {
    if (type instanceof StringLiteral) {
      type = type.value
    }

    return operands.filter(operand => isLiteral(operand)).some(operand => getType(operand as Literal).value === type)
  }

  const isType = (expression: any, types: string | string[]): boolean => {
    if (typeof types === 'string') {
      types = [types]
    }

    return types.some(type => getType(expression).value === type)
  }

  const isOperator = (operator: Expression | string, operators: string[]): operator is string => {
    return operators.some(op => op === operator)
  }

  const numericalAddition = (operands: (Expression | string)[]): NumberLiteral => {
    const first = operands[0]

    let sum: number
    if (first instanceof NumberLiteral) {
      sum = first.value
    } else if (first instanceof BooleanLiteral) {
      sum = first.value ? 1 : 0
    } else if (first === nil) {
      sum = 0
    } else {
      throw new Error(`unexpected type ${first.constructor} in numerical additive expression`)
    }

    for (let i = 1; i < operands.length; i += 2) {
      const [operator, operand] = [operands[i], operands[i + 1]]

      if (!isOperator(operator, additiveOperators)) {
        throw new Error(`unexpected operator ${operator} in numerical additive expression`)
      }

      if (operand instanceof NumberLiteral) {
        sum = addNums(sum, operand.value, operator)
      } else if (operand instanceof BooleanLiteral) {
        if (operand.value) {
          sum = addNums(sum, 1, operator)
        }
      } else if (operand !== nil) {
        throw new Error(`unexpected type ${operand.constructor} in numerical additive expression`)
      }
    }

    return new NumberLiteral(sum)
  }

  const addNums = (sum: number, toAdd: number, operator: string): number => {
    return sum + (operator === addOperator ? toAdd : -toAdd)
  }

  const booleanAddition = (operands: (Expression | string)[]): BooleanLiteral => {
    const first = operands[0]

    let sum: boolean | typeof nil

    if (first instanceof BooleanLiteral) {
      sum = first.value
    } else if (first === nil) {
      sum = nil
    } else {
      throw new Error(`unexpected type ${first.constructor} in boolean additive expression`)
    }

    for (let i = 1; i < operands.length; i += 2) {
      let [operator, operand] = [operands[i], operands[i + 1]]

      if (!isOperator(operator, additiveOperators)) {
        throw new Error(`unexpected operator ${operator} in numerical additive expression`)
      }

      if (sum === nil) {
        sum = false
        if (operator === subtractOperator) {
          continue
        }
      }

      if (operand === nil) {
        operand = new BooleanLiteral(false)
      }

      if (operand instanceof BooleanLiteral) {
        sum = operator === addOperator ? sum || operand.value : sum !== operand.value
      } else {
        throw new Error(`unexpected type ${operand.constructor} in boolean additive expression`)
      }
    }

    return new BooleanLiteral(sum as boolean)
  }

  const stringAddition = (operands: (Expression | string)[]): StringLiteral | NumberLiteral | typeof nil => {
    const first = operands[0]
    const allowedTypes = [StringLiteral.type, NumberLiteral.type, BooleanLiteral.type, nil.type]
    if (!isType(first, allowedTypes)) {
      throw new Error(`unexpected type ${first.constructor} in string additive expression`)
    }

    let sum = ''
    let acc = first

    for (let i = 1; i < operands.length; i += 2) {
      let [operator, rhs] = [operands[i], operands[i + 1]]

      if (!isOperator(operator, additiveOperators)) {
        throw new Error(`unexpected operator ${operator} in numerical additive expression`)
      }

      if (isType(acc, StringLiteral.type)) {
        if (isType(rhs, StringLiteral.type)) {
          if (operator === addOperator) {
            ;(acc as StringLiteral).value = `${(acc as StringLiteral).value}${(rhs as StringLiteral).value}`
          } else {
            ;(acc as StringLiteral).value = (acc as StringLiteral).value.replace((rhs as StringLiteral).value, '')
          }
        } else if (isType(rhs, NumberLiteral.type)) {
          acc = new NumberLiteral(
            (acc as StringLiteral).value.length +
              (operator === addOperator ? (rhs as NumberLiteral).value : -(rhs as NumberLiteral).value)
          )
        } else if (isType(rhs, BooleanLiteral.type)) {
          // rhs = (rhs as BooleanLiteral)
          // add
          // subtract
        }
        // nil
        // err
      } else if (isType(acc, NumberLiteral.type)) {
        // string
        // number
        // bool
        // nil
        // err
      } else if (isType(acc, BooleanLiteral.type)) {
        // string
        // number
        // bool
        // nil
        // err
      } else if (isType(acc, nil.type)) {
        // string
        // number
        // bool
        // nil
        // err
      } else {
        throw new Error(`unexpected type ${acc.constructor} in string additive expression`)
      }
    }

    // string + nil = append/prepend space to string
    // same as nil + string
    // string + bool = `string${bool.value}`
    // bool + string = `${bool.value}string`
    // string + number = string.length + number
    // same as number + string
    // string + string = string concatenation

    // string - nil = remove one whitespace character from start/end of string, if any
    // nil - string = nil
    // string - bool = convert bool to string 'T' or 'F'
    // same as bool - string
    // string - number = string.length - number
    // number - string = number - string.length
    // string - string = remove first instance of rhs from lhs, if any

    return new StringLiteral(sum as string)
  }

  const getType = (expression: Literal): StringLiteral => {
    // @ts-ignore: all Literals have a static attribute 'type'
    return new StringLiteral(expression.constructor.type ?? nil.srcCode().value)
  }

  const getPrtValue = (expression: Literal) => {
    if (expression instanceof BooleanLiteral) {
      return expression.value ? trueKeyword : falseKeyword
    }
    if (expression instanceof NumberLiteral || expression instanceof StringLiteral) {
      return expression.value
    }

    if (expression instanceof FormattedStringLiteral) {
    }

    if (expression instanceof ObjectLiteral) {
    }

    if (expression instanceof ListLiteral) {
    }

    if (expression instanceof FunctionLiteral) {
    }
  }

  // TODO use this instead of last line
  program.statements.forEach(runStatement)
  // program.statements.forEach(statement => console.log(runStatement(statement).value))
}
