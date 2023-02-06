import util from 'util'

export class Block {
  constructor(statements) {
    this.statements = statements
  }
}

export class VarDec {
  constructor(id, isLocal, isReadOnly, assignmentOp = '=', exp) {
    Object.assign(this, { id, isLocal, isReadOnly, assignmentOp, exp })
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

export class FuncLit {
  constructor(params, block) {
    this.params = params
    this.block = block
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

export class FormattedStr {
  constructor(subexps) {
    this.subexps = subexps
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

export class Enum {
  constructor(id, cases) {
    this.id = id
    this.cases = cases
  }
}

export class EnumBlock {
  constructor(cases) {
    this.cases = cases
  }
}

export class EnumCase {
  constructor(id, val) {
    this.id = id
    this.val = val ?? id
  }
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