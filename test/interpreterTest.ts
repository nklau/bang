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
  ['print multiple strings', `prt('hello', 'world')`, 'hello world'],
  ['string + string', `prt('hello ' + 'world')`, 'hello world'],
  ['string + string + string', `prt('hello' + ' ' + 'world')`, 'hello world'],
  ['string - string', `prt('hello world' + 'my world' - 'world')`, 'hello my world'],
  ['string + number', `prt('hello' + 4)`, '9'],
  ['string - number', `prt('hello' - 4)`, '1'],
  ['string + T', `prt('true is ' + T)`, 'true is T'],
  ['string + F', `prt('false is ' + F)`, 'false is F'],
  ['string - T', `prt('TT' - T)`, 'T'],
  ['string - F', `prt('FF' - F)`, 'F'],
  ['string + nil', `prt('hello' + nil)`, ' hello '],
  ['string - nil', `prt('  hello \n' - nil)`, ' hello '],
  ['number + string', `prt(4 + 'hello')`, '9'],
  ['number - string', `prt(4 - 'hello')`, '-1'],
  ['number + number + string', `prt(1 + 2 + 'hello')`, '8'],
  ['number - number + string', `prt(1 - 2 + 'hello')`, '4'],
  ['number + boolean + string', `prt(5 + T + 'hello')`, '11'],
  ['number - boolean + string', `prt(5 - T + 'hello')`, '9'],
  ['number + nil + string', `prt(5 + nil + 'hello')`, '10'],
  ['T + string', `prt(T + ' is true')`, 'T is true'],
  ['F + string', `prt(F + ' is false')`, 'F is false'],
  ['T - random string', `prt(T - 'TT')`, 'T'],
  ['F - random string', `prt(F - 'FF')`, 'F'],
  ['T - T string', `prt(T - 'T')`, ''],
  ['F - F string', `prt(F - 'F')`, ''],
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
