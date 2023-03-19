import { contents, types, coerce } from './stdlib.js'
import * as core from './core.js'

export default function generate(program) {
  const output = [coerce]

  types.forEach(t => output.push(t))

  // TODO change this to be randomly generated?
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
      // TODO what if v.exp is a var
      output.push(`let ${varName(v.var)} = ${gen(v.exp)};`)
    },
    Assign(a) {
      // TODO what if v.exp is a var
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
      // switch b.right
        // case 'nil'
        // case 'bool'
        // case 'num'
        // case 'str'
        // case 'obj'
        // case 'list'
      return `(${b.left}${b.op}${b.right})`
    },
    NaryExp(n) {
      // TODO embed in ()
      // if (b.op === '==') {
      //   return `(${b.left}.equals(${b.right}))`
      // } else if (b.op === '!=') {
      //   return `!(${b.left}.equals(${b.right}))`
      // }
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
      // if c.id instanceof core.BinaryExp {
        // switch c.id.right
        // case 'loop'
      // }
    },
    VarSubscript(v) {
      // TODO
    },
    Subscription(s) {
      // TODO handle all types
      // slice()?
    },
    Func(f) {
      // TODO construct function
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
      // TODO construct object
    },
    ObjField(o) {
      // TODO
    },
    List(l) {
      return `new List(${l.val})`
    },
    Str(s) {
      return `new Str(${s.val})`
    },
    FormattedStr(f) {
      return `new Str(${f.toString()})`
    },
    Num(n) {
      return `new Num(${n.val})`
    },
    Bool(b) {
      return `new Bool(${b.val})`
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