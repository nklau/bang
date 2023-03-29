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
    name: 'num_add',
    source: `
      1 + 2
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(1),'+',new Num(2)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
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
          return console.log(coerce(new Num(1), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '1'
  },
  {
    name: 'print_num_add',
    source: `
    print(1 + 2)
    `,
    expected: dedent`
      function main()
      {
        try {
          return console.log(coerce((add(new Num(1),'+',new Num(2))), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '3'
  },
  {
    name: 'chained_num_add',
    source: `
    10 + 153 + 0
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10),'+',new Num(153),'+',new Num(0)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '163'
  },
  {
    name: 'num_subtraction',
    source: `5 - 3`,
    expected: dedent`
    function main()
      {
        return (add(new Num(5),'-',new Num(3)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '2'
  },
  {
    name: 'num_over-subtraction',
    source: `3 - 5`,
    expected: dedent`
    function main()
      {
        return (add(new Num(3),'-',new Num(5)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '-2'
  },
  {
    name: 'chained_num_subtraction',
    source: `
    10 - 153 - 0
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10),'-',new Num(153),'-',new Num(0)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '-143'
  },
  {
    name: 'num_add_and_subtraction',
    source: `
    10 - 153 + 163
    `,
    expected: dedent`
      function main()
      {
        return (add(new Num(10),'-',new Num(153),'+',new Num(163)));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '20'
  },
  {
    name: 'print_str',
    source: `print('Hello World!')`,
    expected: dedent`
      function main()
      {
        try {
          return console.log(coerce(new Str('Hello World!'), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'Hello World!'
  },
  {
    name: 'print_f_str',
    source: `print($'num {1}')`,
    expected: dedent`
      function main()
      {
        try {
          return console.log(coerce(new Str(\`num \${coerce(new Num(1), Str.typeDescription).val}\`), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'num 1'
  },
  {
    name: 'print_exp',
    source: `print($'addition {1 + 2}')`,
    expected: dedent`
      function main()
      {
        try {
          return console.log(coerce(new Str(\`addition \${coerce((add(new Num(1),'+',new Num(2))), Str.typeDescription).val}\`), Str.typeDescription).val);
        } catch {}
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'addition 3'
  },
  {
    name: 'add_str',
    source: `'hi' + " aidan !"`,
    expected: dedent`
      function main()
      {
        return (add(new Str('hi'),'+',new Str(' aidan !')));
      }
      const output = main();
      if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'hi aidan !'
  },
  {
    name: 'subtract_str',
    source: `'hello' - 'o'`,
    expected: dedent`
      function main()
        {
          return (add(new Str('hello'),'-',new Str('o')));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'hell'
  },
  // TODO
  // x = 'hi'
  // $'{x} aidan' - 'hi'
  {
    name: 'subtract_longer_str',
    source: `'hello' - 'hell'`,
    expected: dedent`
      function main()
        {
          return (add(new Str('hello'),'-',new Str('hell')));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'o'
  },
  {
    name: 'subtract_str_not_found',
    source: `'hi' - 'hello'`,
    expected: dedent`
      function main()
        {
          return (add(new Str('hi'),'-',new Str('hello')));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'hi'
  },
  {
    name: 'print_nil',
    source: `print(nil)`,
    expected: dedent`
      function main()
        {
          try {
            return console.log(coerce(nil, Str.typeDescription).val);
          } catch {}
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: ''
  },
  {
    name: 'add_nil',
    source: `nil + nil`,
    expected: dedent`
      function main()
        {
          return (add(nil,'+',nil));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: ''
  },
  {
    name: 'subtract_nil',
    source: `nil - nil`,
    expected: dedent`
      function main()
        {
          return (add(nil,'-',nil));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: ''
  },
  {
    name: 'add_nil_to_num',
    source: `nil + 5.1`,
    expected: dedent`
      function main()
        {
          return (add(nil,'+',new Num(5.1)));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '5.1'
  },
  {
    name: 'add_nil_to_num_on_right',
    source: `2e2 + nil`,
    expected: dedent`
      function main()
        {
          return (add(new Num(200),'+',nil));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '200'
  },
  // TODO negative nums, print negative num, add negative num to str
  {
    name: 'add_num_to_str',
    source: `2 + 'str'`,
    expected: dedent`
      function main()
        {
          return (add(new Num(2),'+',new Str('str')));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '2str'
  },
  {
    name: 'add_str_to_num',
    source: `'str' + 2`,
    expected: dedent`
      function main()
        {
          return (add(new Str('str'),'+',new Num(2)));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'str2'
  },
  // TODO all casting
  {
    name: 'add_true_true',
    source: `true + true`,
    expected: dedent`
      function main()
        {
          return (add(new Bool(true),'+',new Bool(true)));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'true'
  },
  {
    name: 'add_true_false',
    source: `true + false`,
    expected: dedent`
      function main()
        {
          return (add(new Bool(true),'+',new Bool(false)));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'true'
  },
  {
    name: 'add_false_true',
    source: `false + true`,
    expected: dedent`
      function main()
        {
          return (add(new Bool(false),'+',new Bool(true)));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'true'
  },
  {
    name: 'add_false_false',
    source: `false + false`,
    expected: dedent`
      function main()
        {
          return (add(new Bool(false),'+',new Bool(false)));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: 'false'
  },
  {
    name: 'add_list',
    source: `[] + []`,
    expected: dedent`
      function main()
        {
          return (add(new List([]),'+',new List([])));
        }
        const output = main();
        if (output) console.log(coerce(main(), Str.typeDescription).val);
    `,
    output: '[]'
  }

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
  //       if (output) console.log(coerce(main(), Str.typeDescription).val);
  //   `,
  //   output: '1 2'
  // }
]

describe("The code generator", () => {
  const outputDir = path.join(path.resolve(), 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  exec(`rm ${path.join(outputDir, '*')}`)

  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, async () => {
      const actual = generate(optimize(analyze(fixture.source)))
      if (!actual.endsWith(fixture.expected)) {
        console.log(actual) // for debug
        assert(false)
      }
      fs.writeFile(`output/${fixture.name}.js`, actual, (err) => {
        if (err) throw err
      })
      let output = await execute(`node ${fixture.name}.js`, { encoding: 'utf8', cwd: outputDir })
      assert.deepEqual(output.stdout.trim(), fixture.output)
    })
  }
})