import { ReturnStatement } from './core'
import { FunctionLiteral } from './types'

export const nil = {}

const falseyFunctionSourceCode = '() -> nil'
export const falseyFunction = new FunctionLiteral([], [new ReturnStatement(nil)], falseyFunctionSourceCode)