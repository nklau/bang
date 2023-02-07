import assert from "assert/strict"
import fs from "fs"
import ohm from "ohm-js"

const keywords = ['const', 'true', 'false', 'match', 'nil', 'enum', 'break', 'return', 'local']

const exps = [
  ['2 arg function call', 'x(y, z)'],
  ['additive exp', 'x + y'],
  ['and exp', 'x && y'],
  ['bang function', '{ x = 5 }'],
  ['boolean exp !=', 'x != y'],
  ['boolean exp <', 'x < y'],
  ['boolean exp <=', 'x <= y'],
  ['boolean exp ==', 'x == y'],
  ['boolean exp >', 'x > y'],
  ['boolean exp >=', 'x >= y'],
  ['called selected variable', 'x.y()'],
  ['called subscripted selected variable', 'x.y[1]()'],
  ['division exp', 'x / y'],
  ['empty formatted string', '$""'],
  ['empty single quote formatted string', "$''"],
  ['empty single quote string literal', "''"],
  ['empty string literal', '""'],
  ['exponential exp', 'x ** y'],
  ['false boolean literal', 'false'],
  ['first half of ternary exp', 'x ? y'],
  ['formatted single quote string with no exp', "$'str'"],
  ['formatted single quote string with only exp', "$'{x}'"],
  ['formatted single quote string with two exp', "$'{x}{y}'"],
  ['formatted string with no exp', '$"str"'],
  ['formatted string with only exp', '$"{x}"'],
  ['formatted string with two exp', '$"{x}{y}"'],
  ['formatted string', '$"str{x}"'],
  ['function call chain', 'x()()'],
  ['function call', 'x()'],
  ['function literal', '() -> { }'],
  ['list literal', '[x]'],
  ['longer formatted string', '$"str{x} alt {y}"'],
  ['longer single quote formatted string', "$'str{x} alt {y}'"],
  ['match exp', 'match x { case y: z }'],
  ['mixed list literal', '[1, x]'],
  ['modulus exp', 'x % y'],
  ['multiplicative exp', 'x * y'],
  ['negated exp', '!x'],
  ['negative exp', '-x'],
  ['nil', 'nil'],
  ['number literal', '5'],
  ['object literal', '{ "x": 1 }'],
  ['or exp', 'x || y'],
  ['parenthesized exp', '(x)'],
  ['range exp', 'range(5)'],
  ['selected variable', 'x.y'],
  ['single quote formatted string', "$'str{x}'"],
  ['single quote string literal', "'str'"],
  ['string literal', '"str"'],
  ['subscripted function call', 'x.y()[1]'],
  ['subscripted function return value', 'x()[1]'],
  ['subscripted selected variable', 'x.y[1]'],
  ['subscripted variable call', 'x[1]()'],
  ['subscripted variable', 'x[1]'],
  ['subtractive exp', 'x - y'],
  ['ternary exp', 'x ? y : z'],
  ['true boolean literal', 'true'],
  ['two literal list literal', '[1, 2]'],
  ['two variable list literal', '[x, y]'],
  ['unwrapped exp', 'x?'],
  ['variable name', 'x']
]
const assignmentOps = ['=', '+=', '-=', '*=', '/=', '%=']
const varAssignments = ['x', 'x.y', 'x.y.z', 'x.y[1]', 'x.y[z]', 'x[1]', 'x[y]', 'x[1][y]', 'x[1].y', 'x[y].z']
const binaryOps = ['||', '&&', '+', '-', '*', '/', '%', '**']
const stringChars = ['', '}', '\\\'', '\\"', '\\\\', '\\n', '\\t', '\\r', '\\u']

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
  ['boolean exp != with boolean exps', '(x == y) != (z == n)'],
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
  ['boolean exp <', 'x < y'],
  ['boolean exp < with parenthesized exps', '(x + y) < (z + n)'],
  ['boolean exp < with ternary exps', '(x ? y : m) < (z ? n : a)'],
  ['boolean exp < with boolean exps', '(x == y) < (z == n)'],
  ['chained boolean exp', 'x < y < z'],
  ['boolean exp < with or exps', 'x || y < z || n'],
  ['boolean exp < with and exps', 'x && y < z && n'],
  ['boolean exp < with negated exps', '!x < !y'],
  ['boolean exp < with additive exps', 'x + y < z + n'],
  ['boolean exp < with subtractive exps', 'x - y < z - n'],
  ['boolean exp < with multiplicative exps', 'x * y < z * n'],
  ['boolean exp < with division exps', 'x / y < z / n'],
  ['boolean exp < with modulus exps', 'x % y < z % n'],
  ['boolean exp < with exponential exps', 'x ** y < z ** n'],
  ['boolean exp < with negative exps', '-x < -y'],
  ['boolean exp < with variables', 'x < y'],
  ['boolean exp < with function calls', 'x() < y()'],
  ['boolean exp < with subscripted variables', 'x[1] < y[1]'],
  ['boolean exp < with subscripted functions', 'x[1]() < y[1]()'],
  ['boolean exp < with selected variables', 'x.y < y.x'],
  ['boolean exp < with selected methods', 'x.y() < y.x()'],
  ['boolean exp < with nil', 'nil < nil'],
  ['boolean exp < with strings', '"str" < "alt"'],
  ['boolean exp < with formatted strings', '$"str{x}" < $"alt{y}"'],
  ['boolean exp < with numbers', '1 < 2'],
  ['boolean exp < with floats', '1.2 < 2.1'],
  ['boolean exp < with objects', '{ "x": 1 } < { "y": 2 }'],
  ['boolean exp < with false', 'false < false'],
  ['boolean exp < with true', 'true < true'],
  ['boolean exp < with bang functions', '{ x = 1 } < { y = 2 }'],
  ['boolean exp < with match exps', 'match x { case y: z } < match y { case x: z }'],
  ['boolean exp < with lists', '[x] < [y]'],
  ['boolean exp < with ranges', 'range(5) < range(1, 6)'],
  ['boolean exp >', 'x > y'],
  ['boolean exp > with parenthesized exps', '(x + y) > (z + n)'],
  ['boolean exp > with ternary exps', '(x ? y : m) > (z ? n : a)'],
  ['boolean exp > with boolean exps', '(x == y) > (z == n)'],
  ['chained boolean exp', 'x > y > z'],
  ['boolean exp > with or exps', 'x || y > z || n'],
  ['boolean exp > with and exps', 'x && y > z && n'],
  ['boolean exp > with negated exps', '!x > !y'],
  ['boolean exp > with additive exps', 'x + y > z + n'],
  ['boolean exp > with subtractive exps', 'x - y > z - n'],
  ['boolean exp > with multiplicative exps', 'x * y > z * n'],
  ['boolean exp > with division exps', 'x / y > z / n'],
  ['boolean exp > with modulus exps', 'x % y > z % n'],
  ['boolean exp > with exponential exps', 'x ** y > z ** n'],
  ['boolean exp > with negative exps', '-x > -y'],
  ['boolean exp > with variables', 'x > y'],
  ['boolean exp > with function calls', 'x() > y()'],
  ['boolean exp > with subscripted variables', 'x[1] > y[1]'],
  ['boolean exp > with subscripted functions', 'x[1]() > y[1]()'],
  ['boolean exp > with selected variables', 'x.y > y.x'],
  ['boolean exp > with selected methods', 'x.y() > y.x()'],
  ['boolean exp > with nil', 'nil > nil'],
  ['boolean exp > with strings', '"str" > "alt"'],
  ['boolean exp > with formatted strings', '$"str{x}" > $"alt{y}"'],
  ['boolean exp > with numbers', '1 > 2'],
  ['boolean exp > with floats', '1.2 > 2.1'],
  ['boolean exp > with objects', '{ "x": 1 } > { "y": 2 }'],
  ['boolean exp > with false', 'false > false'],
  ['boolean exp > with true', 'true > true'],
  ['boolean exp > with bang functions', '{ x = 1 } > { y = 2 }'],
  ['boolean exp > with match exps', 'match x { case y: z } > match y { case x: z }'],
  ['boolean exp > with lists', '[x] > [y]'],
  ['boolean exp > with ranges', 'range(5) > range(1, 6)'],
  ['boolean exp <=', 'x <= y'],
  ['boolean exp <= with parenthesized exps', '(x + y) <= (z + n)'],
  ['boolean exp <= with ternary exps', '(x ? y : m) <= (z ? n : a)'],
  ['boolean exp <= with boolean exps', '(x == y) <= (z == n)'],
  ['chained boolean exp', 'x <= y <= z'],
  ['boolean exp <= with or exps', 'x || y <= z || n'],
  ['boolean exp <= with and exps', 'x && y <= z && n'],
  ['boolean exp <= with negated exps', '!x <= !y'],
  ['boolean exp <= with additive exps', 'x + y <= z + n'],
  ['boolean exp <= with subtractive exps', 'x - y <= z - n'],
  ['boolean exp <= with multiplicative exps', 'x * y <= z * n'],
  ['boolean exp <= with division exps', 'x / y <= z / n'],
  ['boolean exp <= with modulus exps', 'x % y <= z % n'],
  ['boolean exp <= with exponential exps', 'x ** y <= z ** n'],
  ['boolean exp <= with negative exps', '-x <= -y'],
  ['boolean exp <= with variables', 'x <= y'],
  ['boolean exp <= with function calls', 'x() <= y()'],
  ['boolean exp <= with subscripted variables', 'x[1] <= y[1]'],
  ['boolean exp <= with subscripted functions', 'x[1]() <= y[1]()'],
  ['boolean exp <= with selected variables', 'x.y <= y.x'],
  ['boolean exp <= with selected methods', 'x.y() <= y.x()'],
  ['boolean exp <= with nil', 'nil <= nil'],
  ['boolean exp <= with strings', '"str" <= "alt"'],
  ['boolean exp <= with formatted strings', '$"str{x}" <= $"alt{y}"'],
  ['boolean exp <= with numbers', '1 <= 2'],
  ['boolean exp <= with floats', '1.2 <= 2.1'],
  ['boolean exp <= with objects', '{ "x": 1 } <= { "y": 2 }'],
  ['boolean exp <= with false', 'false <= false'],
  ['boolean exp <= with true', 'true <= true'],
  ['boolean exp <= with bang functions', '{ x = 1 } <= { y = 2 }'],
  ['boolean exp <= with match exps', 'match x { case y: z } <= match y { case x: z }'],
  ['boolean exp <= with lists', '[x] <= [y]'],
  ['boolean exp <= with ranges', 'range(5) <= range(1, 6)'],
  ['boolean exp >=', 'x >= y'],
  ['boolean exp >= with parenthesized exps', '(x + y) >= (z + n)'],
  ['boolean exp >= with ternary exps', '(x ? y : m) >= (z ? n : a)'],
  ['boolean exp >= with boolean exps', '(x == y) >= (z == n)'],
  ['chained boolean exp', 'x >= y >= z'],
  ['boolean exp >= with or exps', 'x || y >= z || n'],
  ['boolean exp >= with and exps', 'x && y >= z && n'],
  ['boolean exp >= with negated exps', '!x >= !y'],
  ['boolean exp >= with additive exps', 'x + y >= z + n'],
  ['boolean exp >= with subtractive exps', 'x - y >= z - n'],
  ['boolean exp >= with multiplicative exps', 'x * y >= z * n'],
  ['boolean exp >= with division exps', 'x / y >= z / n'],
  ['boolean exp >= with modulus exps', 'x % y >= z % n'],
  ['boolean exp >= with exponential exps', 'x ** y >= z ** n'],
  ['boolean exp >= with negative exps', '-x >= -y'],
  ['boolean exp >= with variables', 'x >= y'],
  ['boolean exp >= with function calls', 'x() >= y()'],
  ['boolean exp >= with subscripted variables', 'x[1] >= y[1]'],
  ['boolean exp >= with subscripted functions', 'x[1]() >= y[1]()'],
  ['boolean exp >= with selected variables', 'x.y >= y.x'],
  ['boolean exp >= with selected methods', 'x.y() >= y.x()'],
  ['boolean exp >= with nil', 'nil >= nil'],
  ['boolean exp >= with strings', '"str" >= "alt"'],
  ['boolean exp >= with formatted strings', '$"str{x}" >= $"alt{y}"'],
  ['boolean exp >= with numbers', '1 >= 2'],
  ['boolean exp >= with floats', '1.2 >= 2.1'],
  ['boolean exp >= with objects', '{ "x": 1 } >= { "y": 2 }'],
  ['boolean exp >= with false', 'false >= false'],
  ['boolean exp >= with true', 'true >= true'],
  ['boolean exp >= with bang functions', '{ x = 1 } >= { y = 2 }'],
  ['boolean exp >= with match exps', 'match x { case y: z } >= match y { case x: z }'],
  ['boolean exp >= with lists', '[x] >= [y]'],
  ['boolean exp >= with ranges', 'range(5) >= range(1, 6)'],
  ['lhs parentheses', '(x == y) == z'],
  ['rhs parentheses', 'x == (y == z)'],
  ['parenthesized exp with newlines', '(\nx\n\t+ y\n)'],
  ['comments', 'x = 5 // comment'],
  ['nested ternary on left', 'x ? (a ? b : c) : y'],
  ['nested ternary on right', 'x ? y : (a ? b : c)'],
  ['empty objects', '{}'],
  ['empty objects with whitespace', '{ }'],
  ['empty objects that span multiple lines', '{\n\n}'],
  ['objects with one string key and a numeric value', '{ "x": 1 }'],
  ['objects with two string keys and string values', '{ "x": \'hello\',\n"y": "hi" }'],
  ['objects with stringified numeric keys', '{ "9": 1 }'],
  ['objects that span multiple lines', "{\n'key1': 'val1',\n'key2': 'val2'\n}"],
  ['objects with object values', '{ "key1": {} }'],
  ['objects with function values', '{ "key1": () -> { } }'],
  ['objects with extra whitespace', '{ "x" : 1 }'],
  ['" in a single-quoted string', `'"'`],
  ["' in a string", `"'"`],
  ['{} in a single-quoted string', `'{}'`],
  ['{} in a string', `"{}"`],
  ['enum with cases on one line', 'enum x { a, b, c }'],
  ['local var dec without value', 'local x'],
  ['enum with cases on multiple lines', 'enum x { a,\nb,\nc }'],
  ['enum with case assignment delimeted by a comma', 'enum x { y = 1, z }'],
  ['return without value', 'return'],
  ['break', 'break'],
  ['... operator on a function call', '...x()()']
]

