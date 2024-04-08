import process from 'process'
import tokenizeFile from './lexer'
import parseFile from './parser'
import runFile from './interpreter'

const help = `Bang! compiler

Syntax: ts-node bang.ts <filename> <outputType>

Prints to stdout according to <outputType>, which must be one of:

  tokenized  the token stream representation
  parsed     the core object representation
  run        the program's output
`

const interpreterFunctions: { [key: string]: any} = {
  'tokenized': tokenizeFile,
  'parsed': parseFile,
  'run': runFile
}

async function compileFromFile(fileName: string, outputType: string) {
  try {
    interpreterFunctions[outputType](fileName)
  } catch (e) {
    console.error(`\u001b[31m${e}\u001b[39m`)
    process.exitCode = 1
  }
}

if (process.argv.length !== 4) {
  console.log(help)
} else {
  compileFromFile(process.argv[2], process.argv[3])
}
