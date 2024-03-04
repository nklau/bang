import assert from 'assert/strict'
import { parse } from '../src/parser'
import { Block, NegativeExpression, Variable, VariableAssignment } from '../src/core/core'
import { NumberLiteral, StringLiteral } from '../src/core/types'
import { tokenize } from '../src/lexer'

const programs = [
  [
    'number assignment',
    'x = 5',
    new Block([new VariableAssignment(new Variable('x', false, false), '=', new NumberLiteral(5))]),
  ],
  [
    'negative number assignment',
    'x = -5',
    new Block([new VariableAssignment(new Variable('x', false, false), '=', new NegativeExpression(new NumberLiteral(5)))]),
  ],
  [
    'string assignment (single quote)',
    `x = 'hello world'`,
    new Block([new VariableAssignment(new Variable('x', false, false), '=', new StringLiteral('hello world'))]),
  ],
  [
    'string assignment (double quote)',
    `x = "hello world"`,
    new Block([new VariableAssignment(new Variable('x', false, false), '=', new StringLiteral('hello world'))]),
  ],
]

for (const [scenario, program, expected] of programs) {
  assert.deepEqual(parse(tokenize(program as string)), expected)
  console.log(`${scenario} passes`)
}
