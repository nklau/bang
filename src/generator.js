import { contents, types, stdFuncs, stdLibFuncs } from './stdlib.js'
import * as core from './core.js'

export default function generate(program) {
  let output = []

  types.forEach(t => output.push(t))

  output = [...output, ...stdFuncs]

  // TODO change this to be randomly generated?
  /* var names will be suffixed with _1, _2, _3, etc in JS. This is because
  JS has reserved keywords that Bang! does not have. */

  const varName = (mapping => {
    return entity => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1)
      }

      return `${entity.id}_${mapping.get(entity)}`
    }
  })(new Map())

  const gen = node => generators[node.constructor.name](node)

  const generators = {
    Block(b) {
      output.push('{')
      gen(b.statements)
      output.push('}')
    },
    VarDec(v) {
      output.push(`let ${varName(v.var)} = ${gen(v.exp)};`)
    },
    Assign(a) {
      output.push(`${varName(a.var)} = ${gen(a.exp)};`)
    },
    ReturnStatement(r) {
      const exp = `return ${gen(r.exp)};`
      if (r.exp instanceof core.Call) {
        output.push('try {', exp, '} catch {}')
      } else {
        output.push(exp)
      }
    },
    BreakStatement(_b) {
      output.push(`throw new Error('break');`)
    },
    Ternary(t) {
      return `${gen(t.cond)} ? ${gen(t.block)} : ${t.alt ? gen(t.alt) : 'undefined'};`
    },
    BinaryExp(b) {
      if (b.op === '.') {
        const coercion = {
          nil: 'nil',
          bool: 'boolean',
          num: 'number',
          str: 'string',
          obj: 'object',
          list: 'list',
          func: 'function'
        }[b.right]

        if (coercion) {
          return `(coerce(${b.left}, ${coercion}))`
        }
      }

      return `(${b.left}${b.op}${b.right})`
    },
    NaryExp(n) {
      if (n.exp.length === 1) {
        // else, n.exp must have at least length 3
        return `(${gen(n.exp[0])})`
      }

      const equalityOps = ['==', '!=', '<', '>', '<=', '>=']
      
      if (equalityOps.includes(n.exp[1])) {
        let elements = []

        const subExps = n.exp.reduce(
          (arr, val, i) => (typeof val === 'string' ? [...arr, [val, [n.exp[i - 1], n.exp[i + 1]]]] : arr),
          []
        )

        subExps.forEach(([op, [left, right]]) => {
          const [lhs, rhs] = [gen(left), gen(right)]
          const translations = {
            '==': `${lhs}.equals(${rhs})`,
            '!=': `!(${lhs}.equals(${rhs}))`,
            '<': `coerce(${lhs}, 'number').val < coerce(${rhs}, 'number).val`,
            '>': `coerce(${lhs}, 'number').val > coerce(${rhs}, 'number).val`,
            '<=': `(coerce(${lhs}, 'number').val < coerce(${rhs}, 'number).val || ${lhs}.equals(${rhs}))`,
            '>=': `(coerce(${lhs}, 'number').val > coerce(${rhs}, 'number).val || ${lhs}.equals(${rhs}))`
          }

          elements.push(translations[op])
        })

        return `(${elements.join(' && ')})`
      } else {
        const addOps = ['+', '-']
        const multOps = ['/', '*', '%']

        const elements = n.exp.map(e => typeof e === 'string' ? `'${e}'` : gen(e))
        const opType = addOps.includes(n.exp[1]) ? 'add' : multOps.includes(n.exp[1]) ? 'multiply' : 'exponentiate'
        return `(${opType}(${elements}))`
      }
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
      const target = stdLibFuncs[c.id]
      // target = target ? target(gen(c.args)) : `${gen(c.id)}(${gen(c.args)})`
//       output.push(`try {
// ${target}
// } catch {}`)
      return target ? target(gen(c.args)) : `${gen(c.id)}(${gen(c.args)})`
      // if c.id instanceof core.BinaryExp {
        // switch c.id.right
        // case 'loop'
      // }
    },
    Var(v) {
      return varName(v)
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
      return a.args.map(gen)
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
    Nil(_n) {
      return 'nil'
    },
    PostIncrement(p) {
      // TODO replace with += or smth
      // nvm JS allows (x++) + (x++)
    },
    PostDecrement(p) {
      // TODO replace with -= or smth
    },
    PreIncrement(p) {
      // TODO replace with += or smth
    },
    PreDecrement(p) {
      // TODO replace with -= or smth
    },
    Array(a) {
      return a.map(gen)
    }
  }

  output.push('function main()')
  gen(program)
  output.push('main();')
  return output.join('\n')
}