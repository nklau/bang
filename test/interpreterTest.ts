import * as chai from 'chai'
import { parse } from '../src/parser'
import { tokenize } from '../src/lexer'
import { run } from '../src/interpreter'

const programs = [
  ['number addition', 'print(5 + 3)', '8'],
  ['number subtraction', 'print(3 - 5)', '-2'],
  ['number + true', 'print(5 + T)', '6'],
  ['number - true', 'print(5 - T)', '4'],
  ['true + number', 'print(T + 6)', '7'],
  ['true - number', 'print(T - 6)', '-5'],
  ['number + false', 'print(5 + F)', '5'],
  ['number - false', 'print(5 - F)', '5'],
  ['false + number', 'print(F + 5)', '5'],
  ['false - number', 'print(F - 5)', '-5'],
]

for (const [scenario, program, expected] of programs) {
  const actual: string[] = []

  const log = console.log
  console.log = function (...args: any[]) {
    actual.push(args.join(' '))
  }

  run(parse(tokenize(program as string)))

  console.log = log

  chai.assert.equal(actual.join('\n'), expected)
  console.log(`${scenario} passes`)
}
