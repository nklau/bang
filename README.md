![a logo for the programming language bang!, it is big blue bubble letters with a small cartoon explosion coming from the b](docs/logo.png "Logo")

# Bang!

A compiler for the programming language bang!

See the official documentation [here](https://nklau.github.io/bang/).

Aidan Srouji, Natalie Lau, and Abe Moore Odell have competed as a team in the LMU Git Gud programming competition for the past two years. After losing to the professors by 0.3 points in the last competition, the team decided to create a programming language specifically designed for the type of coding done in limited time competitions and interviews. Their creation, known as "Bang!", is a dynamically typed language that makes use of concise and clear syntax to create a pleasant and swift programming experience. By treating everything as an object, Bang! gives programmers many time-saving options, such as the ability to create loops from numbers and its signature "bang functions." The mission? Minimize typing, and maximize winning.

## Language Overview

### Comments

| Comment                 | Description         |
| ----------------------- | ------------------- |
| `// comment goes here`  | Single line comment |
| `/*comment goes here*/` | Multi line comment  |

### Keywords

| Keyword  | Description                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `const`  | Used to initialize a variable as read-only<br>_Note: Modifying the elements of a constant list or object variable is allowed_ |
| `true`   | Boolean value true                                                                                                            |
| `false`  | Boolean value false                                                                                                           |
| `match`  | Used to specify the value used as the conditional in a match expression                                                       |
| `nil`    | Used to represent the absence of a value                                                                                      |
| `break`  | Used to return from within a loop function and skip all future iterations of that loop function                               |
| `return` | Used to specify when a function ends and what value it gives as a result of a call                                            |
| `local`  | Used to force variable shadowing within the current scope                                                                     |

### Data Types

| Type       | Value                                      | JavaScript Type Equivalent | JavaScript Value Equivalent           |
| ---------- | ------------------------------------------ | -------------------------- | ------------------------------------- |
| `nil`      | `Nil`                                      | `undefined`                | `undefined`                           |
| `boolean`  | `true`,`false`                             | `boolean`                  | `true`,`false`                        |
| `number`   | `1, 1.5, 1e2, 1E2, 1e+2, 1e-2`             | `number`                   | `1, 1.5, 1e2, 1E2. 1e+2, 1e-2`        |
| `string`   | `'str', "str", $'str {var}', $"str {var}"` | `string`                   | `` 'str', "str", `str ${var}`  ``     |
| `object`   | `{}, {'x': 1, "y": 'str', '1': true}`      | `object`                   | `{}, {'x': 1, 'y': 'str', '1': true}` |
| `list`     | `[], [1, 'hi', {}]`                        | `array`                    | `[], [1, 'hi', {}]`                   |
| `function` | `() -> {}`, `i -> i`                       | `function`                 | `() => {}`, `i => i`                  |

### Type Hierarchy

Types in Bang! are always implicitly coerced upwards, from the weakest type to the strongest. Following the mission statement of a dynamically typed and flexible language, coerced types evaluate to the most logical value (at least we think so!). The Type Hierarchy table shows a variable `e` and its coerced values, `e.<type>`. The weakest type, `nil`, is in the first row, and the strongest type, `list`, is in the final row. Within each row, single values are given if the coercion always results in the same value, otherwise, a general case rule and select examples and/or exceptions to the general rule are given.

<table border="1px">
<tr> <th> Target type &#x2011;> </th> <th> nil </th> <th> boolean </th> <th> number </th> <th> string </th> <th> object </th> <th> list </th></tr>

<tr>
<td align="center">
<b>e = nil</b>
</td>

<td align="center">

<pre><code>nil</code></pre>

</td>
<td align="center">

<pre><code>false</code></pre>

</td>
<td align="center">

<pre><code>0</code></pre>

</td>
<td align="center">

<pre><code>''</code></pre>

</td>
<td align="center">

<pre><code>{}</code></pre>

</td>
<td align="center">

<pre><code>[]</code></pre>

</td>
</tr>

<tr></tr>

<tr>
<td align="center">

<b>e&#160;=&#160;boolean</b>

</td>
<td align="center">

<pre><code>nil</code></pre>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.bool </th>
</tr>

<tr>
<td><pre><code>false</code></pre></td>
<td><pre><code>false</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>true</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.num </th>
</tr>

<tr>
<td><pre><code>false</code></pre></td>
<td><pre><code>0</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>true</code></pre></td>
<td><pre><code>1</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.str </th>
</tr>

<tr>
<td><pre><code>false</code></pre></td>
<td><pre><code>'false'</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>true</code></pre></td>
<td><pre><code>'true'</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.obj </th>
</tr>

<tr>
<td><pre><code>false</code></pre></td>
<td><pre><code>{'false': false}</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>true</code></pre></td>
<td><pre><code>{'true': true}</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.list </th>
</tr>

<tr>
<td><pre><code>false</code></pre></td>
<td><pre><code>[false]</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>true</code></pre></td>
<td><pre><code>[true]</code></pre></td>
</tr>
</table>

</td>
</tr>

<tr></tr>

<tr>
<td align="center">
<b>e = number</b>
</td>
<td align="center">

<pre><code>nil</code></pre>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.bool </th>
</tr>

<tr>
<td><pre><code>0</code></pre></td>
<td><pre><code>false</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>5</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.num </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>e</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>5</code></pre></td>
<td><pre><code>5</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.str </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>'e'</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>5</code></pre></td>
<td><pre><code>'5'</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.obj </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>{'e': e}</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>5</code></pre></td>
<td><pre><code>{'5': 5}</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.list </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>[e]</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>5</code></pre></td>
<td><pre><code>[5]</code></pre></td>
</tr>
</table>

</td>
</tr>

<tr></tr>

<tr>
<td align="center">

<b>e = string</b>

</td>
<td align="center">

<pre><code>nil</code></pre>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.bool </th>
</tr>

<tr>
<td><pre><code>''</code></pre></td>
<td><pre><code>false</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>'string'</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.num </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>len(e)</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>'string'</code></pre></td>
<td><pre><code>6</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.str </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>e</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>'string'</code></pre></td>
<td><pre><code>'string'</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.obj </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>{e: e}</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>'string'</code></pre></td>
<td><pre><code>{'string': 'string'}</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.list </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>[e]</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>'string'</code></pre></td>
<td><pre><code>['string']</code></pre></td>
</tr>
</table>

</td>
</tr>

<tr></tr>

<tr>
<td align="center">

<b>e = object</b>

</td>
<td align="center">

<pre><code>nil</code></pre>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.bool </th>
</tr>

<tr>
<td><pre><code>{}</code></pre></td>
<td><pre><code>false</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>{'x': 0, 'y': 1}</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.num </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>numKeys(e)</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>{'x': 0, 'y': 1}</code></pre></td>
<td><pre><code>2</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.str </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>'e'</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>{'x': 0, 'y': 1}</code></pre></td>
<td><pre><code>'{'x': 0, 'y': 1}'</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.obj </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>e</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>{'x': 0, 'y': 1}</code></pre></td>
<td><pre><code>{'x': 0, 'y': 1}</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.list </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>[e]</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>{'x': 0, 'y': 1}</code></pre></td>
<td><pre><code>[{'x': 0, 'y': 1}]</code></pre></td>
</tr>
</table>

</td>
</tr>

<tr></tr>

<tr>
<td align="center">
<b>e = list</b>
</td>
<td align="center">

<pre><code>nil</code></pre>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.bool </th>
</tr>

<tr>
<td><pre><code>[]</code></pre></td>
<td><pre><code>false</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>[5, false]</code></pre></td>
<td><pre><code>true</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.num </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>len(e)</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>[5, false]</code></pre></td>
<td><pre><code>2</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.str </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>'e'</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>[5, false]</code></pre></td>
<td><pre><code>'[5, false]'</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.obj </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>{'E': E}</code> for all <code>E</code> in <code>e</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>[5, false]</code></pre></td>
<td><pre><code>{'5': 5, 'false': false}</code></pre></td>
</tr>
</table>

</td>
<td align="center">

<table>
<tr>
<th> e </th>
<th> e.list </th>
</tr>

<tr>
<td><pre><code>e</code></pre></td>
<td><pre><code>e</code></pre></td>
</tr>

<tr></tr>

<tr>
<td><pre><code>[5, false]</code></pre></td>
<td><pre><code>[5, false]</code></pre></td>
</tr>
</table>

</td>
</tr>

</table>

### Operators and Precedence

**All operators evaluate left to right.**

| Operator              | Symbol                  | Primary Operational Types | Precedence | Associativity |
| --------------------- | ----------------------- | ------------------------- | :--------: | :-----------: |
| Grouping              | `(<exp>)`               | Expressions               |     1      |     None      |
| Negation              | `!`                     | Booleans                  |     2      |    R to L     |
| Selector              | `.`                     | Objects                   |     2      |    L to R     |
| Indexer               | `[]`                    | Lists                     |     2      |    L to R     |
| Call                  | `()`                    | Functions                 |     2      |    L to R     |
| Pre-Increment         | `++<exp>`               | Numbers                   |     3      |    R to L     |
| Pre-Decrement         | `--<exp>`               | Numbers                   |     3      |    R to L     |
| Post-Increment        | `<exp>++`               | Numbers                   |     3      |    L to R     |
| Post-Decrement        | `<exp>++`               | Numbers                   |     3      |    L to R     |
| Spread                | `...`                   | Lists                     |     4      |    R to L     |
| Negative              | `-`                     | Numbers                   |     4      |    R to L     |
| Exponentiation        | `**`                    | Numbers                   |     5      |     None      |
| Multiplication        | `*`                     | Numbers                   |     6      |     None      |
| Division              | `/`                     | Numbers                   |     6      |     None      |
| Modulus               | `%`                     | Numbers                   |     6      |     None      |
| Addition              | `+`                     | Numbers                   |     7      |     None      |
| Subtraction           | `-`                     | Numbers                   |     7      |     None      |
| Logical AND           | `&&`                    | Booleans                  |     8      |    L to R     |
| Logical OR            | `\|\|`                  | Booleans                  |     9      |    L to R     |
| Equality              | `==`                    | Nil                       |     10     |     None      |
| Inequality            | `!=`                    | Nil                       |     10     |     None      |
| Less Than             | `<`                     | Numbers                   |     10     |     None      |
| Less Than or Equal    | `<=`                    | Numbers                   |     10     |     None      |
| Greater Than          | `>`                     | Numbers                   |     10     |     None      |
| Greater Than or Equal | `>=`                    | Numbers                   |     10     |     None      |
| Conditional           | `<exp> ? <exp>`         | Booleans, Nil             |     11     |    R to L     |
| Conditional Alt       | `<exp> ? <exp> : <exp>` | Booleans, Nil, Nil        |     11     |    R to L     |

_Note: Primary operational types are displayed above because all types are valid for all operators. The primary operational type is the type an operator will default to if given an uninitialized variable_

## Sample Code

<table>
<tr>
<th>Bang!</th>
<th>javascript</th>
</tr>
<tr>
<td>

<pre><code>
x = 17
greeting = "hello"
greeting = "bye"
const decayRate = 0.05
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let x = 17
  let greeting = "hello"
  greeting = "bye"
  const decayRate = 0.05
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
firstName = "John"
lastName = "Doe"

print($"Hello, {firstName} {lastName}!")
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let firstName = "John"
  let lastName = "Doe"

  console.log(`Hello, ${firstName} ${lastName}!`)
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
-2**2
// semantic error
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  return -2**2
// syntax error
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
x++ + 1
// semantic error
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let x = 0
  return x++ + 1
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
(x++) + 1
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let x = 0
  x++ + 1
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
sum = (x, y) -> { x + y }
sum = (x, y) -> x + y
sum(x, y)
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let x = undefined
  let y = undefined

  let sum = (x, y) => {
    return x + y
  }
  sum = (x, y) => x + y

  return sum(x, y)
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
5.loop(print("hello world"))
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  for (let _ = 0; _ < 5; _++) console.log("hello world")
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
5.loop(print)
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  for (let i = 0; i < 5; i++) console.log(i)
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
range(5).loop(print)
// prints 0-4 on separate lines

range(1, 6).loop(print)
// prints 1-5 on separate lines
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  [...Array(5).keys()].forEach(i => console.log(i))
  // prints 0-4 on separate lines

  [...Array(5).keys()].map(i => i + 1).forEach(i => console.log(i))
  // prints 1-5 on separate lines
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
isValid ? print("valid!")
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let isValid = false
  if (isValid) {
    console.log("valid!")
  }
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
isValid ? print("valid!") : print("invalid!")
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let isValid = false

  if (isValid) {
    console.log("valid!")
  } else {
    console.log("invalid!")
  }
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
x = isValid ? object : print("invalid")

const objectField = x.fieldName
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let x
  let isValid = false

  if (isValid) {
    x = () => {
      let object
      return object
    }()
  } else {
    console.log("invalid")
  }
  const objectField = x?.fieldName
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
const isValid = false
x = isValid ? object : print("invalid")
// prints "invalid"

const objectField = x.fieldName
// objectField = nil
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  const isValid = false
  let x
  if (isValid) {
    x = object
  } else {
    console.log("invalid")
  }
  // prints "invalid"

  const objectField = x?.fieldName
  // objectField is undefined
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
isValid = false
x = isValid
  ? object
  : () -> print("invalid")
x() // prints "invalid"
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let isValid = false
  let x = isValid ? object : () => console.log("invalid")
  x() // prints "invalid"
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
x()
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let x = () => this
  return x()
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
const season = { 
  'spring': 'spring', 
  'summer': 'summer', 
  'fall': 'fall',
  'winter': 'winter' 
}

print(season.spring) 
// prints 'spring'
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  const season = Object.freeze({
    spring: "spring",
    summer: "summer",
    fall: "fall",
    winter: "winter",
  })

  console.log(season.spring)
}