const syntaxErrors = [
  ['mismatched brackets', '[', /Line 1, col 2/],
  ['mismatched brackets', ']', /Line 1, col 1/],
  ['mismatched parens', '[(])', /Line 1, col 3/],
  ['mismatched parens', '([)]', /Line 1, col 3/],
  ['mismatched parens', '(', /Line 1, col 2/],
  ['mismatched parens', ')', /Line 1, col 1/],
  ['multiple statements per line', 'x = 2 x = 3', /Line 1, col 7/],
  ['multiple statements per line', 'x = y? { "str" }', /Line 1, col 8/],
  ['multiline comment with //', '// comment \n rest of comment', /Line 2, col 7/],
  ['mismatched apostrophes', "'", /Line 1, col 2/],
  ['mismatched quotes', '"', /Line 1, col 2/],
  ['mismatched quotes', `"'`, /Line 1, col 3/],
  ['mismatched quotes', `'"`, /Line 1, col 3/],
  ['return statement as exp', 'return x = 5', /Line 1, col 12/],
  ['return local var', 'return local x', /Line 1, col 8/],
  ['return an enum', 'return enum x', /Line 1, col 8/],
  ['const var dec without value', 'const x', /Line 1, col 8/],
  ['var dec without value', 'x =', /Line 1, col 4/],
  ['var value as statement', 'x = y = 5', /Line 1, col 9/],
  ['!== operator', 'x !== y', /Line 1, col 5/],
  ['=== operator', 'x === y', /Line 1, col 5/],
  ['!< operator', 'x !< y', /Line 1, col 4/],
  ['=< operator', 'x =< y', /Line 1, col 4/],
  ['! as a binary operator', 'x ! 5', /Line 1, col 5/],
  ['function parameters not separated by commas', 'x(y z)', /Line 1, col 5/],
  ['function parameters separated by newlines', 'x(y\nz)', /Line 2, col 1/],
  ['objects with non-string keys', '{ x: 1 }', /Line 1, col 4/],
  ['objects with formatted string keys', '{ $"hi": 1 }', /Line 1, col 8/],
  ['objects with numeric keys', '{ 9: 1 }', /Line 1, col 4/],
  ['objects with object keys', '{ {}: "val1" }', /Line 1, col 5/],
  ['objects with variable declaration', '{ "x": 1\nx = 5 }', /Line 2, col 1/],
  ['objects with floating function declaration', '{ "x": 1\n() -> {} }', /Line 2, col 1/],
  ['objects with floating ids', '{ "x": 1\ny }', /Line 2, col 1/],
  ['objects with floating keys', '{ "x": 1,\n"y" }', /Line 2, col 5/],
  ['local const variable', 'local const x', /Line 1, col 14/],
  ['statements inside lists', '[x = y]', /Line 1, col 6/],
  ['match without cases', 'match x {}', /Line 1, col 10/],
  ['match with only default', 'match x {default: {}}', /Line 1, col 10/],
  ['match with default case value', 'match x {case y: z\ndefault a: {}}', /Line 2, col 9/],
  ['match with default case first', 'match x { default: y\ncase z: a }', /Line 1, col 11/],
  ['enum without cases', 'enum x {}', /Line 1, col 9/],
  ['enum with cases delimited by a space', 'enum x { y z }', /Line 1, col 12/],
  ['escaped non-escape char', 'print("\\/*")', /Line 1, col 9/],
  ['closing paren in multiline comment', 'print(/*) */', /Line 1, col 7/],
  ['closing paren commented out', 'print(//)', /Line 1, col 7/]
]

