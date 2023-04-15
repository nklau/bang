import assert from 'assert/strict'
import analyze from '../src/analyzer.js'
import optimize from '../src/optimizer.js'
import generate from '../src/generator.js'
import * as fs from 'fs'
import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execute = promisify(exec)

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, '').trim()
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
    output: '3',
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
          let _internal1 = print(new Num(1));
          return _internal1;
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '1',
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
          let _internal1 = print((add(new Num(1), '+', new Num(2))));
          return _internal1;
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '3',
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
    output: '163',
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
    output: '2',
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
    output: '-2',
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
    output: '-143',
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
    output: '20',
  },
  {
    name: 'print str',
    source: `print('Hello World!')`,
    expected: dedent`
      function main()
      {
        try {
          let _internal1 = print(new Str('Hello World!'));
          return _internal1;
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'Hello World!',
  },
  {
    name: 'print f str',
    source: `print($'num {1}')`,
    expected: dedent`
      function main()
      {
        try {
          let _internal1 = print(new Str(\`num \${coerce(new Num(1), Str.typeDescription).val}\`));
          return _internal1;
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'num 1',
  },
  {
    name: 'print exp',
    source: `print($'addition {1 + 2}')`,
    expected: dedent`
      function main()
      {
        try {
          let _internal1 = print(new Str(\`addition \${coerce((add(new Num(1), '+', new Num(2))), Str.typeDescription).val}\`));
          return _internal1;
        } catch {}
      }
      const output = main();
      if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'addition 3',
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
    output: 'hi aidan !',
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
    output: 'hell',
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
    output: 'o',
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
    output: 'hi',
  },
  {
    name: 'print nil',
    source: `print(nil)`,
    expected: dedent`
    function main()
    {
      try {
        let _internal1 = print(nil);
        return _internal1;
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'nil',
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
    output: 'nil',
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
    output: 'nil',
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
    output: '5.1',
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
    output: '200',
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
    output: '2str',
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
    output: 'str2',
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
    output: 'true',
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
    output: 'true',
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
    output: 'true',
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
    output: 'false',
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
    output: '[]',
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
    output: `[1, 'str']`,
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
    output: `[1, 'str', 3, 5]`,
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
    output: `[5, 1, 'str', 3]`,
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
    output: `[1, 'str']`,
  },
  {
    name: 'object',
    source: `{ 'a': 1 }`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([['a', new Num(1)]]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 1 }`,
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
    output: `{ }`,
  },
  {
    name: 'object with 2 entries',
    source: `{ 'a': 1, 'b': '2' }`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([['a', new Num(1)], ['b', new Str('2')]]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 1, 'b': '2' }`,
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
    output: `[1, [2]]`,
  },
  {
    name: 'nested objects',
    source: `{ 'a': { 'a': 1 }, 'b': {} }`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([['a', new Obj(new Map([['a', new Num(1)]]))], ['b', new Obj(new Map([]))]]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': { 'a': 1 }, 'b': { } }`,
  },
  {
    name: 'object with list values',
    source: `{ 'a': [1, 'str'] }`,
    expected: dedent`
    function main()
    {
      return new Obj(new Map([['a', new List([new Num(1), new Str('str')])]]));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': [1, 'str'] }`,
  },
  {
    name: 'adding objects',
    source: `{ 'a': 1 } + { 'b': 2 }`,
    expected: dedent`
    function main()
    {
      return (add(new Obj(new Map([['a', new Num(1)]])), '+', new Obj(new Map([['b', new Num(2)]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 1, 'b': 2 }`,
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
    output: `{ }`,
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
    output: `{ 'str': 'str' }`,
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
    output: `{ 'str': 'str' }`,
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
    output: `{ '1': 1 }`,
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
    output: `{ '1': 1 }`,
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
    output: `{ '1': 1, 'str': 'str' }`,
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
    output: `[{ }]`,
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
      let x_0 = new Num(5);
      return x_0;
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '5',
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
      let x_0 = new Num(5);
      try {
        print(x_0);
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '5',
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
    output: 'nil',
  },
  {
    name: 'print string var',
    source: `x = 'str'
    print(x)`,
    expected: dedent`
    function main()
    {
      let x_0 = new Str('str');
      try {
        print(x_0);
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `str`,
  },
  {
    name: 'print bool var',
    source: `x = false
    print(x)`,
    expected: dedent`
    function main()
    {
      let x_0 = new Bool(false);
      try {
        print(x_0);
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `false`,
  },
  {
    name: 'print list var',
    source: `x = [false]
    print(x)`,
    expected: dedent`
    function main()
    {
      let x_0 = new List([new Bool(false)]);
      try {
        print(x_0);
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[false]`,
  },
  {
    name: 'print obj var',
    source: `x = false + {}
    print(x)`,
    expected: dedent`
    function main()
    {
      let x_0 = (add(new Bool(false), '+', new Obj(new Map([]))));
      try {
        print(x_0);
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'false': false }`,
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
    output: 'true',
  },
  {
    name: 'num inequality false',
    source: `2 != 2`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new Num(2).equals(new Num(2)))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'num equality false',
    source: `2 == 2.1`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Num(2).equals(new Num(2.1))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'num inequality',
    source: `2 != 2.1`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new Num(2).equals(new Num(2.1)))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'str equality',
    source: `'str' == 'str'`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Str('str').equals(new Str('str'))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'str equality with different quotes',
    source: `'str' == "str"`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Str('str').equals(new Str('str'))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'str equality false',
    source: `'str' == 'strs'`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Str('str').equals(new Str('strs'))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'str inequality',
    source: `'str' != 'strs'`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new Str('str').equals(new Str('strs')))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'str inequality different quotes',
    source: `'str' != "strs"`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new Str('str').equals(new Str('strs')))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'str inequality false',
    source: `'str' != 'str'`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new Str('str').equals(new Str('str')))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'num equality using vars',
    source: `x = 5
    x == 5`,
    expected: dedent`
    function main()
    {
      let x_0 = new Num(5);
      return (new Bool(x_0.equals(new Num(5))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'str equality using vars',
    source: `x = 'str'
    'x' == x`,
    expected: dedent`
    function main()
    {
      let x_0 = new Str('str');
      return (new Bool(new Str('x').equals(x_0)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'string num vs num equality',
    source: `5 == '5'`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Num(5).equals(new Str('5'))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'list subtraction',
    source: `[5] - 5`,
    expected: dedent`
    function main()
    {
      return (add(new List([new Num(5)]), '-', new Num(5)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[]`,
  },
  {
    name: 'empty list equality',
    source: `[] == []`,
    expected: dedent`
    function main()
    {
      return (new Bool(new List([]).equals(new List([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'empty list inequality',
    source: `[] != []`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new List([]).equals(new List([])))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: '1 element list equality false',
    source: `[1] == [1]`,
    expected: dedent`
    function main()
    {
      return (new Bool(new List([new Num(1)]).equals(new List([new Num(1)]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: '1 element list inequality',
    source: `[1] != [1]`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new List([new Num(1)]).equals(new List([new Num(1)])))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: '1 element list equality false',
    source: `[1] == ['1']`,
    expected: dedent`
    function main()
    {
      return (new Bool(new List([new Num(1)]).equals(new List([new Str('1')]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: '1 element list inequality',
    source: `[1] != ['1']`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new List([new Num(1)]).equals(new List([new Str('1')])))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'list equality different lens',
    source: `[1] == [1, 1]`,
    expected: dedent`
    function main()
    {
      return (new Bool(new List([new Num(1)]).equals(new List([new Num(1), new Num(1)]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'list equality different lens longer first',
    source: `[1, 1] == [1]`,
    expected: dedent`
    function main()
    {
      return (new Bool(new List([new Num(1), new Num(1)]).equals(new List([new Num(1)]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'list equality two elements',
    source: `[1, 'str'] == [1, 'str']`,
    expected: dedent`
    function main()
    {
      return (new Bool(new List([new Num(1), new Str('str')]).equals(new List([new Num(1), new Str('str')]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'list equality different order',
    source: `['str', 1] == [1, 'str']`,
    expected: dedent`
    function main()
    {
      return (new Bool(new List([new Str('str'), new Num(1)]).equals(new List([new Num(1), new Str('str')]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'list inequality two elements false',
    source: `[1, 'str'] != [1, 'str']`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new List([new Num(1), new Str('str')]).equals(new List([new Num(1), new Str('str')])))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'list inequality two elements different order',
    source: `['str', 1] != [1, 'str']`,
    expected: dedent`
    function main()
    {
      return (new Bool(!(new List([new Str('str'), new Num(1)]).equals(new List([new Num(1), new Str('str')])))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'empty object equality',
    source: `{} == {}`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Obj(new Map([])).equals(new Obj(new Map([])))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'object equality',
    source: `{ 'a': 1 } == { 'a': 1 }`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Obj(new Map([['a', new Num(1)]])).equals(new Obj(new Map([['a', new Num(1)]])))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'get obj val by key subscription',
    source: `x = { 'a': 1 }
    x['a']`,
    expected: dedent`
    function main()
    {
      let x_0 = new Obj(new Map([['a', new Num(1)]]));
      return subscript(x_0, new Str('a'));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `1`,
  },
  {
    name: 'object equality with different vals',
    source: `{ 'a': 1 } == { 'a': '1' }`,
    expected: dedent`
    function main()
    {
      return (new Bool(new Obj(new Map([['a', new Num(1)]])).equals(new Obj(new Map([['a', new Str('1')]])))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'object keys',
    source: `x = { 'a': 1, 'b': 2 }
    print(x.keys())`,
    expected: dedent`
    function main()
    {
      let x_0 = new Obj(new Map([['a', new Num(1)], ['b', new Num(2)]]));
      try {
        print((x_0.keys)());
      } catch {}
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `['a', 'b']`,
  },
  // TODO check that object keys still come out as bang strs when calling .keys() on obj
  {
    name: 'subtract from list',
    source: `[1, 'str', 4] - 4`,
    expected: dedent`
    function main()
    {
      return (add(new List([new Num(1), new Str('str'), new Num(4)]), '-', new Num(4)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[1, 'str']`,
  },
  {
    name: 'num multiplication',
    source: '2 * 3',
    expected: dedent`
    function main()
    {
      return (multiply(new Num(2), '*', new Num(3)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '6',
  },
  {
    name: 'multiply nil, nil',
    source: `nil * nil`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', nil));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `nil`,
  },
  {
    name: 'multiply nil, bool true',
    source: `nil * true`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Bool(true)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `false`,
  },
  {
    name: 'multiply nil, bool false',
    source: `nil * false`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Bool(false)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `false`,
  },
  {
    name: 'multiply nil, num',
    source: `nil * 5`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Num(5)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '0',
  },
  {
    name: 'multiply nil, str',
    source: `nil * 'str'`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply nil, str double quotes',
    source: `nil * "str"`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply nil, f str',
    source: `nil * $'{5}str'`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Str(\`\${coerce(new Num(5), Str.typeDescription).val}str\`)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply nil, f str double quotes',
    source: `nil * $"{5}str"`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Str(\`\${coerce(new Num(5), Str.typeDescription).val}str\`)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply nil, empty obj',
    source: `nil * { }`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Obj(new Map([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '{ }',
  },
  {
    name: 'multiply nil, obj len 1',
    source: `nil * { 'a': 1 }`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Obj(new Map([['a', new Num(1)]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '{ }',
  },
  {
    name: 'multiply nil, obj len 2',
    source: `nil * { 'a': 1, 'b': "2" }`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new Obj(new Map([['a', new Num(1)], ['b', new Str('2')]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '{ }',
  },
  {
    name: 'multiply nil, empty list',
    source: `nil * []`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new List([])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '[]',
  },
  {
    name: 'multiply nil, 1 element list',
    source: `nil * [1]`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new List([new Num(1)])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '[]',
  },
  {
    name: 'multiply nil, 2 element list',
    source: `nil * [1, {}]`,
    expected: dedent`
    function main()
    {
      return (multiply(nil, '*', new List([new Num(1), new Obj(new Map([]))])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '[]',
  },
  {
    name: 'multiply bool true, nil',
    source: `true * nil`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', nil));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'multiply bool false, nil',
    source: `false * nil`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', nil));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'multiply bool true, bool true',
    source: `true * true`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Bool(true)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'true',
  },
  {
    name: 'multiply bool true, bool false',
    source: `true * false`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Bool(false)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'multiply bool false, bool true',
    source: `false * true`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Bool(true)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'multiply bool false, bool false',
    source: `false * false`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Bool(false)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'false',
  },
  {
    name: 'multiply bool true, num',
    source: `true * 5.1`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Num(5.1)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '5.1',
  },
  {
    name: 'multiply bool false, num',
    source: `false * 5.1`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Num(5.1)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '0',
  },
  {
    name: 'multiply bool true, string',
    source: `true * 'str'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'str',
  },
  {
    name: 'multiply bool true, string double quotes',
    source: `true * "str"`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'str',
  },
  {
    name: 'multiply bool true, f string',
    source: `true * $'bool: { true * true }'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Str(\`bool: \${coerce((multiply(new Bool(true), '*', new Bool(true))), Str.typeDescription).val}\`)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'bool: true',
  },
  {
    name: 'multiply bool true, f string double quotes',
    source: `true * $"bool: { true * true }"`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Str(\`bool: \${coerce((multiply(new Bool(true), '*', new Bool(true))), Str.typeDescription).val}\`)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'bool: true',
  },
  {
    name: 'multiply bool false, string',
    source: `false * 'str'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply bool false, string double quotes',
    source: `false * "str"`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply bool false, f string',
    source: `false * $'bool: { true * true }'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Str(\`bool: \${coerce((multiply(new Bool(true), '*', new Bool(true))), Str.typeDescription).val}\`)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply bool false, f string double quotes',
    source: `false * $"bool: { true * true }"`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Str(\`bool: \${coerce((multiply(new Bool(true), '*', new Bool(true))), Str.typeDescription).val}\`)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply bool true, empty obj',
    source: `true * {}`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Obj(new Map([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '{ }',
  },
  {
    name: 'multiply bool true, obj len 1',
    source: `true * { 'a': 1 }`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Obj(new Map([['a', new Num(1)]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 1 }`,
  },
  {
    name: 'multiply bool true, obj len 2',
    source: `true * { 'a': 1, 'b': "str" }`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new Obj(new Map([['a', new Num(1)], ['b', new Str('str')]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 1, 'b': 'str' }`,
  },
  {
    name: 'multiply bool false, empty obj',
    source: `false * {}`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Obj(new Map([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '{ }',
  },
  {
    name: 'multiply bool false, obj len 1',
    source: `false * { 'a': 1 }`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Obj(new Map([['a', new Num(1)]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ }`,
  },
  {
    name: 'multiply bool false, obj len 2',
    source: `false * { 'a': 1, 'b': "str" }`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new Obj(new Map([['a', new Num(1)], ['b', new Str('str')]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ }`,
  },
  {
    name: 'multiply bool true, empty list',
    source: `true * []`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new List([])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '[]',
  },
  {
    name: 'multiply bool true, list len 1',
    source: `true * [1]`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new List([new Num(1)])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '[1]',
  },
  {
    name: 'multiply bool true, list len 2',
    source: `true * [1, 'str']`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(true), '*', new List([new Num(1), new Str('str')])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[1, 'str']`,
  },
  {
    name: 'multiply bool false, empty list',
    source: `false * []`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new List([])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '[]',
  },
  {
    name: 'multiply bool false, list len 1',
    source: `false * [1]`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new List([new Num(1)])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '[]',
  },
  {
    name: 'multiply bool false, list len 2',
    source: `false * [1, 'str']`,
    expected: dedent`
    function main()
    {
      return (multiply(new Bool(false), '*', new List([new Num(1), new Str('str')])));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `[]`,
  },
  {
    name: 'multiply num, nil',
    source: `5 * nil`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5), '*', nil));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '0',
  },
  {
    name: 'multiply num, bool true',
    source: `5 * true`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5), '*', new Bool(true)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '5',
  },
  {
    name: 'multiply num, bool false',
    source: `5 * false`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5), '*', new Bool(false)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '0',
  },
  {
    name: 'multiply 0 num, str',
    source: `0 * 'str'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(0), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '',
  },
  {
    name: 'multiply num 1, str',
    source: `1 * 'str'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(1), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'str',
  },
  {
    name: 'multiply num, str',
    source: `5 * 'str'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'strstrstrstrstr',
  },
  {
    name: 'multiply decimal round up, str',
    source: `5.5 * 'str'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5.5), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'strstrstrstrstrstr',
  },
  {
    name: 'multiply decimal round down, str',
    source: `5.1 * 'str'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5.1), '*', new Str('str')));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: 'strstrstrstrstr',
  },
  {
    name: 'multiply num, f str',
    source: `5 * $'{5} str'`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5), '*', new Str(\`\${coerce(new Num(5), Str.typeDescription).val} str\`)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '5 str5 str5 str5 str5 str',
  },
  {
    name: 'multiply num, empty obj',
    source: `5 * {}`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5), '*', new Obj(new Map([]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: '{ }',
  },
  {
    name: 'multiply num 1, num 5',
    source: `1 * 5`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(1), '*', new Num(5)));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `5`,
  },
  {
    name: 'multiply num, obj len 1',
    source: `5 * { 'a': 1 }`,
    expected: dedent`
    function main()
    {
      return (multiply(new Num(5), '*', new Obj(new Map([['a', new Num(1)]]))));
    }
    const output = main();
    if (output) console.log(output === nil ? nil.type.val : coerce(output, Str.typeDescription).val);
    `,
    output: `{ 'a': 5 }`,
  },

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
    fs.writeFile(
      `output/${fixture.name.replaceAll(' ', '_')}.js`,
      actual,
      (err) => {
        if (err) throw err
      }
    )
    let output = await execute(`node ${fixture.name.replaceAll(' ', '_')}.js`, {
      encoding: 'utf8',
      cwd: outputDir,
    })
    assert.deepEqual(output.stdout.trim(), fixture.output)
  })
}

describe('The code generator', () => {
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
