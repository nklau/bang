import fs from 'fs'
import ohm from 'ohm-js'
import * as core from './core.js'
import * as stdlib from './stdlib.js'

const bangGrammar = ohm.grammar(fs.readFileSync('src/bang.ohm'))
const d = {
  LIST: 'list',
  OBJ: 'object',
  STR: 'string',
  NUM: 'number',
  BOOL: 'boolean',
  NIL: 'nil',
  FUNC: 'function',
  ANY: 'any',
}
const noReturnExps = [
  core.Ternary,
  core.PreIncrement,
  core.PreDecrement,
  core.PostIncrement,
  core.PostDecrement,
  core.Call,
]

function check(condition, message, node) {
  if (!condition) core.error(message, node)
}

// TODO fix all type checking because using sets now
function checkNotType(e, types) {
  const t = e?.type
  check(!types.includes(t), `Unexpected type ${t}`)
}

// function coerceToType(e, type) {
//   if (e.type === type) { return e }
//   // TODO check if e is a var
//   if (e instanceof core.Var) {
//     // TODO what if I don't know the value of the thing that needs to be coerced?
//     // ex:
//     /*
//     x = 1
//     x ? 'hi'
//     */
//   }

// }

// function coerceToNil(e) {
//   return new core.Nil()
// }

// function coerceToBool(e) {
//   // Should always be a core object that is one of the main types
//   return new core.Bool(e.type === d.NIL ? false : (!e.equals(e.default)))
// }

// function coerceToNum(e) {
//   const exps = {[d.NIL]: 0, [d.BOOL]: e.val ? 1 : 0,[d.NUM]: e.val, [d.STR]: e.val.length, [d.OBJ]: e.val.length, [d.LIST]: e.val.length}
//   return new core.Num(exps[e.type] ?? 0)
// }

// function coerceToStr(e) {
//   return new core.Str(e.type === d.NIL ? '' : e.toString())
// }

// function coerceToObj(e) {
//   // const toObjField = (val) => {
//   //   return new core.ObjField(new core.Str(val.toString()), val)
//   // }

//   // let exp

//   // if (e.type === d.NIL) {
//   //   exp = []
//   // } else if (e.type === d.OBJ) {
//   //   exp = e.val
//   // } else {
//   //   exp = [new core.ObjField(new core.Str(e.toString()), e)]
//   // }

//   return new core.Obj(e.type === d.NIL ? [] : e.type === d.OBJ ? e.val : [new core.ObjField(new core.Str(e.toString()), e)])
// }

// function coerceToList(e) {
//   if (e.type === d.OBJ) {
//     const vals = e.val.reduce((list, field) => {
//       list.push([field.key, field.val])
//     }, [])

//     return new core.List(vals)
//   }

//   return new core.List(e.type === d.NIL ? [] : e.type === d.LIST ? e.val : [e.val])
// }

function defineVar(
  id,
  context,
  types = [d.NIL],
  exp,
  local = false,
  readOnly = false
) {
  if (typeof id !== 'string') return

  const variable = new core.Var(id, local, readOnly, types)
  context.add(id, variable)
  const varDec = new core.VarDec(variable, exp ?? variable.default)
  context.extraVarDecs.unshift(varDec)
  return varDec
}

function checkNotLiteral(e) {
  const lits = [core.Str, core.Num, core.Bool, core.Nil]
  check(!lits.some((l) => e instanceof l), 'Cannot mutate a literal')
}

function checkInBlock(context) {
  check(context.parent?.block, 'Cannot return outside a function')
}

function checkInLoop(context) {
  // loops must always be in the block of a function
  check(context.parent?.block, 'Cannot break outside of loop')
}

function mapOps(elements) {
  const ops = ['==', '!=', '<', '>', '<=', '>=', '+', '-', '/', '*', '%', '**']
  return elements.reduce(
    (arr, val, i) =>
      ops.includes(val)
        ? [...arr, [val, [elements[i - 1], elements[i + 1]]]]
        : arr,
    []
  )
}

