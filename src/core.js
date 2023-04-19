import util from 'util'

export class List {
  static typeDescription = 'list'

  constructor(val = []) {
    this.val = val
  }

  get default() {
    return new List()
  }

  get type() {
    return List.typeDescription
  }
}

export class Obj {
  static typeDescription = 'object'

  constructor(val = []) {
    this.val = val
  }

  get default() {
    return new Obj()
  }

  get type() {
    return Obj.typeDescription
  }
}

export class ObjField {
  constructor(key, val) {
    this.key = key
    this.val = val
  }
}

export class Str {
  static typeDescription = 'string'

  constructor(val = '') {
    this.val = val
  }

  get default() {
    return new Str()
  }

  get type() {
    return Str.typeDescription
  }
}

export class FormattedStr extends Str {
  constructor(val = []) {
    super(val)
  }

  get default() {
    return new FormattedStr()
  }
}

export class Num {
  static typeDescription = 'number'

  constructor(val = 0) {
    this.val = Number(val)
  }

  get default() {
    return new Num()
  }

  get type() {
    return Num.typeDescription
  }
}

export class Bool {
  static typeDescription = 'boolean'

  constructor(val = false) {
    this.val = val === 'true' || val === true
  }

  get default() {
    return new Bool()
  }

  get type() {
    return Bool.typeDescription
  }
}

export class Nil {
  static typeDescription = 'nil'

  get type() {
    return Nil.typeDescription
  }
}

export class Func {
  static typeDescription = 'function'

  constructor(params, block) {
    this.params = params
    this.block = block
  }

  get default() {
    return new Func(
      new Params(),
      new Block()
    )
  }

  get type() {
    return Func.typeDescription
  }
}

export class Params {
  constructor(params = []) {
    this.params = params
  }
}

export class KeywordParam {
  constructor(id, val) {
    this.id = id
    this.val = val
  }

  equals(other) {
    return other instanceof KeywordParam && this.id === other.id && this.val === other.val
  }

  toString() {
    return `${this.id} = ${this.val.toString()}`
  }
}

export class Block {
  constructor(statements = []) {
    this.statements = statements
  }

  get type() {
    let returns = []
    this.statements.filter(s => s instanceof ReturnStatement).forEach(r => {
      let types = r.type
      types = types instanceof Set ? [...types] : [types]
      returns.push(types)
    })

    if (returns.length === 0) {
      return Nil.typeDescription
    }

    return new Set(returns.flat())
  }

  get default() {
    const t = getType(this.type)

    return getDefault(t)
  }

  equals(other) {
    return other instanceof Block && JSON.stringify(this.statements) === JSON.stringify(other.statements)
  }

  toString() {
    return `{\n${this.statements.join('\n')}\n}`
  }
}

export class VarDec {
  constructor(variable, exp = new Nil()) {
    this.var = variable
    this.exp = exp
  }
}

export class Var {
  constructor(id, local, readOnly, type = ['any']) {
    Object.assign(this, { id, local, readOnly })
    this.type = new Set(type)
  }

  get default() {
    return getDefault(this.type.size === 1 ? this.type.values().next().value : getType(this.type, true))
  }

  toString() {
    return this.id
  }
}

export class Assign {
  constructor(variable, exp = new Nil()) {
    this.var = variable
    this.exp = exp
  }
}

export class VarSubscript {
  constructor(id, selector) {
    this.id = id
    this.selector = selector
  }
}

export class Subscription {
  constructor(left, right) {
    this.left = left
    this.right = right
    // indices may be out of bounds
  }
}

export class ReturnStatement {
  constructor(exp) {
    this.exp = exp ?? new Nil()
  }

  get type() {
    let [e, t] = [this.exp]
    while (!t) {
      t = e.type
      e = e.exp
    }
    return t
  }
}

export class BreakStatement {
  constructor() { }
}

export class Ternary {
  constructor(cond, block, alt) {
    Object.assign(this, { cond, block, alt: alt })
  }

  get type() {
    let [blockType, altType] = [this.block.type, this.alt?.type]
    blockType = blockType instanceof Set ? [...blockType] : [blockType]

    if (altType) {
      altType = altType instanceof Set ? [...altType] : [altType]
      return new Set([...blockType, ...altType])
    } else {
      return new Set(blockType)
    }
  }
}

