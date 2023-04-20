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

export default function optimize(node) {
  // return node;
  return optimizers[node.constructor.name](node) ?? node
}

const optimizers = {
  Block(b) {
    b.statements = b.statements.map(optimize)
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
    // TODO
    // t.condition = optimize(t.condition)
    // t.then = optimize(t.then)
    // t.else = optimize(t.else)
    return t
  },
  BinaryExp(b) {
    // TODO
    return b
  },
  NaryExp(n) {
    // TODO
    return n
  },
  UnaryExp(u) {
    // TODO negating a constant
    return u
  },
  Call(c) {
    // TODO calling a constant returns itself anyways
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
