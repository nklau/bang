import { contents, types, stdFuncs, stdLibFuncs } from './stdlib.js'
import * as core from './core.js'

export default function generate(program) {
  let output = []

  types.forEach((t) => output.push(t))

  output = [...output, ...stdFuncs]

  /* var names will be suffixed with _0, _1, _2, etc in JS. This is because
  JS has reserved keywords that Bang! does not have. */

  const varName = ((mapping) => {
    return (entity) => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size)
      }

      return `${entity.id}_${mapping.get(entity)}`
    }
  })(new Map())

  /* internal var names will look like _internal0, _internal1, _internal2, etc in JS.
  These are to ensure that the variables needed for internal usage do not interfere with user vars. */

  const internalVarName = ((count) => {
    return (num) =>
      `_internal${num === undefined || count <= num ? count++ : num}`
  })(1)

  const gen = (node) => generators[node.constructor.name](node)

  const generators = {
    Block(b) {
      output.push('{')
      b.statements.forEach((statement) => {
        if (statement instanceof core.Call) {
          output.push('try {', `${gen(statement)};`, '} catch {}')
        } else {
          output.push(gen(statement))
        }
      })
      output.push('}')
    },
    VarDec(v) {
      return `let ${varName(v.var)} = ${gen(v.exp)};`
    },
    Assign(a) {
      return `${varName(a.var)} = ${gen(a.exp)};`
    },
    ReturnStatement(r) {
      const exp = gen(r.exp)
      const returnExp = []
      if (r.exp instanceof core.Call) {
        const id = internalVarName()
        returnExp.push(
          'try {',
          `let ${id} = ${exp};`,
          `return ${id};`,
          '} catch {}'
        )
      } else if (r.exp instanceof core.BreakStatement) {
        returnExp.push(exp)
      } else {
        returnExp.push(`return ${exp};`)
      }
      return returnExp.join('\n')
    },
    BreakStatement(_b) {
      return `throw new Error('break');`
    },
    Ternary(t) {
      return `${gen(t.cond)}.val ? (() => {${t.block.statements.map(gen).join('\n')}})() : (() => {${
        t.alt ? gen(t.alt) : 'return undefined;'
      }})();`
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
          func: 'function',
        }[b.right]

        if (coercion) {
          return `(coerce(${b.left}, ${coercion}))`
        }
      }

      return `(${gen(b.left)}${b.op}${b.right})`
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
          (arr, val, i) =>
            typeof val === 'string'
              ? [...arr, [val, [n.exp[i - 1], n.exp[i + 1]]]]
              : arr,
          []
        )

        subExps.forEach(([op, [left, right]]) => {
          const [lhs, rhs] = [gen(left), gen(right)]
          const translations = {
            '==': `() => ${lhs}.equals(${rhs})`,
            '!=': `() => !(${lhs}.equals(${rhs}))`,
            '<': `() => coerce(${lhs}, Num.typeDescription).val < coerce(${rhs}, Num.typeDescription).val`,
            '>': `() => coerce(${lhs}, Num.typeDescription).val > coerce(${rhs}, Num.typeDescription).val`,
            '<=': `() => (coerce(${lhs}, Num.typeDescription).val < coerce(${rhs}, Num.typeDescription).val || ${lhs}.equals(${rhs}))`,
            '>=': `() => (coerce(${lhs}, Num.typeDescription).val > coerce(${rhs}, Num.typeDescription).val || ${lhs}.equals(${rhs}))`,
          }

          elements.push(`new Bool(${translations[op]})`)
        })

        return `(${elements.join(' && ')})`
      } else {
        const addOps = ['+', '-']
        const multOps = ['/', '*', '%']

        const elements = n.exp
          .map((e) => (typeof e === 'string' ? `'${e}'` : gen(e)))
          .join(', ')
        const opType = addOps.includes(n.exp[1])
          ? 'add'
          : multOps.includes(n.exp[1])
          ? 'multiply'
          : 'exponentiate'
        return `(${opType}(${elements}))`
      }
    },
    UnaryExp(u) {
      return {
        '!': () => {
          return `(!(coerce(${gen(u.exp)}, Bool.typeDescription).val))`
        },
        '-': () => {
          return `negate(${gen(u.exp)})`
        },
        '...': () => {
          // return `spread(${gen(u.exp)})`
          throw new Error('Spread operator not implemented')
        },
      }[u.op]()
    },
    Call(c) {
      const target = stdLibFuncs[c.id]
      return target ? target(gen(c.args)) : `${gen(c.id)}(${gen(c.args)})`
    },
    Var(v) {
      return varName(v)
    },
    VarSubscript(v) {
      return `subscript(${gen(v.id)}, ${gen(v.selector)})`
    },
    Subscription(s) {
      return `${gen(s.left)}, ${gen(s.right)}`
    },
    Func(f) {
      const params = gen(f.params)
      let body = []
      f.block.statements.forEach((statement) => {
        if (statement instanceof core.Call) {
          body.push('try {', `${gen(statement)};`, '} catch {}')
        } else {
          body.push(gen(statement))
        }
      })
      return `${params} => {${body.join('\n')}}`
    },
    Params(p) {
      return `(${p.params.map(gen).join(', ')})`
    },
    KeywordParam(k) {
      throw new Error('Keyword parameters not implemented')
    },
    Args(a) {
      return `${a.args.map(gen).join(', ')}`
    },
    KeywordArg(k) {
      throw new Error('Keyword arguments not implemented')
    },
    Obj(o) {
      return `new Obj(new Map([${o.val.map(gen).join(', ')}]))`
    },
    ObjField(o) {
      const key = gen(o.key)
      return `[${key.substring(8, key.length - 1)}, ${gen(o.val)}]`
    },
    List(l) {
      return `new List([${l.val.map(gen).join(', ')}])`
    },
    Str(s) {
      return `new Str('${s.val}')`
    },
    FormattedStr(f) {
      let outStr
      if (f.val.length === 0) {
        outStr = ''
      } else {
        outStr = f.val.reduce((str, element) => {
          if (typeof element === 'string') {
            str += element
          } else {
            str += `\${coerce(${gen(element)}, Str.typeDescription).val}`
          }
          return str
        }, '')
      }
      return `new Str(\`${outStr}\`)`
    },
    Num(n) {
      return `new Num(${n.val})`
    },
    Bool(b) {
      return `new Bool(${b.val})`
    },
    MatchExp(m) {
      throw new Error('Match expressions not implemented')
      // const condition = gen(m.cond)
      // const firstConds = m.clauses.cases[0].conds.map(gen)
      // let exp = `if (${firstConds.map(cond => `${condition}.equals(${cond})`).join(' || ')}) ${gen(m.clauses.cases[0].block)}`
      // for (let i = 1; i < m.clauses.cases.length; i++) {
      //   exp += gen(m.clauses.cases[i])
      // }
      // return exp
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
      return `postInc(${gen(p.exp)})`
    },
    PostDecrement(p) {
      return `postDec(${gen(p.exp)})`
    },
    PreIncrement(p) {
      return `preInc(${gen(p.exp)})`
    },
    PreDecrement(p) {
      return `preDec(${gen(p.exp)})`
    },
    Array(a) {
      return a.map(gen)
    },
  }

  output.push('function main()')
  gen(program)
  output.push('const output = main();')
  output.push(
    `if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);`
  )
  return output.join('\n')
}
