![a logo for the programming language bang!, it is big blue bubble letters with a small cartoon explosion coming from the b](docs/logo.png "Logo")

# Bang!

A compiler for the programming language "bang!"

Aidan Srjoui, Natalie Lau, and Abe Moore Odell have competed as a team in the LMU Git Gud programming competition for the past two years. After losing to the professors by 0.3 points in the last competition, the team decided to create a programming language specifically designed for the type of coding done in limited time competitions and interviews. Their creation, known as "Bang!", is a dynamically typed language that makes use of concise and clear syntax to create a pleasant and swift programming experience. By treating everything as an object, Bang! gives programmers many time-saving options, such as the ability to create loops from numbers and its signature "bang functions". The mission? Minimize typing, and maximize winning.

## Language Overview

### Comments
|Comment|Description|
|-------|-----------|
|`// comment goes here`|Single line comment|
|`/* comment goes here*/`|Multi line comment|

### Keywords
|Keyword|Description|
|-------|-----------|
|`const`|Used to initialize a variable as read-only<br>Note: Modifying the elements of a constant list or object variable is allowed|
|`true`|Boolean value true|
|`false`|Boolean value false|
|`match`|Used to specify the value used as the conditional in a match expression|
|`nil`|Used to represent the absence of a value|
|`break`|Used to return from within a loop function and skip all future iterations of that loop function|
|`return`|Used to specify when a function ends and what value it gives as a result of a call|
|`local`|Used to force variable shadowing within the current scope|

### Data Types
|Type|Value|JavaScript Type Equivalent|JavaScript Value Equivalent|
|----|-----|--------------------------|---------------------------|
|`nil`|`Nil`|`undefined`|`undefined`|
|`boolean`|`true`,`false`|`boolean`|`true`,`false`|
|`number`|`1`,`1.5`,`1e2`,`1E2`,`1e+2`,`1e-2`|`number`|`1`,`1.5`,`1e2`,`1E2`,`1e+2`,`1e-2`|
|`string`|`'str'`,`"str"`,`$'str {var}'`,`$"str {var}"`|`string`|`'str'`,`"str"`,`` `str ${var}` ``|
|`object`|`{}`,`{ 'x': 1, "y": 'str', '1': true }`|`object`|`{}`,`{ 'x': 1, 'y': 'str', '1': true }`|
|`list`|`[]`,`[1, 'hi', {}]`|`array`|`[]`,`[1, 'hi', {}]`|
|`function`|`() -> {}`, `i -> i`|`function`|`() => {}`, `i => i`|

### Type Hierarchy


Types in Bang! are always implicitly coerced upwards, from the weakest type to the strongest. Following the mission statement of a dynamic and flexible language, coerced types evaluate to the most logical value (at least we think so!). The Type Hierarchy table shows the coercion values of a variable 'e'. The weakest type, nil, is in the first row, and the strongest type, list, is in the final row. Within each row, the general converstions are given, as well as select examples.

<table>
<tr> <th> Target type -> </th> <th> nil </th> <th> boolean </th> <th> number </th> <th> string </th> <th> object </th> <th> list </th></tr>

<tr>
<td>
<b>e = nil</b>
</td>

<td>

`nil`
</td>
<td>

`false`
</td>
<td>

`0`
</td>
<td>

`''`
</td>
<td>

`{}`
</td>
<td>

`[]`
</td>
</tr>

<tr>
<td>

<b>e = boolean</b>
</td>
<td>

`nil`
</td>
<td>

`false` -> `false`<br>`true` -> `true`
</td>
<td>

`false` -> `0`<br>`true` -> `1`
</td>
<td>

`false` -> `'false'`<br>`true` -> `'true'`
</td>
<td>

`false`->`{'false': false}`<br>`true`->`{'true': true}`
</td>
<td>

`false`->`[false]`<br>`true`->`[true]`
</td>
</tr>

<tr>
<td>
<b>e = number</b>
</td>
<td>

`nil`
</td>
<td>

`0` -> `false`<br>else -> `true`
</td>
<td>

`e` -> `e`<br>`5` -> `5`
</td>
<td>

