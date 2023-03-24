import assert from "assert/strict"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"
import * as fs from 'fs'
import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execute = promisify(exec)

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

const fixtures = [
  {
    name: 'num_add',
    source: `
      1 + 2
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(1),'+',new Num(2)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '3'
  },
  {
    name: 'print',
    source: `
    print(1)
    `,
    expected: dedent`
      function main()
      {
        try {
          return console.log(coerce(new Num(1), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '1'
  },
  {
    name: 'print_num_add',
    source: `
    print(1 + 2)
    `,
    expected: dedent`
      function main()
      {
        try {
          return console.log(coerce((add(new Num(1),'+',new Num(2))), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '3'
  },
  {
    name: 'chained_num_add',
    source: `
    10 + 153 + 0
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10),'+',new Num(153),'+',new Num(0)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '163'
  },
  {
    name: 'num_subtraction',
    source: `5 - 3`,
    expected: dedent`
    function main()
      {
        return (add(new Num(5),'-',new Num(3)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '2'
  },
  {
    name: 'num_over-subtraction',
    source: `3 - 5`,
    expected: dedent`
    function main()
      {
        return (add(new Num(3),'-',new Num(5)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '-2'
  },
  {
    name: 'chained_num_subtraction',
    source: `
    10 - 153 - 0
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10),'-',new Num(153),'-',new Num(0)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '-143'
  },
  {
    name: 'num_add_and_subtraction',
    source: `
    10 - 153 + 163
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10),'-',new Num(153),'+',new Num(163)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '20'
  }
]

describe("The code generator", () => {
  const outputDir = path.join(path.resolve(), 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  exec(`rm ${path.join(outputDir, '*')}`)

  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, async () => {
      const actual = generate(optimize(analyze(fixture.source)))
      // console.log(path.resolve())
      // console.log(actual) // for debug
      assert(actual.endsWith(fixture.expected))
      fs.writeFile(`output/${fixture.name}.js`, actual, (err) => { // for debug
        if (err) throw err
      })
      let output = await execute(`node ${fixture.name}.js`, { encoding: 'utf8', cwd: outputDir })
      assert.deepEqual(output.stdout.trim(), fixture.output)
    })
  }
})