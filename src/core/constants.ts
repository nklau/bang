import { ReturnStatement } from './core'
import { FunctionLiteral, NumberLiteral } from './types'

const falseyFunctionSourceCode = '() -> nil'
export const falseyFunction = new FunctionLiteral([], [new ReturnStatement()], falseyFunctionSourceCode)
export const inf = new NumberLiteral(Infinity)