`e` -> `'e'`<br>`5` -> `'5'`
</td>
<td>

`e` -> `{'e': e}`<br>`5` -> `{'5': 5}`
</td>
<td>

`e` -> `[e]`<br>`5` -> `[5]`
</td>
</tr>
<tr>
<td>

<b>e = string</b>
</td>
<td>

`nil`
</td>
<td>

`''` -> `false`<br>else -> `true`
</td>
<td>

`e` -> `len(e)`<br>`'string'` -> `6`
</td>
<td>

`e` -> `e`<br>`'string'` -> `'string'`
</td>
<td>

`e` -> `{e: e}`<br>`'string'` -> `{'string': 'string'}`
</td>
<td>

`e` -> `[e]`<br>`'string'` -> `['string']`
</td>
</tr>

<tr>
<td>

<b>e = object</b>
</td>
<td>

`nil`
</td>
<td>

`{}` -> `false`<br>else -> `true`
</td>
<td>

`e` -> `numKeys(e)`<br>`{'x': 0, 'y': false}` -> `2`
</td>
<td>

`e` -> `'e'`<br>`{'x': 0, 'y': false}` -> `'{'x': 0, 'y': false}'`
</td>
<td>

`e` -> `e`<br>`{'x': 0, 'y': false}` -> `{'x': 0, 'y': false}`
</td>
<td>

`e` -> `[e]`<br>`{'x': 0, 'y': false}` -> `[{'x': 0, 'y': false}]`
</td>
</tr>

<tr>
<td>
<b>e = list</b>
</td>
<td>

`nil`
</td>
<td>

`[]` -> `false`<br>else -> `true`
</td>
<td>

`e` -> `len(e)`<br>`[x, false]` -> `2`
</td>
<td>

`e` -> `'e'`<br>`[x, false]` -> `'[x, false]'`
</td>
<td>

`e` -> `{'i': i}` for all `i` in `e`<br>`[x, false]` -> `{'x': x, 'false': false}`
</td>
<td>

`e` -> `e`<br>`[x, false]` -> `[x, false]`
</td>
</tr>

</table>

### Operators and Precedence
**All operators evaluate left to right.**
|Operator|Symbol|Primary Operational Types|Precedence|Associativity|
|--------|------|-----------------|:--------:|:-----------:|
|Grouping|`(<exp>)`|Expressions|1|None|
|Negation|`!`|Booleans|2|R to L|
|Selector|`.`|Objects|2|L to R|
|Indexer|`[]`|Lists|2|L to R|
|Call|`()`|Functions|2|L to R|
|Pre-Increment|`++<exp>`|Numbers|3|R to L|
|Pre-Decrement|`--<exp>`|Numbers|3|R to L|
|Post-Increment|`<exp>++`|Numbers|3|L to R|
|Post-Decrement|`<exp>++`|Numbers|3|L to R|
|Spread|`...`|Lists|4|R to L|
|Negative|`-`|Numbers|4|R to L|
|Exponentiation|`**`|Numbers|5|None|
|Multiplication|`*`|Numbers|6|None|
|Division|`/`|Numbers|6|None|
|Modulus|`%`|Numbers|6|None|
|Addition|`+`|Numbers|7|None|
|Subtraction|`-`|Numbers|7|None|
|Logical AND|`&&`|Booleans|8|L to R|
|Logical OR|`\|\|`|Booleans|9|L to R|
|Equality|`==`|Nil|10|None|
|Inequality|`!=`|Nil|10|None|
|Less Than|`<`|Numbers|10|None|
|Less Than or Equal|`<=`|Numbers|10|None|
|Greater Than|`>`|Numbers|10|None|
|Greater Than or Equal|`>=`|Numbers|10|None|
|Conditional|`<exp> ? <exp>`|Booleans, Nil|11|R to L|
|Conditional Alt|`<exp> ? <exp> : <exp>`|Booleans, Nil, Nil|11|R to L|

*Note: Primary operational types are displayed above because all types are valid for all operators. The primary operational type is the type an operator will default to if given an uninitialized variable*

## Sample Code

<table>
<tr>
<th>Bang!</th>
<th>javascript</th>
</tr>
<tr>
<td>

