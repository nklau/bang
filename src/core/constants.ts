import { ReturnStatement } from './core'
import { FunctionLiteral, NumberLiteral } from './types'

export const falseyFunction = new FunctionLiteral([], [new ReturnStatement()])
export const inf = new NumberLiteral(Infinity)