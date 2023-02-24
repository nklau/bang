import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const bangGrammar = ohm.grammar(fs.readFileSync("src/bang.ohm"))
const d = { LIST: 'list', OBJ: 'object', STR: 'string', NUM: 'number', BOOL: 'boolean', NIL: 'nil', FUNC: 'function', ANY: 'any' }
const noReturnExps = [core.Ternary, core.PreIncrement, core.PreDecrement, core.PostIncrement, core.PostDecrement, core.Call]

// TODO: function to get type

function check(condition, message, node) {
  if (!condition) core.error(message, node)
}

// TODO fix all type checking because using sets now
function checkNotType(e, types) {
  const t = e?.type
  check(!types.includes(t), `Unexpected type ${t}`)
}

function checkSameTypes(e0, e1) {
  const [t0, t1] = [e0?.type, e1?.type]
  check(t0 === t1, `${t0} can never be equal to ${t1}`)
}

function defineVar(id, context, exp = new core.Nil(), types = [exp?.type ?? d.ANY], local = false, readOnly = false) {
  if (typeof id !== 'string') return

  const variable = new core.Var(id, local, readOnly, types)
  context.add(id, variable)
  return new core.VarDec(variable, exp)
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

// function coerceToBool(e) {
//   return new core.Bool(!e?.equals(e?.default))
// }

function mapOps(elements) {
  const ops = ['==', '!=', '<', '>', '<=', '>=', '+', '-']
  return elements.reduce(
    (map, val, i) => (ops.includes(val) ? { ...map, [val]: [elements[i - 1], elements[i + 1]] } : map),
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
  let extraStatements = []

  const analyzer = bangGrammar.createSemantics().addOperation("rep", {
    Program(body) {
      return body.rep()
    },
    Block(_n0, statements, statement, _n1) {
      const block = new core.Block()
      context = context.newChildContext({ inLoop: false, block: block })

      statements.children.forEach(s => {
        block.statements.push(s.rep())
      })
      block.statements.push(...statement.rep())

      if (block.statements.length === 1 && noReturnExps.includes(block.statements[0].constructor)) {
        block.statements[0] = new core.ReturnStatement(block.statements[0])
      }

      extraStatements.forEach(s => block.statements.unshift(s))
      extraStatements = []

      context = context.parent ?? context
      return block
    },
    StatementNewLine(statement, _space, _n) {
      return statement.rep()
    },
    Statement_varDec(local, readOnly, id, op, exp) {
      let [val, o, isLocal, isReadOnly, name] = [exp.rep(), op.sourceString, local.sourceString === 'local', readOnly.sourceString === 'const', id.sourceString]
      let variable = context.lookup(name)

      if (typeof val === 'string') {
        const valVariable = new core.Var(val, false, false, [d.NIL])
        const varDec = new core.VarDec(valVariable, new core.Nil())

        context.add(val, valVariable)
        extraStatements.push(varDec)
        val = varDec.exp
      }

      if (val instanceof core.Var) {
        // setting a variable equal to another variable makes a shallow copy
        context.block.statements.slice().reverse().forEach(s => {
          if ((s instanceof core.Assign || s instanceof core.VarDec) && s.var === val) {
            val = s.exp
          }
        })

        if (val instanceof core.Var) {
          extraStatements.slice().reverse().forEach(s => {
            if ((s instanceof core.Assign || s instanceof core.VarDec) && s.var === val) {
              val = s.exp
            }
          })
        }
      }

      if (o === '=') {
        let type = val.type ?? val.exp?.type
        type = type instanceof Set ? Array.from(type) : [type]
        if (isLocal || !variable) {
          return defineVar(name, context, val, [...type], isLocal, isReadOnly)
        } else {
          type.forEach(t => variable.type.add(t))
        }
      } else {
        // Designed to only get here if variable dec is using an eval assignment
        const flatExp = val instanceof core.NaryExp ? val.exp : [val]
        const evalOp = (/^(.)=/.exec(o) ?? /(\*\*)=/.exec(o))[1]
        if (!variable) {
          val = new core.NaryExp([val.default, evalOp, ...flatExp])
          return defineVar(name, context, val, [val.type], isLocal, isReadOnly)
        } else {
          val = new core.NaryExp([variable, evalOp, ...flatExp])
          variable.type.add(val.type)
        }
      }

      return new core.Assign(variable, val)
    },
    Statement_localVar(_local, id) {
      // const [name, exp] = [id.sourceString, new core.Nil()]
      return defineVar(id.sourceString, context, new core.Nil(), [d.NIL], true)
      // const variable = new core.Var(name, true, false, [exp.type])
      // context.add(name, variable)
      // // TODO check if var has already been declared as local within this scope
      // return new core.VarDec(variable, exp)
    },
    Statement_varAssignment(target, op, exp) {
      let [variable, o, val] = [target.rep(), op.sourceString, exp.rep()]
      if (val instanceof core.Var) {
        // setting a variable equal to another variable makes a shallow copy
        val = val.exp
      }

      // variable will never be undefined because the "id" rule is caught by Statement_varDec
      if (o !== '=') {
        // Using eval assignment
        const flatExp = val instanceof core.NaryExp ? val.exp : [val]
        const evalOp = (/^(.)=/.exec(o) ?? /(\*\*)=/.exec(o))[1]
        val = new core.NaryExp([variable, evalOp, ...flatExp])
      }

      return new core.Assign(variable, val)
    },
    Statement_return(_return, exp) {
      // Can only explicitly use 'return' keyword inside a function
      checkInBlock(context)
      const e = exp.rep()
      return new core.ReturnStatement(...e)
    },
    Statement_impliedReturn(exp) {
      const e = exp.rep()
      if (typeof e !== 'string') {
        const noReturn = noReturnExps.some(r => e instanceof r)
        if (!noReturn) {
          return new core.ReturnStatement(e)
        }

        return e
      }
      else {
        const variable = new core.Var(e, false, false, ['nil'])
        context.add(e, variable)
        extraStatements.push(new core.VarDec(variable, new core.Nil()))
        return variable
      }
    },
    Statement_break(_b) {
      checkInLoop(context)
      return new core.BreakStatement()
    },
    Exp_ternary(cond, _qMark, block, _c, alt) {
      let [bool, trueBlock] = [cond.rep(), block.rep()]

      if (!(trueBlock instanceof core.Block)) {
        const b = new core.Block()
        context = context.newChildContext({ inLoop: false, block: b })

        b.statements = [trueBlock]
        if (!(trueBlock instanceof core.ReturnStatement)) {
          b.statements[0] = new core.ReturnStatement(trueBlock)
        }

        extraStatements.forEach(s => b.statements.unshift(s))
        extraStatements = []

        context = context.parent
        trueBlock = b
      }

      if (alt.children.length === 0) {
        return new core.Ternary(bool, trueBlock)
      }

      let [falseBlock] = [...alt.rep()]

      if (!(falseBlock instanceof core.Block)) {
        const b = new core.Block()
        context = context.newChildContext({ inLoop: false, block: b })

        b.statements = [falseBlock]
        if (!(falseBlock instanceof core.ReturnStatement)) {
          b.statements[0] = new core.ReturnStatement(falseBlock)
        }

        extraStatements.forEach(s => b.statements.unshift(s))
        extraStatements = []

        context = context.parent
        falseBlock = b
      }

      return new core.Ternary(bool, trueBlock, falseBlock)
    },
    Exp1_equality(left, right) {
      let elements = [...left.rep(), right.rep()].flat()
      const type = core.getType(elements.filter(e => typeof e !== 'string'))
      const pieces = mapOps(elements)
      let statements = []

      for (let [op, [lhs, rhs]] of Object.entries(pieces)) {
        if (op === '==') {
          // checkSameTypes(l, r) // TODO: probably don't want to throw error on this - just want to replace with false
        }
        if (op.includes('<') || op.includes('>')) {
          checkNotType(lhs, [d.FUNC])
          checkNotType(rhs, [d.FUNC])
        }
        if (typeof lhs === 'string') {
          const variable = new core.Var(lhs, false, false, [type === d.ANY ? d.NIL : type])
          context.add(lhs, variable)
          statements.push(new core.VarDec(variable, variable.default))
          elements[elements.indexOf(lhs)] = variable
        }

        if (typeof rhs === 'string') {
          const variable = new core.Var(rhs, false, false, [type === d.ANY ? d.NIL : type])
          context.add(rhs, variable)
          statements.push(new core.VarDec(variable, variable.default))
          elements[elements.indexOf(rhs)] = variable
        }
      }
      const exp = new core.NaryExp(elements)
      statements = statements.filter(s => s)
      if (statements.length > 0) {
        statements.forEach(s => extraStatements.push(s))
        // extraStatements.push(statements)
      }

      return exp
    },
    Exp2_or(left, or, right) {
      const [lhs, op, rhs] = [left.rep(), or.sourceString, right.rep()]
      // TODO check lhs and rhs are strings
      return new core.BinaryExp(lhs, op, rhs)
    },
    Exp3_and(left, and, right) {
      const [lhs, op, rhs] = [left.rep(), and.sourceString, right.rep()]
      // TODO check lhs and rhs are strings
      return new core.BinaryExp(lhs, op, rhs)
    },
    Exp4_addSubtract(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      const pieces = mapOps(elements)

      for (const [op, [lhs, rhs]] of Object.entries(pieces)) {
        if (op === '-') {
          if (rhs instanceof core.PreDecrement) {
            core.error('Expected parentheses around pre-decrement operation on the right side of a subtraction')
          } else if (lhs instanceof core.PostDecrement) {
            core.error('Expected parentheses around post-decrement operation on the left side of a subtraction')
          }
        } else if (op === '+') {
          if (rhs instanceof core.PreIncrement) {
            core.error('Expected parentheses around pre-increment operation on the right side of an addition')
          } else if (lhs instanceof core.PostIncrement) {
            core.error('Expected parentheses around post-increment operation on the left side of an addition')
          }
        }
        // TODO: check if lhs and rhs are strings
      }

      return new core.NaryExp(elements)
    },
    Exp5_multiplyDivideMod(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      elements.filter(e => typeof e !== 'string').forEach(e => checkNotType(e, [d.FUNC]))
      // TODO check e is string

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
        // TODO check if e is a string
      })
      checkNotType(exps[-1], [d.FUNC])
      // todo check if exps[-1] is a string

      return new core.NaryExp(elements)
    },
    Exp7_negate(negative, right) {
      const [op, rhs] = [negative.sourceString, right.rep()]
      if (rhs instanceof core.PreDecrement) {
        core.error('Expected parentheses around pre-decrement operation with a negation')
      }
      // TODO check if rhs is a string
      return new core.UnaryExp(rhs, op)
    },
    Exp7_spread(spread, right) {
      const [op, rhs] = [spread.sourceString, right.rep()]
      checkType(rhs, [d.OBJ, d.LIST])

      return new core.UnaryExp(rhs, op)
    },
    Exp8_postFix(target, postfixOp) {
      // TODO need to check const
      let [exp, op] = [target.rep(), postfixOp.sourceString]
      checkNotLiteral(exp)

      const increment = op.includes('+') ? core.PostIncrement : core.PostDecrement
      let extra

      if (typeof exp === 'string') {
        const name = target.sourceString
        exp = new core.Var(name, false, false, [d.NUM])

        context.add(name, exp)
        extra = new core.VarDec(exp, exp.default)
      }

      const statement = new increment(exp)

      if (extra) {
        extraStatements.push(extra)
      }

      return statement
    },
    Exp8_preFix(prefixOp, target) {
      // TODO need to check const
      let [exp, op] = [target.rep(), prefixOp.sourceString]
      checkNotLiteral(exp)

      const increment = op.includes('+') ? core.PreIncrement : core.PreDecrement
      let extra

      if (typeof exp === 'string') {
        const name = target.sourceString
        exp = new core.Var(name, false, false, [d.NUM])

        context.add(name, exp)
        extra = new core.VarDec(exp, exp.default)
      }

      const statement = new increment(exp)

      if (extra) {
        extraStatements.push(extra)
      }

      return statement
    },
    Exp9_call(id, _space, params) {
      const [exp, args] = [id.rep(), params.rep()]
      return new core.Call(exp, args)
    },
    Exp9_subscript(target, _open, selector, _close) {
      // TODO check for loop
      const [id, exp] = [target.rep(), selector.rep()]
      checkNotType(id, [d.FUNC])
      if (id.type === d.LIST) {
        // TODO is this how we should handle this
        return id.val[exp.val]
      } else if (id.type === d.OBJ) {
        // TODO is this how we should handle this
        return (id instanceof core.Var ? id.exp : id).getVal(exp.val)
        // TODO dive further if chained dot ops
      }
      // TODO how to check context? to see if selector exists/needs to be created
      return new core.VarSubscript(id, exp)
    },
    Exp9_select(target, dot, selector) {
      const [id, exp] = [target.rep(), selector.rep()]
      checkNotType(id, [d.FUNC])

      if (id.type === d.LIST) {
        return id.val[exp.val] ?? new core.Nil()
      } else if (id.type === d.OBJ) {
        return (id instanceof core.Var ? id.exp : id).getVal(exp.val)
        // TODO dive further if chained dot ops
      }

      // selector.rep() ?? new core.Str(selector.sourceString)
      return new core.BinaryExp(id, dot.sourceString, exp)
    },
    Exp9_negative(negate, exp) {
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
    // BangFunc(statement) {
    //   // const block = new core.Block()
    //   context = context.newChildContext({ inLoop: false, block: context.block })

    //   let s = [statement.rep()]

    //   if (noReturnExps.includes(s[0].constructor)) {
    //     s[0] = new core.ReturnStatement(s[0])
    //   }

    //   for (let [_toFind, toAdd] of extraStatements.entries()) {
    //     s.unshift(toAdd)
    //   }
    //   extraStatements = new Map()
    //   context = context.parent ?? context
    //   return s
    // },
    VarAssignment_subscript(target, _open, selector, _close) {
      // TODO check for loop
      let [id, exp] = [target.rep(), selector.rep()]

      if (!id) {
        const name = target.sourceString
        id = new core.Var(name, false, false)
        const assign = new core.VarDec(id)

        context.add(name, id)
        context.block.statements.unshift(assign)
      }

      return new core.VarSubscript(id, exp)
    },
    VarAssignment_select(target, dot, selector) {
      let [id, exp] = [target.rep(), selector.sourceString]

      if (!id) {
        const name = target.sourceString
        id = new core.Var(name, false, false)
        const assign = new core.VarDec(id)

        context.add(name, id)
        context.block.statements.unshift(assign)
      }

      // TODO check for loop
      return new core.BinaryExp(id, dot.sourceString, exp)
    },
    FuncLit(exp, _arrow, funcBody) {
      const id = exp.rep()

      const block = new core.Block()
      context = context.newChildContext({ inLoop: false, block: block })
      const statements = funcBody.rep()
      context = context.parent
      // TODO check if block has only 1 statement, and if it should be a return statement
      // TODO add extra statements

      return new core.Func(id, statements)
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
      const name = param.sourceString
      const variable = new core.Var(name, true, false, [d.ANY])

      context.add(name, variable)
      return variable
    },
    PositionalArg(exp) {
      return exp.rep()
    },
    KeywordArg(id, _e, exp) {
      // TODO: this may need to be a separate core.KeywordArg class
      return new core.KeywordParam(id.sourceString, exp.rep())
    },
    oneParam(id) {
      const name = id.sourceString
      const variable = new core.Var(name, true, false, [d.ANY])

      context.add(name, variable)
      return new core.Params([variable])
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
      const elements = [...list.asIteration().rep()]

      elements.forEach((e, index) => {
        if (typeof e === 'string') {
          const variable = new core.Var(e, false, false, [d.NIL])

          context.add(e, variable)
          elements[index] = variable

          extraStatements.push(new core.VarDec(variable, new core.Nil()))
        }
      })

      return new core.List(elements)
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
      let e = exp.rep()

      if (typeof e === 'string') {
        const variable = new core.Var(e, false, false, ['nil'])
        const varDec = new core.VarDec(variable, new core.Nil())

        context.add(e, variable)
        e = variable
        extraStatements.push(varDec)
      }

      return e
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
      // let variable = context.lookup(name)
      // if (!variable) {
      //   variable = new core.Var(name, false, false)
      //   const assign = new core.Assign(variable)

      //   context.add(name, variable)
      //   context.block.statements.unshift(assign)
      // }
      // return variable
      return context.lookup(this.sourceString) ?? this.sourceString
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