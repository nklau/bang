import assert from "assert/strict"
import fs from "fs"
import ohm from "ohm-js"

const syntaxChecks = [
  ['single line commments', '// comment here'],
  ['statements following single line comments', '// comment\nx = 5'],
  ['multiline comments', '/*\ncomment\nhere\n*/'],
  ['multiline comments used on one line', '/* comment here */'],
  ['statements following multiline comments', '/* comment */\nx = 5'],
  ['statements following multiline comments', '/* comment */x = 5'],
  ['no statements', ''],
  ['bang function with no statement', 'i ? { }'],
  ['bang function with one statement', '{ x = 1 }'],
  ['bang function without brackets', 'i ? x = 1'],
  ['bang function with multiple statements', '{ x = 1\ny = 2 }'],
  ['bang function with tabs', '{\nx=1\n\ty = 2\n}'],
  ['bang function with local var with no value', '{ local x }'],
  ['bang function with local var', '{ local x = 1 }'],
  ['bang function with local const var', '{ local const x = 1 }'],
  ['bang function with break', '{ break }'],
  ['bang function with empty return', '{ return }'],
  ['bang function that returns boolean exp', '{ return x == y }'],
  ['bang function that returns ternary', '{ return x ? y : z }'],
  ['bang function that returns or exp', '{ return x || y }'],
  ['bang function that returns and exp', '{ return x && y }'],
  ['bang function that returns negated exp', '{ return !x }'],
  ['bang function that returns additive exp', '{ return x + y }'],
  ['bang function that returns subtractive exp', '{ return x - y }'],
  ['bang function that returns multiplicative exp', '{ return x * y }'],
  ['bang function that returns division exp', '{ return x / y }'],
  ['bang function that returns modulus exp', '{ return x % y }'],
  ['bang function that returns exponential exp', '{ return x ** y }'],
  ['bang function that returns negative exp', '{ return -x }'],
  ['bang function that returns a variable', '{ return x }'],
  ['bang function that returns a function call', '{ return x() }'],
  ['bang function that returns a subscripted variable', '{ return x[1] }'],
  ['bang function that returns a called subscripted variable', '{ return x[1]() }'],
  ['bang function that returns a selected variable', '{ return x.y }'],
  ['bang function that returns a selected call', '{ return x.y() }'],
  ['bang function that returns nil', '{ return nil }'],
  ['bang function that returns a string', '{ return "str" }'],
  ['bang function that returns a number', '{ return 1 }'],
  ['bang function that returns an object', '{ return { "x": 1 } }'],
  ['bang function that returns true', '{ return true }'],
  ['bang function that returns false', '{ return false }'],
  ['bang function that returns a bang function', '{ return { x = 1 } }'],
  ['bang function that returns a match exp', '{ return match x { case x: 1 } }'],
  ['bang function that returns a list', '{ return [] }'],
  ['bang function that returns a range', '{ return range(5) }'],
  ['bang function that returns a function literal', '{ return () -> { } }'],
  ['bang function that returns without the return keyword', '{ x }'],
  ['variable declaration', 'x = 1'],
  ['constant variable declaration', 'const x = 1'],
  ['variable of type bang function', 'x = { y = 5 }'],
  ['variable of type function literal', 'x = () -> {}'],
  ['variable of type boolean exp', 'x = y == z'],
  ['variable of type parenthesized exp', 'x = (y + z)'],
  ['variable of type ternary', 'x = y ? "str" : "alt"'],
  ['variable of type or exp', 'x = y || z'],
  ['variable of type and exp', 'x = y && z'],
  ['variable of type negated exp', 'x = !x'],
  ['variable of type additive exp', 'x = y + z'],
  ['variable of type subtractive exp', 'x = y - z'],
  ['variable of type multiplicative exp', 'x = y * z'],
  ['variable of type division exp', 'x = y / z'],
  ['variable of type modulus exp', 'x = y % z'],
  ['variable of type exponential exp', 'x = y ** z'],
  ['variable of type negative exp', 'x = -y'],
  ['setting one variable equal to another', 'x = y'],
  ['setting one variable equal to another variable field', 'x = y.z'],
  ['setting one variable equal to the result of another variable method call', 'x = y.z()'],
  ['variable of type nil', 'x = nil'],
  ['variable of type string', 'x = "str"'],
  ['variable of type number', 'x = 1'],
  ['variable of type object', 'x = {}'],
  ['variable with value false', 'x = false'],
  ['variable with value true', 'x = true'],
  ['variable of type match exp', 'x = match y { case z: 1 }'],
  ['variable of type list', 'x = []'],
  ['variable of type range', 'x = range(5)'],
  ['assignment operator +=', 'x += y'],
  ['assignment operator -=', 'x -= y'],
  ['assignment operator *=', 'x *= y'],
  ['assignment operator /=', 'x /= y'],
  ['assignment operator %=', 'x %= y'],
  ['printing nothing', 'print()'],
  ['printing function literal', 'print(() -> { })'],
  ['printing boolean exp', 'print(x == y)'],
  ['printing parenthesized exp', 'print((x + y))'],
  ['printing ternary', 'print(x ? y : z)'],
  ['printing or exp', 'print(x || y)'],
  ['printing and exp', 'print(x && y)'],
  ['printing negated exp', 'print(!x)'],
  ['printing additive exp', 'print(x + y)'],
  ['printing subtractive exp', 'print(x - y)'],
  ['printing multiplicative exp', 'print(x * y)'],
  ['printing division exp', 'print(x / y)'],
  ['printing modulus exp', 'print(x % y)'],
  ['printing exponential exp', 'print(x ** y)'],
  ['printing negative exp', 'print(-x)'],
  ['printing variable', 'print(x)'],
  ['printing nil', 'print(nil)'],
  ['printing string literal', 'print("str")'],
  ['printing number', 'print(1)'],
  ['printing float', 'print(1.2)'],
  ['printing object', 'print({ "x": 1 })'],
  ['printing false', 'print(false)'],
  ['printing true', 'print(true)'],
  ['printing result of bang function', 'print({ x })'],
  ['printing result of match exp', 'print(match x { case y: z })'],
  ['printing list', 'print([])'],
  ['printing range', 'print(range(5))'],
  ['printing subscripted variable', 'print(x[1])'],
  ['printing selected variable', 'print(x.y)'],
  ['printing formatted string', 'print($"str{x}")'],
  ['boolean exp ==', 'x == y'],
  ['boolean exp == with parenthesized exps', '(x + y) == (z + n)'],
  ['boolean exp == with ternary exps', '(x ? y : m) == (z ? n : a)'],
  ['boolean exp == with boolean exps', '(x == y) == (z == n)'],
  ['chained boolean exp', 'x == y == z'],
  ['boolean exp == with or exps', 'x || y == z || n'],
  ['boolean exp == with and exps', 'x && y == z && n'],
  ['boolean exp == with negated exps', '!x == !y'],
  ['boolean exp == with additive exps', 'x + y == z + n'],
  ['boolean exp == with subtractive exps', 'x - y == z - n'],
  ['boolean exp == with multiplicative exps', 'x * y == z * n'],
  ['boolean exp == with division exps', 'x / y == z / n'],
  ['boolean exp == with modulus exps', 'x % y == z % n'],
  ['boolean exp == with exponential exps', 'x ** y == z ** n'],
  ['boolean exp == with negative exps', '-x == -y'],
  ['boolean exp == with variables', 'x == y'],
  ['boolean exp == with function calls', 'x() == y()'],
  ['boolean exp == with subscripted variables', 'x[1] == y[1]'],
  ['boolean exp == with subscripted functions', 'x[1]() == y[1]()'],
  ['boolean exp == with selected variables', 'x.y == y.x'],
  ['boolean exp == with selected methods', 'x.y() == y.x()'],
  ['boolean exp == with nil', 'nil == nil'],
  ['boolean exp == with strings', '"str" == "alt"'],
  ['boolean exp == with formatted strings', '$"str{x}" == $"alt{y}"'],
  ['boolean exp == with numbers', '1 == 2'],
  ['boolean exp == with floats', '1.2 == 2.1'],
  ['boolean exp == with objects', '{ "x": 1 } == { "y": 2 }'],
  ['boolean exp == with false', 'false == false'],
  ['boolean exp == with true', 'true == true'],
  ['boolean exp == with bang functions', '{ x = 1 } == { y = 2 }'],
  ['boolean exp == with match exps', 'match x { case y: z } == match y { case x: z }'],
  ['boolean exp == with lists', '[x] == [y]'],
  ['boolean exp == with ranges', 'range(5) == range(1, 6)'],
  ['boolean exp !=', 'x != y'],
  ['boolean exp != with parenthesized exps', '(x + y) != (z + n)'],
  ['boolean exp != with ternary exps', '(x ? y : m) != (z ? n : a)'],
  ['boolean exp != with boolean exps', '(x == y) == (z == n)'],
  ['chained boolean exp', 'x != y != z'],
  ['boolean exp != with or exps', 'x || y != z || n'],
  ['boolean exp != with and exps', 'x && y != z && n'],
  ['boolean exp != with negated exps', '!x != !y'],
  ['boolean exp != with additive exps', 'x + y != z + n'],
  ['boolean exp != with subtractive exps', 'x - y != z - n'],
  ['boolean exp != with multiplicative exps', 'x * y != z * n'],
  ['boolean exp != with division exps', 'x / y != z / n'],
  ['boolean exp != with modulus exps', 'x % y != z % n'],
  ['boolean exp != with exponential exps', 'x ** y != z ** n'],
  ['boolean exp != with negative exps', '-x != -y'],
  ['boolean exp != with variables', 'x != y'],
  ['boolean exp != with function calls', 'x() != y()'],
  ['boolean exp != with subscripted variables', 'x[1] != y[1]'],
  ['boolean exp != with subscripted functions', 'x[1]() != y[1]()'],
  ['boolean exp != with selected variables', 'x.y != y.x'],
  ['boolean exp != with selected methods', 'x.y() != y.x()'],
  ['boolean exp != with nil', 'nil != nil'],
  ['boolean exp != with strings', '"str" != "alt"'],
  ['boolean exp != with formatted strings', '$"str{x}" != $"alt{y}"'],
  ['boolean exp != with numbers', '1 != 2'],
  ['boolean exp != with floats', '1.2 != 2.1'],
  ['boolean exp != with objects', '{ "x": 1 } != { "y": 2 }'],
  ['boolean exp != with false', 'false != false'],
  ['boolean exp != with true', 'true != true'],
  ['boolean exp != with bang functions', '{ x = 1 } != { y = 2 }'],
  ['boolean exp != with match exps', 'match x { case y: z } != match y { case x: z }'],
  ['boolean exp != with lists', '[x] != [y]'],
  ['boolean exp != with ranges', 'range(5) != range(1, 6)'],

  // Exp tests
    // <
    // >
    // <=
    // >=
    // (x == y) == z
    // x == (y == z)

  // Exps
    // x || y (all literals)
    // x && y (all literals)
    // !x (all literals)
    // x + y (all literals)
    // x - y (all literals)
    // x * y (all literals)
    // x / y (all literals)
    // x % y (all literals)
    // x ** y (all literals)
    // -x (all literals)
    // (x) (all literals)
    // (x + y) (all exps, all spacing)
  
  // Exp7
    // x[1]
    // x[1]()
    // x[1].field
    // x[1].method()
    // x.field
    // x.method()
    // x.method(() -> { })
    // x.method((i) -> { })
    // x()().field.method()
    // .field
    // .method()
    // .field.field2
  
  // Ternary
    // y ? "str"
    // y ? "str" : "alt"
    // x = y ? "str" : "alt"
    // x = y ? "str" : "alt"

  // function lits
    // () -> print('hi')
    // () -> { print('hi') }
    // (i) -> print(i)
    // (i) -> { print(i) }
    // (i) -> { x = 5\nprint(x) }
    // (a, b) -> { }
    // () -> return 'hi'
    // () -> { return 'hi' }
    // (i) -> return i
    // (i) -> { return i }
    // () -> () -> { }
    // (a=5, b) -> { }
    // (a = 5, b) -> { }
    // (a, b = 5) -> { }

  // params
    // x()
    // x(y)
    // x(y, z)
    // x(y, z=5)
    // x(y, z = 5)
    // z(y = 5, z)

  ['empty objects', '{}'],
  ['empty objects with whitespace', '{ }'],
  ['empty objects that span multiple lines', '{\n\n}'],
  ['objects with one string key and a numeric value', '{ "x": 1 }'],
  ['objects with two string keys and string values', '{ "x": \'hello\'\n"y": "hi" }'],
  ['objects with stringified numeric keys', '{ "9": 1 }'],
  ['objects that span multiple lines', "{\n'key1': 'val1'\n'key2': 'val2'\n}"],
  ['objects with object values', '{ "key1": {} }'],
  ['objects with function values', '{ "key1": () -> { } }'],
  ['objects with extra whitespace', '{ "x" : 1 }']

  // lists
    // []
    // [a]
    // [a, b]
    // [1, 2]
    // [1, "str"]
    // [a, 'str']
    // [$'test {a}']
    // [{ print('hi') }]
    // [() -> print('hi')]

  // range
    // range(5)
    // range(1, 5)
  
  // strings
    // ''
    // ""
    // '"'
    // "'"
    // 'str'
    // "str"
    // '\''
    // "\""
    // '\\'
    // "\\"
    // '\n'
    // "\n"
    // '\t'
    // "\t"
    // '\r'
    // "\r"
  
  // formatted strings
    // $''
    // $""
    // $'{x}'
    // $"{x}"
    // $'str'
    // $"str"
    // $'str {x}'
    // $"str {x}"
    // $'{x}{y}'
    // $"{x}{y}"
    // $'{x}str'
    // $"{x}str"
    // $'}'
    // $"}"

  // match
    // match x {case 1: {}}
    // match x {case x: {}}
    // match x {\ncase x: \n\t{}\n}
    // match x {case x: {}\ncase y: {}}
    // match x {case x: {}\ndefault: {}}
    // match x {case x: {}\ndefault: {}\ncase y: {}}
    // match x {case x, y: {}}

  // enum
    // enum Season { spring }
    // enum Season { spring = 'spring' }
    // enum Season { spring, summer }
    // enum Season { spring\nsummer }
    // enum Season { spring\n\tsummer }
    // enum Season { spring = 'spring'\nsummer = 'summer' }
    // enum Season { spring = 'spring'\nsummer }
    // enum X { y = (all literals) }

  // declaring vars with/without values
  // declaring local vars with/without value
  // declaring constant vars with/without values
  // various assignment operators
  // var selection
]

