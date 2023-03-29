import * as core from "./core.js"

// object todo list
  // function to get by index (loop that just counts upwards)
  // function to check if has element
  /*
  function has(map, string) {
  let found = false;
  
  map.forEach((val, key) => {
    if (key.equals(string)) {
      found = true;
    }
  })

  return found;
}
  */
 // function to remove element
 /*
 function delete(map, string) {
  let found = false;
  
  map.forEach((val, key) => {
    if (key.equals(string)) {
      found = map.delete(key);
    }
  })

  return found;
}
 */
 // function to remove element at index

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
const add = `const add = (...exps) => {
  const type = strongestType(exps.filter(e => typeof e !== 'string'));
  const addFunc = {
    [List.typeDescription.val]: () => {
      let toSubtract = [];
      let toAdd = [];

      for (let i = 0; i < exps.length; i++) {
        if (typeof exps[i] === 'string') {
          if (exps[i] === '-') {
            if (exps[i + 1].type.equals(List.typeDescription)) {
              // subtracting a list does set difference, but only flattens once
              exps[i + 1].val.forEach(e => toSubtract.push(e));
            } else {
              toSubtract.push(exps[i + 1]);
            }
            i++;
          }

          continue;
        }

        toAdd.push(exps[i]);
      }

      toSubtract.forEach(exp => {
        const index = toAdd.findIndex(e => e.equals(exp));
        if (index > -1) {
          toAdd.splice(index, 1);
        }
      });

      let added = toAdd.reduce((arr, element) => {
        // adding two lists flattens once
        if (element.type.equals(List.typeDescription)) {
          arr = [...arr, ...element.val];
        } else {
          arr.push(element);
        }
        return arr;
      }, []);

      return new List(added);
    },
    [Obj.typeDescription.val]: () => {
      let toSubtract = [];
      let toAdd = [];

      for (let i = 0; i < exps.length; i++) {
        if (typeof exps[i] === 'string') {
          if (exps[i] === '-') {
            if (exps[i + 1].type.equals(Obj.typeDescription)) {
              // subtracting an object does set difference by keys, but only flattens once
              exps[i + 1].val.forEach(([_val, key]) => toSubtract.push(key));
            } else {
              toSubtract.push(exps[i + 1]);
            }
            i++;
          }

          continue;
        }

        toAdd.push(exps[i]);
      }

      toSubtract.forEach(exp => {
        const index = toAdd.findIndex(e => e.equals(exp));
        if (index > -1) {
          toAdd.splice(index, 1);
        }
      });

      let added = toAdd.reduce((map, element) => {
        if (element.type.equals(Obj.typeDescription)) {
          element.val.forEach((val, key) => {
            map.set(key, val);
          })
        } else {
          map.set(coerce(element, Str.typeDescription), element);
        }
        return map;
      }, new Map());

      return new Obj(added);
    },
    [Str.typeDescription.val]: () => {
      let toSubtract = [];
      let toAdd = [];

      for (let i = 0; i < exps.length; i++) {
        if (typeof exps[i] === 'string') {
          if (exps[i] === '-') {
            toSubtract.push(exps[i + 1]);
            i++;
          }

          continue;
        }

        toAdd.push(exps[i]);
      }

      let added = toAdd.reduce((str, substr) => {
        str += coerce(substr, Str.typeDescription).val;
        return str;
      }, '');

      toSubtract.forEach(exp => {
        added = added.replace(coerce(exp, Str.typeDescription).val, '');
      });

      return new Str(added);
    },
    [Num.typeDescription.val]: () => {
      let toSubtract = [];
      let toAdd = [];

      const coerced = exps.map(e => typeof e === 'string' ? e : coerce(e, Num.typeDescription).val);
      for (let i = 0; i < coerced.length; i++) {
        if (typeof coerced[i] === 'string') {
          (coerced[i] === '-' ? toSubtract : toAdd).push(coerced[i + 1]);
          i++;
          continue;
        }

        toAdd.push(coerced[i]);
      }

      let sum = toAdd.reduce((num, e) => num += e, 0);
      return new Num(toSubtract.reduce((num, e) => num -= e, sum));
    },
    [Bool.typeDescription.val]: () => {
      const coerced = exps.map(e => typeof e === 'string' ? e : coerce(e, Bool.typeDescription).val);
      let retVal = false;

      for (let i = 0; i < coerced.length; i++) {
        if (typeof coerced[i] === 'string') {
          if (coerced[i] === '+') {
            retVal = retVal || coerced[i + 1];
          } else {
            retVal = (retVal || coerced[i + 1]) && !(coerced[i] && retVal);
          }

          i++;
          continue;
        }

        retVal = coerced[i] ? coerced[i] : retVal;
      }

      return new Bool(retVal);
    },
    [nil.type.val]: () => nil,
    [Func.typeDescription.val]: () => {
      let toAdd = [];
      let toSubtract = [];
      let params = [];

      for (let i = 0; i < exps.length; i++) {
        if (typeof exps[i] === 'string' && exps[i] === '-') {
          toSubtract.push(exps[i + 1]);
          i++;
          continue;
        } else {
          if (exps[i].type.equals(Func.typeDescription)) {
            params.push(exp.params.val);
          }

          toAdd.push(exps[i]);
        }
      }

      toSubtract.forEach(exp => {
        const index = toAdd.findIndex(e => e.equals(exp));
        if (index > -1) {
          toAdd.splice(index, 1);
        }
      });

      return new Func((...funcParams) => {
        let retVal = []
        let paramIndex = 0;

        toAdd.forEach(exp => {
          if (exp.type.equals(Func.typeDescription)) {
            retVal.push(exp.val(...funcParams[paramIndex]));
          } else {
            retVal.push(exp);
          }
        });

        return add(...retVal);
      }, new List(params));
    }
  }[type.val]

  return addFunc()
}`

