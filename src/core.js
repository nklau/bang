export class Program {
  constructor(statements) {
    this.statements = statements
  }
}

export class BangFunc {
  constructor(statements) {
    this.statements = statements
  }
}

export class VariableDec {
  constructor(id, isLocal, isReadOnly, assignmentOp, exp) {
    Object.assign(this, { id, isLocal, isReadOnly, assignmentOp, exp })
  }
}

export class PrintStatement {
  constructor(exp) {
    this.exp = exp
  }
}

export class ReturnStatement {
  constructor(exp) {
    this.exp = exp
  }
}

export class Conditional {
  constructor(cond, block, alternative) {
    Object.assign(this, { cond, block, alternative })
  }
}

export class UnaryExp {
  constructor(op, exp) {
    this.op = op
    this.exp = exp
  }
}

export class BinaryExp {
  constructor(left, right, op) {
    Object.assign(this, { left, right, op })
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

export class FuncDec {
  constructor(params, block) {
    this.params = params
    this.block = block
  }
}

export class FuncLit {
  constructor(args, block) {
    this.args = args
    this.block = block
  }
}

export class Object {
  constructor(fields) {
    this.fields = fields
  }
}

export class List {
  constructor(exps) {
    this.exps = exps
  }
}

export class Var {
  constructor(name, exp) {
    this.name = name
    this.exp = exp
  }
}

export class MatchExp {
  constructor(cond, clauses) {
    this.cond = cond
    this.clauses = clauses
  }
}

export class MatchClause {
  constructor(isDefault, matchCase, block) {
    Object.assign(this, { isDefault, matchCase, block })
  }
}

export class Enum {
  constructor(name, cases) {
    this.name = name
    this.cases = cases
  }
}

// TODO: this could probably just be Var?
export class EnumVal {
  constructor(name, exp) {
    this.name = name
    this.exp = exp
  }
}