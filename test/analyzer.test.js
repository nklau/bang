import util from "util"
import assert from "assert/strict"
import analyze from "../src/analyzer.js"

const examples = [
  [
    'numeric variable declaration',
    'x = 1',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | NumType description='number'
   5 | Num val=1 type=#4`
  ],
  [
    'string var dec',
    'x = "str"',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | StrType description='string'
   5 | Str val='str' type=#4`
  ],
  [
    'string var dec with apostrophes',
    `x = 'str'`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | StrType description='string'
   5 | Str val='str' type=#4`
  ],
  [
    'bool var dec with true',
    'x = true',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | BoolType description='boolean'
   5 | Bool val=true type=#4`
  ],
  [
    'bool var dec with false',
    'x = false',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | BoolType description='boolean'
   5 | Bool val=false type=#4`
  ],
  [
    'list var dec with empty list',
    'x = []',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | ListType description='list'
   5 | List list=[] type=#4`
  ],
  [
    'list var dec with 1-element list',
    'x = [1]',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | ListType description='list'
   5 | List list=[#6] type=#4
   6 | Num val=1 type=#7
   7 | NumType description='number'`
  ],
  [
    'list var dec with 2-element list',
    'x = [1, "str"]',
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | ListType description='list'
   5 | List list=[#6,#8] type=#4
   6 | Num val=1 type=#7
   7 | NumType description='number'
   8 | Str val='str' type=#9
   9 | StrType description='string'`
  ],
  [
    'formatted str var dec',
    `y = 12
    x = $"str{y}ing"`,
    `   1 | Block statements=[#2,#6]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='y' local=false readOnly=false type=#4
   4 | NumType description='number'
   5 | Num val=12 type=#4
   6 | VarDec variable=#7 assignmentOp='=' exp=#9
   7 | Var id='x' local=false readOnly=false type=#8
   8 | StrType description='string'
   9 | FormattedStr subexps=['s','t','r',#3,'i','n','g'] type=#8`
  ],
  [
    'formatted str var dec with apostrophes',
    `y = 12
    x = $'str{y}ing'`,
    `   1 | Block statements=[#2,#6]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='y' local=false readOnly=false type=#4
   4 | NumType description='number'
   5 | Num val=12 type=#4
   6 | VarDec variable=#7 assignmentOp='=' exp=#9
   7 | Var id='x' local=false readOnly=false type=#8
   8 | StrType description='string'
   9 | FormattedStr subexps=['s','t','r',#3,'i','n','g'] type=#8`
  ],
  [
    'empty function literal with no params var dec',
    `x = () -> {}`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | FuncType description='function'
   5 | Func params=#6 block=#7 type=#4
   6 | Params params=[]
   7 | Block statements=[]`
  ],
  [
    'function literal with enclosed 1 param var dec',
    `x = (i) -> { i }`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | FuncType description='function'
   5 | Func params=#6 block=#8 type=#4
   6 | Params params=[#7]
   7 | Var id='i' local=true readOnly=false type=undefined
   8 | Block statements=[#9]
   9 | ReturnStatement exp=#7`
  ],
  [
    'function literal with 1 param var dec',
    `x = i -> { i }`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | FuncType description='function'
   5 | Func params=#6 block=#8 type=#4
   6 | Params params=[#7]
   7 | Var id='i' local=true readOnly=false type=undefined
   8 | Block statements=[#9]
   9 | ReturnStatement exp=#7`
  ],
  [
    'function literal with no brackets',
    `x = i -> i`,
    `   1 | Block statements=[#2]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='x' local=false readOnly=false type=#4
   4 | FuncType description='function'
   5 | Func params=#6 block=#8 type=#4
   6 | Params params=[#7]
   7 | Var id='i' local=true readOnly=false type=undefined
   8 | ReturnStatement exp=#7`
  ],
  [
    '2 arg function call', 
    `add = (y, z) -> { y + z }
    add(2, [false])`, 
    `   1 | Block statements=[#2,#12]
   2 | VarDec variable=#3 assignmentOp='=' exp=#5
   3 | Var id='add' local=false readOnly=false type=#4
   4 | FuncType description='function'
   5 | Func params=#6 block=#9 type=#4
   6 | Params params=[#7,#8]
   7 | Var id='y' local=true readOnly=false type=undefined
   8 | Var id='z' local=true readOnly=false type=undefined
   9 | Block statements=[#10]
  10 | ReturnStatement exp=#11
  11 | NaryExp exp=[#7,'+',#8]
  12 | ReturnStatement exp=#13
  13 | Call id=#3 args=#14
  14 | Args args=[#15,#17]
  15 | Num val=2 type=#16
  16 | NumType description='number'
  17 | List list=[#18] type=#20
  18 | Bool val=false type=#19
  19 | BoolType description='boolean'
  20 | ListType description='list'`
  ],
  // [
  //   'variable to number comparison',
  //   'x < 2',
  //   `   1 | Block statements=[#2]
  //  2 | BinaryExp left=#3 op='<' right=
  //  3 | Var id='x' local=false readOnly=false type=#4
  //  4 | `
  // ],
//   [
//     'number to variable comparison',
//     '4 > y',
//     `   1 | Block statements=[#2]
//    2 | BinaryExp left=4 op='>' right='y'`
//   ],
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
]

describe('The analyzer', () => {
  for (const [scenario, example, expected] of examples) {
    it(`produces the expected ast for ${scenario}`, () => {
      assert.deepEqual(util.format(analyze(example)), expected)
    }) 
  }
})