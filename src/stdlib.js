import * as core from "./core.js"

export const contents = Object.freeze({
  print: new core.Var('print', false, true, ['function']),
  range: new core.Var('range', false, true, ['function'])
})