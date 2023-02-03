export class Program {
  constructor(block) {
    this.block = block
  }
}

export class Block {
  constructor(statements) {
    this.statements = statements
  }
}

export class VariableDec {
  constructor(id, isLocal, isReadOnly, assignmentOp, exp) {
    Object.assign(this, { id, isLocal, isReadOnly, assignmentOp, exp })
  }
}

export class ReturnStatement {
  constructor(exp) {
    this.exp = exp
  }
}

export class Ternary {
  constructor(cond, block, alternative) {
    Object.assign(this, { cond, block, alternative })
  }
}

export class BinaryExp {
  constructor(left, right, op) {
    Object.assign(this, { left, right, op })
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
  constructor(id, field) {
    this.id = id
    this.field = field
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

export class List {
  constructor(exps) {
    this.exps = exps
  }
}

export class StrLit {
  constructor(chars) {
    this.chars = chars
  }
}

export class FormattedStr {
  constructor(substrs) {
    this.substrs = substrs
  }
}

export class FormattedStrExp {
  constructor(exp) {
    this.exp = exp
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
  constructor(matchCases, block) {
    Object.assign(this, { isDefault, matchCases, block })
  }
}

export class DefaultMatchCase {
  constructor(block) {
    this.block = block
  }
}

export class Enum {
  constructor(name, cases) {
    this.name = name
    this.cases = cases
  }
}

export class EnumBlock {
  constructor(cases) {
    this.cases = cases
  }
}

export class EnumCase {
  constructor(name, value) {
    this.name = name
    this.value = value ?? name
  }
}