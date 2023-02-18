import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const bangGrammar = ohm.grammar(fs.readFileSync("src/bang.ohm"))
const d = { LIST: 'list', OBJ: 'object', STR: 'string', NUM: 'number', BOOL: 'boolean', NIL: 'nil', FUNC: 'function' }

// TODO: function to get type

function check(condition, message, node) {
  if (!condition) core.error(message, node)
}

function checkNotType(e, types) {
  const t = e?.type
  check(!types.includes(t), `Unexpected type ${t}`)
}

function checkSameTypes(e0, e1) {
  const [t0, t1] = [e0?.type, e1?.type]
  check(t0 === t1, `${t0} can never be equal to ${t1}`)
}

function isVar(e) {
  return e instanceof core.Var
}

function isList(e) {
  return e.type === d.LIST
}

function isObj(e) {
  return e.type === d.OBJ
}

function isStr(e) {
  return e.type === d.STR
}

function isNum(e) {
  return e.type === d.NUM
}

function isBool(e) {
  return e.type === d.BOOL
}

// TODO: is this needed?
function isNil(e) {
  return e.type === d.NIL
}

function isFunc(e) {
  return e.type === d.FUNC
}

function checkType(e, types) {
  check(types.includes(e?.type), `Unexpected type ${e?.type}`)
}

// function checkNotUndefined(e, name) {
//   check(e, `Variable may not have been initialized`)
// }

function checkNotLiteral(e) {
  const lits = [core.Str, core.Num, core.Bool, core.Nil]
  check(!lits.some(l => e instanceof l), 'Cannot mutate a literal')
}

function checkInBlock(context) {
  check(context.block, 'Cannot return outside a function')
}

function checkInLoop(context) {
  check(context.inLoop, 'Cannot break outside of loop')
}

// function checkBool(e) {
//   check(e.type.constructor === core.BoolType, 'Expected boolean')
// }

// function checkNum(e) {
//   check(e.type.constructor === core.NumType, 'Expected number')
// }

// function isList(e) {
//   return e.type.constructor === core.ListType
// }

// function isVar(e) {
//   return e.constructor === core.Var
// }

function coerceToBool(e) {
  return new core.Bool(!e?.equals(e?.default))
}

function mapOps(elements) {
  return elements.reduce(
    (map, val, i) => (typeof val === 'string' ? { ...map, [val]: [elements[i - 1], elements[i + 1]] } : map),
    {}
  )
}

// function isPreIncrement(e) {
//   return e instanceof core.UnaryExp
//     && e.op === '++'
//     && !e.postOp
// }

// function isPreDecrement(e) {
//   return e instanceof core.UnaryExp
//     && e.op === '--'
//     && !e.postOp
// }

// TODO: should be able to say break from inside a block that's nested in a loop
// TODO: should be able to say return from inside a loop that's nested in a block
class Context {
  constructor({ parent = null, locals = new Map(), inLoop = false, block: b = null }) {
    Object.assign(this, { parent, locals, inLoop, block: b })
  }

  sees(name) {
    // Search "outward" through enclosing scopes
    return this.locals.has(name) || this.parent?.sees(name)
  }

  lookup(name) {
    const entity = this.locals.get(name)
    return entity ? entity : this.parent?.lookup(name)
  }

  add(name, entity) {
    // check(
    //   !(!entity.local && entity.readOnly && this.locals.has(name)), 
    //   `Cannot assign to constant variable ${name}`, 
    //   node
    // )
    if (!entity.local && this.lookup(name)?.readOnly) {
      core.error(`Cannot assign to constant variable ${name}`)
    }
    // entity.local ? `_${name}` : name
    this.locals.set(name, entity)
    // return entity
  }

  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() })
  }
}

