import assert from "assert/strict"
import util from "util"
import compile from "../src/compiler.js"

const sampleProgram = "print(0)"

describe("The compiler", () => {
  it("throws when the output type is unknown", done => {
    assert.throws(() => compile("print(0);", "blah"), /Unknown output type/)
    done()
  })
  it("accepts the analyzed option", done => {
    const compiled = compile(sampleProgram, "analyzed")
    assert(util.format(compiled).startsWith("   1 | Block"))
    done()
  })
  it("accepts the optimized option", done => {
    const compiled = compile(sampleProgram, "optimized")
    assert(util.format(compiled).startsWith("   1 | Block"))
    done()
  })
  // it("generates js code when given the js option", done => {
  //   const compiled = compile(sampleProgram, "js")
  //   assert(util.format(compiled).startsWith("console.log(0)"))
  //   done()
  // })
})