```javascript
x = 17
greeting = "hello"
greeting = "bye"
const decayRate = 0.05
```

</td>
<td>

```javascript
function _main() {
  let x = 17
  let greeting = "hello"
  greeting = "bye"
  const decayRate = 0.05
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```cs
firstName = "John"
lastName = "Doe"

print($"Hello, {firstName} {lastName}!")
```

</td>
<td>

```javascript
function _main() {
  let firstName = "John"
  let lastName = "Doe"

  console.log(`Hello, ${firstName} ${lastName}!`)
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```javascript
-2**2
// semantic error
```

</td>
<td>

```javascript
function _main() {
  return -2**2
// syntax error
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```javascript
x++ + 1
// semantic error
```

</td>
<td>

```javascript
function _main() {
  let x = 0
  return x++ + 1
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```javascript
(x++) + 1
```

</td>
<td>

```javascript
function _main() {
  let x = 0
  x++ + 1
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
sum = (x, y) -> { x + y }
sum = (x, y) -> x + y
sum(x, y)
```

</td>
<td>

```javascript
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
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```javascript
5.loop(print("hello world"))
```

</td>
<td>

```javascript
function _main() {
  for (let _ = 0; _ < 5; _++) console.log("hello world")
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```javascript
5.loop(print)
```

</td>
<td>

```javascript
function _main() {
  for (let i = 0; i < 5; i++) console.log(i)
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```javascript
range(5).loop(print)
// prints 0-4 on separate lines

range(1, 6).loop(print)
// prints 1-5 on separate lines
```

</td>
<td>

```javascript
function _main() {
  [...Array(5).keys()].forEach(i => console.log(i))
  // prints 0-4 on separate lines

  [...Array(5).keys()].map(i => i + 1).forEach(i => console.log(i))
  // prints 1-5 on separate lines
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```swift
isValid ? print("valid!")
```

</td>
<td>

```javascript
function _main() {
  let isValid = false
  if (isValid) {
    console.log("valid!")
  }
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```swift
isValid ? print("valid!") : print("invalid!")
```

</td>
<td>

```javascript
function _main() {
  let isValid = false

  if (isValid) {
    console.log("valid!")
  } else {
    console.log("invalid!")
  }
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```swift
x = isValid ? object : print("invalid")

const objectField = x.fieldName
```

</td>
<td>

```javascript
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
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```swift
const isValid = false
x = isValid ? object : print("invalid")
// prints "invalid"

const objectField = x.fieldName
// objectField = nil
```

</td>
<td>

```javascript
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
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```swift
isValid = false
x = isValid
  ? object
  : () -> print("invalid")
x() // prints "invalid"
```

</td>
<td>

```javascript
function _main() {
  let isValid = false
  let x = isValid ? object : () => console.log("invalid")
  x() // prints "invalid"
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```swift
x()
```

</td>
<td>

```javascript
function _main() {
  let x = () => this
  return x()
}

_main()
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```js
const season = { 
  'spring': 'spring', 
  'summer': 'summer', 
  'fall': 'fall',
  'winter': 'winter' 
}

print(season.spring) 
// prints 'spring'
```

</td>
<td>

```javascript
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
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```swift
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
```

</td>
<td>

```javascript
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
```

</td>
</tr>
</table>

Natalie "nat" Lau is a third-year CS student at Loyola Marymount University interested in language scemantics and design, mobile app development, and video game development. Some of her past projects include implementing Linux kernel modules using sockets, and a mobile app companion for the game Breath of the Wild.

Abraham "Abe" Moore Odell is a computer science student at Loyola Marymount University with interests in AI, language design, and game design. Some of his past projects include AI game playing agents, and a video generator.

Aidan Srouji is a third-year CS student at LMU, interested in applying artificial intelligence agents to the field of video game development. Some of his past projects include implementing an automatic speech recognition deep learning model, and creating a text-based multiplayer game run through the Discord platform.

## Code of Conduct

Feel free to add or recommend any features or changes to the language. If you do, please do so with kindness and consideration for all other contributors, users, and people across the globe. "bang!" uses the MIT license.
