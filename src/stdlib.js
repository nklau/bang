import * as core from "./core.js"

export const contents = Object.freeze({
  print: new core.Var('print', false, true, ['function']),
  range: new core.Var('range', false, true, ['function']),
  _numLoop: new core.Var('loop', false, true, ['function']),
  _boolLoop: new core.Var('loop', false, true, ['function']),
  _listLoop: new core.Var('loop', false, true, ['function']),
  _objLoop: new core.Var('loop', false, true, ['function']),
  _strLoop: new core.Var('loop', false, true, ['function'])
})