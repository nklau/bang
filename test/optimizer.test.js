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
