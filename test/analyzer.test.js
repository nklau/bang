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
   8 | VarSelect id='x' field='y'
   9 | VariableDec id=#10 isLocal=false isReadOnly=false assignmentOp='*=' exp=100000
  10 | VarSubscript id='x' selector='y'
  11 | VariableDec id=#12 isLocal=false isReadOnly=false assignmentOp='/=' exp=0.000001
  12 | VarSelect id=#13 field='y'
  13 | VarSubscript id='x' selector=1
  14 | VariableDec id=#15 isLocal=false isReadOnly=false assignmentOp='%=' exp=10000
  15 | VarSelect id='x' field=#16
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
   2 | Enum name='x' cases=#3
   3 | EnumBlock cases=[#4,#5,#6,#7,#15]
   4 | EnumCase name='y' value='y'
   5 | EnumCase name='z' value='z'
   6 | EnumCase name='a' value=4
   7 | EnumCase name='b' value=#8
   8 | Block statements=[#9,#13]
   9 | VariableDec id='x' isLocal=true isReadOnly=true assignmentOp='=' exp=#10
  10 | BinaryExp left=#11 op='&&' right=#12
  11 | VarSelect id='x' field='y'
  12 | VarSelect id='x' field='z'
  13 | ReturnStatement exp=#14
  14 | BinaryExp left='a' op='+' right='x'
  15 | EnumCase name='d' value=false`
  ]
]

describe('The analyzer', () => {
  for (const [scenario, example, expected] of examples) {
    it(`produces the expected ast for ${scenario}`, () => {
      assert.deepEqual(util.format(analyze(example)), expected)
    }) 
  }
})