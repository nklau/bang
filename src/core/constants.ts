import { ReturnStatement } from './core'
import { FunctionLiteral } from './types'

const falseyFunctionSourceCode = '() -> nil'
export const falseyFunction = new FunctionLiteral([], [new ReturnStatement()], falseyFunctionSourceCode)