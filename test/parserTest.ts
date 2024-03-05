import assert from 'assert/strict'
import { parse } from '../src/parser'
import { Block, NegativeExpression, Variable, VariableAssignment } from '../src/core/core'
import { ListLiteral, NumberLiteral, StringLiteral } from '../src/core/types'
import { tokenize } from '../src/lexer'

const x = new Variable('x', false, false)

const programs = [
  [
    'number assignment',
    'x = 5',
    new Block([new VariableAssignment(x, '=', new NumberLiteral(5))]),
  ],
  [
    'negative number assignment',
    'x = -5',
    new Block([new VariableAssignment(x, '=', new NegativeExpression(new NumberLiteral(5)))]),
  ],
  [
    'string assignment (single quote)',
    `x = 'hello world'`,
    new Block([new VariableAssignment(x, '=', new StringLiteral('hello world'))]),
  ],
  [
    'string assignment (double quote)',
    `x = "hello world"`,
    new Block([new VariableAssignment(x, '=', new StringLiteral('hello world'))]),
  ],
  [
    'variable to variable assignment',
    'x = y',
    new Block([new VariableAssignment(x, '=', new Variable('y', false, false))]),
  ],
  [
    'empty list assignment',
    'x = []',
    new Block([new VariableAssignment(x, '=', new ListLiteral([]))]),
  ],
  [
    'empty list assignment with whitespace',
    'x = [  ]',
    new Block([new VariableAssignment(x, '=', new ListLiteral([]))]),
  ],
  [
    'list assignment with one number',
    'x = [ 5 ]',
    new Block([new VariableAssignment(x, '=', new ListLiteral([new NumberLiteral(5)]))])
  ],
  [
    'list assignment with string and number',
    'x = [5,   "hello world" ]',
    new Block([new VariableAssignment(x, '=', new ListLiteral([new NumberLiteral(5), new StringLiteral('hello world')]))]),
  ],
]

for (const [scenario, program, expected] of programs) {
  assert.deepEqual(parse(tokenize(program as string)), expected)
  console.log(`${scenario} passes`)
}
