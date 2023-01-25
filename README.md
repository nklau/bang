![a logo for the programming language bang!, it is big blue bubble letters with a small cartoon explosion coming from the b](docs/logo.png "Logo")

# Bang!

A compiler for the programming language "bang!"

"Bang!" is a dynamically typed, highly concise language focused on prioritizing the features used in fast coding for interviews and competitions.

## Example

<table>
<tr>
<th>Bang!</th>
<th>javascript</th>
</tr>
<tr>
<td>

```
x = 17
greeting = "hello"
greeting = 'bye'
const decayRate = 0.05
```

</td>
<td>

```javascript
let x = 17
let greeting = "hello"
greeting = 'bye'
const decayRate = 0.05
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
sum = (x, y) -> { x + y }
sum = (x, y) -> x + y
```

</td>
<td>

```javascript
let sum = function (x, y) { return x + y }
let sum = (x, y) => x + y
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
5.times(() -> { print("hello world") })
5.times(() -> print("hello world"))
5.times({ print("hello world") })
5.times(print("hello world"))
```

</td>
<td>

```javascript
for (let _ = 0; _ < 5; _++) console.log("hello world")
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
5.times(i -> { print(i)) })
5.times(i -> print(i))
5.times(print)
```

</td>
<td>

```javascript
for(let i = 0; i < 5; i++) console.log(i)
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
range(5).forEach((i) -> { print(i) })
range(5).forEach((i) -> print(i))
range(5).forEach(print)
// prints 0-4 on separate lines

range(1, 6).forEach(print)
// prints 1-5 on separate lines
```

</td>
<td>

```javascript
// TODO: js equivalent
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
isValid ? print("valid!")
```

</td>
<td>

```javascript
if (isValid) { console.log("valid!") }
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
isValid ? print("valid!") : print("invalid!")
```

</td>
<td>

```javascript
if (isValid) { console.log("valid!") }
else { console.log("invalid!") }
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
optional = isValid
  ? { object }
  : { print("invalid") }
optional = isValid ? object : print("invalid")

const objectField = optional?.fieldName
```

</td>
<td>

```javascript
let optional
if (isValid) { optional = object }
else { console.log("invalid") }
const objectField = optional?.fieldName
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
const isValid = false
optional = isValid ? object : print("invalid")
// prints "invalid"

const objectField = optional?.fieldName
// objectField = nil
```

</td>
<td>

```javascript
const isValid = false
let optional
if (isValid) { optional = object }
else { console.log("invalid") }
// prints "invalid"

const objectField = optional?.fieldName
// objectField is undefined
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
isValid = false
optional = isValid
  ? object
  : () -> print("invalid")
optional?() // prints "invalid"
```

</td>
<td>

```javascript
let isValid = false
let optional = isValid
  ? object
  : () => console.log("invalid")
optional() // prints "invalid"
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
enum Season { spring, summer, fall, winter }
```

</td>
<td>

```javascript
// TODO: js equivalent
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
enum Season { 
  spring = '🌷'
  summer = '☀️'
  fall = '🍁'
  winter = '❄️'
}

print(Season.spring.rawTextVal) 
// prints "🌷"
```

</td>
<td>

```javascript
// TODO: js equivalent
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```
season = Season.spring
result = match season {
  case .spring: "spring!"
  case .summer: { "summer!" }
  case .fall, .winter: {
    str = "is cold!"
    return str
  }
  default: "California!"
}
```

</td>
<td>

```javascript
// TODO: js equivalent
```

</td>
</tr>
</table>

Natalie "nat" Lau is a third-year CS student at Loyola Marymount University interested in language scemantics and design, mobile app development, and video game development. Some of her past projects include implementing Linux kernel modules using sockets, and a mobile app companion for the game Breath of the Wild.

Abraham "Abe" Moore Odell is a computer science student at Loyola Marymount University with interests in AI, language design, and game design. Some of his past projects include AI game playing agents, and a video generator.

Aidan Srouji is a third-year CS student at LMU, interested in applying artificial intelligence agents to the field of video game development. Some of his past projects include implementing an automatic speech recognition deep learning model, and creating a text-based multiplayer game run through the Discord platform.

## Code of Conduct

Feel free to add or recommend any features or changes to the language. If you do, please do so with kindness and consideration for all other contributors, users, and people across the globe. "bang!" uses the MIT license.
