import { Expression } from './core'

interface Literal extends Expression {}

export class BooleanLiteral implements Literal {
  constructor(public value: boolean) {}
}