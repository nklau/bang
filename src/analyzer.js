import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const bangGrammar = ohm.grammar(fs.readFileSync("src/bang.ohm"))

// Throw an error message that takes advantage of Ohm's messaging
function error(message, node) {
  if (node) {
    throw new Error(`${node.source.getLineAndColumnMessage()}${message}`)
  }
  throw new Error(message)
}

function check(condition, message, node) {
  if (!condition) error(message, node)
}

export default function analyze(sourceCode) {
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
    Statement_varAssignment(local, readOnly, id, op, exp) {
      return new core.VariableDec(
        id.rep(), 
        local.sourceString === 'local', 
        readOnly.sourceString === 'const', 
        op.sourceString, 
        exp.rep()
      )
    },
    Statement_localVar(_local, id) {
      return new core.VariableDec(id.rep(), true, false)
    },
    Statement_return(_return, exp) {
      return new core.ReturnStatement(...exp.rep())
    },
    Statement(exp) {
      return exp.rep()
    },
    Exp_ternary(cond, _qMark, block, _c, alt) {
      return new core.Ternary(cond.rep(), block.rep(), ...alt.rep())
    },
    Exp1_equality(left, op0, op1, right) {
      return new core.BinaryExp(left.rep(), `${op0.sourceString}${op1.sourceString}`, right.rep())
    },
    Exp2_or(left, or, right) {
      return new core.BinaryExp(left.rep(), or.sourceString, right.rep())
    },
    Exp3_and(left, op, right) {
      return new core.BinaryExp(left.rep(), op.sourceString, right.rep())
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
    Exp7_call(exp, params) {
      return new core.Call(exp.rep(), params.rep())
    },
    Exp7_subscript(exp, _open, selector, _close) {
      return new core.VarSubscript(exp.rep(), selector.rep())
    },
    Exp7_select(exp, _dot, selector) {
      return new core.VarSelect(...exp.rep(), selector.rep())
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
      return new core.KeywordParam(id.sourceString, exp.rep())
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
      return [...list.asIteration().rep()]
    },
    Str(str) {
      return str.rep()
    },
    strLit(_open, chars, _close) {
      return chars.rep().join('')
    },
    FormattedStr(_open, chars, _close) {
      return chars.rep().join('')
    },
    FSingleSubstr(exp) {
      return exp.rep()
    },
    FDoubleSubstr(exp) {
      return exp.rep()
    },
    FStrExp(_open, exp, _close) {
      // const x = exp.rep()[0]
      // return ['${', exp.rep(), '}'].join('')
      return `\${${exp.rep()}}`
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
    id(start, rest) {
      return `${start.sourceString}${rest.sourceString}`
    },
    boolLit(bool) {
      return bool.sourceString === 'true'
    },
    num(_whole, _dot, _fraction, _e, _sign, _exponent) {
      return Number(this.sourceString)
    },
    MatchExp(_match, id, block) {
      return new core.MatchExp(id.sourceString, block.rep())
    },
    MatchBlock(_open, cases, defaultCase, _close) {
      return new core.MatchBlock(cases.rep(), defaultCase.rep())
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