import util from 'util'

export class List {
  static defaultVal = []
  static typeDescription = 'list'

  constructor(val) {
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
    return new List(List.defaultVal)
  }

  get type() {
    return List.typeDescription
  }
}

export class Obj {
  static defaultVal = []
  static typeDescription = 'object'

  constructor(val) {
    this.val = val
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    // TODO
  }

  fixRef() {
    // TODO
  }

  get len() {
    return this.val.length
  }

  get default() {
    return new Obj(Obj.defaultVal)
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
  static defaultVal = ''
  static typeDescription = 'string'

  constructor(val) {
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
    return new Str(Str.defaultVal)
  }

  get type() {
    return Str.typeDescription
  }
}

export class FormattedStr extends Str {
  static defaultVal = []

  constructor(val) {
    super(val)
  }

  equals(other) {
    // TODO
  }

  get default() {
    return new FormattedStr(FormattedStr.defaultVal)
  }
}

export class Num {
  static defaultVal = 0
  static typeDescription = 'number'

  constructor(val) {
    this.val = Number(val)
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    // TODO
  }

  get default() {
    return new Num(Num.defaultVal)
  }

  get type() {
    return Num.typeDescription
  }
}

export class Bool {
  static defaultVal = 'false'
  static typeDescription = 'boolean'

  constructor(val) {
    this.val = val === 'true' || val === true
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    // TODO
  }

  get default() {
    return new Bool(Bool.defaultVal)
  }

  get type() {
    return Bool.typeDescription
  }
}

export class Nil {
  static typeDescription = 'nil'

  static get default() {
    return undefined
  }

  get type() {
    return Nil.typeDescription
  }
}

export class Func {
  static defaultVal = []
  static typeDescription = 'function'

  constructor(params, block) {
    this.params = params
    this.block = block
  }

  equals(other) {
    return this.type === other.type 
      && this.params.params === other.params.params
      && this.block.statements === other.block.statements
  }

  get default() {
    return new Func(
      new Params(Func.defaultVal),
      new Block(Func.defaultVal)
    )
  }

  get type() {
    return Func.typeDescription
  }
}

export class Params {
  constructor(params) {
    this.params = params
  }
}

export class KeywordParam {
  constructor(id, val) {
    this.id = id
    this.val = val
  }
}

export class Block {
  constructor(statements) {
    this.statements = statements
  }
}

export class VarDec {
  constructor(variable, assignmentOp, exp) {
    Object.assign(this, { variable, assignmentOp, exp })
  }
}

export class Var {
  constructor(id, local, readOnly, type) {
    Object.assign(this, { id, local, readOnly, type })
  }
}

export class VarSubscript {
  constructor(id, selector) {
    this.id = id
    this.selector = selector
  }
}

export class VarSelect {
  constructor(id, selector) {
    this.id = id
    this.selector = selector
  }
}

export class ReturnStatement {
  constructor(exp) {
    this.exp = exp
  }
}

export class Ternary {
  constructor(cond, block, alt) {
    Object.assign(this, { cond, block, alt: alt })
  }
}

export class NaryExp {
  constructor(exp) {
    this.exp = exp
  }

  get type() {
    const types = [List.typeDescription, Obj.typeDescription, Str.typeDescription, Num.typeDescription, Bool.typeDescription]

    for (const type of types) {
      if (this.exp.some(e => { return e.type === type })) { 
        return type 
      }
    }
  }

  get default() {
    const types = [List, Obj, Str, Num, Bool]

    for (const type of types) {
      if (this.exp.some(e => { return e instanceof type })) {
        return new type().default
      }
    }
  }
}

export class BinaryExp {
  constructor(left, op, right) {
    Object.assign(this, { left, op, right })
  }
}

export class UnaryExp {
  constructor(exp, op) {
    this.exp = exp
    this.op = op
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
export function error(message, node) {
  if (node) {
    throw new Error(`${node.source.getLineAndColumnMessage()}${message}`)
  }
  throw new Error(message)
}

Block.prototype[util.inspect.custom] = function () {
  const tags = new Map()

  // Attach a unique integer tag to every node
  function tag(node) {
    if (tags.has(node) || typeof node !== "object" || node === null) return
    tags.set(node, tags.size + 1)
    for (const child of Object.values(node)) {
      Array.isArray(child) ? child.forEach(tag) : tag(child)
    }
  }

  function* lines() {
    function view(e) {
      if (tags.has(e)) return `#${tags.get(e)}`
      if (Array.isArray(e)) return `[${e.map(view)}]`
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