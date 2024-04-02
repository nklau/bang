import * as chai from 'chai'
import { parse } from '../src/parser'
import { tokenize } from '../src/lexer'
import { run } from '../src/interpreter'

const programs = [['number addition', 'print(5 + 3)', '8']]

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