const syntaxErrors = [
  // single open/close bracket
  // mismatched parens
  // multiple statements on one line
  // multiline comment w/ //
  // mismatched quotes
  // x = isValid? { "valid" } // should read as 2 statements

  // bang function things
    // single line w/ local keyword
    // local const w/ no value
    // return statement (ex. return x = 5)
    // `return local var` (should be declared as local before return statement)
    // return enum

  // var dec tests
    // local cannot be outside function
    // const without value
    // var dec with hanging assignment op
    // var dec without value
    // x = y = 5

  // print tests
    // requires parentheses
    // cannot have mismatched parens
    // printx(x)
    // statement

  // return tests
    // return w/without value outside bang func

  // break tests
    // break outside bang func

  // Exp tests
    // !==
    // ===
    // !<
    // =<
    // x ! 5
    // x == y == z

  // Ternary
    // x? { } // should read as 2 statements
  
  // Exp6
    // -2 ** 2

  // func lit
    // x(y z)
    // x(y\nz)
  ['objects with non-string keys', '{ x: 1 }', /Line 1, col 4/],
  ['objects with formatted string keys', '{ $"hi": 1 }', /Line 1, col 8/],
  ['objects with numeric keys', '{ 9: 1 }', /Line 1, col 4/],
  ['objects with object keys', '{ {}: "val1" }', /Line 1, col 5/],
  ['objects with variable declaration', '{ "x": 1\nx = 5 }', /Line 2, col 1/],
  ['objects with floating function declaration', '{ "x": 1\n() -> {} }', /Line 2, col 1/],
  ['objects with floating ids', '{ "x": 1\ny }', /Line 2, col 1/],
  ['objects with floating keys', '{ "x": 1\n"y" }', /Line 2, col 5/]

  // lists
    // [a = 5]

  // ranges
    // rangex(5)
    // range(5 5)
    // range = 5
    
  // match
    // match x {}
    // match x {default: {}}
    // match x {default x: {}}
    // match x {default: {}\ncase y: {}}

  // enum
    // enum Season {}
    // enum Season { spring summer }
    // enum Season { spring = 'spring', summer }

  // declaring vars with hanging operators
  // keywords as ids
]