_main()
</code></pre>

</td>
</tr>
<tr></tr>
<tr>
<td>

<pre><code>
s = season.fall
result = match s {
  case season.spring: "spring!"
  case season.summer: { "summer!" }
  case season.fall, season.winter: {
    str = "is cold!"
    str
  }
  default: "California!"
}
print(result)
// prints "is cold!"
</code></pre>

</td>
<td>

<pre><code>
function _main() {
  let season = {'fall': 'fall'}
  let s = season.fall
  let result

  switch (s) {
    case "spring":
      result = "spring!"
      break
    case "summer":
      result = "summer!"
      break
    case "fall":
    case "winter":
      let str = "is cold!"
      result = str
      break
    default:
      result = "California!"
  }
  console.log(result)
  // prints "is cold!"
}

_main()
</code></pre>

</td>
</tr>
</table>

Natalie "Nat" Lau is a third-year CS student at Loyola Marymount University interested in language scemantics and design, mobile app development, and video game development. Some of her past projects include implementing Linux kernel modules using sockets, and a mobile app companion for the game Breath of the Wild.

Abraham "Abe" Moore Odell is a computer science student at Loyola Marymount University with interests in AI, language design, and game design. Some of his past projects include AI game playing agents, and an automatic video generator.

Aidan "Aidan" Srouji is a third-year CS student at LMU, interested in applying artificial intelligence agents to the field of video game development. Some of his past projects include implementing an automatic speech recognition deep learning model, and creating a text-based multiplayer game run through the Discord platform.

## Code of Conduct

Feel free to add or recommend any features or changes to the language. If you do, please do so with kindness and consideration for all other contributors, users, and people across the globe. "bang!" uses the MIT license.
