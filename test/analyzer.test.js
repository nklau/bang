import util from "util"
import assert from "assert/strict"
import analyze from "../src/analyzer.js"

// TODO const w/out val should error
// TODO: local const w/out val should error
// TODO: changing const val should error

const examples = [
  [
    'numeric variable declaration',
    'x = 1',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='number'
   4 | Num val=1`
  ],
  [
    'string var dec',
    'x = "str"',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='string'
   4 | Str val='str'`
  ],
  [
    'string var dec with apostrophes',
    `x = 'str'`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='string'
   4 | Str val='str'`
  ],
  [
    'bool var dec with true',
    'x = true',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='boolean'
   4 | Bool val=true`
  ],
  [
    'bool var dec with false',
    'x = false',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='boolean'
   4 | Bool val=false`
  ],
  [
    'list var dec with empty list',
    'x = []',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='list'
   4 | List val=[]`
  ],
  [
    'list var dec with 1-element list',
    'x = [1]',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='list'
   4 | List val=[#5]
   5 | Num val=1`
  ],
  [
    'list var dec with 2-element list',
    'x = [1, "str"]',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='list'
   4 | List val=[#5,#6]
   5 | Num val=1
   6 | Str val='str'`
  ],
  [
    'formatted str var dec',
    `y = 12
    x = $"str{y}ing"`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='y' local=false readOnly=false type='number'
   4 | Num val=12
   5 | VarDec variable=#6 assignmentOp='=' exp=#7
   6 | Var id='x' local=false readOnly=false type='string'
   7 | FormattedStr val=['s','t','r',#3,'i','n','g']`
  ],
  [
    'formatted str var dec with apostrophes',
    `y = 12
    x = $'str{y}ing'`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='y' local=false readOnly=false type='number'
   4 | Num val=12
   5 | VarDec variable=#6 assignmentOp='=' exp=#7
   6 | Var id='x' local=false readOnly=false type='string'
   7 | FormattedStr val=['s','t','r',#3,'i','n','g']`
  ],
  [
    'empty function literal with no params var dec',
    `x = () -> {}`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='function'
   4 | Func params=#5 block=#6
   5 | Params params=[]
   6 | Block statements=[]`
  ],
  [
    'function literal with enclosed 1 param var dec',
    `x = (i) -> { i }`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='function'
   4 | Func params=#5 block=#7
   5 | Params params=[#6]
   6 | Var id='i' local=true readOnly=false type=undefined
   7 | Block statements=[#8]
   8 | ReturnStatement exp=#6`
  ],
  [
    'function literal with 1 param var dec',
    `x = i -> { i }`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='function'
   4 | Func params=#5 block=#7
   5 | Params params=[#6]
   6 | Var id='i' local=true readOnly=false type=undefined
   7 | Block statements=[#8]
   8 | ReturnStatement exp=#6`
  ],
  [
    'function literal with no brackets',
    `x = i -> i`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='function'
   4 | Func params=#5 block=#7
   5 | Params params=[#6]
   6 | Var id='i' local=true readOnly=false type=undefined
   7 | ReturnStatement exp=#6`
  ],
  [
    '2 arg function call', 
    `add = (y, z) -> { y + z }
    add(2, [false])`, 
    `   1 | Block statements=[#2,#11]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='add' local=false readOnly=false type='function'
   4 | Func params=#5 block=#8
   5 | Params params=[#6,#7]
   6 | Var id='y' local=true readOnly=false type=undefined
   7 | Var id='z' local=true readOnly=false type=undefined
   8 | Block statements=[#9]
   9 | ReturnStatement exp=#10
  10 | NaryExp exp=[#6,'+',#7]
  11 | ReturnStatement exp=#12
  12 | Call id=#3 args=#13
  13 | Args args=[#14,#15]
  14 | Num val=2
  15 | List val=[#16]
  16 | Bool val=false`
  ],
  [
    'variable to number comparison',
    `x = 1
    x < 2`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='number'
   4 | Num val=1
   5 | ReturnStatement exp=#6
   6 | NaryExp exp=[#3,'<',#7]
   7 | Num val=2`
  ],
  [
    'number to variable comparison',
    `y = false
    4 > y > -1`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='y' local=false readOnly=false type='boolean'
   4 | Bool val=false
   5 | ReturnStatement exp=#6
   6 | NaryExp exp=[#7,'>',#3,'>',#8]
   7 | Num val=4
   8 | UnaryExp exp=#9 op='-'
   9 | Num val=1`
  ],
  [
    'equality check',
    `x += 1
    x == y`,
    `   1 | Block statements=[#2,#7]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='number'
   4 | NaryExp exp=[#5,'+',#6]
   5 | Num val=0
   6 | Num val=1
   7 | ReturnStatement exp=#8
   8 | NaryExp exp=[#3,'==',undefined]`
  ],
  [
    'post-increment operator',
    `y = x++`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='y' local=false readOnly=false type='number'
   4 | PostIncrement exp=#5
   5 | Var id='x' local=false readOnly=false type='number'`
  ],
  [
    'post-increment operator is not an implied return',
    `x++`,
    `   1 | Block statements=[#2]
   2 | PostIncrement exp=#3
   3 | Var id='x' local=false readOnly=false type='number'`
  ],
  [
    'post-decrement operator is not an implied return',
    `x--`,
    `   1 | Block statements=[#2]
   2 | PostDecrement exp=#3
   3 | Var id='x' local=false readOnly=false type='number'`
  ],
  [
    'pre-increment operator is not an implied return',
    `++x`,
    `   1 | Block statements=[#2]
   2 | PreIncrement exp=#3
   3 | Var id='x' local=false readOnly=false type='number'`
  ],
  [
    'pre-decrement operator is not an implied return',
    `--x`,
    `   1 | Block statements=[#2]
   2 | PreDecrement exp=#3
   3 | Var id='x' local=false readOnly=false type='number'`
  ],
  [
    'ternary is not an implied return',
    `true ? 1 : 2`,
    `   1 | Block statements=[#2]
   2 | Ternary cond=#3 block=#4 alt=#6
   3 | Bool val=true
   4 | ReturnStatement exp=#5
   5 | Num val=1
   6 | ReturnStatement exp=#7
   7 | Num val=2`
  ],
  [
    'postfix op',
    `x = 1
    x++`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='number'
   4 | Num val=1
   5 | PostIncrement exp=#3`
  ],
  [
    'chained addition',
    `1 + 2 + 3`,
    `   1 | Block statements=[#2]
   2 | ReturnStatement exp=#3
   3 | NaryExp exp=[#4,'+',#5,'+',#6]
   4 | Num val=1
   5 | Num val=2
   6 | Num val=3`
  ],
  [
    'chained subtraction',
    `4 - 3 - 5 - 1`,
    `   1 | Block statements=[#2]
   2 | ReturnStatement exp=#3
   3 | NaryExp exp=[#4,'-',#5,'-',#6,'-',#7]
   4 | Num val=4
   5 | Num val=3
   6 | Num val=5
   7 | Num val=1`
  ],
  [
    'empty obj dec',
    `x = {}`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='object'
   4 | Obj val=[]`
  ],
  [
    'local var dec with value', 
    `local x = 5`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=true readOnly=false type='number'
   4 | Num val=5`
  ],
  [
    'local var dec without value',
    `local x`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=true readOnly=false type='nil'
   4 | Nil `
  ],
  [
    'var dec without value',
    `x`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='nil'
   4 | Nil `
  ],
  [
    'var as implied return gets recognized as return',
    `x = 1
    x`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='number'
   4 | Num val=1
   5 | ReturnStatement exp=#3`
  ],
  [
    'const var dec with value',
    `const x = 5`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=true type='number'
   4 | Num val=5`
  ],
  [
    'local const var dec with value',
    `local const x = 5`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=true readOnly=true type='number'
   4 | Num val=5`
  ],
  [
    'changing variable value affects previously undefined var type',
    `x
    x = 5
    x`,
    `   1 | Block statements=[#2,#5,#7]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='number'
   4 | Nil 
   5 | VarDec variable=#3 assignmentOp='=' exp=#6
   6 | Num val=5
   7 | ReturnStatement exp=#3`
  ],
  [
    'changing variable value affects already existing var type',
    `x = 5
    x = 'str'`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='string'
   4 | Num val=5
   5 | VarDec variable=#3 assignmentOp='=' exp=#6
   6 | Str val='str'`
  ],
  [
    'changing variable value with mutating assignment op',
    `x = 5
    x += 'str'`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='string'
   4 | Num val=5
   5 | VarDec variable=#3 assignmentOp='=' exp=#6
   6 | NaryExp exp=[#3,'+',#7]
   7 | Str val='str'`
  ],
  [
    '+= op with chained addition on right',
    `x = 5
    x += 'str' + ['alt']`,
    `   1 | Block statements=[#2,#5]
   2 | VarDec variable=#3 assignmentOp='=' exp=#4
   3 | Var id='x' local=false readOnly=false type='list'
   4 | Num val=5
   5 | VarDec variable=#3 assignmentOp='=' exp=#6
   6 | NaryExp exp=[#3,'+',#7,'+',#8]
   7 | Str val='str'
   8 | List val=[#9]
   9 | Str val='alt'`
  ]
  // TODO: x = 5 \n x += 'str' + 'alt'
  // TODO: declaring local x in smaller scope should make a new var, then outside var should be unchanged type (test using different types)
//   [
//     'binary exps',
//     `x == y
//     x != true
//     x < 2
//     4 > y
//     x <= y
//     x >= y
//     x || false
//     x && y
//     [x] + 'str'
//     x - y
//     x * y
//     x / y
//     x % y
//     x ** y`,
//     `   1 | Block statements=[#2,#3,#5]
//    2 | BinaryExp left='x' op='==' right='y'
//    3 | BinaryExp left='x' op='!=' right=#4
//    4 | Bool val=false
//    5 | BinaryExp left='x' op='<' right=2
//    6 | BinaryExp left=4 op='>' right='y'
//    6 | BinaryExp left='x' op='<=' right='y'
//    7 | BinaryExp left='x' op='>=' right='y'
//    8 | BinaryExp left='x' op='||' right=false
//    9 | BinaryExp left='x' op='&&' right='y'
//   10 | BinaryExp left=#11 op='+' right='str'
//   11 | List list=['x']
//   12 | BinaryExp left='x' op='-' right='y'
//   13 | BinaryExp left='x' op='*' right='y'
//   14 | BinaryExp left='x' op='/' right='y'
//   15 | BinaryExp left='x' op='%' right='y'
//   16 | BinaryExp left='x' op='**' right='y'`
//   ],
//   [
//     'additive exp',
//     'x + y',
//     `   1 | Block statements=[#2]
//    2 | BinaryExp left='x' op='+' right='y'`
//   ],
//   [
//     'assignment ops',
//     `local x = 5
//     local const y = 'str'
//     const var = nil
//     local x
//     x += 1.5
//     x.y -= 1.5E4
//     x[y] *= 1e5
//     x[1].y /= 1E-6
//     x.y['str'] %= 1e+4`,
//     `   1 | Block statements=[#2,#4,#6,#8,#10,#12,#15,#18,#22]
//    2 | VarDec variable=#3 assignmentOp='=' exp=5
//    3 | Var id='x' local=true readOnly=false type=undefined
//    4 | VarDec variable=#5 assignmentOp='=' exp='str'
//    5 | Var id='y' local=true readOnly=true type=undefined
//    6 | VarDec variable=#7 assignmentOp='=' exp=undefined
//    7 | Var id='var' local=false readOnly=true type=undefined
//    8 | VarDec variable=#9 assignmentOp='=' exp=undefined
//    9 | Var id='x' local=true readOnly=false type=undefined
//   10 | VarDec variable=#11 assignmentOp='+=' exp=1.5
//   11 | Var id='x' local=false readOnly=false type=undefined
//   12 | VarDec variable=#13 assignmentOp='-=' exp=15000
//   13 | Var id=#14 local=false readOnly=false type=undefined
//   14 | VarSelect id='x' selector='y'
//   15 | VarDec variable=#16 assignmentOp='*=' exp=100000
//   16 | Var id=#17 local=false readOnly=false type=undefined
//   17 | VarSubscript id='x' selector='y'
//   18 | VarDec variable=#19 assignmentOp='/=' exp=0.000001
//   19 | Var id=#20 local=false readOnly=false type=undefined
//   20 | VarSelect id=#21 selector='y'
//   21 | VarSubscript id='x' selector=1
//   22 | VarDec variable=#23 assignmentOp='%=' exp=10000
//   23 | Var id=#24 local=false readOnly=false type=undefined
//   24 | VarSelect id='x' selector=#25
//   25 | VarSubscript id='y' selector='str'`
//   ],
//   [
//     'return statement',
//     `return x
//     return x && y || z
//     return { 
//       "x": 1,
//       "y": { 
//         return [1, 'str'] 
//       } 
//     }
//     x = { 
//       local x = true
//       return x 
//     }
//     return`,
//     `   1 | Block statements=[#2,#3,#6,#13,#19]
//    2 | ReturnStatement exp='x'
//    3 | ReturnStatement exp=#4
//    4 | BinaryExp left=#5 op='||' right='z'
//    5 | BinaryExp left='x' op='&&' right='y'
//    6 | ReturnStatement exp=#7
//    7 | Obj fields=[#8,#9]
//    8 | ObjField key='x' val=1
//    9 | ObjField key='y' val=#10
//   10 | Block statements=[#11]
//   11 | ReturnStatement exp=#12
//   12 | List list=[1,'str']
//   13 | VarDec variable=#13 assignmentOp='=' exp=#14
//   14 | Var id='x' local=false readOnly=false type=undefined
//   15 | Block statements=[#15,#17]
//   16 | VarDec variable=#16 assignmentOp='=' exp=true
//   17 | Var id='x' local=true readOnly=false type=undefined
//   18 | ReturnStatement exp='x'
//   19 | ReturnStatement exp=undefined`
//   ],
//   [
//     'ternaries',
//     `x ? y
//     x ? y : z
//     x ? {
//       break
//     } : {
//       return {
//         "x": a >= 5 ? b : c,
//         'y': d + e > f ? 'hello'
//       }
//     }`,
//     `   1 | Block statements=[#2,#3,#4]
//    2 | Ternary cond='x' block='y' alt=undefined
//    3 | Ternary cond='x' block='y' alt='z'
//    4 | Ternary cond='x' block=#5 alt=#6
//    5 | Block statements=['break']
//    6 | Block statements=[#7]
//    7 | ReturnStatement exp=#8
//    8 | Obj fields=[#9,#12]
//    9 | ObjField key='x' val=#10
//   10 | Ternary cond=#11 block='b' alt='c'
//   11 | BinaryExp left='a' op='>=' right=5
//   12 | ObjField key='y' val=#13
//   13 | Ternary cond=#14 block='hello' alt=undefined
//   14 | BinaryExp left=#15 op='>' right='f'
//   15 | BinaryExp left='d' op='+' right='e'`
//   ],
//   [
//     'unary exps',
//     `x = false
//     x = !x
//     y = -x
//     z = !(y == true) ? [1] : { "n": ...[x, [y]] }
//     a = z?[0] == nil ? z?.n`,
//     `   1 | Block statements=[#2,#4,#7,#10,#19]
//    2 | VarDec variable=#3 assignmentOp='=' exp=false
//    3 | Var id='x' local=false readOnly=false type=undefined
//    4 | VarDec variable=#5 assignmentOp='=' exp=#6
//    5 | Var id='x' local=false readOnly=false type=undefined
//    6 | UnaryExp exp='x' op='!' returnBeforeEval=false
//    7 | VarDec variable=#8 assignmentOp='=' exp=#9
//    8 | Var id='y' local=false readOnly=false type=undefined
//    9 | UnaryExp exp='x' op='-' returnBeforeEval=false
//   10 | VarDec variable=#11 assignmentOp='=' exp=#12
//   11 | Var id='z' local=false readOnly=false type=undefined
//   12 | Ternary cond=#13 block=[1] alt=#15
//   13 | UnaryExp exp=#14 op='!' returnBeforeEval=false
//   14 | BinaryExp left='y' op='==' right=true
//   15 | Obj fields=[#16]
//   16 | ObjField key='n' val=#17
//   17 | UnaryExp exp=['x',#18] op='...' returnBeforeEval=false
//   18 | Array 0='y'
//   19 | VarDec variable=#20 assignmentOp='=' exp=#21
//   20 | Var id='a' local=false readOnly=false type=undefined
//   21 | Ternary cond=#22 block=#25 alt=undefined
//   22 | BinaryExp left=#23 op='==' right=undefined
//   23 | VarSubscript id=#24 selector=0
//   24 | UnaryExp exp='z' op='?' returnBeforeEval=false
//   25 | VarSelect id=#26 selector='n'
//   26 | UnaryExp exp='z' op='?' returnBeforeEval=false`
//   ],
//   [
//     'function literals',
//     `x = () -> {}
//     x = y -> { return -(y ** 2) }
//     z = x(5) > 25 ? {
//       return (y=0) -> {
//         y ** 2
//       }
//     } : {
//       return (y) -> { (-y) ** 2 }
//     }`,
//     `   1 | Block statements=[#2,#7,#14]
//    2 | VarDec variable=#3 assignmentOp='=' exp=#4
//    3 | Var id='x' local=false readOnly=false type=undefined
//    4 | Func params=#5 block=#6
//    5 | Params params=[]
//    6 | Block statements=[]
//    7 | VarDec variable=#8 assignmentOp='=' exp=#9
//    8 | Var id='x' local=false readOnly=false type=undefined
//    9 | Func params='y' block=#10
//   10 | Block statements=[#11]
//   11 | ReturnStatement exp=#12
//   12 | UnaryExp exp=#13 op='-' returnBeforeEval=false
//   13 | BinaryExp left='y' op='**' right=2
//   14 | VarDec variable=#15 assignmentOp='=' exp=#16
//   15 | Var id='z' local=false readOnly=false type=undefined
//   16 | Ternary cond=#17 block=#20 alt=#27
//   17 | BinaryExp left=#18 op='>' right=25
//   18 | Call id='x' args=#19
//   19 | Params params=[5]
//   20 | Block statements=[#21]
//   21 | ReturnStatement exp=#22
//   22 | Func params=#23 block=#25
//   23 | Params params=[#24]
//   24 | KeywordParam id='y' val=0
//   25 | Block statements=[#26]
//   26 | BinaryExp left='y' op='**' right=2
//   27 | Block statements=[#28]
//   28 | ReturnStatement exp=#29
//   29 | Func params=#30 block=#31
//   30 | Params params=['y']
//   31 | Block statements=[#32]
//   32 | BinaryExp left=#33 op='**' right=2
//   33 | UnaryExp exp='y' op='-' returnBeforeEval=false`
//   ],
//   [
//     'formatted strings',
//     `x = $'str{ a >= 5 ? b : c }'`,
//     `   1 | Block statements=[#2]
//    2 | VarDec variable=#3 assignmentOp='=' exp=#4
//    3 | Var id='x' local=false readOnly=false type=undefined
//    4 | FormattedStr subexps=['s','t','r',#5]
//    5 | Ternary cond=#6 block='b' alt='c'
//    6 | BinaryExp left='a' op='>=' right=5`
//   ],
//   [
//     'loops.bang example code lines 9-14',
//     `i = 0
//     (i < 10).loop({
//       print(i)
//       i += 1
//     })
//     // prints 0-9 on separate lines`,
//     `   1 | Block statements=[#2,#4]
//    2 | VarDec variable=#3 assignmentOp='=' exp=0
//    3 | Var id='i' local=false readOnly=false type=undefined
//    4 | Call id=#5 args=#7
//    5 | VarSelect id=#6 selector='loop'
//    6 | BinaryExp left='i' op='<' right=10
//    7 | Params params=[#8]
//    8 | Block statements=[#9,#11]
//    9 | Call id='print' args=#10
//   10 | Params params=['i']
//   11 | VarDec variable=#12 assignmentOp='+=' exp=1
//   12 | Var id='i' local=false readOnly=false type=undefined`
//   ],
//   [
//     'loops.bang example code lines 16-22',
//     `range(5).loop((i) -> { print(i) })
//     range(5).loop((i) -> print(i))
//     range(5).loop(print)
//     // prints 0-4 on separate lines
    
//     range(1, 6).loop(print)
//     // prints 1-5 on separate lines`,
//     `   1 | Block statements=[#2,#12,#21,#26]
//    2 | Call id=#3 args=#6
//    3 | VarSelect id=#4 selector='loop'
//    4 | Call id='range' args=#5
//    5 | Params params=[5]
//    6 | Params params=[#7]
//    7 | Func params=#8 block=#9
//    8 | Params params=['i']
//    9 | Block statements=[#10]
//   10 | Call id='print' args=#11
//   11 | Params params=['i']
//   12 | Call id=#13 args=#16
//   13 | VarSelect id=#14 selector='loop'
//   14 | Call id='range' args=#15
//   15 | Params params=[5]
//   16 | Params params=[#17]
//   17 | Func params=#18 block=#19
//   18 | Params params=['i']
//   19 | Call id='print' args=#20
//   20 | Params params=['i']
//   21 | Call id=#22 args=#25
//   22 | VarSelect id=#23 selector='loop'
//   23 | Call id='range' args=#24
//   24 | Params params=[5]
//   25 | Params params=['print']
//   26 | Call id=#27 args=#30
//   27 | VarSelect id=#28 selector='loop'
//   28 | Call id='range' args=#29
//   29 | Params params=[1,6]
//   30 | Params params=['print']`
//   ]//,
//   // [
//   //   'strings.bang example code lines 1-11',
//   //   `const name = "John Smith"
//   //   name = "Sally"
    
//   //   firstName = "Ray"
//   //   lastName = "Toal"
//   //   combinedName = firstName + " " + lastName
//   //   interpolatedName = $'{firstName} {lastName}'
    
//   //   print("//")
//   //   print(/* */)
//   //   print(/* // */)`,
//   //   `   1 | Block statements=[#2,#4,#6,#8,#10,#14]
//   //  2 | VarDec variable=#3 assignmentOp='=' exp='John Smith'
//   //  3 | Var id='name' local=false readOnly=true type=undefined
//   //  4 | VarDec variable=#5 assignmentOp='=' exp='Sally'
//   //  5 | Var id='name' local=false readOnly=false type=undefined
//   //  6 | VarDec variable=#7 assignmentOp='=' exp='Ray'
//   //  7 | Var id='firstName' local=false readOnly=false type=undefined
//   //  8 | VarDec variable=#9 assignmentOp='=' exp='Toal'
//   //  9 | Var id='lastName' local=false readOnly=false type=undefined
//   // 10 | VarDec variable=#11 assignmentOp='=' exp=#12
//   // 11 | Var id='combinedName' local=false readOnly=false type=undefined
//   // 12 | BinaryExp left=#13 op='+' right='lastName'
//   // 13 | BinaryExp left='firstName' op='+' right=' '
//   // 14 | VarDec variable=#15 assignmentOp='=' exp=#16
//   // 15 | Var id='interpolatedName' local=false readOnly=false type=undefined
//   // 16 | FormattedStr subexps=[#17,' ']
//   // 17 | Var `
//   // ]
//   // TODO: escaped chars (formatted and regular strs)
// TODO 1 +++x, 1 ---x
]

describe('The analyzer', () => {
  for (const [scenario, example, expected] of examples) {
    it(`produces the expected ast for ${scenario}`, () => {
      assert.deepEqual(util.format(analyze(example)), expected)
    }) 
  }
})