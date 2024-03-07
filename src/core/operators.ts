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

const spreadAssignmentOperator = `${spreadOperator}${assignmentOperator}`
const negateAssignmentOperator = `${negateOperator}${assignmentOperator}`
const exponentialAssignmentOperator = `${exponentialOperator}${assignmentOperator}`
const multiplyAssignmentOperator = `${multiplyOperator}${assignmentOperator}`
const divideAssignmentOperator = `${divideOperator}${assignmentOperator}`
const modulusAssignmentOperator = `${modulusOperator}${assignmentOperator}`
const addAssignmentOperator = `${addOperator}${assignmentOperator}`
const subtractAssignmentOperator = `${subtractOperator}${assignmentOperator}`
const andAssignmentOperator = `${andOperator}${assignmentOperator}`
const orAssignmentOperator = `${orOperator}${assignmentOperator}`

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
