import * as chai from 'chai'
import chaiExclude from 'chai-exclude'
import { parse } from '../src/parser'
import {
  AccessExpression,
  AdditiveExpression,
  Block,
  CallExpression,
  ImmediateFunction,
  MatchCase,
  MatchExpression,
  NaryExpression,
  NegativeExpression,
  ReturnStatement,
  StatementExpression,
  Variable,
  VariableAssignment,
} from '../src/core/core'
import {
  BooleanLiteral,
  FunctionLiteral,
  ListLiteral,
  NumberLiteral,
  ObjectLiteral,
  StringLiteral,
  nil,
} from '../src/core/types'
import { tokenize } from '../src/lexer'

const x = new Variable('x', false, false)
const localX = new Variable('x', true, false)
const print = new Variable('prt', false, false)

const programs = [
  ['number assignment', 'x = 5', new Block([new VariableAssignment(x, '=', new NumberLiteral(5))])],
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
  ['new line string', `x = '\\n'`, new Block([new VariableAssignment(x, '=', new StringLiteral('\\n'))])],
  [
    'variable to variable assignment',
    'x = y',
    new Block([new VariableAssignment(x, '=', new Variable('y', false, false))]),
  ],
  ['empty list assignment', 'x = []', new Block([new VariableAssignment(x, '=', new ListLiteral([]))])],
  [
    'empty list assignment with whitespace',
    'x = [  ]',
    new Block([new VariableAssignment(x, '=', new ListLiteral([]))]),
  ],
  [
    'list assignment with one number',
    'x = [ 5 ]',
    new Block([new VariableAssignment(x, '=', new ListLiteral([new NumberLiteral(5)]))]),
  ],
  [
    'list assignment with string and number',
    'x = [5,   "hello world" ]',
    new Block([
      new VariableAssignment(x, '=', new ListLiteral([new NumberLiteral(5), new StringLiteral('hello world')])),
    ]),
  ],
  ['empty object assignment', 'x = {}', new Block([new VariableAssignment(x, '=', new ObjectLiteral([]))])],
  [
    'empty object assignment with whitespace',
    'x = {  }',
    new Block([new VariableAssignment(x, '=', new ObjectLiteral([]))]),
  ],
  [
    'object assignment with one key-val pair',
    `x = { 'one': 1 }`,
    new Block([new VariableAssignment(x, '=', new ObjectLiteral([[new StringLiteral('one'), new NumberLiteral(1)]]))]),
  ],
  [
    'object assignment with two key-val pairs',
    `x = { 'one': 1, " two": '2' }`,
    new Block([
      new VariableAssignment(
        x,
        '=',
        new ObjectLiteral([
          [new StringLiteral('one'), new NumberLiteral(1)],
          [new StringLiteral(' two'), new StringLiteral('2')],
        ])
      ),
    ]),
  ],
  ['number addition', '5 + 3', new Block([new AdditiveExpression([new NumberLiteral(5), '+', new NumberLiteral(3)])])],
  [
    'parenthesized number addition',
    '(5 + 3)',
    new Block([new AdditiveExpression([new NumberLiteral(5), '+', new NumberLiteral(3)])]),
  ],
  ['boolean', 'T', new Block([new BooleanLiteral(true)])],
  [
    'number + boolean',
    '5 + T',
    new Block([new AdditiveExpression([new NumberLiteral(5), '+', new BooleanLiteral(true)])]),
  ],
  [
    'print boolean + number',
    'prt(T + 6)',
    new Block([new CallExpression(print, [new NaryExpression([new BooleanLiteral(true), '+', new NumberLiteral(6)])])]),
  ],
  ['number + nil', '5 + nil', new Block([new AdditiveExpression([new NumberLiteral(5), '+', nil])])],
  ['identity function with parentheses', '(x) -> { x }', new Block([new FunctionLiteral([localX], [x])])],
  ['identity function with no parentheses', 'x -> { x }', new Block([new FunctionLiteral([localX], [x])])],
  ['identity function with no brackets', '(x) -> x', new Block([new FunctionLiteral([localX], [x])])],
  ['identity function with no parentheses or brackets', 'x -> x', new Block([new FunctionLiteral([localX], [x])])],
  ['empty function', '() -> {}', new Block([new FunctionLiteral([], [])])],
  ['empty function with spaces', '( ) -> {\n}', new Block([new FunctionLiteral([], [])])],
  [
    'function that takes two parameters',
    'add = (a, b) -> a + b',
    new Block([
      new VariableAssignment(
        new Variable('add', false, false),
        '=',
        new FunctionLiteral(
          [new Variable('a', true, false), new Variable('b', true, false)],
          [new AdditiveExpression([new Variable('a', false, false), '+', new Variable('b', false, false)])]
        )
      ),
    ]),
  ],
  [
    'function that takes two parameters with rtn keyword',
    'add = (a, b) -> rtn a + b',
    new Block([
      new VariableAssignment(
        new Variable('add', false, false),
        '=',
        new FunctionLiteral(
          [new Variable('a', true, false), new Variable('b', true, false)],
          [
            new ReturnStatement(
              new AdditiveExpression([new Variable('a', false, false), '+', new Variable('b', false, false)])
            ),
          ]
        )
      ),
    ]),
  ],
  [
    'function that takes two parameters with rtn keyword and brackets',
    'add = (a, b) -> { rtn a + b }',
    new Block([
      new VariableAssignment(
        new Variable('add', false, false),
        '=',
        new FunctionLiteral(
          [new Variable('a', true, false), new Variable('b', true, false)],
          [
            new ReturnStatement(
              new AdditiveExpression([new Variable('a', false, false), '+', new Variable('b', false, false)])
            ),
          ]
        )
      ),
    ]),
  ],
  [
    'basic immediate function that returns a number',
    '{ 5 }',
    new Block([new ImmediateFunction([new NumberLiteral(5)])]),
  ],
  [
    'basic match expression',
    `x = 5
    mtch x {
      cs 5: 5
    }`,
    new Block([
      new VariableAssignment(x, '=', new NumberLiteral(5)),
      new MatchExpression(x, [
        new MatchCase(new ListLiteral([new NumberLiteral(5)]), new FunctionLiteral([], [new NumberLiteral(5)])),
      ]),
    ]),
  ],
  [
    'match expression with default case',
    `x = 5
    mtch x {
      cs 5: 5
      dft: 'other'
    }`,
    new Block([
      new VariableAssignment(x, '=', new NumberLiteral(5)),
      new MatchExpression(
        x,
        [new MatchCase(new ListLiteral([new NumberLiteral(5)]), new FunctionLiteral([], [new NumberLiteral(5)]))],
        new FunctionLiteral([], [new StringLiteral('other')])
      ),
    ]),
  ],
  [
    'match expression with two cases',
    `x = 5
    mtch x {
      cs '5': {
        y = 'string'
        y
      }
      cs 5: 5
    }`,
    new Block([
      new VariableAssignment(x, '=', new NumberLiteral(5)),
      new MatchExpression(x, [
        new MatchCase(
          new ListLiteral([new StringLiteral('5')]),
          new FunctionLiteral(
            [],
            [
              new VariableAssignment(new Variable('y', false, false), '=', new StringLiteral('string')),
              new Variable('y', false, false),
            ]
          )
        ),
        new MatchCase(new ListLiteral([new NumberLiteral(5)]), new FunctionLiteral([], [new NumberLiteral(5)])),
      ]),
    ]),
  ],
  [
    'match expression with two cases + default case',
    `x = 5
    mtch x {
      cs '5': {
        y = 'string'
        y
      }
      cs 5: 5
      dft: 'other'
    }`,
    new Block([
      new VariableAssignment(x, '=', new NumberLiteral(5)),
      new MatchExpression(
        x,
        [
          new MatchCase(
            new ListLiteral([new StringLiteral('5')]),
            new FunctionLiteral(
              [],
              [
                new VariableAssignment(new Variable('y', false, false), '=', new StringLiteral('string')),
                new Variable('y', false, false),
              ]
            )
          ),
          new MatchCase(new ListLiteral([new NumberLiteral(5)]), new FunctionLiteral([], [new NumberLiteral(5)])),
        ],
        new FunctionLiteral([], [new StringLiteral('other')])
      ),
    ]),
  ],
  [
    'match expression with multi-value cases',
    `x = 5
    mtch x {
      cs 5, '5': {
        y = 5
        y
      }
      cs 1, '1': 1
      dft: {
        y = 'other'
        y
      }
    }`,
    new Block([
      new VariableAssignment(x, '=', new NumberLiteral(5)),
      new MatchExpression(
        x,
        [
          new MatchCase(
            new ListLiteral([new NumberLiteral(5), new StringLiteral('5')]),
            new FunctionLiteral(
              [],
              [
                new VariableAssignment(new Variable('y', false, false), '=', new NumberLiteral(5)),
                new Variable('y', false, false),
              ]
            )
          ),
          new MatchCase(
            new ListLiteral([new NumberLiteral(1), new StringLiteral('1')]),
            new FunctionLiteral([], [new NumberLiteral(1)])
          ),
        ],
        new FunctionLiteral(
          [],
          [
            new VariableAssignment(new Variable('y', false, false), '=', new StringLiteral('other')),
            new Variable('y', false, false),
          ]
        )
      ),
    ]),
  ],
  ['function call', 'prt(5)', new Block([new CallExpression(print, [new NumberLiteral(5)])])],
  [
    'function call with multiple args',
    `prt(
      5, "string",
    'new line'
    )`,
    new Block([
      new CallExpression(print, [new NumberLiteral(5), new StringLiteral('string'), new StringLiteral('new line')]),
    ]),
  ],
  ['function call with no args', 'prt( )', new Block([new CallExpression(print, [])])],
  // ['. operator', 'x.y', new Block([new AccessExpression(x, new Variable('y', false, false))])],
  // [
  //   'repeated . operator',
  //   `x.(z + 3).y`,
  //   new Block([])
  // ],
  // repeated ()
  // repeated []
  // combination of ., (), and []
  // function w/ 2 statements
  // functions that span multiple lines
  // function w/ rtn keyword and val
  // function w/ rtn keyword
]

chai.use(chaiExclude)

for (const [scenario, program, expected] of programs) {
  const actual = parse(tokenize(program as string))
  try {
    // @ts-expect-error
    chai.assert.deepEqualExcludingEvery(actual, expected, ['srcCode'])
  } catch {
    console.log('Expected:')
    console.dir(expected, { depth: null })
    console.log('But got:')
    console.dir(actual, { depth: null })
    throw new Error(`${scenario} failed`)
  }
  console.log(`${scenario} passes`)
}
