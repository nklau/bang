import assert from "assert/strict"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"
import * as fs from 'fs'
import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execute = promisify(exec)

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

const fixtures = [
  {
    name: 'num add',
    source: `
      1 + 2
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(1), '+', new Num(2)));
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '3'
  },
  {
    name: 'print',
    source: `
    print(1)
    `,
    expected: dedent`
      function main()
      {
        try {
          return console.log(new Num(1) === nil ? nil.type.val : coerce(new Num(1), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '1'
  },
  {
    name: 'print num add',
    source: `
    print(1 + 2)
    `,
    expected: dedent`
      function main()
      {
        try {
          return console.log((add(new Num(1), '+', new Num(2))) === nil ? nil.type.val : coerce((add(new Num(1), '+', new Num(2))), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '3'
  },
  {
    name: 'chained num add',
    source: `
    10 + 153 + 0
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10), '+', new Num(153), '+', new Num(0)));
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '163'
  },
  {
    name: 'num subtraction',
    source: `5 - 3`,
    expected: dedent`
    function main()
      {
        return (add(new Num(5), '-', new Num(3)));
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '2'
  },
  {
    name: 'num over-subtraction',
    source: `3 - 5`,
    expected: dedent`
    function main()
      {
        return (add(new Num(3), '-', new Num(5)));
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '-2'
  },
  {
    name: 'chained num subtraction',
    source: `
    10 - 153 - 0
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10), '-', new Num(153), '-', new Num(0)));
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '-143'
  },
  {
    name: 'num add and subtraction',
    source: `
    10 - 153 + 163
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10), '-', new Num(153), '+', new Num(163)));
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '20'
  },
  {
    name: 'print str',
    source: `print('Hello World!')`,
    expected: dedent`
      function main()
      {
        try {
          return console.log(new Str('Hello World!') === nil ? nil.type.val : coerce(new Str('Hello World!'), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'Hello World!'
  },
  {
    name: 'print f str',
    source: `print($'num {1}')`,
    expected: dedent`
      function main()
      {
        try {
          return console.log(new Str(\`num \${coerce(new Num(1), Str.typeDescription).val}\`) === nil ? nil.type.val : coerce(new Str(\`num \${coerce(new Num(1), Str.typeDescription).val}\`), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'num 1'
  },
  {
    name: 'print exp',
    source: `print($'addition {1 + 2}')`,
    expected: dedent`
      function main()
      {
        try {
          return console.log(new Str(\`addition \${coerce((add(new Num(1), '+', new Num(2))), Str.typeDescription).val}\`) === nil ? nil.type.val : coerce(new Str(\`addition \${coerce((add(new Num(1), '+', new Num(2))), Str.typeDescription).val}\`), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'addition 3'
  },
  {
    name: 'add str',
    source: `'hi' + " aidan !"`,
    expected: dedent`
      function main()
      {
        return (add(new Str('hi'), '+', new Str(' aidan !')));
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'hi aidan !'
  },
  {
    name: 'subtract str',
    source: `'hello' - 'o'`,
    expected: dedent`
      function main()
        {
          return (add(new Str('hello'), '-', new Str('o')));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'hell'
  },
  // TODO
  // x = 'hi'
  // $'{x} aidan' - 'hi'
  {
    name: 'subtract longer str',
    source: `'hello' - 'hell'`,
    expected: dedent`
      function main()
        {
          return (add(new Str('hello'), '-', new Str('hell')));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'o'
  },
  {
    name: 'subtract str not found',
    source: `'hi' - 'hello'`,
    expected: dedent`
      function main()
        {
          return (add(new Str('hi'), '-', new Str('hello')));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'hi'
  },
  {
    name: 'print nil',
    source: `print(nil)`,
    expected: dedent`
      function main()
        {
          try {
            return console.log(nil === nil ? nil.type.val : coerce(nil, Str.typeDescription).val);
          } catch {}
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'nil'
  },
  {
    name: 'add nil',
    source: `nil + nil`,
    expected: dedent`
      function main()
        {
          return (add(nil, '+', nil));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'nil'
  },
  {
    name: 'subtract nil',
    source: `nil - nil`,
    expected: dedent`
      function main()
        {
          return (add(nil, '-', nil));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'nil'
  },
  {
    name: 'add nil to num',
    source: `nil + 5.1`,
    expected: dedent`
      function main()
        {
          return (add(nil, '+', new Num(5.1)));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '5.1'
  },
  {
    name: 'add nil to num on right',
    source: `2e2 + nil`,
    expected: dedent`
      function main()
        {
          return (add(new Num(200), '+', nil));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '200'
  },
  // TODO negative nums, print negative num, add negative num to str
  {
    name: 'add num to str',
    source: `2 + 'str'`,
    expected: dedent`
      function main()
        {
          return (add(new Num(2), '+', new Str('str')));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '2str'
  },
  {
    name: 'add str to num',
    source: `'str' + 2`,
    expected: dedent`
      function main()
        {
          return (add(new Str('str'), '+', new Num(2)));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'str2'
  },
  // TODO all casting
  {
    name: 'add true true',
    source: `true + true`,
    expected: dedent`
      function main()
        {
          return (add(new Bool(true), '+', new Bool(true)));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true'
  },
  {
    name: 'add true false',
    source: `true + false`,
    expected: dedent`
      function main()
        {
          return (add(new Bool(true), '+', new Bool(false)));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true'
  },
  {
    name: 'add false true',
    source: `false + true`,
    expected: dedent`
      function main()
        {
          return (add(new Bool(false), '+', new Bool(true)));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true'
  },
  {
    name: 'add false false',
    source: `false + false`,
    expected: dedent`
      function main()
        {
          return (add(new Bool(false), '+', new Bool(false)));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false'
  },
  {
    name: 'add empty lists',
    source: `[] + []`,
    expected: dedent`
      function main()
        {
          return (add(new List([]), '+', new List([])));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '[]'
  },
  {
    name: 'add one element lists',
    source: `[1] + ['str']`,
    expected: dedent`
      function main()
        {
          return (add(new List([new Num(1)]), '+', new List([new Str('str')])));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[1, 'str']`
  },
  {
    name: 'add to end of list',
    source: `[1, 'str', 3] + 5`,
    expected: dedent`
      function main()
        {
          return (add(new List([new Num(1), new Str('str'), new Num(3)]), '+', new Num(5)));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
      `,
    output: `[1, 'str', 3, 5]`
  },
  {
    name: 'add to start of list',
    source: `5 + [1, 'str', 3]`,
    expected: dedent`
      function main()
        {
          return (add(new Num(5), '+', new List([new Num(1), new Str('str'), new Num(3)])));
        }
        const output = main();
        if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
      `,
    output: `[5, 1, 'str', 3]`
  },
  {
    name: 'add two things to list',
    source: `1 + 'str' + []`,
    expected: dedent`
    function main()
    {
      return (add(new Num(1), '+', new Str('str'), '+', new List([])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[1, 'str']`
  },
  {
    name: 'object',
    source: `{ 'a': 1 }`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([[new Str('a'), new Num(1)]]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 1 }`
  },
  {
    name: 'empty object',
    source: `{}`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ }`
  },
  {
    name: 'object with 2 entries',
    source: `{ 'a': 1, 'b': '2' }`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([[new Str('a'), new Num(1)], [new Str('b'), new Str('2')]]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 1, 'b': '2' }`
  },
  {
    name: 'nested lists',
    source: `[1, [2]]`,
    expected: dedent`
    function main()
    {
      return new List([new Num(1), new List([new Num(2)])]);
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[1, [2]]`
  },
  {
    name: 'nested objects',
    source: `{ 'a': { 'a': 1 }, 'b': {} }`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([[new Str('a'), new Obj(new Map([[new Str('a'), new Num(1)]]))], [new Str('b'), new Obj(new Map([]))]]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': { 'a': 1 }, 'b': { } }`
  },
  {
    name: 'object with list values',
    source: `{ 'a': [1, 'str'] }`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([[new Str('a'), new List([new Num(1), new Str('str')])]]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': [1, 'str'] }`
  },
  {
    name: 'adding objects',
    source: `{ 'a': 1 } + { 'b': 2 }`,
    expected: dedent`
    function main()
    {
      return (add(new Obj(new Map([[new Str('a'), new Num(1)]])), '+', new Obj(new Map([[new Str('b'), new Num(2)]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 1, 'b': 2 }`
  },
  {
    name: 'adding empty objects',
    source: `{} + {}`,
    expected: dedent`
    function main()
    {
      return (add(new Obj(new Map([])), '+', new Obj(new Map([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ }`
  },
  {
    name: 'adding str to object',
    source: `'str' + {}`,
    expected: dedent`
    function main()
    {
      return (add(new Str('str'), '+', new Obj(new Map([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'str': 'str' }`
  },
  {
    name: 'adding object to str',
    source: `{} + 'str'`,
    expected: dedent`
    function main()
    {
      return (add(new Obj(new Map([])), '+', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'str': 'str' }`
  },
  {
    name: 'adding num to object',
    source: `1 + {}`,
    expected: dedent`
    function main()
    {
      return (add(new Num(1), '+', new Obj(new Map([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ '1': 1 }`
  },
  {
    name: 'adding object to num',
    source: `{} + 1`,
    expected: dedent`
    function main()
    {
      return (add(new Obj(new Map([])), '+', new Num(1)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ '1': 1 }`
  },
  {
    name: 'adding multiple things to obj',
    source: `1 + 'str' + {}`,
    expected: dedent`
    function main()
    {
      return (add(new Num(1), '+', new Str('str'), '+', new Obj(new Map([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ '1': 1, 'str': 'str' }`
  },
  {
    name: 'adding obj to list',
    source: `{} + []`,
    expected: dedent`
    function main()
    {
      return (add(new Obj(new Map([])), '+', new List([])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[{ }]`
  },
  {
    name: 'var dec',
    source: `
    x = 5
    x
    `,
    expected: dedent`
    function main()
    {
      let x_1 = new Num(5);
      return x_1;
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '5'
  },
  {
    name: 'print var',
    source: `
    x = 5
    print(x)
    `,
    expected: dedent`
    function main()
    {
      let x_1 = new Num(5);
      try {
        console.log(x_1 === nil ? nil.type.val : coerce(x_1, Str.typeDescription).val)
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '5'
  },
  {
    name: 'return nil',
    source: 'nil',
    expected: dedent`
    function main()
    {
      return nil;
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'nil'
  },
  {
    name: 'print string var',
    source: `x = 'str'
    print(x)`,
    expected: dedent`
    function main()
    {
      let x_1 = new Str('str');
      try {
        console.log(x_1 === nil ? nil.type.val : coerce(x_1, Str.typeDescription).val)
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `str`
  },
  {
    name: 'print bool var',
    source: `x = false
    print(x)`,
    expected: dedent`
    function main()
    {
      let x_1 = new Bool(false);
      try {
        console.log(x_1 === nil ? nil.type.val : coerce(x_1, Str.typeDescription).val)
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `false`
  },
  {
    name: 'print list var',
    source: `x = [false]
    print(x)`,
    expected: dedent`
    function main()
    {
      let x_1 = new List([new Bool(false)]);
      try {
        console.log(x_1 === nil ? nil.type.val : coerce(x_1, Str.typeDescription).val)
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[false]`
  },
  {
    name: 'print obj var',
    source: `x = false + {}
    print(x)`,
    expected: dedent`
    function main()
    {
      let x_1 = (add(new Bool(false), '+', new Obj(new Map([]))));
      try {
        console.log(x_1 === nil ? nil.type.val : coerce(x_1, Str.typeDescription).val)
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'false': false }`
  },
  {
    name: 'num equality',
    source: `2 == 2`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Num(2).equals(new Num(2))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true'
  }
  // { // TODO need to do equality first
  //   name: 'subtract from list',
  //   source: `[1, 'str', 4] - 4`,
  //   expected: dedent`
  //     function main()
  //       {
  //         return (add(new List([new Num(1),new Str('str'),new Num(4)]),'-',new Num(4)));
  //       }
  //       const output = main();
  //       if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
  //   `,
  //   output: `[1, 'str']`
  // }

  // TODO function calls w/ multiple args
  // { // TODO fix
  //   name: 'print multiple things',
  //   source: `print(1, 2)`,
  //   expected: dedent`
  //     function main()
  //       {
  //         try {
  //           return console.log(coerce(new Num(1), Str.typeDescription).val,coerce(new Num(2), Str.typeDescription).val);
  //         } catch {}
  //       }
  //       const output = main();
  //       if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
  //   `,
  //   output: '1 2'
  // }
]

const runTest = (fixture, outputDir) => {
  it(`produces expected js output for the ${fixture.name} program`, async () => {
    const actual = generate(optimize(analyze(fixture.source)))
    if (!actual.endsWith(fixture.expected)) {
      console.log(actual) // for debug
      assert(false)
    }
    fs.writeFile(`output/${fixture.name.replaceAll(' ', '_')}.js`, actual, (err) => {
      if (err) throw err
    })
    let output = await execute(`node ${fixture.name.replaceAll(' ', '_')}.js`, { encoding: 'utf8', cwd: outputDir })
    assert.deepEqual(output.stdout.trim(), fixture.output)
  })
}

describe("The code generator", () => {
  const outputDir = path.join(path.resolve(), 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  exec(`rm ${path.join(outputDir, '*')}`)

  if (process.env.npm_config_last) {
    runTest(fixtures[fixtures.length - 1], outputDir)
  } else {
    for (const fixture of fixtures) {
      runTest(fixture, outputDir)
    }
  }
})