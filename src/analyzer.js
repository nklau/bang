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
  const analyzer = bellaGrammar.createSemantics().addOperation("rep", {
    Program(body) {
      return new core.Program(body.rep())
    },
    Statement_bangFunc(_open, statements, _close) {
      return new core.BangFunc(statements)
    },
    Statement_varDec(local, readOnly, id, op, exp) {
      return new core.VariableDec(id, local, readOnly, op, exp)
    },
    Statement_print(_print, _open, exp, _close) {
      return new core.PrintStatement(exp)
    },
    Statement_return(_return, exp) {
      return new core.ReturnStatement(exp)
    },
    Exp_unary(op, operand) {
      return new core.UnaryExp(op, operand)
    },
    Exp_binary(left, op, right) {
      return new core.BinaryExp(left, right, op)
    },
    Exp_call(id, args) {
      return new core.Call(id, args)
    },
    Exp_varSubscript(id, _open, selector, _close) {
      return new core.VarSubscript(id, selector)
    },
    Exp_varSelect(id, _dot, field) {
      return new core.VarSelect(id, field)
    },
    Exp_cond(cond, _questionMark, block, _colon, alt) {
      return new core.Conditional(cond, block, alt)
    },
    Exp_func(params, _arrow, block) {
      return new core.FuncLit(params, block)
    },
    Params(_open, params, _close) {
      return new core.Params(params)
    },
    KeywordParam(id, _equals, exp) {
      return new core.KeywordParam(id, exp)
    },
    Obj(_open, fields, _close) {
      return new core.Object(fields)
    },
    ObjField(key, _colon, exp) {
      return new core.ObjField(key, exp)
    },
    List(_open, list, _close) {
      return new core.List(list)
    },
    Range(_range, _open, start, _comma, end, _close) {
      return new core.Range(start, end)
    },
    StrLit(_open, chars, _close) {
      // TODO: could probably replace with regular string
      return new core.StrLit(chars)
    },
    FormattedStr(_open, exps, _close) {
      // TODO: could probably replace with JS's formatted string, i.e. `strLit ${exp}`
      return new core.FormattedStr(exps)
    },
    FormattedSubstr(_open, exp, _close) {
      return new core.FormattedSubstr(exp)
    },
    Exp_unwrap(id, _questionMark) {
      return new core.UnwrapExp(id)
    },
    num(_whole, _dot, _fraction, _e, _sign, _exponent) {
      return Number(this.sourceString)
    },
    Exp_match(_match, id, cases) {
      return new core.MatchExp(id, cases)
    },
    Exp_matchCase(_case, matches, _colon, block) {
      return new core.MatchClause(false, matches, block)
    },
    Exp_matchDefaultCase(_default, _colon, block) {
      return new core.MatchClause(true, undefined, block)
    },
    Statement_enum(_enum, id, _open, cases, _close) {
      return new core.Enum(id, cases)
    }
    // TODO: tokens
  })

  const match = bangGrammar.match(sourceCode)
  if (!match.succeeded()) error(match.message)
  return analyzer(match).rep()
}