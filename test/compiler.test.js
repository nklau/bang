import assert from 'assert/strict'
import util from 'util'
import compile from '../src/compiler.js'

const sampleProgram = 'print(0)'

describe('The compiler', () => {
  it('throws when the output type is unknown', async () => {
    await assert.rejects(
      async () => await compile('print(0);', 'blah'),
      /Unknown output type/
    )
  })
  it('accepts the analyzed option', async () => {
    const compiled = await compile(sampleProgram, 'analyzed')
    assert(util.format(compiled).startsWith('   1 | Block'))
  })
  it('accepts the optimized option', async () => {
    const compiled = await compile(sampleProgram, 'optimized')
    assert(util.format(compiled).startsWith('   1 | Block'))
  })
})
