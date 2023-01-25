export class Program {
  constructor(statements) {
    this.statements = statements
  }
}

export class VariableDeclaration {
  constructor(name, value) {
    Object.assign(this, { name, value })
  }
}

export class FunctionDeclaration {
  constructor(params, body) {
    Object.assign(this, { params, body })
  }
}

// TODO: is this needed? think this belongs to number class
export class Repeat {
  constructor(times, body) {
    Object.assign(this, { times, body })
  }
}

// TODO: is this needed?
export class Assignment {
  constructor(target, source) {
    Object.assign(this, { target, source })
  }
}

export class PrintStatement {
  constructor(expression) {
    Object.assign(this, { expression })
  }
}

export class Call {
  constructor(callee, args) {
    Object.assign(this, { callee, args })
  }
}

export class Conditional {
  constructor(condition, consequent, alternate) {
    Object.assign(this, { condition, consequent, alternate })
  }
}

export class BinaryExpression {
  constructor(op, left, right) {
    Object.assign(this, { op, left, right })
  }
}

export class UnaryExpression {
  constructor(op, operand) {
    Object.assign(this, { op, operand })
  }
}

export class Variable {
  constructor(name, constant) {
    Object.assign(this, { name, constant })
  }
}

export class Function {
  constructor(name, numParams, readOnly) {
    Object.assign(this, { name, numParams, readOnly })
  }
}

export const standardLibrary = Object.freeze({
  pi: new Variable(Math.PI, true),
  sqrt: new Function('sqrt', 1, true),
  sin: new Function('sin', 1, true),
  cos: new Function('cos', 1, true),
})