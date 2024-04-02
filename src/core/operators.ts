export const assignmentOperator = '='
export const arrow = '->'

const equalityOperator = '=='
const inequalityOperator = '!='
const lessThanOperator = '<'
const lessThanEqualOperator = '<='
const greaterThanOperator = '>'
const greaterThanEqualOperator = '>='
export const equalityOperators = [
  equalityOperator,
  inequalityOperator,
  lessThanOperator,
  lessThanEqualOperator,
  greaterThanOperator,
  greaterThanEqualOperator,
]

export const orOperator = '||'
export const andOperator = '&&'

export const addOperator = '+'
export const subtractOperator = '-'
export const additiveOperators = [addOperator, subtractOperator]

const multiplyOperator = '*'
const divideOperator = '/'
const modulusOperator = '%'
export const multiplicativeOperators = [multiplyOperator, divideOperator, modulusOperator]

export const exponentialOperator = '^'

export const negateOperator = '!'
export const spreadOperator = '@'

export const incrementOperator = '++'
export const decrementOperator = '--'

export const spreadAssignmentOperator = `${spreadOperator}${assignmentOperator}`
export const negateAssignmentOperator = `${negateOperator}${assignmentOperator}`
export const exponentialAssignmentOperator = `${exponentialOperator}${assignmentOperator}`
export const multiplyAssignmentOperator = `${multiplyOperator}${assignmentOperator}`
export const divideAssignmentOperator = `${divideOperator}${assignmentOperator}`
export const modulusAssignmentOperator = `${modulusOperator}${assignmentOperator}`
export const addAssignmentOperator = `${addOperator}${assignmentOperator}`
export const subtractAssignmentOperator = `${subtractOperator}${assignmentOperator}`
export const andAssignmentOperator = `${andOperator}${assignmentOperator}`
export const orAssignmentOperator = `${orOperator}${assignmentOperator}`

export const assignmentOperators = [
  assignmentOperator,
  spreadAssignmentOperator,
  negateAssignmentOperator,
  exponentialAssignmentOperator,
  multiplyAssignmentOperator,
  divideAssignmentOperator,
  modulusAssignmentOperator,
  addAssignmentOperator,
  subtractAssignmentOperator,
  andAssignmentOperator,
  orAssignmentOperator,
]