export class NaryExp {
  constructor(exp) {
    this.exp = exp
  }

  get type() {
    const equalityOps = ['>=', '<=', '>', '<', '==', '!=']
    if (this.exp.some(e => equalityOps.includes(e))) {
      return Bool.typeDescription
    }

    return getType(this.exp)
  }

  get default() {
    return getDefault(this.type)
  }
}

export class BinaryExp {
  constructor(left, op, right) {
    Object.assign(this, { left, op, right })
  }

  get type() {
    const boolOps = ['||', '&&']
    if (boolOps.includes(this.op)) {
      return Bool.typeDescription
    }

    if (this.op === '.') {
      return 'any'
    }

    // if (this.op === '.') {
    //   return this.right.type
    // }

    return getType([this.left, this.right])
  }

  get default() {
    return getDefault(this.type)
  }
}

export class UnaryExp {
  constructor(exp, op) {
    this.exp = exp
    this.op = op
  }

  get type() {
    return this.op === '!' ? Bool.typeDescription : this.exp.type
  }
}

export class PreIncrement {
  constructor(exp) {
    this.exp = exp
  }
}

export class PreDecrement {
  constructor(exp) {
    this.exp = exp
  }
}

export class PostIncrement {
  constructor(exp) {
    this.exp = exp
  }
}

export class PostDecrement {
  constructor(exp) {
    this.exp = exp
  }
}

export class Call {
  constructor(id, args) {
    this.id = id
    this.args = args
  }
}

export class Args {
  constructor(args) {
    this.args = args
  }
}

export class KeywordArg {
  constructor(id, val) {
    this.id = id
    this.val = val
  }
}

export class MatchExp {
  constructor(cond, clauses) {
    this.cond = cond
    this.clauses = clauses
  }
}

export class MatchBlock {
  constructor(cases) {
    this.cases = cases
  }
}

export class MatchCase {
  constructor(conds, block) {
    Object.assign(this, { conds, block })
  }
}

export class DefaultMatchCase {
  constructor(block) {
    this.block = block
  }
}

// Throw an error message that takes advantage of Ohm's messaging
export function error(message) {
  throw new Error(message)
}

Block.prototype[util.inspect.custom] = function () {
  const tags = new Map()

  // Attach a unique integer tag to every node
  function tag(node) {
    if (tags.has(node) || typeof node !== "object" || node === null) return
    tags.set(node, tags.size + 1)
    for (const child of Object.values(node)) {
      Array.isArray(child) || child instanceof Set ? child.forEach(tag) : tag(child)
    }
  }

  function* lines() {
    function view(e) {
      if (tags.has(e)) return `#${tags.get(e)}`
      if (Array.isArray(e)) return `[${e.map(view)}]`
      if (e instanceof Set) return `[${[...e].map(view)}]`
      return util.inspect(e)
    }
    for (let [node, id] of [...tags.entries()].sort((a, b) => a[1] - b[1])) {
      let type = node.constructor.name
      let props = Object.entries(node).map(([k, v]) => `${k}=${view(v)}`)
      yield `${String(id).padStart(4, " ")} | ${type} ${props.join(" ")}`
    }
  }

  tag(this)
  return [...lines()].join("\n")
}

const getDefault = (t) => {
  const types = { [List.typeDescription]: List, [Obj.typeDescription]: Obj, [Str.typeDescription]: Str, [Num.typeDescription]: Num, [Bool.typeDescription]: Bool, [Func.typeDescription]: Func }

  for (const [typeDescription, type] of Object.entries(types)) {
    if (t === typeDescription) {
      return new type().default
    }
  }

  return new Nil()
}

const arrayEquals = (a, b) => {
  return a.length === b.length && a.every((val, index) => val === b[index] || (typeof val.equals === 'function' && val.equals(b[index])))
}

export const getType = (exps, defaultType = 'any', weakest = false) => {
  const types = [List.typeDescription, Obj.typeDescription, Str.typeDescription, Num.typeDescription, Bool.typeDescription]

  for (const type of weakest ? types.slice().reverse() : types) {
    if ([...exps].some(e => {
      let t = e.type
      if (e instanceof Var) {
        t = getType(e.type, 'any', true)
      }
      return t === type || e === type
    })) {
      return type
    }
  }

  return defaultType
}