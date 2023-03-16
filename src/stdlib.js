import * as core from "./core.js"

export const contents = Object.freeze({
  print: new core.Var('print', false, true, ['function']),
  range: new core.Var('range', false, true, ['function']),
  _numLoop: new core.Var('loop', false, true, ['function']),
  _boolLoop: new core.Var('loop', false, true, ['function']),
  _strLoop: new core.Var('loop', false, true, ['function']),
  _listLoop: new core.Var('loop', false, true, ['function']),
  _objLoop: new core.Var('loop', false, true, ['function']),
  _numAdd: new core.Var('add', false, true, ['function']),
  _boolAdd: new core.Var('add', false, true, ['function']),
  _strConcat: new core.Var('add', false, true, ['function']),
  _listConcat: new core.Var('add', false, true, ['function']),
  _objMerge: new core.Var('add', false, true, ['function']),
})

const nil = 
`class Nil {
  static typeDescription = 'nil'

  get type() {
    return Nil.typeDescription
  }
}`

const bool =
`class Bool {
  static typeDescription = 'boolean'

  constructor(val = false) {
    this.val = val === 'true' || val === true
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    return this.type === other.type && this.val === other.val
  }

  get type() {
    return Bool.typeDescription
  }

  get str() {
    return String(this.val)
  }
}`

const num = 
`class Num {
  static typeDescription = 'number'

  constructor(val = 0) {
    this.val = val
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    return this.type === other.type && this.val === other.val
  }

  get type() {
    return Num.typeDescription
  }

  get str() {
    return String(this.val)
  }
}`

const str = 
`export class Str {
  static typeDescription = 'string'

  constructor(val = '') {
    this.val = val
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    // TODO
  }

  get len() {
    return this.val.length
  }

  get default() {
    return new Str()
  }

  get type() {
    return Str.typeDescription
  }

  equals(other) {
    return other instanceof Str && this.val === other.val
  }

  get str() {
    return this.val
  }
}`

const obj = 
`class Obj {
  static typeDescription = 'object'

  constructor(val = {}) {
    this.val = val
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    // TODO
  }

  get len() {
    return Object.keys(this.val).length
  }

  get default() {
    return new Obj()
  }

  get type() {
    return Obj.typeDescription
  }

  equals(other) {
    return this.type === other.type && arrayEquals(this.val, other.val)
  }

  get str() {
    if (this.val.len === 0) {
      return \`{}\`
    }

    const str = Object.entries(this.val).forEach(([key, val]) => {
      str += \`\${key.str()}: \${val.str()}, \`
    })

    return \`\${str.slice(0, -2)}\`
  }
}`
// TODO all type coercions to all other types using getters
const list =
`class List {
  static typeDescription = 'list'

  constructor(val = []) {
    this.val = val
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    // TODO
  }

  // getVal(key) {
  //   return this.val[key] ?? new Nil()
  //   // TODO
  // }

  get len() {
    return this.val.length
  }

  get default() {
    return new List()
  }

  get type() {
    return List.typeDescription
  }

  equals(other) {
    return this.type === other.type && arrayEquals(this.val, other.val)
  }

  get str() {
    if (this.val.length === 0) {
      return \`[]\`
    }

    const str = this.val.reduce((str, element) => {
      str += \`\${element.str()}, \`
    }, '')
    return \`[\${str.slice(0, -2)}]\`
  }
}`

const func =
`class Func {
  static typeDescription = 'function'

  constructor(val) {
    this.val = val
  }

  equals(other) {
    return this.type === other.type
      && this.val === other.val
  }

  get default() {
    return new Func(() => {})
  }

  get type() {
    return Func.typeDescription
  }

  get str() {
    return \`\${this.val.toString().replaceAll('=', '-')}\`
  }
}`

export const types = [nil, bool, num, str, obj, list, func]