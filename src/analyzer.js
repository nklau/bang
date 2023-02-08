import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const bangGrammar = ohm.grammar(fs.readFileSync("src/bang.ohm"))

// TODO: function to get type

function check(condition, message, node) {
  if (!condition) error(message, node)
}

function checkType(e, types, expectation) {
  check(types.includes(e.type.constructor), `Expected ${expectation}`)
}

function checkInBlock(context) {
  check(context.function, 'Cannot return outside a function')
}

function checkBool(e) {
  check(e.type.constructor === core.BoolType, 'Expected bool')
}

function coerceToBool(e) {
  // TODO: attempt type coercion
  // if e.val === e.default then e = falsy
  checkBool(e)
}

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
    if (!entity.local && lookup(name).readOnly) {
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
      return new core.Block([...(statements.rep()), ...statement.rep()])
    },
    StatementNewLine(statement, _space, _n) {
      return statement.rep()
    },
    Statement_varDec(local, readOnly, id, op, exp) {
      const e = exp.rep()
      let v

      if (op.sourceString === '=') {
        v = new core.Var(
          id.sourceString,
          local.sourceString === 'local',
          readOnly.sourceString === 'const',
          e.type
        )
        context.add(id.sourceString, v)
      } else {
        v = id.rep()
      }

      return new core.VarDec(v, op.sourceString, e)
    },
    Statement_localVar(_local, id) {
      const v = new core.Var(
        id.sourceString,
        true,
        false
      )
      context.add(id.sourceString, v)
      return new core.VarDec(v)
    },
    Statement_varAssignment(variable, op, exp) {
      // Designed to only get here for variable subscription/selection
      const v = variable.rep()
      return new core.VarDec(v, op.sourceString, exp.rep())
    },
    Statement_return(_return, exp) {
      // Can only explicitly use 'return' keyword inside a function
      checkInBlock(context)
      return new core.ReturnStatement(...exp.rep())
    },
    Statement_impliedReturn(exp) {
      return new core.ReturnStatement(...exp.rep())
    },
    Exp_ternary(cond, _qMark, block, _c, alt) {
      const c = coerceToBool(cond.rep())
      return new core.Ternary(c, block.rep(), ...alt.rep())
    },
    Exp1_equality(left, op, rest) {
      return new core.NaryExp([left.rep(), op.sourceString, [...rest.asIteration().rep()]])

      // const [l, op, r] = [left.rep(), `${op0.sourceString}${op1.sourceString}`, right.rep()]
      // if (op.includes('<') || op.includes('>')) {
      //   const types = [core.NumType, core.StrType, core.BoolType]
      //   checkType(l, types, 'number')
      //   checkType(r, types, l.type)
      // }
      // return new core.BinaryExp(left.rep(), op, right.rep())
    },
    Exp2_or(left, or, right) {
      const [l, op, rs] = [left.rep(), or.sourceString, right.rep()]
      let x = coerceToBool(l)

      for (let r of rs) {
        const y = coerceToBool(r)
        x = new core.BinaryExp(x, op, y)
      }

      return x
    },
    Exp3_and(left, and, right) {
      const [l, op, rs] = [left.rep(), and.sourceString, right.rep()]
      let x = coerceToBool(l)
      
      for (let r of rs) {
        const y = coerceToBool(r)
        x = new core.BinaryExp(x, op, y)
      }

      return x
    },
    Exp4_addSubtract(left, op, right) {
      return new core.BinaryExp(left.rep(), op.sourceString, right.rep())
    },
    Exp5_multiplyDivideMod(left, op, right) {
      return new core.BinaryExp(left.rep(), op.sourceString, right.rep())
    },
    Exp6_exponent(left, op, right) {
      return new core.BinaryExp(left.rep(), op.sourceString, right.rep())
    },
    Exp6_negate(negative, right) {
      return new core.UnaryExp(right.rep(), negative.sourceString)
    },
    Exp6_spread(spread, right) {
      return new core.UnaryExp(right.rep(), spread.sourceString)
    },
    Exp6_postIncrement(exp, op) {
      return new core.UnaryExp(exp.rep(), op.sourceString, true)
    },
    Exp7_call(exp, _space, params) {
      return new core.Call(exp.rep(), params.rep())
    },
    Exp7_subscript(exp, _open, selector, _close) {
      return new core.VarSubscript(exp.rep(), selector.rep())
    },
    Exp7_select(exp, _dot, selector) {
      return exp.sourceString
        ? new core.VarSelect(...exp.rep(), selector.rep())
        : new core.VarSelect(undefined, selector.rep())
    },
    Exp7_negative(negate, exp) {
      return new core.UnaryExp(exp.rep(), negate.sourceString)
    },
    Exp7_unwrap(exp, unwrap) {
      return new core.UnaryExp(exp.rep(), unwrap.sourceString)
    },
    Exp8_enclosed(_open, exp, _close) {
      return exp.rep()
    },
    BangFunc(_open, block, _close) {
      return block.rep()
    },
    VarAssignment_subscript(exp, _open, selector, _close) {
      return new core.VarSubscript(exp.rep(), selector.rep())
    },
    VarAssignment_select(exp, _dot, selector) {
      // TODO: set exp type to object?
      return new core.VarSelect(exp.rep(), selector.rep())
    },
    FuncLit(exp, _arrow, block) {
      return new core.FuncLit(exp.rep(), block.rep())
    },
    Params(_open, args, _close) {
      return new core.Params(args.asIteration().rep())
    },
    Arg(arg) {
      return arg.rep()
    },
    PositionalArg(exp) {
      return exp.rep()
    },
    KeywordArg(id, _e, exp) {
      return new core.KeywordParam(id.rep(), exp.rep())
    },
    Obj(_open, fields, _close) {
      return new core.Obj(fields.asIteration().rep())
    },
    ObjField(key, _c, exp) {
      return new core.ObjField(key.rep(), exp.rep())
    },
    key(str) {
      return str.rep()
    },
    ListLit(_open, list, _close) {
      return core.List([...list.asIteration().rep()])
    },
    Str(str) {
      return str.rep()
    },
    strLit(_open, chars, _close) {
      return chars.rep().join('')
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
      return context.lookup(this.sourceString)
    },
    boolLit(bool) {
      return new core.Bool(bool.sourceString)
    },
    num(_whole, _dot, _fraction, _e, _sign, _exponent) {
      return new core.Num(this.sourceString)
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
    Enum(_enum, id, _open, block, _close) {
      return new core.Enum(id.sourceString, block.rep())
    },
    EnumBlock(cases) {
      return new core.EnumBlock(cases.asIteration().rep())
    },
    EnumCaseAssignment_withValue(id, _e, exp) {
      return new core.EnumCase(id.sourceString, exp.rep())
    },
    EnumCaseAssignment_noValue(id) {
      return new core.EnumCase(id.sourceString)
    },
    nil(_nil) {
      return undefined
    },
    _terminal() {
      return this.sourceString
    },
    _iter(...children) {
      return children.map(child => child.rep())
    },
  })

  const match = bangGrammar.match(sourceCode)
  if (!match.succeeded()) error(match.message)
  return analyzer(match).rep()
}