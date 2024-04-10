import fs from 'fs'
import {
  AdditiveExpression,
  Block,
  CallExpression,
  ComparisonExpression,
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

    if (expression instanceof ComparisonExpression) {
      return interpretComparison(expression.operands)
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
      return listAddition(operands)
    }

    // TODO object addtion/subtraction

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
      throw new Error(`unexpected type ${first.constructor.name} in numerical additive expression`)
    }

    for (let i = 1; i < operands.length; i += 2) {
      let [operator, operand] = [operands[i], operands[i + 1]]

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
        if (typeof operand !== 'string') {
          sum = numericalAddition([new NumberLiteral(sum), operator, runStatement(operand)]).value
        } else {
          throw new Error(`unexpected type ${operand.constructor.name} in numerical additive expression`)
        }
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
      throw new Error(`unexpected type ${first.constructor.name} in boolean additive expression`)
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
        throw new Error(`unexpected type ${operand.constructor.name} in boolean additive expression`)
      }
    }

    return new BooleanLiteral(sum as boolean)
  }

  const stringAddition = (operands: (Expression | string)[]): StringLiteral | NumberLiteral | typeof nil => {
    const first = operands[0]
    const allowedTypes = [StringLiteral.type, NumberLiteral.type, BooleanLiteral.type, nil.type]
    if (!isType(first, allowedTypes)) {
      throw new Error(`unexpected type ${first.constructor.name} in string additive expression`)
    }

    let acc = first

    for (let i = 1; i < operands.length; i += 2) {
      let [operator, rhs] = [operands[i], operands[i + 1]]

      if (!isOperator(operator, additiveOperators)) {
        throw new Error(`unexpected operator ${operator} in string additive expression`)
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
          if (operator === addOperator) {
            ;(acc as StringLiteral).value = `${(acc as StringLiteral).value}${getPrtValue(rhs as BooleanLiteral)}`
          } else {
            ;(acc as StringLiteral).value = (acc as StringLiteral).value.replace(
              getPrtValue(rhs as BooleanLiteral) as string,
              ''
            )
          }
        } else if (isType(rhs, nil.type)) {
          // TODO this is the cleanest way to organize addition to avoid all the type casting
          acc = nilStringAddition(operator, acc as StringLiteral)
        } else {
          throw new Error(`unexpected type ${rhs.constructor.name} in string additive expression`)
        }
      } else if (isType(acc, NumberLiteral.type)) {
        if (isType(rhs, StringLiteral.type)) {
          if (operator === addOperator) {
            ;(acc as NumberLiteral).value += (rhs as StringLiteral).value.length
          } else {
            ;(acc as NumberLiteral).value -= (rhs as StringLiteral).value.length
          }
        } else {
          acc = numericalAddition([acc, operator, rhs])
        }
      } else if (isType(acc, BooleanLiteral.type)) {
        if (isType(rhs, StringLiteral.type)) {
          if (operator === addOperator) {
            acc = new StringLiteral(`${getPrtValue(acc as BooleanLiteral)}${(rhs as StringLiteral).value}`)
          } else {
            const boolVal = getPrtValue(acc as BooleanLiteral)
            acc = new StringLiteral((rhs as StringLiteral).value === boolVal ? '' : (boolVal as string))
          }
        } else {
          acc = interpretAdditiveExpression(new AdditiveExpression([acc, operator, rhs]))
        }
      } else if (isType(acc, nil.type)) {
        if (isType(rhs, StringLiteral.type)) {
          acc = operator === addOperator ? nilStringAddition(operator, rhs as StringLiteral) : nil
        } else {
          acc = interpretAdditiveExpression(new AdditiveExpression([acc, operator, rhs]))
        }
      } else {
        throw new Error(`unexpected type ${acc.constructor.name} in string additive expression`)
      }
    }

    if (acc instanceof StringLiteral) {
      return acc
    } else if (acc instanceof NumberLiteral) {
      return acc
    } else if (isType(acc, nil.type)) {
      return nil
    }

    throw new Error(`unexpected output type ${acc.constructor.name} in string additive expression`)
  }

  const nilStringAddition = (operator: string, operand: StringLiteral): StringLiteral => {
    return new StringLiteral(operator === addOperator ? ` ${operand.value} ` : operand.value.replace(/^\s|\s$/g, ''))
  }

  const listAddition = (operands: (Expression | string)[]): ListLiteral => {
    const first = operands[0]
    const allowedTypes = [ListLiteral.type, ObjectLiteral.type, StringLiteral.type, NumberLiteral.type, BooleanLiteral.type, nil.type]
    if (!isType(first, allowedTypes)) {
      throw new Error(`unexpected type ${first.constructor.name} in list additive expression`)
    }

    let acc = first

    for (let i = 1; i < operands.length; i += 2) {
      let [operator, rhs] = [operands[i], operands[i + 1]]

      if (!isOperator(operator, additiveOperators)) {
        throw new Error(`unexpected operator ${operator} in list additive expression`)
      }

      if (acc instanceof ListLiteral) {
        if (rhs instanceof ListLiteral) {
          if (operator === addOperator) {
            acc.value = [...acc.value, ...rhs.value]
          } else {
            rhs.value.forEach(acc.del)
          }
        } else if (rhs === nil) {
          if (operator === addOperator) {
            acc = acc.flat()
          } else {
            const index = acc.value.findIndex(e => isLiteral(e) && !e.bool.value)
            if (index > -1) {
              acc.value.splice(index, 1)
            }
          }
        } else if (isLiteral(rhs)) {
          acc[operator === addOperator ? 'add' : 'del'](rhs)
        } else {
          throw new Error(`unexpected type ${rhs.constructor.name} in list additive expression`)
        }
      } else if (acc instanceof ObjectLiteral) {
        if (rhs instanceof ListLiteral) {
          if (operator === addOperator) {
            acc = new ListLiteral([acc, ...rhs.value])
          } else {
            // TODO subtraction
          }
        } else {
          // TODO
        }
      } else if (acc instanceof StringLiteral) {
        if (rhs instanceof ListLiteral) {
          if (operator === addOperator) {
            acc = new ListLiteral([acc, ...rhs.value])
          } else {
            // TODO Subtracting a list from a string will remove all substrings in the list from the string.
            // Any other types will be ignored.
          }
        } else {
          // TODO call objectAddition, neither acc nor rhs is a list
        }
      } else if (acc instanceof NumberLiteral) {
        if (rhs instanceof ListLiteral) {
          if (operator === addOperator) {
            acc = new ListLiteral([acc, ...rhs.value])
          } else {
            if (rhs.has(acc)) {
              acc.value = 0
            }
          }
        } else {
          // TODO call objectAddition, neither acc nor rhs is a list
        }
      } else if (acc instanceof BooleanLiteral) {
        if (rhs instanceof ListLiteral) {
          if (operator === addOperator) {
            acc = new ListLiteral([acc, ...rhs.value])
          } else {
            const first = rhs.get(new NumberLiteral(0))
            if (isLiteral(first)) {
              acc = acc.value ? first.bool : first.bool.not()
            } else {
              acc.value = true
            }
          }
        } else {
          // TODO call objectAddition, neither acc nor rhs is a list
        }
      } else if (acc === nil) {
        if (rhs instanceof ListLiteral) {
          acc = operator === addOperator ? rhs.flat() : nil
        } else {
          // TODO call objectAddition, neither acc nor rhs is a list
        }
      }
    }

    if (acc instanceof ListLiteral) {
      return acc
    }

    throw new Error(`unexpected output type ${acc.constructor.name} in list additive expression`)
  }

  const interpretComparison = (operands: (Expression | string)[]) => {
    // TODO this is hard-coded for debug purposes
    if (operands[1] === '==') {
      return new BooleanLiteral(isEqual(operands[0] as Literal, operands[2] as Literal))
    } else if (operands[1] === '!=') {
      return new BooleanLiteral(!isEqual(operands[0] as Literal, operands[2] as Literal))
    }

    throw new Error('unimplemented comparison expression')
  }

  const getType = (expression: Literal): StringLiteral => {
    // @ts-ignore: all Literals have a static attribute 'type'
    return new StringLiteral(expression.constructor.type ?? nil.srcCode().value)
  }

  const getPrtValue = (expression: Expression): string => {
    if (expression === nil) {
      return nil.type
    }
    if (expression instanceof BooleanLiteral) {
      return expression.value ? trueKeyword : falseKeyword
    }
    if (expression instanceof NumberLiteral || expression instanceof StringLiteral) {
      return expression.value as string
    }

    if (expression instanceof FormattedStringLiteral) {
    }

    if (expression instanceof ObjectLiteral) {
      if (expression.value.length === 0) {
        return `{ }`
      }

      return `{\n${expression.value
        .map(([key, value]) => `  '${key.value}': ${getNestedPrtValue(value)}`)
        .join(',\n')}\n}`
    }

    if (expression instanceof ListLiteral) {
      return `[${expression.value.map(getNestedPrtValue).join(', ')}]`
    }

    if (expression instanceof FunctionLiteral) {
    }

    throw new Error(`unimplemented print call ${expression.constructor.name}`)
  }

  const getNestedPrtValue = (expression: Expression): string => {
    return expression instanceof StringLiteral ? `'${expression.value}'` : getPrtValue(expression)
  }

  // TODO use this instead of last line
  program.statements.forEach(runStatement)
  // program.statements.forEach(statement => console.log(runStatement(statement).value))
}

export const isEqual = (lhs: Expression, rhs: Expression): boolean => {
  // TODO allow variables
  // if (lhs.constructor.name !== rhs.constructor.name) {
  //   return false
  // }

  if (lhs instanceof ListLiteral && rhs instanceof ListLiteral) {
    return lhs.value.every((e, index) => {
      return isEqual(e, rhs.value[index])
    })
  } else if (lhs instanceof ObjectLiteral && rhs instanceof ObjectLiteral) {
    return lhs.value.every(([key, value], index) => {
      return isEqual(key, rhs.value[index][0]) && isEqual(value, rhs.value[index][1])
    })
  } else if (lhs.constructor.name === rhs.constructor.name && lhs !== nil) {
    return (lhs as any).value !== undefined && (lhs as any).value === (rhs as any).value
  }

  return lhs === nil && rhs === nil
}