export default function analyze(sourceCode) {
  let context = new Context({})

  const analyzer = bangGrammar.createSemantics().addOperation("rep", {
    Program(body) {
      return body.rep()
    },
    Block(_n0, statements, statement, _n1) {
      const b = new core.Block()
      context = context.newChildContext({ inLoop: false, block: b })
      b.statements = [...(statements.rep()), ...statement.rep()]
      return b
    },
    StatementNewLine(statement, _space, _n) {
      return statement.rep()
    },
    Statement_varDec(local, readOnly, id, op, exp) {
      let [e, o, l, r, i] = [exp.rep(), op.sourceString, local.sourceString === 'local', readOnly.sourceString === 'const', id.sourceString]
      let v = context.lookup(i)
      if (e instanceof core.Var) {
        e = e.exp
      }

      if (op.sourceString === '=') {
        // if (l || !v) {
        //   v = new core.Var(i, l, r, e.type ?? e.exp?.type, e)
        //   context.add(i, v)
        // } else if (v && !l) {
        //   v.type = e.type ?? e.exp?.type 
        //   v.exp = e
        // }
        if (v) {
          if (l) {
            v = new core.Var(i, l, r, e.type ?? e.exp?.type, e)
            context.add(i, v)
          } else {
            v.type = e.type ?? e.exp?.type
            // v.exp = e
          }
        } else {
          // TODO same as above fix it
          v = new core.Var(i, l, r, e.type ?? e.exp?.type, e)
          context.add(i, v)
        }
      } else {
        // Designed to only get here if variable dec is using an eval assignment
        const spread = e instanceof core.NaryExp ? e.exp : [e]
        const evalOp = (/^(.)=/.exec(o) ?? /(\*\*)=/.exec(o))[1]
        if (!v) {
          e = new core.NaryExp([e.default, evalOp, ...spread])
          v = new core.Var(i, l, r, e.type, e)

          context.add(i, v)
        } else {
          e = new core.NaryExp([v, evalOp, ...spread])
          v.type = e.type // TODO: check for weaker type
          // v.exp = e
        }
      }

      return new core.VarDec(v, '=', e)
    },
    Statement_localVar(_local, id) {
      const e = new core.Nil()
      const v = new core.Var(
        id.sourceString,
        true,
        false,
        e.type,
        e
      )
      context.add(id.sourceString, v)
      return new core.VarDec(v, '=', e)
    },
    Statement_varAssignment(variable, op, exp) {
      // TODO check for var
      // Designed to only get here for variable subscription/selection
      const v = variable.rep()
      // TODO: should objects have their own context?
      return new core.VarDec(v, op.sourceString, exp.rep())
    },
    Statement_return(_return, exp) {
      // Can only explicitly use 'return' keyword inside a function
      checkInBlock(context)
      const e = exp.rep()
      context = context.parent
      return new core.ReturnStatement(...e)
    },
    Statement_impliedReturn(exp) {
      // TODO: need to move up a context
      const e = exp.rep()
      if (e) {
        const noReturn = [core.Ternary, core.PreIncrement, core.PreDecrement, core.PostIncrement, core.PostDecrement, core.Call]
        return noReturn.some(r => e instanceof r) ? e : new core.ReturnStatement(e)
      } else {
        const x = new core.Nil()
        const v = new core.Var(
          exp.sourceString,
          false,
          false,
          x.type,
          x
        )

        context.add(exp.sourceString, v)
        return new core.VarDec(v, '=', x)
      }
    },
    Statement_break(_b) { 
      checkInLoop(context)
      return new core.BreakStatement()
    },
    Exp_ternary(cond, _qMark, block, _c, alt) {
      const c = coerceToBool(cond.rep())
      return new core.Ternary(c, block.rep(), ...alt.rep())
    },
    Exp1_equality(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      const pieces = mapOps(elements)

      for (const [o, [l, r]] of Object.entries(pieces)) {
        if (o === '==') {
          // checkSameTypes(l, r) // TODO: probably don't want to throw error on this - just want to replace with false
        }
        if (o.includes('<') || o.includes('>')) {
          checkNotType(l, [d.FUNC])
          checkNotType(r, [d.FUNC])
        }
      }

      return new core.NaryExp(elements)
    },
    Exp2_or(left, or, right) {
      const [l, op, r] = [left.rep(), or.sourceString, right.rep()]
      return new core.BinaryExp(l, op, r)
    },
    Exp3_and(left, and, right) {
      const [l, op, r] = [left.rep(), and.sourceString, right.rep()]
      return new core.BinaryExp(l, op, r)
    },
    Exp4_addSubtract(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      const pieces = mapOps(elements)

      for (const [o, [l, r]] of Object.entries(pieces)) {
        if (o === '-') {
          if (r instanceof core.PreDecrement) {
            core.error('Expected parentheses around pre-decrement operation on the right side of a subtraction')
          } else if (l instanceof core.PostDecrement) {
            core.error('Expected parentheses around post-decrement operation on the left side of a subtraction')
          }
        } else if (o === '+') {
          if (r instanceof core.PreIncrement) {
            core.error('Expected parentheses around pre-increment operation on the right side of an addition')
          } else if (l instanceof core.PostIncrement) {
            core.error('Expected parentheses around post-increment operation on the left side of an addition')
          }
        }
      }

      return new core.NaryExp(elements)
    },
    Exp5_multiplyDivideMod(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      elements.filter(e => typeof e !== 'string').forEach(e => checkNotType(e, [d.FUNC]))
      // TODO: see language design photos

      return new core.NaryExp(elements)
    },
    // TODO implement eval order (l -> r)
    Exp6_exponent(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      const exps = elements.filter(e => typeof e !== 'string')

      exps.slice(0, -1).forEach(e => {
        checkNotType(e, [d.FUNC])
        if (e instanceof core.UnaryExp && e.op === '-') {
          core.error('Expected parentheses around negative operation on the left side of an exponential expression')
        }
      })
      checkNotType(exps[-1], [d.FUNC])

      return new core.NaryExp(elements)
    },
    Exp7_negate(negative, right) {
      const [op, r] = [negative.sourceString, right.rep()]
      if (r instanceof core.PreDecrement) {
        core.error('Expected parentheses around pre-decrement operation with a negation')
      }
      // -string
      // -[]
      // -{}
      return new core.UnaryExp(r, op)
    },
    Exp7_spread(spread, right) {
      const [o, r] = [spread.sourceString, right.rep()]
      checkType(r, [d.OBJ, d.LIST])

      return new core.UnaryExp(r, o)
    },
    Exp8_postFix(exp, op) {
      // TODO need to check const
      let [e, o] = [exp.rep(), op.sourceString]

      if (!e) {
        e = new core.Var(exp.sourceString, false, false, 'number', new core.Num().default)
        context.add(exp.sourceString, e)
      }
      checkNotLiteral(e)

      return o.includes('+') ? new core.PostIncrement(e) : new core.PostDecrement(e)
    },
    Exp8_preFix(op, exp) {
      // TODO need to check const
      let [e, o] = [exp.rep(), op.sourceString]

      if (!e) {
        e = new core.Var(exp.sourceString, false, false, 'number', new core.Num().default)
        context.add(exp.sourceString, e)
      }
      checkNotLiteral(e)

      return o.includes('+') ? new core.PreIncrement(e) : new core.PreDecrement(e)
    },
    Exp9_call(exp, _space, params) {
      const [e, p] = [exp.rep(), params.rep()]
      check(e, 'Variable may not have been initialized')
      // checkNotUndefined(e) // TODO: does this prevent 0()

      return new core.Call(e, p)
    },
    Exp9_subscript(exp, _open, selector, _close) {

      // TODO check for loop
      const [e, s] = [exp.rep(), selector.rep()]
      if (e.type === d.LIST) {
        return e.val[s.val]
      } else if (e.type === d.OBJ) {
        return (e instanceof core.Var ? e.exp : e).getVal(s.val)
        // TODO dive further if chained dot ops
      }
      // TODO check if it's a list or obj
      // for obj, use .getVal(key)
      // for list, index


      // TODO: don't think this is right because it doesn't allow built-in functions
      checkType(e, [d.OBJ, d.LIST])
      checkType(s, [d.NUM, d.STR, d.BOOL])
      // TODO how to check context? to see if selector exists/needs to be created
        // use .getVal(key)

      return new core.VarSubscript(e, selector.rep())
    },
    Exp9_select(exp, dot, selector) {
      const [e, s] = [exp.rep(), selector.rep()]
      checkNotType(e, [d.FUNC])

      if (e.type === d.LIST) {
        return e.val[s.val] ?? new core.Nil()
      } else if (e.type === d.OBJ) {
        return (e instanceof core.Var ? e.exp : e).getVal(s.val)
        // TODO dive further if chained dot ops
      }

      // TODO check for loop

      // selector.rep() ?? new core.Str(selector.sourceString)
      
      // TODO: how to check s?
      // TODO do we allow list.1 as indexing?
      // if so, need to allow list type for x
      return new core.BinaryExp(e, dot.sourceString, selector.rep())
    },
    Exp9_negative(negate, exp) {
      // TODO: probably can't use on objects, function literals,
      // unless we save it as a unary exp so it applies the negative to the result after the function gets called?
      // does using it on a boolean toggle the boolean? or does it turn to -1 * boolean (this one makes more sense probably)
      // -string? probably not allowed (unless it can be coerced to a number

      return new core.UnaryExp(exp.rep(), negate.sourceString)
    },
    Exp9_unwrap(exp, unwrap) {
      return new core.UnaryExp(exp.rep(), unwrap.sourceString)
    },
    Exp10_enclosed(_open, exp, _close) {
      return new core.NaryExp([exp.rep()])
    },
    LeftCompare(exp, op) {
      return [exp.rep(), op.sourceString]
    },
    LeftAddition(exp, op) {
      return [exp.rep(), op.sourceString]
    },
    LeftMultiply(exp, op) {
      return [exp.rep(), op.sourceString]
    },
    LeftExponent(exp, op) {
      return [exp.rep(), op.sourceString]
    },
    BangFunc(_open, block, _close) {
      return block.rep()
    },
    VarAssignment_subscript(exp, _open, selector, _close) {
      // TODO check for loop
      return new core.VarSubscript(exp.rep(), selector.rep())
    },
    VarAssignment_select(exp, dot, selector) {
      // TODO check for loop
      return new core.BinaryExp(exp.rep(), dot.sourceString, selector.rep())
    },
    FuncLit(exp, _arrow, block) {
      const e = exp.rep()

      const b = new core.Block()
      context = context.newChildContext({ inLoop: false, block: b })
      const f = block.rep()
      context = context.parent

      return new core.Func(e, f)
    },
    Params(_open, params, _close) {
      return new core.Params(params.asIteration().rep())
    },
    Args(_open, args, _close) {
      return new core.Args(args.asIteration().rep())
    },
    Arg(arg) {
      return arg.rep()
    },
    Param(param) {
      const p = param.rep()
      const x = new core.Var(
        p ? p.id : param.sourceString,
        true,
        false,
        p ? p.type : d.NIL,
        p ?? new core.Nil()
      )

      context.add(x.id, x)
      return x
    },
    PositionalArg(exp) {
      return exp.rep()
    },
    KeywordArg(id, _e, exp) {
      return new core.KeywordParam(id.rep(), exp.rep())
    },
    oneParam(id) {
      const x = new core.Var(
        id.sourceString,
        true,
        false,
        d.NIL,
        new core.Nil()
      )

      context.add(id.sourceString, x)
      return new core.Params([x])
      // return new core.KeywordParam(id.rep(), exp.rep())
    },
    Obj(_open, fields, _close) {
      // TODO: create new context?
      return new core.Obj(fields.asIteration().rep())
    },
    ObjField(key, _c, exp) {
      return new core.ObjField(key.rep(), exp.rep())
    },
    key(str) {
      return str.rep()
    },
    ListLit(_open, list, _close) {
      return new core.List([...list.asIteration().rep()])
    },
    Str(str) {
      return str.rep()
    },
    strLit(_open, chars, _close) {
      return new core.Str(chars.rep().join(''))
    },
    FormattedStr(_open, chars, _close) {
      return new core.FormattedStr(chars.rep())
    },
    FSingleSubstr(exp) {
      return exp.rep()
    },
    FDoubleSubstr(exp) {
      return exp.rep()
    },
    FStrExp(_open, exp, _close) {
      return exp.rep()
    },
    fSingleStrChar(char) {
      return char.rep()
    },
    fDoubleStrChar(char) {
      return char.rep()
    },
    singleStrChar_escaped(escape, char) {
      return `${escape.sourceString}${char.rep()}`
    },
    singleStrChar(char) {
      return char.rep()
    },
    doubleStrChar_escaped(escape, char) {
      return `${escape.sourceString}${char.rep()}`
    },
    doubleStrChar(char) {
      return char.rep()
    },
    lineContinuation(escape, newLine) {
      return `${escape.sourceString}${newLine.rep()}`
    },
    id(_first, _rest) {
      return context.lookup(this.sourceString) // TODO is returning undefined
    },
    boolLit(bool) {
      return new core.Bool(bool.sourceString)
    },
    num(_whole, _dot, _fraction, _e, _sign, _exponent) {
      return new core.Num(this.sourceString)
    },
    compareOp(_o0, _o1) {
      return this.sourceString
    },
    MatchExp(_match, id, block) {
      return new core.MatchExp(id.sourceString, block.rep())
    },
    MatchBlock(_open, cases, defaultCase, _close) {
      return new core.MatchBlock([...cases.rep(), ...defaultCase.rep()])
    },
    CaseClause(_case, matches, _colon, block) {
      return new core.MatchCase(matches.asIteration().rep(), block.rep())
    },
    DefaultClause(_default, _colon, block) {
      return new core.DefaultMatchCase(block.rep())
    },
    nil(_nil) {
      return new core.Nil()
    },
    _terminal() {
      return this.sourceString
    },
    _iter(...children) {
      return children.map(child => child.rep())
    },
  })

  const match = bangGrammar.match(sourceCode)
  if (!match.succeeded()) core.error(match.message)
  return analyzer(match).rep()
}