const strongestType = `const strongestType = (exps) => {
  const types = [Func.typeDescription, List.typeDescription, Obj.typeDescription, Str.typeDescription, Num.typeDescription, Bool.typeDescription];
  for (let type of types) {
    if (exps.some(e => {
      return e.type.equals(type);
    })) {
      return type;
    }
  }

  return nil.type;
}`

/*
let x = new Num(0)
let y = new Num(5)
[...Array(coerce(y, 'number').val - (coerce(x, 'number')).val).keys().map(i => i + coerce(x, 'number').val)]
*/

const coerce = `const coerce = (exp, targetType) => {
  const targets = {
    [nil.type.val]: () => nil,
    [Bool.typeDescription.val]: e => {
      const eTypes = {
        [nil.type.val]: () => false,
        [Bool.typeDescription.val]: x => x.val,
        [Num.typeDescription.val]: x => x.val !== 0,
        [Str.typeDescription.val]: x => x.val !== '',
        [Obj.typeDescription.val]: x => x.len.val > 0,
        [List.typeDescription.val]: x => x.val.length > 0,
        [Func.typeDescription.val]: x => !(x.params.equals(new List())) || x.block.val !== ''
      }

      return new Bool(eTypes[e.type.val](e))
    },
    [Num.typeDescription.val]: e => {
      const eTypes = {
        [nil.type.val]: () => 0,
        [Bool.typeDescription.val]: x => x.val ? 1 : 0,
        [Num.typeDescription.val]: x => x.val,
        [Str.typeDescription.val]: x => x.val.toString(),
        [Obj.typeDescription.val]: x => x.len.val,
        [List.typeDescription.val]: x => x.len.val,
        [Func.typeDescription.val]: x => x.params.len.val
      }

      return new Num(eTypes[e.type.val](e))
    },
    [Str.typeDescription.val]: e => {
      const eTypes = {
        [nil.type.val]: () => '',
        [Bool.typeDescription.val]: x => x.val.toString(),
        [Num.typeDescription.val]: x => x.val.toString(),
        [Str.typeDescription.val]: x => x.val,
        [Obj.typeDescription.val]: x => {
          if (x.len.val === 0) {
            return '{ }'
          }

          const str = [...(x.val)].reduce((s, [key, value]) => {
            s += \`'\${key.val}\': \${coerce(value, Str.typeDescription).val}, \`;
            return s;
          }, '') 

          return \`{ \${str.slice(0, -2)} }\`
        },
        [List.typeDescription.val]: x => {
          if (x.len.val === 0) {
            return \`[]\`;
          }

          const str = x.val.reduce((s, element) => {
            let e = coerce(element, Str.typeDescription).val;
            if (element.type.equals(Str.typeDescription)) {
              e = \`'\${e}'\`
            }
            s += \`\${e}, \`;
            return s;
          }, '')

          return \`[\${str.slice(0, -2)}]\`
        },
        [Func.typeDescription.val]: x => {
          let str = '() -> ';

          if (x.params.len.val !== 0) {
            str = x.params.val.reduce((s, param) => \`\${s}\${param.id}, \`, '(');
            str = \`\${str.slice(0, -2)}) -> \`;
          }

          str += x.block.val
        }
      }

      return new Str(eTypes[e.type.val](e))
    },
    [Obj.typeDescription.val]: e => {
      const eTypes = {
        [nil.type.val]: () => new Map(),
        [Obj.typeDescription.val]: x => x.val,
        [List.typeDescription.val]: x => x.val.reduce((map, element) => {
          map.set(coerce(element, Str.typeDescription), element)
        }, new Map())
      }

      return new Obj((eTypes[e.type.val] ?? (x => new Map([[coerce(e, Str.typeDescription), x]])))(e))
    },
    [List.typeDescription.val]: e => {
      const eTypes = {
        [nil.type.val]: () => [],
        [Obj.typeDescription.val]: x => [...(x.val)].reduce((list, keyVal) => {
          list.push(new List(keyVal))
        }, []),
        [List.typeDescription.val]: x => x.val
      }

      return new List((eTypes[e.type.val] ?? (x => [x]))(e))
    },
    [Func.typeDescription.val]: e => {
      const eTypes = {
        [nil.type.val]: () => new Func(() => {}),
        [Func.typeDescription.val]: x => x
      }

      return (eTypes[e.type.val] ?? (x => new Func(() => x, new List(), new Str(x.val.toString()))))(e)
    }
  }

  return targets[targetType.val ?? targetType](exp)
}`

