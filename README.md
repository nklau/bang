![a logo for the programming language bang!, it is big blue bubble letters with a small cartoon explosion coming from the b](docs/logo.png "Logo")

# Bang!

A compiler for the programming language "bang!"

"Bang!" is a dynamically typed, highly concise language focused on prioritizing the features used in fast coding for interviews and competitions.

## Example

| Bang!                                                                                                                                                                                                                                                        | javascript                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <pre>`x = 17`<br>`greeting = "hello"`<br>`greeting = 'bye'`<br>`const decayRate = 0.05`</pre> | <pre>`let x = 17`<br>`let greeting = "hello"`<br>`greeting = 'bye'`<br>`const decayRate = 0.05`</pre>
| <pre>`sum = (x, y) -> { x + y }`<br>`sum = (x, y) -> x + y`</pre> | <pre>`let sum = function (x, y) { return x + y }`<br>`let sum = (x, y) => x + y`</pre> 
| <pre>`5.times(() -> { print("hello world") })`<br>`5.times(() -> print("hello world"))`<br>`5.times({ print("hello world") })`<br>`5.times(print("hello world"))`</pre> | <pre>`for (let _ = 0; _ < 5; _++) console.log("hello world")`</pre>
| <pre>`5.times(i -> { print(i)) })`<br>`5.times(i -> print(i))`<br>`5.times(print)`</pre> | <pre>`for(let i = 0; i < 5; i++) console.log(i)`</pre>
| <pre>`range(5).forEach((i) -> { print(i) })`<br>`range(5).forEach((i) -> print(i))`<br>`range(5).forEach(print)`<br>`// prints 0-4 on separate lines`<br>`range(1, 6).forEach(print)`<br>`// prints 1-5 on separate lines`</pre> | <pre>`// TODO: js equivalent`</pre>
| <pre>`isValid ? print("valid!")`</pre> | <pre>`if (isValid) { console.log("valid!") }`</pre>
| <pre>`isValid ? print("valid!") : print("invalid!")`</pre> | <pre>`if (isValid) { console.log("valid!") }`<br>`else { console.log("invalid!") }`</pre>
| <pre>`optional = isValid`<br>`  ? { return object }`<br>`  : { print("invalid") }`<br><br>`optional = isValid`<br>`  ? { object }`<br>`  : { print("invalid") }`<br><br>`optional = isValid ? object : print("invalid")`<br>`const objectField = optional?.fieldName`<br></pre> | <pre>`let optional`<br>`if (isValid) { optional = object }`<br>`else { console.log("invalid") }`<br>`const objectField = optional?.fieldName`</pre>
| <pre>`const isValid = false`<br>`optional = isValid ? object : print("invalid")`<br>`// prints "invalid"`<br><br>`const objectField = optional?.fieldName`<br>`// objectField = nil`</pre> | <pre>`const isValid = false`<br>`let optional`<br>`if (isValid) { optional = object }`<br>`else { console.log("invalid") }`<br>`const objectField = optional?.fieldName`<br>`// objectField is undefined`</pre>
| <pre>`isValid = false`<br>`optional = isValid`<br>`  ? object`<br>`  : () -> print("invalid")`<br>`optional?() // prints "invalid"`</pre> | <pre>`let isValid = false`<br>`let optional = isValid`<br>`  ? object`<br>`  : () => console.log("invalid")`<br>`optional() // prints "invalid"`</pre>
| <pre>`enum Season { spring, summer, fall, winter }`</pre> | <pre>`// TODO js equivalent`</pre>
| <pre>`enum Season { `<br>`  spring = '🌷'`<br>`  summer = '☀️'`<br>`  fall = '🍁'`<br>`  winter = '❄️'`<br>`}`<br>`print(Season.spring.rawTextVal) // prints "🌷"`</pre> | <pre>`// TODO: js equivalent`</pre>
| <pre>`season = Season.spring`<br>`result = match season {`<br>`  case .spring: "spring!"`<br>`  case .summer: { "summer!" }`<br>`  case .fall, .winter: {`<br>`    str = "is cold!"`<br>`    return str`<br>`  }`<br>`  default: "California!"`<br>`}`</pre> | <pre>`// TODO: js equivalent`</pre>

Natalie "nat" Lau is a third-year CS student at Loyola Marymount University interested in language scemantics and design, mobile app development, and video game development. Some of her past projects include implementing Linux kernel modules using sockets, and a mobile app companion for the game Breath of the Wild.

Abraham "Abe" Moore Odell is a computer science student at Loyola Marymount University with interests in AI, language design, and game design. Some of his past projects include AI game playing agents, and a video generator.

Aidan Srouji is a third-year CS student at LMU, interested in applying artificial intelligence agents to the field of video game development. Some of his past projects include implementing an automatic speech recognition deep learning model, and creating a text-based multiplayer game run through the Discord platform.

## Code of Conduct

Feel free to add or recommend any features or changes to the language. If you do, please do so with kindness and consideration for all other contributors, users, and people across the globe. "bang!" uses the MIT license.
