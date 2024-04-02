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

export default function runFile() {
  if (process.argv.length < 3) {
    console.log(`Usage: ts-node ${process.argv[1]} <filename.bang>`)
    process.exit(1)
  }

  fs.readFile(process.argv[2], 'utf8', (err, data) => {
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

    if (isLiteral(expression)) {
      console.log(`found literal value ${getLiteralValue(expression)}`)
      return getLiteralValue(expression)
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
      if (operand.id === 'print') {
        console.log(runStatement(args[0]).value)
        
        // TODO allow multiple args

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
    if (containsType(expression.operands, FunctionLiteral.type)) {
      throw new Error('unimplemented function addition')
    }

    if (containsType(expression.operands, ListLiteral.type)) {
    }

    if (containsType(expression.operands, NumberLiteral.type)) {
      const first = expression.operands[0]

      let sum: number
      if (first instanceof NumberLiteral) {
        sum = first.value
      } else if (first instanceof BooleanLiteral) {
        sum = first.value ? 1 : 0
      } else {
        throw new Error(`unexpected type ${first.constructor} in numerical additive expression`)
      }

      for (let i = 1; i < expression.operands.length; i += 2) {
        const [operator, operand] = [expression.operands[i], expression.operands[i + 1]]

        if (operator !== addOperator && operator !== subtractOperator) {
          throw new Error(`unexpected operator ${operator} in numerical additive expression`)
        }

        if (operand instanceof NumberLiteral) {
          sum = addNums(sum, operand.value, operator)
        } else if (operand instanceof BooleanLiteral && operand.value) {
          sum = addNums(sum, 1, operator)
        } else {
          throw new Error(`unexpected type ${operand.constructor} in numerical additive expression`)
        }
      }

      return new NumberLiteral(sum)
    }

    return expression
  }

  const addNums = (sum: number, toAdd: number, operator: string): number => {
    return sum + (operator === addOperator ? toAdd : -toAdd)
  }

  const containsType = (operands: (Expression | string)[], type: StringLiteral | string) => {
    if (type instanceof StringLiteral) {
      type = type.value
    }

    return operands.filter(operand => isLiteral(operand)).some(operand => getType(operand as Literal).value === type)
  }

  const getType = (expression: Literal): StringLiteral => {
    // @ts-ignore: all Literals have a static attribute 'type'
    return new StringLiteral(expression.constructor.type ?? nil.srcCode().value)
  }

  const getLiteralValue = (expression: Literal) => {
    if (
      expression instanceof BooleanLiteral ||
      expression instanceof NumberLiteral ||
      expression instanceof StringLiteral
    ) {
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