import assert from "assert/strict"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"
import * as fs from 'fs'

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

const fixtures = [
  {
    name: 'num add',
    source: `
      1 + 2
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(1),'+',new Num(2)));
      }
      main();
    `
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
      main();
    `
  },
  {
    name: 'print num add',
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
      main();
    `
  },
  {
    name: 'chained num add',
    source: `
    10 + 153 + 0
    `,
    expected: dedent`
    function main()
    {
      return (add(new Num(10),'+',new Num(153),'+',new Num(0)));
    }
    main();
    `
  },
  {
    name: 'subtraction',
    source: `5 - 3`,
    expected: dedent`
    function main()
      {
        return (add(new Num(5),'-',new Num(3)));
      }
      main();
    `
  },
  {
    name: 'over-subtraction',
    source: `3 - 5`,
    expected: dedent`
    function main()
      {
        return (add(new Num(3),'-',new Num(5)));
      }
      main();
    `
  }
]

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(fixture.source)))
      // console.log(actual) // for debug
      assert(actual.endsWith(fixture.expected))
      // if (fixture.name === 'over-subtraction') {
      //   fs.writeFile(`output/${fixture.name}.js`, actual, (err) => { // for debug
      //     if (err) throw err
      //   })
      // }
    })
  }
})