describe("The grammar", () => {
  const grammar = ohm.grammar(fs.readFileSync("src/bang.ohm"))

  for (const [scenario, source] of syntaxChecks) {
    it(`properly specifies ${scenario}`, () => {
      assert(grammar.match(source).succeeded())
    })
  }

  for (const char of stringChars) {
    it(`properly accepts ${char} in a single-quoted string`, () => {
      assert(grammar.match(`'${char}'`).succeeded())
    }) 
    it(`properly accepts ${char} in a string`, () => {
      assert(grammar.match(`"${char}"`).succeeded())
    })
    it(`properly accepts ${char} in a formatted single-quoted string`, () => {
      assert(grammar.match(`$'${char}'`).succeeded())
    })
    it(`properly accepts ${char} in a formatted string`, () => {
      assert(grammar.match(`$"${char}"`).succeeded())
    })
  }

  for (const [scenario, source] of exps) {
    it(`properly specifies ${scenario}s`, () => {
      assert(grammar.match(`${source}`).succeeded())
    })
    it(`properly specifies parenthesized exps with ${scenario}s`, () => {
      assert(grammar.match(`(${source})`).succeeded())
    })
    it(`properly specifies bang functions with a ${scenario}`, () => {
      assert(grammar.match(`{ x = ${source} }`).succeeded())
    })
    it(`properly accepts a ${scenario} as a return value`, () => {
      assert(grammar.match(`return ${source}`).succeeded())
    })
    it(`properly specifies variable subscription with a ${scenario}`, () => {
      assert(grammar.match(`x[${source}]`).succeeded())
    })
    it(`properly specifies variable selection with a ${scenario}`, () => {
      assert(grammar.match(`${source}.x`).succeeded())
    })
    it(`properly accepts a ${scenario} as a positional argument`, () => {
      assert(grammar.match(`x(${source})`).succeeded())
    })
    it(`properly accepts a ${scenario} as a keyword argument`, () => {
      assert(grammar.match(`x(y = ${source})`).succeeded())
    })
    it(`properly accepts a ${scenario} as a positional or keyword argument`, () => {
      assert(grammar.match(`x(y = ${source}, ${source})`).succeeded())
    })
    it(`properly accepts ${scenario}s as values in an object`, () => {
      assert(grammar.match(`{ "x": ${source},\n"y": ${source} }`).succeeded())
    })
    it(`properly accepts ${scenario}s as list values`, () => {
      assert(grammar.match(`[${source},\n${source}]`).succeeded())
    })
    it(`properly accepts ${scenario}s as exps in a formatted string`, () => {
      if (!(source.includes('"') || source.includes("{"))) {
        assert(grammar.match(`$"str${source} alt"`).succeeded())
      } else if (!(source.includes("'") || source.includes("{"))) {
        assert(grammar.match(`$'str${source} alt'`).succeeded())
      }
    })
    it(`properly accepts a ${scenario} as a match case`, () => {
      if (!scenario.includes('first half')) {
        assert(grammar.match(`match x {\ncase ${source}:\nx}`).succeeded())
      } else {
        assert(grammar.match(`match x {\ncase (${source}):\nx}`).succeeded())
      }
    })
    it(`properly accepts a ${scenario} as a return value for a match case`, () => {
      assert(grammar.match(`match x {\ncase x:\n${source}}`).succeeded())
    })
    it(`properly accepts a ${scenario} as a return value for a default case`, () => {
      assert(grammar.match(`match x {\ncase x:\ny\ndefault: ${source}}`).succeeded())
    })
    it(`properly accepts a ${scenario} as a case value in an enum`, () => {
      assert(grammar.match(`enum x { x = ${source} }`).succeeded())
      assert(grammar.match(`enum x { \nx = ${source},\ny = ${source}\n}`).succeeded())
    })
    it(`properly accepts ${scenario} as the condition of a ternary`, () => {
      assert(grammar.match(`${source} ? x`).succeeded())
      assert(grammar.match(`${source} ? x : y`).succeeded())
    })
    it(`properly accepts ${scenario} as the true case for a ternary`, () => {
      assert(grammar.match(`x ? ${source}`).succeeded())
      assert(grammar.match(`x ? ${source} : y`).succeeded())
    })
    it(`properly accepts ${scenario} as the false case for a ternary`, () => {
      assert(grammar.match(`x ? y : ${source}`).succeeded())
    })
    it(`properly accepts the ! operator on a ${scenario}`, () => {
      const match = grammar.match(`!${source}`)
      if (scenario.includes('negative exp')) {
        assert(!match.succeeded())
      } else {
        assert(match.succeeded())
      }
    })
    it(`properly accepts the ? operator on a ${scenario}`, () => {
      assert(grammar.match(`${source}?`).succeeded())
    })
    it(`properly accepts the - operator on a ${scenario}`, () => {
      const match = grammar.match(`-${source}`)
      if (scenario.includes('exponential') || scenario.includes('negative exp')) {
        assert(!match.succeeded())
      } else {
        assert(match.succeeded())
      }
    })

    for (const varAssignment of varAssignments) {
      for (const op of assignmentOps) {
        it(`properly specifies ${varAssignment} ${op} declaration with a ${scenario} value`, () => {
          assert(grammar.match(`${varAssignment} ${op} ${source}`).succeeded())
          assert(grammar.match(`local ${varAssignment} ${op} ${source}`).succeeded())
          assert(grammar.match(`const ${varAssignment} ${op} ${source}`).succeeded())
          assert(grammar.match(`local const ${varAssignment} ${op} ${source}`).succeeded())
        })
      }
    }

    for (const [otherScenario, otherSource] of exps) {
      for (const operator of binaryOps) {
        if (operator.includes('**') && (scenario.includes('negative') || otherScenario.includes('negative'))) {
          it(`does not permit the ${operator} with ${scenario} and ${otherScenario}`, () => {
            if (scenario.includes('negative')) {
              assert(!grammar.match(`${source} ${operator} ${otherSource}`).succeeded())
            } else {
              assert(!grammar.match(`${otherSource} ${operator} ${source}`).succeeded())
            }
          })
        } else {
          it(`properly specifies the ${operator} operator with ${scenario} and ${otherScenario}`, () => {
            assert(grammar.match(`${source} ${operator} ${otherSource}`).succeeded())
            assert(grammar.match(`${otherSource} ${operator} ${source}`).succeeded())
          })
        }
      }
    }
  }

  for (const varAssignment of varAssignments) {
    it(`properly accepts the ... operator on ${varAssignment}`, () => {
      assert(grammar.match(`...${varAssignment}`).succeeded())
    })
  }

  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`does not permit ${scenario}`, () => {
      const match = grammar.match(source)
      assert(!match.succeeded())
      assert(new RegExp(errorMessagePattern).test(match.message))
    })
  }

  for (const keyword of keywords) {
    it(`does not permit ${keyword} as a variable name`, () => {
      assert(!grammar.match(`${keyword} = 1`).succeeded())
    })
  }
})