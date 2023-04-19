import analyze from './analyzer.js'
import optimize from './optimizer.js'
import generate from './generator.js'
import * as fsPromises from 'fs/promises'
import * as fs from 'fs'
import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execute = promisify(exec)

export default async function compile(
  source,
  outputType,
  filename = 'output.js'
) {
  if (!['analyzed', 'optimized', 'js', 'run'].includes(outputType)) {
    throw new Error('Unknown output type')
  }

  const analyzed = analyze(source)
  if (outputType === 'analyzed') return analyzed
  const optimized = optimize(analyzed)
  if (outputType === 'optimized') return optimized
  const generated = generate(optimized)
  if (outputType === 'js') return generated

  const outputDir = path.join(path.resolve(), 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  try {
    await execute(`rm ${path.join(outputDir, '*')}`)
  } catch {}

  await fsPromises.writeFile(path.join(outputDir, filename), generated)

  return (await execute(`node ${path.join(outputDir, filename)}`, {
    encoding: 'utf8',
    cwd: outputDir,
  })).stdout
}