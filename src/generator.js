import { contents } from './stdlib.js'
import * as core from './core.js'

export default function generate(program) {
  const output = []

  /* var names will be suffixed with _1, _2, _3, etc in JS. This is because
  JS has reserved keywords that Bang! does not have. */

  const varName = (mapping => {
    return entity => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1)
      }

      return `${entity.name}_${mapping.get(entity)}`
    }
  })(new Map())

  const gen = node => generators[node.constructor.name](node)

  const generators = {
    Block(b) {
      gen(b.statements)
    },
    VarDec(v) {
      output.push(`let ${varName(v.var)} = ${gen(v.exp)};`)
    },
    Assign(a) {
      output.push(`${varName(a.var)} = ${gen(a.exp)};`)
    },
    ReturnStatement(r) {
      output.push(`return ${gen(r.exp)};`)
    },
    BreakStatement(_b) {
      output.push(`throw new Error('break');`)
    },
    Ternary(t) {
      return `${gen(t.cond)} ? ${gen(t.block)} : ${t.alt ? gen(t.alt) : 'undefined'};`
    },
    BinaryExp(b) {
      const op = { '==': '===', '!=': '!==' }[b.op] ?? b.op
      return `(${b.left}${op}${b.right})`
    },
    NaryExp(n) {
      // TODO embed in ()
    },
    UnaryExp(u) {
      // TODO
      // if u.op == !
        // coerce u.exp to bool
      // if u.op == -
        // handle all types
      // if u.op == ...
        // handle all types
    },
    Call(c) {
      // TODO embed in try catch
    },
    VarSubscript(v) {
      // TODO
    },
    Subscription(s) {
      // TODO handle all types
      // slice()?
    },
    Func(f) {
      // TODO
    },
    Params(p) {
      // TODO
    },
    KeywordParam(k) {
      // TODO
    },
    Args(a) {
      // TODO
    },
    KeywordArg(k) {
      // TODO
    },
    Obj(o) {
      // TODO
    },
    ObjField(o) {
      // TODO
    },
    List(l) {
      // TODO
    },
    Str(s) {
      // TODO
    },
    FormattedStr(f) {
      // TODO
    },
    Num(n) {
      // TODO
    },
    Bool(b) {
      // TODO
    },
    MatchExp(m) {
      // TODO use JS switch
    },
    MatchBlock(m) {
      // TODO
    },
    MatchCase(m) {
      // TODO check for multiple cases, use JS fall-through
    },
    DefaultMatchCase(d) {
      // TODO
    },
    Nil(n) {
      return 'undefined'
    },
  }

  gen(program)
  return output.join('\n')
}