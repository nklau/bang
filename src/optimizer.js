import * as core from './core.js'
// TODO:
//
//   - assignments to self (x = x) turn into no-ops
//   - constant folding
//   - some strength reductions (+0, -0, *0, *1, etc.)
//   - Conditionals with constant tests collapse into a single arm
//   - Unrolling loops
//  - Dead code elimination (if a variable is never read, it can be removed)
//  - Dead code elimination (if a loop is never entered, it can be removed)
//  - Dead code elimination (if a conditional is never entered, it can be removed)
//  - Dead code elimination (if a conditional has no statements, it can be removed)

export default function optimize(node) {
  // return node;
  return optimizers[node.constructor.name](node) ?? node
}

const optimizers = {
  Block(b) {
    if (b.statements.length === 0) {
      return []
    } // TODO this might cause bugs - to test, optimize then run an empty block

    b.statements = b.statements.flatMap((statement) => optimize(statement))
    return b
  },
  VarDec(v) {
    v.exp = optimize(v.exp)
    return v
  },
  Assign(a) {
    a.exp = optimize(a.exp)
    return a
  },
  ReturnStatement(r) {
    r.exp = optimize(r.exp)
    return r
  },
  Ternary(t) {
    const trueBlock = t.block.statements > 0 ? optimize(t.block) : []
    const falseBlock = t.alt ? optimize(t.alt) : []
    const trueCond = {
      [core.List]: (cond) => cond.length > 0,
      [core.Obj]: (cond) => cond.size > 0,
      [core.Str]: (cond) => cond.length > 0,
      [core.Num]: (cond) => cond !== 0,
      [core.Bool]: (cond) => cond,
      [core.Nil]: (_cond) => false,
    }[t.cond.constructor](t.cond.val)
    return trueCond ? trueBlock : trueCond === undefined ? t : falseBlock
  },
  BinaryExp(b) {
    if (b.op === '.') {
      const left = b.left.constructor
      if (
        {
          nil: left === core.Nil,
          bool: left === core.Bool,
          num: left === core.Num,
          str: left === core.Str,
          obj: left === core.Obj,
          list: left === core.List,
        }[b.right]
      ) {
        return optimize(b.left)
      }
    }
    // TODO constant folding for ||, &&
    return b
  },
  NaryExp(n) {
    // TODO equality comparisons with constants (remember that it's nary!)
    // TODO constant folding for +, -, *, /, %, **
    return n
  },
  UnaryExp(u) {
    // TODO negating a constant
    return u
  },
  Call(c) {
    c.id = optimize(c.id)

    if ([core.List, core.Obj, core.Str, core.Num, core.Bool, core.Nil].includes(c.id.constructor)) { 
      return c.id
    }

    c.args = optimize(c.args)
    return c
  },
  Var(v) {
    return v
  },
  VarSubscript(v) {
    return v
  },
  Subscription(s) {
    return s
  },
  Func(f) {
    return f
  },
  Params(p) {
    return p
  },
  KeywordParam(k) {
    return k
  },
  Args(a) {
    return a
  },
  KeywordArg(k) {
    return k
  },
  Obj(o) {
    return o
  },
  ObjField(o) {
    return o
  },
  List(l) {
    return l
  },
  Str(s) {
    return s
  },
  FormattedStr(f) {
    return f
  },
  Num(n) {
    return n
  },
  Bool(b) {
    return b
  },
  MatchExp(m) {
    return m
  },
  MatchBlock(m) {
    return m
  },
  MatchCase(m) {
    return m
  },
  DefaultMatchCase(d) {
    return d
  },
  Nil(n) {
    return n
  },
  PostIncrement(p) {
    return p
  },
  PostDecrement(p) {
    return p
  },
  PreIncrement(p) {
    return p
  },
  PreDecrement(p) {
    return p
  },
  Array(a) {
    return a
  },
}
