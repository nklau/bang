import * as core from './core.js'

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

        if (exps[i].type.equals(List.typeDescription)) {
          exps[i].val.forEach(e => toAdd.push(e));
        } else {
          toAdd.push(exps[i]);
        }
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

// multiply, divide, modulus
const multiply = `const multiply = (...exps) => {
  const type = strongestType(exps.filter((e) => typeof e !== 'string'));
  const multiplyFunc = {
    [List.typeDescription.val]: () => {
      let product = exps[0].type.equals(Obj.typeDescription)
        ? exps[0].keys()
        : exps[0];

      for (let i = 0; i < exps.length - 1; i += 2) {
        const [left, right] = [product, exps[i + 2].type.equals(Obj.typeDescription)
          ? exps[i + 2].keys()
          : exps[i + 2]];
        product = {
          '*': () => {
            if (left.type.equals(List.typeDescription)) {
              return (
                {
                  // right should never be an object
                  [List.typeDescription.val]: () => {
                    return new List([...left.val, right]);
                  },
                  [Bool.typeDescription.val]: () => {
                    return right.val ? left : new List();
                  },
                  [nil.type.val]: () => {
                    return new List();
                  },
                }[right.type.val] ??
                (() => {
                  return new List(product.val.map(e => multiply(e, '*', right)));
                })
              )();
            }

            if (right.type.equals(List.typeDescription)) {
              return (
                {
                  // designed to get here only if left is not a list
                  // left should also never be an object
                  [Bool.typeDescription.val]: () => {
                    return left.val ? right : new List();
                  },
                  [nil.type.val]: () => {
                    return new List();
                  },
                }[left.type.val] ??
                (() => {
                  return new List(right.val.map(e => multiply(product, '*', e)));
                })
              )();
            }

            return multiply(left, '*', right);
          },
          '/': () => {
            if (!left.type.equals(List.typeDescription)) {
              left = coerce(left, List.typeDescription);
            }
            if (!right.type.equals(List.typeDescription)) {
              right = coerce(right, List.typeDescription);
            }

            left.val = left.val.filter(
              (lhs) => !right.val.some((rhs) => lhs.equals(rhs))
            );
            return left;
          },
          '%': () => {
            if (!left.type.equals(List.typeDescription)) {
              left = coerce(left, List.typeDescription);
            }
            if (!right.type.equals(List.typeDescription)) {
              right = coerce(right, List.typeDescription);
            }

            left.val = left.val.filter((lhs) =>
              right.val.some((rhs) => lhs.equals(rhs))
            );
            return left;
          },
        }[exps[i + 1]]();
      }

      return product;
    },
    [Obj.typeDescription.val]: () => {
      let product = new Map();
      for (let i = 0; i < exps.length - 1; i += 2) {
        let [left, right] = [exps[i], exps[i + 2]];
        ({
          '*': () => {
            ({
              [Obj.typeDescription.val]: () => {
                ((
                  {
                    // [Obj.typeDescription.val]: () => {
                    //   // TODO this might duplicate the middle object in a chained multiplication with all objs
                    //   product.set(product.size.toString(), left);
                    //   product.set(product.size.toString(), right);
                    // },
                    [Num.typeDescription.val]: () => {
                      if (right.val === 0) {
                        product = new Map();
                      } else {
                        left.val.forEach((val, key) => {
                          product.set(key, val);
                        });

                        product.forEach((val, key) => {
                          product.set(key, multiply(right, '*', val));
                        });
                      }
                    },
                    [Bool.typeDescription.val]: () => {
                      if (!right.val) {
                        product = new Map();
                      } else {
                        left.val.forEach((val, key) => {
                          product.set(key, val);
                        });
                      }
                    },
                    [nil.type.val]: () => {
                      product = new Map();
                    },
                  }[right.type.val] ??
                  (() => {
                    product.forEach((val, key) => {
                      product.set(key, multiply(val, '*', right));
                    });
                  })
                )());
              },
              [Str.typeDescription.val]: () => {
                ({
                  [Obj.typeDescription.val]: () => {
                    right.val.forEach((val, key) => {
                      product.set(key, val);
                    });
                    product.forEach((val, key) => {
                      product.set(key, multiply(left, '*', val));
                    });
                  }
                }[right.type.val])();
              },
              [Num.typeDescription.val]: () => {
                if (right.type.equals(Obj.typeDescription)) {
                  if (left.val === 0) {
                    product = new Map();
                  } else {
                    right.val.forEach((val, key) => {
                      product.set(key, val);
                    });
  
                    product.forEach((val, key) => {
                      product.set(key, multiply(left, '*', val));
                    });
                  }
                }
              },
              [Bool.typeDescription.val]: () => {
                if (!left.val) {
                  product = new Map();
                } else {
                  right.val.forEach((val, key) => {
                    product.set(key, val);
                  });
                }
              },
              [nil.type.val]: () => {
                product = new Map();
              },
            }[left.type.val]());
          },
          '/': () => {
            const rightOp =
              {
                [Obj.typeDescription.val]: (lhs, rhs) => {
                  rhs.val.forEach((_val, key) => {
                    lhs.val.delete(key);
                  });
                },
                [Str.typeDescription.val]: (lhs, rhs) => {
                  lhs.val.delete(rhs.val);
                },
                [nil.type.val]: (_lhs, _rhs) => {},
              }[right.type.val] ??
              ((lhs, rhs) => {
                lhs.val.delete(rhs.val.toString());
              });
            ({
              [Obj.typeDescription.val]: () => {
                rightOp(left, right);
              },
              [nil.type.val]: () => {},
            }[left.type.val] ??
              (() => {
                rightOp(coerce(left, Obj.typeDescription), right);
              })());
          },
          '%': () => {
            const rightOp =
              {
                [Obj.typeDescription.val]: (lhs, rhs) => {
                  lhs.val.forEach((_val, key) => {
                    if (!rhs.val.has(key)) {
                      lhs.val.delete(key);
                    }
                  });
                },
                [Str.typeDescription.val]: (lhs, rhs) => {
                  let val = lhs.val.get(rhs.val);
                  lhs.val.clear();
                  if (val) {
                    lhs.val.set(rhs.val, val);
                  }
                },
                [nil.type.val]: (_lhs, _rhs) => {},
              }[right.type.val] ??
              ((lhs, rhs) => {
                let val = lhs.val.get(rhs.val.toString());
                lhs.val.clear();
                if (val) {
                  lhs.val.set(rhs.val.toString(), val);
                }
              });
            ({
              [Obj.typeDescription.val]: () => {
                rightOp(left, right);
              },
              [nil.type.val]: () => {},
            }[left.type.val] ??
              (() => {
                rightOp(coerce(left, Obj.typeDescription), right);
              })());
          },
        }[exps[i + 1]]());
      }

      return new Obj(product);
    },
    [Str.typeDescription.val]: () => {
      let product = exps[0];

      for (let i = 0; i < exps.length - 1; i += 2) {
        let [left, right] = [product, exps[i + 2]];
        product = {
          '*': () => {
            return {
              [Str.typeDescription.val]: () => {
                return {
                  [Str.typeDescription.val]: () => {
                    return new Str(left.val + right.val);
                  },
                  [Num.typeDescription.val]: () => {
                    let result = '';
                    for (let j = 0; j < Math.round(right.val); j++) {
                      result += left.val;
                    }
                    return new Str(result);
                  },
                  [Bool.typeDescription.val]: () => {
                    return right.val ? left : new Str();
                  },
                  [nil.type.val]: () => {
                    return new Str();
                  },
                }[right.type.val]();
              },
              [Num.typeDescription.val]: () => {
                return {
                  [Str.typeDescription.val]: () => {
                    let result = '';
                    for (let j = 0; j < Math.round(left.val); j++) {
                      result += right.val;
                    }
                    return new Str(result);
                  },
                  [Num.typeDescription.val]: () => {
                    return new Num(left.val * right.val);
                  },
                  [Bool.typeDescription.val]: () => {
                    return right.val ? left : new Num();
                  },
                  [nil.type.val]: () => {
                    return new Num();
                  },
                }[right.type.val]();
              },
              [Bool.typeDescription.val]: () => {
                return {
                  [Str.typeDescription.val]: () => {
                    return left.val ? right : new Str();
                  },
                  [Num.typeDescription.val]: () => {
                    return left.val ? right : new Num();
                  },
                  [Bool.typeDescription.val]: () => {
                    return new Bool(left.val && right.val);
                  },
                  [nil.type.val]: () => {
                    return new Bool();
                  },
                }[right.type.val]();
              },
              [nil.type.val]: () => {
                return new right.constructor();
              },
            }[left.type.val]();
          },
          '/': () => {
            const recurse = () => {
              return multiply(left, '/', right);
            };
            return {
              [Str.typeDescription.val]: () => {
                return (
                  {
                    [Str.typeDescription.val]: () => {
                      return new Str(left.val.replaceAll(right.val, ''));
                    },
                    [nil.type.val]: () => {
                      return left;
                    },
                  }[right.type.val] ??
                  (() => {
                    return new Str(
                      left.val.replaceAll(right.val.toString(), '')
                    );
                  })
                )();
              },
              [Num.typeDescription.val]: () => {
                return (
                  {
                    [Str.typeDescription.val]: () => {
                      return new Str(
                        left.val.toString().replaceAll(right.val, '')
                      );
                    },
                  }[right.type.val] ?? recurse
                )();
              },
              [Bool.typeDescription.val]: () => {
                return (
                  {
                    [Str.typeDescription.val]: () => {
                      return new Str(
                        left.val.toString().replaceAll(right.val, '')
                      );
                    },
                  }[right.type.val] ?? recurse
                )();
              },
              [nil.type.val]: () => {
                return new right.constructor();
              },
            }[left.type.val]();
          },
          '%': () => {
            const recurse = () => {
              return multiply(left, '%', right);
            };

            return (
              {
                [Str.typeDescription.val]: () => {
                  return (
                    {
                      [Str.typeDescription.val]: () => {
                        return new Str(
                          left.val.match(new RegExp(right.val, 'g')) || []
                        ).join('');
                      },
                      [nil.type.val]: () => {
                        return new Str();
                      },
                    }[right.type.val] ??
                    (() => {
                      return new Str(
                        left.val.match(new RegExp(right.val.toString(), 'g')) ||
                          []
                      ).join('');
                    })
                  )();
                },
                [Num.typeDescription.val]: () => {
                  return (
                    {
                      [Str.typeDescription.val]: () => {
                        return new Str(
                          right.val
                            .toString()
                            .match(new RegExp(right.val, 'g')) || []
                        ).join('');
                      },
                    }[right.type.val] ?? recurse
                  )();
                },
                [Bool.typeDescription.val]: () => {
                  return (
                    {
                      [Str.typeDescription.val]: () => {
                        return new Str(
                          right.val
                            .toString()
                            .match(new RegExp(right.val, 'g')) || []
                        ).join('');
                      },
                    }[right.type.val] ?? recurse
                  )();
                },
                [nil.type.val]: () => {
                  return new right.constructor();
                },
              }[left.type.val] ?? recurse
            )();
          },
        }[exps[i + 1]]();
      }
      return product;
    },
    [Num.typeDescription.val]: () => {
      let product = exps[0];
      for (let i = 0; i < exps.length - 1; i += 2) {
        const [left, right] = [product, exps[i + 2]];
        product = {
          '*': () => {
            const recurse = () => {
              return multiply(left, '*', right);
            };
            return {
              [Num.typeDescription.val]: () => {
                return {
                  [Num.typeDescription.val]: () => {
                    return new Num(left.val * right.val);
                  },
                  [Bool.typeDescription.val]: () => {
                    return right.val ? left : new Num();
                  },
                  [nil.type.val]: () => {
                    return new Num();
                  },
                }[right.type.val]();
              },
              [Bool.typeDescription.val]: () => {
                return (
                  {
                    [Num.typeDescription.val]: () => {
                      return left.val ? right : new Num();
                    },
                  }[right.type.val] ?? recurse
                )();
              },
              [nil.type.val]: () => {
                return new right.constructor();
              },
            }[left.type.val]();
          },
          '/': () => {
            const recurse = () => {
              return multiply(left, '/', right);
            };
            return {
              [Num.typeDescription.val]: () => {
                return {
                  [Num.typeDescription.val]: () => {
                    return new Num(left.val / right.val);
                  },
                  [Bool.typeDescription.val]: () => {
                    return right.val ? left : Num.inf;
                  },
                  [nil.type.val]: () => {
                    return Num.inf;
                  },
                }[right.type.val]();
              },
              [Bool.typeDescription.val]: () => {
                return (
                  {
                    [Num.typeDescription.val]: () => {
                      return new Num((left.val ? 1 : 0) / right.val);
                    },
                  }[right.type.val] ?? recurse
                )();
              },
              [nil.type.val]: () => {
                return new right.constructor();
              },
            }[left.type.val]();
          },
          '%': () => {
            const recurse = () => {
              return multiply(left, '%', right);
            };
            return {
              [Num.typeDescription.val]: () => {
                return {
                  [Num.typeDescription.val]: () => {
                    return new Num(left.val % right.val);
                  },
                  [Bool.typeDescription.val]: () => {
                    return new Num(left.val % (right.val ? 1 : 0));
                  },
                  [nil.type.val]: () => {
                    return left;
                  },
                }[right.type.val]();
              },
              [Bool.typeDescription.val]: () => {
                return (
                  {
                    [Num.typeDescription.val]: () => {
                      return new Num(left.val ? 1 : 0);
                    },
                  }[right.type.val] ?? recurse
                )();
              },
              [nil.type.val]: () => {
                return nil;
              },
            }[left.type.val]();
          },
        }[exps[i + 1]]();
      }

      return product;
    },
    [Bool.typeDescription.val]: () => {
      let product = exps[0];
      for (let i = 0; i < exps.length - 1; i += 2) {
        const [left, right] = [product, exps[i + 2]];
        product = {
          '*': () => {
            return {
              [Bool.typeDescription.val]: () => {
                return {
                  [Bool.typeDescription.val]: () => {
                    return new Bool(left.val && right.val);
                  },
                  [nil.type.val]: () => {
                    return new Bool();
                  },
                }[right.type.val]();
              },
              [nil.type.val]: () => {
                return new Bool();
              },
            }[left.type.val]();
          },
          '/': () => {
            return {
              [Bool.typeDescription.val]: () => {
                return {
                  [Bool.typeDescription.val]: () => {
                    return new Bool(!(left.val || right.val));
                  },
                  [nil.type.val]: () => {
                    return new Bool(!left.val);
                  },
                }[right.type.val]();
              },
              [nil.type.val]: () => {
                return {
                  [Bool.typeDescription.val]: () => {
                    return new Bool(!right.val);
                  },
                  [nil.type.val]: () => {
                    return nil;
                  },
                }[right.type.val]();
              },
            }[left.type.val]();
          },
          '%': () => {
            return {
              [Bool.typeDescription.val]: () => {
                return {
                  [Bool.typeDescription.val]: () => {
                    return new Bool(left.val === right.val);
                  },
                  [nil.type.val]: () => {
                    return new Bool(!left.val);
                  },
                }[right.type.val]();
              },
              [nil.type.val]: () => {
                return {
                  [Bool.typeDescription.val]: () => {
                    return new Bool(!right.val);
                  },
                  [nil.type.val]: () => {
                    return nil;
                  },
                }[right.type.val]();
              },
            }[left.type.val]();
          },
        }[exps[i + 1]]();
      }

      return product;
    },
    [nil.type.val]: () => nil,
    [Func.typeDescription.val]: () => {
      // TODO func wrapper
      throw new Error('unimplemented multiplicative operation on a function literal');
    },
  }[type.val];

  return multiplyFunc();
};`

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
            const val = value.type.equals(Str.typeDescription) ? \`'\${value.val}'\` : coerce(value, Str.typeDescription).val
            s += \`'\${key.val ?? key}\': \${val}, \`;
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

const subscript = `const subscript = (target, selector) => {
  // TODO selector might have : syntax instead of a single element
  const subscriptFunc = {
    [Func.typeDescription.val]: () => {
      // TODO
    },
    [List.typeDescription.val]: () => {
      // TODO check if selector is instanceof core.Subscription
      return target.val[coerce(selector, Num.typeDescription).val] ?? nil;
    },
    [Obj.typeDescription.val]: () => {
      // TODO check if selector is instanceof core.Subscription
      return target.getVal(selector);
    },
    [Str.typeDescription.val]: () => {
      // TODO check if selector is instanceof core.Subscription
      // TODO acts like a list
    },
    [Num.typeDescription.val]: () => {
      // TODO check if selector is instanceof core.Subscription
      // TODO metadata access (ie even, odd, positive, negative, hasDecimal, etc)
    },
    [Bool.typeDescription.val]: () => {
      // TODO check if selector is instanceof core.Subscription
      // TODO same as num
    },
    [nil.type.val]: () => {
      return nil;
    }
  }[target.type.val];

  return subscriptFunc();
}`

const print = `const print = exp => {
  let _internal0 = exp;
  console.log(_internal0 === nil ? nil.type.val : coerce(_internal0, Str.typeDescription).val);
}`

// TODO function to convert between types, will get pushed to top of file along with type classes

export const stdLibFuncs = {
  [contents.print]: (x) => `print(${x})`,
  [contents.range]: (start, end) => {
    // TODO are these actually strings? or are they the class objs from below?
    // TODO need to convert (coerce) start and end to nums
    return `[...Array(${end}.val - ${start}.val).keys().map(i => i + ${start}.val)]`
  },
}

const nil = `const nil = Object.freeze({
  type: new Str('nil'),
  equals: other => this.type.equals(other.type)
});`

const bool = `class Bool {
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

const num = `class Num {
  static typeDescription = new Str('number');
  static inf = new Num(Infinity);

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

const str = `export class Str {
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

const obj = `class Obj {
  static typeDescription = new Str('object');

  constructor(val = new Map()) {
    this.val = val;
  }

  loop(block) {
    // TODO
  }

  getVal(key) {
    return this.val.get(typeof key === 'string' ? key : coerce(key, Str.typeDescription).val) ?? nil;
  }

  equals(other) {
    if (!this.type.equals(other.type) || !this.keys().equals(other.keys()) ) { return false; }

    let equal = true;

    this.val.forEach((value, key) => {
      if (!value.equals(other.getVal(key))) { equal = false; }
    })

    return equal;
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
    return new List([...this.val.keys()].map(key => new Str(key)));
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
const list = `class List {
  static typeDescription = new Str('list');

  constructor(val = []) {
    this.val = val;
  }

  loop(block) {
    // TODO
  }

  equals(other) {
    return this.type.equals(other.type) && this.len.equals(other.len) && this.val.every((value, index) => value.equals(other.val[index]));
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

const func = `class Func {
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
export const stdFuncs = [strongestType, coerce, add, multiply, subscript, print]
