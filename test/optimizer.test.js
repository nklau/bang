import assert from 'assert/strict'
import analyze from '../src/analyzer.js'
import optimize from '../src/optimizer.js'
import generate from '../src/generator.js'

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, '').trim()
}

const fixtures = [
  {
    name: 'coercing a number to a number gets optimized away',
    source: `1.num`,
    expected: dedent`
    function main()
    {
      return new Num(1);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `1`,
  },
  {
    name: 'constant folding for adding two numbers',
    source: `1 + 2`,
    expected: dedent`
    function main()
    {
      return new Num(3);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `3`,
  },
  {
    name: 'constant folding for subtracting two numbers',
    source: `1 - 2`,
    expected: dedent`
    function main()
    {
      return new Num(-1);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `-1`,
  },
  {
    name: 'constant folding for dividing two numbers',
    source: `1 / 2`,
    expected: dedent`
    function main()
    {
      return new Num(0.5);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `0.5`,
  },
  {
    name: 'constant folding for multiplying two numbers',
    source: `1 * 2`,
    expected: dedent`
    function main()
    {
      return new Num(2);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `2`,
  },
  {
    name: 'constant folding for modulo two numbers',
    source: `1 % 2`,
    expected: dedent`
    function main()
    {
      return new Num(1);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `1`,
  },
  {
    name: 'constant folding for exponentiating two numbers',
    source: `2 ** 4`,
    expected: dedent`
    function main()
    {
      return new Num(16);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `16`,
  },
  {
    name: 'constant folding for adding three numbers',
    source: `1 + 2 + 3`,
    expected: dedent`
    function main()
    {
      return new Num(6);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `6`,
  },
]

const runTest = async (fixture) => {
  it(`produces expected js output for the ${fixture.name} program`, () => {
    const actual = generate(optimize(analyze(fixture.source)))
    if (!actual.endsWith(fixture.expected)) {
      console.log(actual) // for debug
      assert(false)
    }
    let result = []
    const cons = {
      log: (...args) => result.push(args),
    }
    eval(`((console) => { ${actual} })`)(cons)
    result = result.join('\n')
    if (result !== fixture.output) {
      console.log(result) // for debug
      assert(false)
    }
    assert.deepEqual(result, fixture.output)
  })
}

describe('The code generator', async () => {
  if (process.env.npm_config_last) {
    await runTest(fixtures[fixtures.length - 1])
  } else {
    for (const fixture of fixtures) {
      runTest(fixture)
    }
  }
})
