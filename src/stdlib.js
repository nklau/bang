import * as core from "./core.js"

export const contents = Object.freeze({
  print: new core.Var('print', false, true, ['function']),
  range: new core.Var('range', false, true, ['function']),
  // _numLoop: new core.Var('loop', false, true, ['function']),
  // _boolLoop: new core.Var('loop', false, true, ['function']),
  // _strLoop: new core.Var('loop', false, true, ['function']),
  // _listLoop: new core.Var('loop', false, true, ['function']),
  // _objLoop: new core.Var('loop', false, true, ['function']),
  // _numAdd: new core.Var('add', false, true, ['function']),
  // _boolAdd: new core.Var('add', false, true, ['function']),
  // _strConcat: new core.Var('add', false, true, ['function']),
  // _listConcat: new core.Var('add', false, true, ['function']),
  // _objMerge: new core.Var('add', false, true, ['function']),
})

// also does subtraction
// const add = 

/*
let x = new Num(0)
let y = new Num(5)
[...Array(coerce(y, 'number').val - (coerce(x, 'number')).val).keys().map(i => i + coerce(x, 'number').val)]
*/

const coerce = `const coerce = (exp, targetType) => {
  const targets = {
    nil: () => nil,
    boolean: e => {
      const eTypes = {
        nil: () => false,
        boolean: x => x.val,
        number: x => x.val !== 0,
        string: x => x.val !== '',
        object: x => x.len.val > 0,
        list: x => x.val.length > 0,
        function: x => !(x.params.equals(new List())) || x.block.val !== ''
      }

      return new Bool(eTypes[e.type](e))
    },
    number: e => {
      const eTypes = {
        nil: () => 0,
        boolean: x => x.val ? 1 : 0,
        number: x => x.val,
        string: x => x.val.toString(),
        object: x => x.len.val,
        list: x => x.len.val,
        function: x => x.params.len.val
      }

      return new Num(eTypes[e.type](e))
    },
    string: e => {
      const eTypes = {
        nil: () => '',
        boolean: x => x.val.toString(),
        number: x => x.val.toString(),
        string: x => x.val,
        object: x => {
          if (x.len.val === 0) {
            return '{ }'
          }

          const str = [...(x.val)].reduce((s, [key, value]) => {
            s += \`'\${key.val}\': \${coerce(value, 'string').val}\`
          }, '') 

          return \`{ \${str.slice(0, -2)} }\`
        },
        list: x => {
          if (x.len.val === 0) {
            return \`[]\`
          }

          const str = x.val.reduce((s, element) => {
            s += \`\${coerce(element, 'string')}, \`
          }, '')

          return \`[\${str.slice(0, -2)}]\`
        },
        function: x => {
          let str = '() -> '

          if (x.params.len.val !== 0) {
            str = x.params.val.reduce((s, param) => {
              s += \`\${param.id}, \`
            }, '(')

            str = \`\${str.slice(0, -2)}) -> \`
          }

          str += x.block.val
        }
      }

      return new Str(eTypes[e.type](e))
    },
    object: e => {
      const eTypes = {
        nil: () => new Map(),
        object: x => x.val,
        list: x => x.val.reduce((map, element) => {
          map.set(coerce(element, 'string'), element)
        }, new Map())
      }

      return new Obj((eTypes[e.type] ?? (x => new Map([[coerce(e, 'string'), x]])))(e))
    },
    list: e => {
      const eTypes = {
        nil: () => [],
        object: x => [...(x.val)].reduce((list, keyVal) => {
          list.push(new List(keyVal))
        }, []),
        list: x => x.val
      }

      return new List((eTypes[e.type] ?? (x => [x]))(e))
    },
    function: e => {
      const eTypes = {
        nil: () => new Func(() => {}),
        function: x => x
      }

      return (eTypes[e.type] ?? (x => new Func(() => x, new List(), new Str(x.val.toString()))))(e)
    }
  }

  return targets[targetType.val ?? targetType](exp)
}`

// TODO function to convert between types, will get pushed to top of file along with type classes

export const stdLibFuncs = {
  [contents.print]: x => `console.log(${stdLibFuncs.string(x)})`, // TODO don't think i can call this here, think it has to be called in the file
  [contents.range]: (start, end) => { // TODO are these actually strings? or are they the class objs from below?
    // TODO need to convert (coerce) start and end to nums
    return `[...Array(${end}.val - ${start}.val).keys().map(i => i + ${start}.val)]`
  },
  // nil: () => `nil`,
  // boolean: x => {
  //   return `new Bool(${{
  //     nil: false,
  //     boolean: x.val,
  //     number: x.val !== 0,
  //     string: x.val !== '',
  //     object: x.val.length > 0,
  //     list: x.val.length > 0,
  //     function: x.params.params.length > 0 && x.block.statements.length > 0
  //   }[x.type]})`
  // },
  // number: x => {
  //   return `new Num(${{
  //     nil: 0,
  //     boolean: x.val ? 1 : 0,
  //     number: x.val,
  //     string: x.val.length,
  //     object: x.val.length,
  //     list: x.val.length,
  //     function: x.params.params.length
  //   }[x.type]})`
  // },
  // string: x => {
  //   return `new Str(${({
  //     nil: () => '',
  //     boolean: x => x.val.toString(),
  //     number: x => x.val.toString(),
  //     string: x => x.val,
  //     object: _toStrRec,
  //     list: _toStrRec,
  //     function: _convertFunc
  //   }[x.type])(x)})`
  // },
  // object: x => {
  //   const key = stdFuncs.string(x)

  //   return `new Obj(${{
  //     nil: `{}`,
  //     object: `{ [${key}]: ${_toStrRec(x)} }`,
  //   }[x.type] ?? `{ [${key}]: ${stdFuncs[x.type](x)} }`})`
  // },
  // list: x => {
  //   const converted = stdFuncs[x.type](x)

  //   return `new List(${{
  //     nil: `[]`,
  //     boolean: `[${converted}]`,
  //     number: `[${converted}]`,
  //     string: `[${converted}]`,
  //     object: `[${converted}]`,
  //     list: ``
  //   }[x.type]})`
  // } // i might be overcomplicating this? am i supposed to assume all objs are the core ones or the ones pushed to the compiled js file?
  // // p sure they're actually supposed to be the ones in the compiled file (from the stdlib, not core)
}