class Context {
  constructor({
    parent = null,
    locals = new Map(),
    block: b = null,
    extraVarDecs = [],
  }) {
    Object.assign(this, {
      parent,
      locals,
      block: b,
      extraVarDecs: extraVarDecs,
    })
  }

  // sees(name) {
  //   // Search "outward" through enclosing scopes
  //   return this.locals.has(name) || this.parent?.sees(name)
  // }

  lookup(name) {
    const entity = this.locals.get(name)
    return entity ? entity : this.parent?.lookup(name)
  }

  add(name, entity) {
    this.locals.set(name, entity)
  }

  newChildContext(props) {
    return new Context({
      ...this,
      ...props,
      parent: this,
      locals: new Map(),
      extraVarDecs: [],
    })
  }
}

export default function analyze(sourceCode) {
  let context = new Context({})

  const analyzer = bangGrammar.createSemantics().addOperation('rep', {
    Program(body) {
      return body.rep()
    },
    Block(_n0, statements, statement, _n1) {
      const block = new core.Block()
      context = context.newChildContext({ block: block })

      statements.children.forEach((s) => {
        block.statements.push(s.rep())
      })
      block.statements.push(...statement.rep())

      if (
        block.statements.length === 1 &&
        (noReturnExps.includes(block.statements[0].constructor) ||
          block.statements[0] instanceof core.Var)
      ) {
        block.statements[0] = new core.ReturnStatement(block.statements[0])
      }

      context.extraVarDecs.forEach((s) => block.statements.unshift(s))
      context.extraVarDecs = []

      context = context.parent
      return block
    },
    StatementNewLine(statement, _space, _n) {
      return statement.rep()
    },
    Statement_varDec(local, readOnly, id, op, exp) {
      let [val, o, isLocal, isReadOnly, name] = [
        exp.rep(),
        op.sourceString,
        local.sourceString === 'local',
        readOnly.sourceString === 'const',
        id.sourceString,
      ]
      let variable = context.lookup(name)

      if (!isLocal && variable?.readOnly) {
        core.error(`Cannot assign to constant variable ${name}`)
      }

      const notDefined = defineVar(val, context)
      if (notDefined) {
        val = notDefined.var
      }

      // TODO at code generation will need to use shared semantics, although js might handle that already

      // TODO this is a problem because can't guarantee the most recent assignment actually happened, or that it's not skipping
      // over some nested assignment in a ternary or something
      // if (val instanceof core.Var) {
      //   // setting a variable equal to another variable makes a shallow copy
      //   context.block.statements.forEach(s => {
      //     if ((s instanceof core.Assign || s instanceof core.VarDec) && s.var === val) {
      //       val = s.exp
      //     }
      //   })

      //   if (val instanceof core.Var) {
      //     context.extraVarDecs.forEach(s => {
      //       if ((s instanceof core.Assign || s instanceof core.VarDec) && s.var === val) {
      //         val = s.exp
      //       }
      //     })
      //   }
      // }

      if (o === '=') {
        let type = val.type ?? val.exp?.type ?? 'any'
        type = type instanceof Set ? Array.from(type) : [type]
        if (isLocal || !variable) {
          const variable = new core.Var(name, isLocal, isReadOnly, type)
          context.add(name, variable)
          return new core.VarDec(variable, val)
        } else {
          type.forEach((t) => variable.type.add(t))
        }
      } else {
        // Designed to only get here if variable dec is using an eval assignment
        const flatExp = val instanceof core.NaryExp ? val.exp : [val]
        const evalOp = (/^(.)=/.exec(o) ?? /(\*\*)=/.exec(o))[1]
        if (!variable) {
          val = new core.NaryExp([val.default, evalOp, ...flatExp])
          const variable = new core.Var(name, isLocal, isReadOnly, [val.type])
          context.add(name, variable)
          return new core.VarDec(variable, val)
        } else {
          val = new core.NaryExp([variable, evalOp, ...flatExp])
          variable.type.add(val.type)
        }
      }

      return new core.Assign(variable, val)
    },
    Statement_localVar(_local, id) {
      // const [name, exp] = [id.sourceString, new core.Nil()]
      const name = id.sourceString
      const variable = new core.Var(name, true, false, [d.NIL])
      context.add(name, variable)
      return new core.VarDec(variable, variable.default)
      // const variable = new core.Var(name, true, false, [exp.type])
      // context.add(name, variable)
      // // TODO check if var has already been declared as local within this scope
      // return new core.VarDec(variable, exp)
    },
    Statement_varAssignment(target, op, exp) {
      // Designed to only get here if assignment is using the . or [] operator
      // If a variable is a constant list or object, changing its elements is allowed
      let [assign, o, val] = [target.rep(), op.sourceString, exp.rep()]

      let variable = assign.id || assign.left
      while (variable instanceof core.VarSubscript) {
        variable = variable.id
      }

      if (variable.readOnly) {
        const constTypes = [d.NIL, d.BOOL, d.NUM, d.STR]
        if ([...variable.type].some((t) => constTypes.includes(t))) {
          core.error(`Cannot assign to constant variable ${variable.id}`)
        }
      }

      // if (val instanceof core.Var) {
      //   // setting a variable equal to another variable makes a shallow copy
      //   context.block.statements.forEach(s => {
      //     if ((s instanceof core.Assign || s instanceof core.VarDec) && s.var === val) {
      //       val = s.exp
      //     }
      //   })
      // }

      // variable will never be undefined because the "id" rule is caught by Statement_varDec
      if (o !== '=') {
        // Using eval assignment
        const flatExp = val instanceof core.NaryExp ? val.exp : [val]
        const evalOp = (/^(.)=/.exec(o) ?? /(\*\*)=/.exec(o))[1]
        val = new core.NaryExp([assign, evalOp, ...flatExp])
      }

      return new core.Assign(assign, val)
    },
    Statement_return(_return, exp) {
      // Can only explicitly use 'return' keyword inside a function
      checkInBlock(context)
      let e = exp.rep()

      if (e.length === 0) {
        // short return statement
        return new core.ReturnStatement()
      }

      const notDefined = defineVar(e[0], context)
      if (notDefined) {
        e = [notDefined.var]
      }

      return new core.ReturnStatement(...e)
    },
    Statement_impliedReturn(exp) {
      let e = exp.rep()

      const notDefined = defineVar(e, context)
      if (notDefined) {
        e = notDefined.var
      } else {
        const noReturn = noReturnExps.some((r) => e instanceof r)
        if (!noReturn) {
          return new core.ReturnStatement(e)
        }
      }

      return e
    },
    Statement_break(_b) {
      checkInLoop(context)
      return new core.BreakStatement()
    },
    Exp_ternary(cond, _qMark, block, _c, alt) {
      let bool = cond.rep()

      const notDefined = defineVar(bool, context, [d.BOOL])
      if (notDefined) {
        bool = notDefined.var
      }

      let trueBlock

      if (block._node.ruleName !== 'BangFunc') {
        const b = new core.Block()
        context = context.newChildContext({ block: b })

        b.statements = [block.rep()]
        if (!(b.statements[0] instanceof core.ReturnStatement)) {
          b.statements[0] = new core.ReturnStatement(b.statements[0])
        }

        context.extraVarDecs.forEach((s) => b.statements.unshift(s))
        context.extraVarDecs = []

        context = context.parent
        trueBlock = b
      } else {
        trueBlock = block.rep()
      }

      if (alt.children.length === 0) {
        return new core.Ternary(bool, trueBlock)
      }

      let falseBlock

      if (alt.children[0]._node.ruleName !== 'BangFunc') {
        const b = new core.Block()
        context = context.newChildContext({ block: b })

        b.statements = [...alt.rep()]
        if (!(b.statements[0] instanceof core.ReturnStatement)) {
          b.statements[0] = new core.ReturnStatement(b.statements[0])
        }

        context.extraVarDecs.forEach((s) => b.statements.unshift(s))
        context.extraVarDecs = []

        context = context.parent
        falseBlock = b
      } else {
        ;[falseBlock] = [...alt.rep()]
      }

      return new core.Ternary(bool, trueBlock, falseBlock)
    },
    Exp1_equality(left, right) {
      let elements = [...left.rep(), right.rep()].flat()
      const type = core.getType(elements.filter((e) => typeof e !== 'string'))
      const pieces = mapOps(elements)
      let statements = []

      for (let [op, [lhs, rhs]] of pieces) {
        if (op.includes('<') || op.includes('>')) {
          checkNotType(lhs, [d.FUNC])
          checkNotType(rhs, [d.FUNC])
        }
        if (typeof lhs === 'string') {
          const variable = new core.Var(lhs, false, false, [
            type === d.ANY ? d.NIL : type,
          ])
          context.add(lhs, variable)
          statements.push(new core.VarDec(variable, variable.default))
          elements[elements.indexOf(lhs)] = variable
        }

        if (typeof rhs === 'string') {
          const variable = new core.Var(rhs, false, false, [
            type === d.ANY ? d.NIL : type,
          ])
          context.add(rhs, variable)
          statements.push(new core.VarDec(variable, variable.default))
          elements[elements.indexOf(rhs)] = variable
        }
      }
      const exp = new core.NaryExp(elements)
      statements = statements.filter((s) => s)
      if (statements.length > 0) {
        statements.forEach((s) => context.extraVarDecs.unshift(s))
      }

      return exp
    },
    Exp2_or(left, or, right) {
      let [lhs, op, rhs] = [left.rep(), or.sourceString, right.rep()]
      const leftDefine = defineVar(lhs, context, [d.BOOL])
      const rightDefine = defineVar(rhs, context, [d.BOOL])

      if (leftDefine) {
        lhs = leftDefine.var
      }

      if (rightDefine) {
        rhs = rightDefine.var
      }

      return new core.BinaryExp(lhs, op, rhs)
    },
    Exp3_and(left, and, right) {
      let [lhs, op, rhs] = [left.rep(), and.sourceString, right.rep()]
      const leftDefine = defineVar(lhs, context, [d.BOOL])
      const rightDefine = defineVar(rhs, context, [d.BOOL])

      if (leftDefine) {
        lhs = leftDefine.var
      }

      if (rightDefine) {
        rhs = rightDefine.var
      }

      return new core.BinaryExp(lhs, op, rhs)
    },
    Exp4_addSubtract(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      const type = core.getType(elements, d.NUM)

      const pieces = mapOps(elements)
      let operands = []

      for (let [op, [lhs, rhs]] of pieces) {
        if (op === '-') {
          if (rhs instanceof core.PreDecrement) {
            core.error(
              'Expected parentheses around pre-decrement operation on the right side of a subtraction'
            )
          } else if (lhs instanceof core.PostDecrement) {
            core.error(
              'Expected parentheses around post-decrement operation on the left side of a subtraction'
            )
          }
        } else if (op === '+') {
          if (rhs instanceof core.PreIncrement) {
            core.error(
              'Expected parentheses around pre-increment operation on the right side of an addition'
            )
          } else if (lhs instanceof core.PostIncrement) {
            core.error(
              'Expected parentheses around post-increment operation on the left side of an addition'
            )
          }
        }

        const notDefined = defineVar(lhs, context, [type])
        if (notDefined) {
          lhs = notDefined.var
        }

        operands.push(lhs, op)
      }

      let lastElement = elements[elements.length - 1]
      const notDefined = defineVar(lastElement, context, [type])
      if (notDefined) {
        lastElement = notDefined.var
      }

      operands.push(lastElement)

      // const type = core.getType(operands)
      // for (let op of operands) {
      //   if (typeof op === 'string') {
      //     continue
      //   }

      //   coerceToType(op, type)
      // }

      return new core.NaryExp(operands)
    },
    Exp5_multiplyDivideMod(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      const type = core.getType(elements, d.NUM)

      const pieces = mapOps(elements)
      let operands = []

      for (let [op, [lhs, _rhs]] of pieces) {
        const notDefined = defineVar(lhs, context, [type])
        if (notDefined) {
          lhs = notDefined.var
        }

        operands.push(lhs, op)
      }

      let lastElement = elements[elements.length - 1]
      const notDefined = defineVar(lastElement, context, [type])
      if (notDefined) {
        lastElement = notDefined.var
      }

      operands.push(lastElement)

      return new core.NaryExp(operands)
    },
    // TODO implement eval order (l -> r)
    Exp6_exponent(left, right) {
      const elements = [...left.rep(), right.rep()].flat()
      const type = core.getType(elements, d.NUM)
      const pieces = mapOps(elements)
      let operands = []

      if (elements[0] instanceof core.UnaryExp && elements[0].op === '-') {
        core.error(
          'Expected parentheses around negative operation on the left side of an exponential expression'
        )
      }

      for (let [op, [lhs, _rhs]] of pieces) {
        const notDefined = defineVar(lhs, context, [type])
        if (notDefined) {
          lhs = notDefined.var
        }

        operands.push(lhs, op)
      }

      let lastElement = elements[elements.length - 1]
      const notDefined = defineVar(lastElement, context, [type])
      if (notDefined) {
        lastElement = notDefined.var
      }

      operands.push(lastElement)

      return new core.NaryExp(operands)
    },
    Exp7_negative(negative, right) {
      let [op, rhs] = [negative.sourceString, right.rep()]
      if (rhs instanceof core.PreDecrement) {
        core.error(
          'Expected parentheses around pre-decrement operation with a negation'
        )
      }

      const notDefined = defineVar(rhs, context, [d.NUM])
      if (notDefined) {
        rhs = notDefined.var
      }
      return new core.UnaryExp(rhs, op)
    },
    Exp7_spread(spread, right) {
      let [op, rhs] = [spread.sourceString, right.rep()]
      const notDefined = defineVar(rhs, context, [d.LIST])
      if (notDefined) {
        rhs = notDefined.var
      }

      return new core.UnaryExp(rhs, op)
    },
    Exp8_postFix(target, postfixOp) {
      // TODO need to check const
      let [exp, op] = [target.rep(), postfixOp.sourceString]
      checkNotLiteral(exp)

      const increment = op.includes('+')
        ? core.PostIncrement
        : core.PostDecrement

      const notDefined = defineVar(exp, context, [d.NUM])
      if (notDefined) {
        exp = notDefined.var
      }

      return new increment(exp)
    },
    Exp8_preFix(prefixOp, target) {
      // TODO need to check const
      let [exp, op] = [target.rep(), prefixOp.sourceString]
      checkNotLiteral(exp)

      const increment = op.includes('+') ? core.PreIncrement : core.PreDecrement

      const notDefined = defineVar(exp, context, [d.NUM])
      if (notDefined) {
        exp = notDefined.var
      }

      return new increment(exp)
    },
    Exp9_call(id, _space, inputs) {
      // if (id.sourceString === 'print' || id.sourceString === 'range') {
      //   // TODO
      //   return new core.Call(id.sourceString, params.rep())
      // }
      let [exp, args] = [id.rep(), inputs.rep()]
      // new core.Func(new core.Params(), new core.Block([new core.ReturnStatement(new core.Str(exp))]))
      const notDefined = defineVar(exp, context, [d.FUNC])
      if (notDefined) {
        const ret = new core.ReturnStatement(notDefined.var)
        notDefined.exp.block.statements.push(ret)
        notDefined.exp.params.params = []
        exp = notDefined.var
      }

      return new core.Call(exp, args)
    },
    Exp9_subscript(target, _open, selector, _close) {
      // TODO check for loop
      let id = target.rep()
      checkNotType(id, [d.FUNC])

      const idNotDefined = defineVar(id, context, [d.LIST])
      if (idNotDefined) {
        id = idNotDefined.var
      }

      let exp = selector.rep()

      const expNotDefined = defineVar(exp, context, [d.NUM])
      if (expNotDefined) {
        exp = expNotDefined.var
      }

      return new core.VarSubscript(id, exp)
    },
    Exp9_select(left, right) {
      let [target, selector] = [left.rep(), right.sourceString]
      let dot
      if (target instanceof Array) {
        ;[target, dot] = target
      }

      const notDefined = defineVar(
        target,
        context,
        [d.OBJ],
        new core.Obj([
          new core.ObjField(new core.Str(selector), new core.Str(selector)),
        ])
      )
      if (notDefined) {
        target = notDefined.var
      }

      // TODO check for loop
      // TODO check for list
      // return new core.BinaryExp(id, dot.sourceString, exp)
      // return id.getVal(exp)

      // if (id.type === d.LIST) {
      //   return id.val[exp.val] ?? new core.Nil()
      // } else if (id.type === d.OBJ) {
      //   return (id instanceof core.Var ? id.exp : id).getVal(exp.val)
      //   // TODO dive further if chained dot ops
      // }

      // selector.rep() ?? new core.Str(selector.sourceString)
      return new core.BinaryExp(target, dot, selector)
    },
    Exp9_negate(negate, exp) {
      let [target, negation] = [exp.rep(), negate.sourceString]

      const notDefined = defineVar(target, context, [d.BOOL])
      if (notDefined) {
        target = notDefined.var
      }

      return new core.UnaryExp(target, negation)
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
    LeftSelect(exp, op) {
      return [exp.rep(), op.sourceString]
    },
    Subscription_rightSlice(_colon, right) {
      let rhs = right.rep()
      if (rhs.length === 0) {
        rhs = [new core.Num(Infinity)]
      }
      return new core.Subscription(new core.Num(0), ...rhs)
    },
    Subscription_slice(left, _colon, right) {
      let [lhs, rhs] = [left.rep(), right.rep()]
      if (rhs.length === 0) {
        rhs = [new core.Num(Infinity)]
      }
      return new core.Subscription(lhs, ...rhs)
    },
    Subscription(exp) {
      return exp.rep()
    },
    BangFunc(_open, block, _close) {
      return block.rep()
    },
    VarAssignment_subscript(target, _open, selector, _close) {
      // TODO check for loop
      let [id, exp] = [target.rep(), selector.rep()]

      const idNotDefined = defineVar(id, context, [d.LIST])
      if (idNotDefined) {
        id = idNotDefined.var
      }

      const expNotDefined = defineVar(exp, context, [d.NUM])
      if (expNotDefined) {
        exp = expNotDefined.var
      }

      return new core.VarSubscript(id, exp)
    },
    VarAssignment_select(target, dot, selector) {
      let [id, exp] = [target.rep(), selector.rep()]

      const notDefined = defineVar(
        id,
        context,
        [d.OBJ],
        new core.Obj([new core.ObjField(new core.Str(exp), new core.Str(exp))])
      )
      if (notDefined) {
        id = notDefined.var
      }

      // TODO check for loop
      // TODO check for list
      return new core.BinaryExp(id, dot.sourceString, exp)
      // return (id instanceof core.Var ? id.exp : id).getVal(exp)
    },
    FuncLit(exp, _arrow, funcBody) {
      let block = new core.Block()
      context = context.newChildContext({ block: block })

      const params = exp.rep()

      if (funcBody._node.ruleName !== 'BangFunc') {
        // Designed to only get here if the function body is a single statement

        block.statements = [funcBody.rep()]
        if (!(block.statements[0] instanceof core.ReturnStatement)) {
          block.statements[0] = new core.ReturnStatement(block.statements[0])
        }

        context.extraVarDecs.forEach((s) => block.statements.unshift(s))
        context.extraVarDecs = []
      } else {
        block = funcBody.rep()
      }

      context = context.parent
      return new core.Func(params, block)
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
      const name = param.rep()
      let variable
      if (typeof name === 'string') {
        variable = new core.Var(name, true, false, [d.ANY])
        context.add(name, variable)
      } else {
        variable = name
      }

      return variable
    },
    PositionalArg(exp) {
      return exp.rep()
    },
    KeywordArg(id, _e, exp) {
      // const [name, val] = [id.rep(), exp.rep()]
      return new core.KeywordArg(id.rep(), exp.rep())
    },
    KeywordParam(id, _e, exp) {
      const [name, val] = [id.sourceString, exp.rep()]
      const variable = new core.Var(name, true, false, [d.ANY, val.type])
      context.add(name, variable)
      return new core.KeywordParam(variable, val)
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
        const notDefined = defineVar(e, context)
        if (notDefined) {
          elements[index] = notDefined.var
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
    FStrExp(_open, exp, _close) {
      let e = exp.rep()

      const notDefined = defineVar(e, context)
      if (notDefined) {
        e = notDefined.var
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
      return context.lookup(this.sourceString) ?? this.sourceString
    },
    boolLit(bool) {
      return new core.Bool(bool.sourceString)
    },
    num(_whole, _dot, _fraction, _e, _sign, _exponent) {
      return new core.Num(this.sourceString)
    },
    MatchExp(_match, id, block) {
      let cond = id.rep()
      const notDefined = defineVar(cond, context)
      if (notDefined) {
        cond = notDefined.var
      }
      return new core.MatchExp(cond, block.rep())
    },
    MatchBlock(_open, cases, defaultCase, _close) {
      return new core.MatchBlock([...cases.rep(), ...defaultCase.rep()])
    },
    CaseClause(_case, matches, _colon, caseBlock) {
      let block

      if (caseBlock._node.ruleName !== 'BangFunc') {
        // Designed to only get here if block is a single statement

        const b = new core.Block()
        context = context.newChildContext({ block: b })

        b.statements = [caseBlock.rep()]
        if (!(b.statements[0] instanceof core.ReturnStatement)) {
          b.statements[0] = new core.ReturnStatement(b.statements[0])
        }

        context.extraVarDecs.forEach((s) => b.statements.unshift(s))
        context.extraVarDecs = []

        context = context.parent
        block = b
      } else {
        block = caseBlock.rep()
      }

      let conds = matches.asIteration().rep()
      conds = conds.map((c) => {
        const notDefined = defineVar(c, context)
        return notDefined ? notDefined.var : c
      })

      return new core.MatchCase(conds, block)
    },
    DefaultClause(_default, _colon, defaultBlock) {
      let block

      if (defaultBlock._node.ruleName !== 'BangFunc') {
        block = new core.Block()
        context = context.newChildContext({ block: block })

        block.statements = [defaultBlock.rep()]
        if (!(block.statements[0] instanceof core.ReturnStatement)) {
          block.statements[0] = new core.ReturnStatement(block.statements[0])
        }

        context.extraVarDecs.forEach((s) => block.statements.unshift(s))
        context.extraVarDecs = []

        context = context.parent
      } else {
        block = defaultBlock.rep()
      }

      return new core.DefaultMatchCase(block)
    },
    nil(_nil) {
      return new core.Nil()
    },
    _terminal() {
      return this.sourceString
    },
    _iter(...children) {
      return children.map((child) => child.rep())
    },
  })

  for (const [name, obj] of Object.entries(stdlib.contents)) {
    context.add(name, obj)
  }

  const match = bangGrammar.match(sourceCode)
  return analyzer(match).rep()
}
