import * as chai from 'chai'
import { parse } from '../src/parser'
import { tokenize } from '../src/lexer'
import { run } from '../src/interpreter'

const programs = [
  ['number addition', 'prt(5 + 3)', '8'],
  ['number subtraction', 'prt(3 - 5)', '-2'],
  ['number + true', 'prt(5 + T)', '6'],
  ['number - true', 'prt(5 - T)', '4'],
  ['true + number', 'prt(T + 6)', '7'],
  ['true - number', 'prt(T - 6)', '-5'],
  ['number + false', 'prt(5 + F)', '5'],
  ['number - false', 'prt(5 - F)', '5'],
  ['false + number', 'prt(F + 5)', '5'],
  ['false - number', 'prt(F - 5)', '-5'],
  ['number + nil', 'prt(5 + nil)', '5'],
  ['number - nil', 'prt(5 - nil)', '5'],
  ['nil + number', 'prt(nil + 5)', '5'],
  ['nil - number', 'prt(nil - 5)', '-5'],
  ['true + true', 'prt(T + T)', 'T'],
  ['true + false', 'prt(T + F)', 'T'],
  ['false + true', 'prt(F + T)', 'T'],
  ['false + false', 'prt(F + F)', 'F'],
  ['true + nil', 'prt(T + nil)', 'T'],
  ['nil + true', 'prt(nil + T)', 'T'],
  ['false + nil', 'prt(F + nil)', 'F'],
  ['nil + false', 'prt(nil + F)', 'F'],
  ['true - true', 'prt(T - T)', 'F'],
  ['true - false', 'prt(T - F)', 'T'],
  ['false - true', 'prt(F - T)', 'T'],
  ['false - false', 'prt(F - F)', 'F'],
  ['true - nil', 'prt(T - nil)', 'T'],
  ['nil - true', 'prt(nil - T)', 'F'],
  ['false - nil', 'prt(F - nil)', 'F'],
  ['nil - false', 'prt(nil - F)', 'F'],
  ['print string', `prt('hi')`, 'hi'],
  ['print multiple strings', `prt('hello', 'world')`, 'hello world']
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
