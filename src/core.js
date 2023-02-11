import util from 'util'

export class Block {
  constructor(statements) {
    this.statements = statements
  }
}

export class VarDec {
  constructor(variable, assignmentOp = '=', exp) {
    Object.assign(this, { variable, assignmentOp, exp })
  }
}

export class Var {
  constructor(id, local, readOnly, type) {
    Object.assign(this, { id, local, readOnly, type })
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
}

export class BinaryExp {
  constructor(left, op, right) {
    Object.assign(this, { left, op, right })
  }
}

export class UnaryExp {
  constructor(exp, op, postOp = false) {
    this.exp = exp
    this.op = op
    this.returnBeforeEval = postOp
  }
}

export class Call {
  constructor(id, args) {
    this.id = id
    this.args = args
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

export class Func {
  constructor(params, block) {
    this.params = params
    this.block = block
    this.type = new FuncType()
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

export class Args {
  constructor(args) {
    this.args = args
  }
}

export class Obj {
  constructor(fields) {
    this.fields = fields
  }
}

export class ObjField {
  constructor(key, val) {
    this.key = key
    this.val = val
  }
}

export class List {
  constructor(list) {
    this.list = list
    this.type = new ListType()
  }
}

export class FormattedStr {
  constructor(subexps) {
    this.subexps = subexps
    this.type = new StrType()
  }
}

export class Bool {
  constructor(val) {
    this.val = val === 'true'
    this.type = new BoolType()
  }
}

export class Num {
  constructor(val) {
    this.val = Number(val)
    this.type = new NumType()
  }
}

export class Str {
  constructor(val) {
    this.val = val
    this.type = new StrType()
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

export class Type {
  static NIL = new Type('nil')
  static default = Type.NIL

  constructor(description) {
    this.description = description
  }

  isEquivalentTo(target) {
    return this == target
  }
}

export class NumType extends Type {
  static default = 0

  constructor() {
    super('number')
  }

  // TODO
  loop(block) {

  }
}

export class StrType extends Type {
  static default = ''

  constructor() {
    super('string')
  }

  // TODO
  get len() {

  }
}

export class BoolType extends Type {
  static default = false

  constructor() {
    super('boolean')
  }

  // TODO
  loop(block) {
    // while (this) {
    //   block.run()
    // }
  }
}

export class ListType extends Type {
  static default = []

  constructor() {
    super('list')
  }
}

export class FuncType extends Type {
  static default = () => {}

  constructor() {
    super('function')
  }
}

export class BangFuncType extends Type {
  static default = {}

  constructor() {
    super('bang function')
  }
}

export class ObjType extends Type {
  static default = {}

  constructor() {
    super('object')
  }

  fixRef() {
    // TODO
  }

  getVal(key) {
    // TODO
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