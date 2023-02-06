import util from "util"
import assert from "assert/strict"
import analyze from "../src/analyzer.js"

const examples = [
  [
    'variable declaration',
    'x = 1',
    `   1 | Block statements=[#2]
   2 | VariableDec id='x' isLocal=false isReadOnly=false assignmentOp='=' exp=1`
  ],
  [
    '2 arg function call', 
    'x(y, z)', 
    `   1 | Block statements=[#2]
   2 | Call id='x' args=#3
   3 | Params params=['y','z']`
  ],
  [
    'variable to number comparison',
    'x < 2',
    `   1 | Block statements=[#2]
   2 | BinaryExp left='x' op='<' right=2`
  ],
  [
    'number to variable comparison',
    '4 > y',
    `   1 | Block statements=[#2]
   2 | BinaryExp left=4 op='>' right='y'`
  ],
  [
    'binary exps',
    `x == y
    x != true
    x < 2
    4 > y
    x <= y
    x >= y
    x || false
    x && y
    [x] + 'str'
    x - y
    x * y
    x / y
    x % y
    x ** y`,
    `   1 | Block statements=[#2,#3,#4,#5,#6,#7,#8,#9,#10,#11,#12,#13,#14,#15]
   2 | BinaryExp left='x' op='==' right='y'
   3 | BinaryExp left='x' op='!=' right=true
   4 | BinaryExp left='x' op='<' right=2
   5 | BinaryExp left=4 op='>' right='y'
   6 | BinaryExp left='x' op='<=' right='y'
   7 | BinaryExp left='x' op='>=' right='y'
   8 | BinaryExp left='x' op='||' right=false
   9 | BinaryExp left='x' op='&&' right='y'
  10 | BinaryExp left=['x'] op='+' right='str'
  11 | BinaryExp left='x' op='-' right='y'
  12 | BinaryExp left='x' op='*' right='y'
  13 | BinaryExp left='x' op='/' right='y'
  14 | BinaryExp left='x' op='%' right='y'
  15 | BinaryExp left='x' op='**' right='y'`
  ],
  [
    'additive exp',
    'x + y',
    `   1 | Block statements=[#2]
   2 | BinaryExp left='x' op='+' right='y'`
  ],
  [
    'assignment ops',
    `local x = 5
    local const y = 'str'
    const var = nil
    local x
    x += 1.5
    x.y -= 1.5E4
    x[y] *= 1e5
    x[1].y /= 1E-6
    x.y['str'] %= 1e+4`,
    `   1 | Block statements=[#2,#3,#4,#5,#6,#7,#9,#11,#14]
   2 | VariableDec id='x' isLocal=true isReadOnly=false assignmentOp='=' exp=5
   3 | VariableDec id='y' isLocal=true isReadOnly=true assignmentOp='=' exp='str'
   4 | VariableDec id='var' isLocal=false isReadOnly=true assignmentOp='=' exp=undefined
   5 | VariableDec id='x' isLocal=true isReadOnly=false assignmentOp='=' exp=undefined
   6 | VariableDec id='x' isLocal=false isReadOnly=false assignmentOp='+=' exp=1.5
   7 | VariableDec id=#8 isLocal=false isReadOnly=false assignmentOp='-=' exp=15000
   8 | VarSelect id='x' selector='y'
   9 | VariableDec id=#10 isLocal=false isReadOnly=false assignmentOp='*=' exp=100000
  10 | VarSubscript id='x' selector='y'
  11 | VariableDec id=#12 isLocal=false isReadOnly=false assignmentOp='/=' exp=0.000001
  12 | VarSelect id=#13 selector='y'
  13 | VarSubscript id='x' selector=1
  14 | VariableDec id=#15 isLocal=false isReadOnly=false assignmentOp='%=' exp=10000
  15 | VarSelect id='x' selector=#16
  16 | VarSubscript id='y' selector='str'`
  ],
  [
    'return statement',
    `return x
    return x && y || z
    return { 
      "x": 1,
      "y": { 
        return [1, 'str'] 
      } 
    }
    x = { 
      local x = true
      return x 
    }
    return`,
    `   1 | Block statements=[#2,#3,#6,#12,#16]
   2 | ReturnStatement exp='x'
   3 | ReturnStatement exp=#4
   4 | BinaryExp left=#5 op='||' right='z'
   5 | BinaryExp left='x' op='&&' right='y'
   6 | ReturnStatement exp=#7
   7 | Obj fields=[#8,#9]
   8 | ObjField key='x' val=1
   9 | ObjField key='y' val=#10
  10 | Block statements=[#11]
  11 | ReturnStatement exp=[1,'str']
  12 | VariableDec id='x' isLocal=false isReadOnly=false assignmentOp='=' exp=#13
  13 | Block statements=[#14,#15]
  14 | VariableDec id='x' isLocal=true isReadOnly=false assignmentOp='=' exp=true
  15 | ReturnStatement exp='x'
  16 | ReturnStatement exp=undefined`
  ],
  [
    'enums',
    `enum x {
      y, z,
      a = 4,
      b = {
        local const x = x.y && x.z
        return a + x
      },
      d = false
    }`,
    `   1 | Block statements=[#2]
   2 | Enum id='x' cases=#3
   3 | EnumBlock cases=[#4,#5,#6,#7,#15]
   4 | EnumCase id='y' val='y'
   5 | EnumCase id='z' val='z'
   6 | EnumCase id='a' val=4
   7 | EnumCase id='b' val=#8
   8 | Block statements=[#9,#13]
   9 | VariableDec id='x' isLocal=true isReadOnly=true assignmentOp='=' exp=#10
  10 | BinaryExp left=#11 op='&&' right=#12
  11 | VarSelect id='x' selector='y'
  12 | VarSelect id='x' selector='z'
  13 | ReturnStatement exp=#14
  14 | BinaryExp left='a' op='+' right='x'
  15 | EnumCase id='d' val=false`
  ],
  [
    'ternaries',
    `x ? y
    x ? y : z
    x ? {
      break
    } : {
      return {
        "x": a >= 5 ? b : c,
        'y': d + e > f ? 'hello'
      }
    }`,
    `   1 | Block statements=[#2,#3,#4]
   2 | Ternary cond='x' block='y' alternative=undefined
   3 | Ternary cond='x' block='y' alternative='z'
   4 | Ternary cond='x' block=#5 alternative=#6
   5 | Block statements=['break']
   6 | Block statements=[#7]
   7 | ReturnStatement exp=#8
   8 | Obj fields=[#9,#12]
   9 | ObjField key='x' val=#10
  10 | Ternary cond=#11 block='b' alternative='c'
  11 | BinaryExp left='a' op='>=' right=5
  12 | ObjField key='y' val=#13
  13 | Ternary cond=#14 block='hello' alternative=undefined
  14 | BinaryExp left=#15 op='>' right='f'
  15 | BinaryExp left='d' op='+' right='e'`
  ],
  [
    'unary exps',
    `x = false
    x = !x
    y = -x
    z = !(y == true) ? [1] : { "n": ...[x, [y]] }
    a = z?[0] == nil ? z?.n`,
    `   1 | Block statements=[#2,#3,#5,#7,#15]
   2 | VariableDec id='x' isLocal=false isReadOnly=false assignmentOp='=' exp=false
   3 | VariableDec id='x' isLocal=false isReadOnly=false assignmentOp='=' exp=#4
   4 | UnaryExp exp='x' op='!'
   5 | VariableDec id='y' isLocal=false isReadOnly=false assignmentOp='=' exp=#6
   6 | UnaryExp exp='x' op='-'
   7 | VariableDec id='z' isLocal=false isReadOnly=false assignmentOp='=' exp=#8
   8 | Ternary cond=#9 block=[1] alternative=#11
   9 | UnaryExp exp=#10 op='!'
  10 | BinaryExp left='y' op='==' right=true
  11 | Obj fields=[#12]
  12 | ObjField key='n' val=#13
  13 | UnaryExp exp=['x',#14] op='...'
  14 | Array 0='y'
  15 | VariableDec id='a' isLocal=false isReadOnly=false assignmentOp='=' exp=#16
  16 | Ternary cond=#17 block=#20 alternative=undefined
  17 | BinaryExp left=#18 op='==' right=undefined
  18 | VarSubscript id=#19 selector=0
  19 | UnaryExp exp='z' op='?'
  20 | VarSelect id=#21 selector='n'
  21 | UnaryExp exp='z' op='?'`
  ]
  // TODO: $'str{ a >= 5 ? b : c }'
]

describe('The analyzer', () => {
  for (const [scenario, example, expected] of examples) {
    it(`produces the expected ast for ${scenario}`, () => {
      assert.deepEqual(util.format(analyze(example)), expected)
    }) 
  }
})