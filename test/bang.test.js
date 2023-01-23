import assert from "assert"
import { add } from "../src/bang.js"

describe("The compiler", () => {
  it("gives the correct values for the add function", function () {
    assert.equal(add(5, 8), 13)
    assert.equal(add(5, -8), -3)
  })
})