// TODO function to convert between types, will get pushed to top of file along with type classes

export const stdLibFuncs = {
  [contents.print]: x => `console.log(${x} === nil ? nil.type.val : coerce(${x}, Str.typeDescription).val)`, // TODO don't think i can call this here, think it has to be called in the file
  [contents.range]: (start, end) => { // TODO are these actually strings? or are they the class objs from below?
    // TODO need to convert (coerce) start and end to nums
    return `[...Array(${end}.val - ${start}.val).keys().map(i => i + ${start}.val)]`
  },
}

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
    return this.type.val === other.type.val && this.val === other.val;
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

  reverse() {
    let reversed = new Map();
    this.val = Array.from(this.val).reverse().reduce((map, [key, val]) => map.set(key, val), new Map());
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
  static typeDescription = new Str('function');

  constructor(val, params = new List()) {
    this.val = val;
    this.params = params;
  }

  equals(other) {
    return this.type.equals(other.type) && this.val.toString() === other.val.toString();
  }

  get len() {
    return new Num(this.val.length);
  }

  get default() {
    return new Func(() => {});
  }

  get block() {
    return this.val.toString().substring(this.val.toString().indexOf('=>') + 2);
  }

  get type() {
    return Func.typeDescription;
  }

  get str() {
    return new Str(\`\${this.val.toString().replaceAll('=', '-')}\`);
  }
}`

export const types = [str, nil, bool, num, obj, list, func]
export const stdFuncs = [strongestType, coerce, add]