describe("The grammar", () => {
  const grammar = ohm.grammar(fs.readFileSync("src/bang.ohm"))
  for (const [scenario, source] of syntaxChecks) {
    it(`properly specifies ${scenario}`, () => {
      assert(grammar.match(source).succeeded())
    })
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`does not permit ${scenario}`, () => {
      const match = grammar.match(source)
      assert(!match.succeeded())
      assert(new RegExp(errorMessagePattern).test(match.message))
    })
  }
})


  // TODO: Semantic tests
    // { return x && [y][0] }

    // { return x && y } 

    // { return x() && y() }

    // { return x.y && y.x }

    // { return x[1] && y[0] }

    // x ? { }
    // x = y ? { "str" }
    // x = y ? "str" : "alt"
    // x = y ? { "str" } : "alt"
    // x = y ? "str" : { "alt" }
    // x = y ? { return z } : "alt"
    // x = y ? { return "str" } : "alt"
    // x = y ? "str" : { return z }
    // y ? { break }
    /*
    y 
    ? { 
      x = 5
        break
    }
    */
    /*
    y ? { 
      "str"
    } : {
      "alt"
    }
    */
    /*
    y 
    ? { return } 
    : return
    */
    // x ? { () -> print("hi") }
    // x ? { () -> { print("hi") }}
    // x ? { (i) -> print(i) }
    // x ? { (i) -> { print(i) }}
    // x = y ? 'true' : 'false
    // x = y ? 'true' : return nil
    /*
    z = y 
    ? { return x ? 'true' : 'false' } 
    : return nil
    */
    // x ? print('hi') : 'alt'
    // x ? 'str' : { print('hi') }
    // x = [{ print('hi') }] // should print hi, then x = [nil]
    // constx = 5\nconstx = 6

  // TODO: semantic errors
    // a = [$'test {a}']
    // constants as ids