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
      main()
    `
  }
]

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(fixture.source)))
      // console.log(actual) // for debug
      assert(actual.endsWith(fixture.expected))
      // fs.writeFile('out.js', actual, (err) => { // for debug
      //   if (err) throw err
      // })
    })
  }
})