/*

let x = new List([])
x.list -> stdlib.stdFuncs[list](x)

*/

// const _toStrRec = e => {
//   if (e instanceof core.Obj) {
//     let str = ''

//     e.val.forEach(field => {
//       str += `${field.key.val}: ${stdFuncs.str(field.val)}, `
//     })

//     return `{ ${str.slice(0, -2)} }`
//   } else if (e instanceof core.List) {
//     let str = ''

//     e.val.forEach(v => {
//       str += `${stdFuncs.str(v)}, `
//     })

//     return `[${str.slice(0, -2)}]`
//   } else {
//     return stdFuncs.str(e)
//   }
// }

// const _convertFunc = e => {
//   if (!(e instanceof core.Func)) { return e }

//   let str = '('

//   e.params.params.forEach(p => {
//     str += `${p.id}, `
//   })

//   return str.slice(0, -2) + `) -> {\n${util.format(e.block)}\n}`
// }

const nil = 
`const nil = Object.freeze({
  type: new Str('nil'),
  equals: other => this.type.equals(other.type)
});`

const bool =
`class Bool {
  static typeDescription = new Str('boolean');

  constructor(val = false) {
    this.val = val === 'true' || val === true || (val instanceof Bool && val.val);
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    return this.type.equals(other.type) && this.val === other.val;
  }

  get type() {
    return Bool.typeDescription;
  }

  get str() {
    return new Str(this.val.toString());
  }
}`

const num = 
`class Num {
  static typeDescription = new Str('number');

  constructor(val = 0) {
    this.val = val;
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    return this.type.equals(other.type) && this.val === other.val;
  }

  get type() {
    return Num.typeDescription;
  }

  get str() {
    return new Str(this.val.toString());
  }
}`

const str = 
`export class Str {
  static typeDescription = new Str('string');

  constructor(val = '') {
    this.val = val;
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    return this.type.equals(other.type) && this.val === other.val;
  }

  get len() {
    return new Num(this.val.length);
  }

  get default() {
    return new Str();
  }

  get type() {
    return Str.typeDescription;
  }

  get str() {
    return this;
  }
}`

const obj = 
`class Obj {
  static typeDescription = new Str('object');

  constructor(val = new Map()) {
    this.val = val;
  }

  loop(block) {
    // TODO
  }

  getVal(key) {
    return this.val(coerce(key, 'string').val);
  }

  equals(other) {
    if (!this.type.equals(other.type) || !this.keys().equals(other.keys()) ) { return new Bool(false); }

    this.val.forEach((value, key) => {
      if (!value.equals(other.getVal(key))) { return new Bool(false); }
    })

    return new Bool(true);
  }

  get len() {
    return new Num(this.val.size);
  }

  get default() {
    return new Obj();
  }

  get type() {
    return Obj.typeDescription;
  }

  get str() {
    if (this.len === 0) {
      return new Str('{}');
    }

    let str = '';
    this.val.forEach((val, key) => {
      str += \`\${coerce(key, 'string')}: \${coerce(val, 'string')}, \`;
    })

    return new Str(\`\${str.slice(0, -2)}\`);
  }

  keys() {
    return new List([...this.val.keys()]);
  }

  vals() {
    return new List([...this.val.values()]);
  }
}`
// TODO all type coercions to all other types using getters
const list =
`class List {
  static typeDescription = new Str('list');

  constructor(val = []) {
    this.val = val;
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    return this.type.equals(other.type) && this.len.equals(other.len) && this.val.every((value, index) => value === other.val[index]);
  }

  get len() {
    return new Num(this.val.length);
  }

  get default() {
    return new List();
  }

  get type() {
    return List.typeDescription;
  }

  get str() {
    if (this.val.length === 0) {
      return new Str('[]');
    }

    const str = this.val.reduce((str, element) => {
      str += \`\${element.str()}, \`;
    }, '');
    return new Str(\`[\${str.slice(0, -2)}]\`);
  }
}`

const func =
`class Func {
  static typeDescription = 'function';

  constructor(val, params = new List(), block = new Str()) {
    this.val = val;
    this.params = params;
    this.block = block;
  }

  equals(other) {
    return this.type.equals(other.type) && this.params.equals(other.params) && this.block.equals(other.block);
  }

  get len() {
    return new Num(this.val.length);
  }

  get default() {
    return new Func(() => {});
  }

  get type() {
    return Func.typeDescription;
  }

  get str() {
    return new Str(\`\${this.val.toString().replaceAll('=', '-')}\`);
  }
}`

export const types = [nil, bool, num, str, obj, list, func]
export const stdFuncs = [coerce]