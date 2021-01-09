const { create } = require("istanbul-reports")

const dimensionLess = '__'

function multiplyDimensions(dimA, dimB) {
  if (dimA === dimensionLess && dimB === dimensionLess) return dimensionLess
  if (dimA === dimensionLess) return dimB
  if (dimB === dimensionLess) return dimA

  return `${dimA} __*__ ${dimB}`
}

function divideDimensions(dimA, dimB) {
  if (dimA === dimB) return dimensionLess

  return `${dimA} __/__ ${dimB}`
}

function simplifyDimensions(node) {
  return node
}

const operations = {
  addition: {
    name: 'addition',
    symbol: '+',
    dimensionConditionFn: (dimA, dimB) => dimA === dimB,
    dimensionResultFn: dimA => dimA,
    resultFn: (a, b) => a + b,
    trivialityFn: () => false,
  },
  soustraction: {
    name: 'soustraction',
    symbol: '-',
    dimensionConditionFn: (dimA, dimB) => dimA === dimB,
    dimensionResultFn: dimA => dimA,
    resultFn: (a, b) => a - b,
    trivialityFn: (inputA, inputB) => inputA.name === inputB.name,
  },
  multiplication: {
    name: 'multiplication',
    symbol: '*',
    dimensionConditionFn: () => true,
    dimensionResultFn: (dimA, dimB) => multiplyDimensions(dimA, dimB),
    resultFn: (a, b) => a * b,
    trivialityFn: () => false,
  },
  division: {
    name: 'division',
    symbol: '/',
    dimensionConditionFn: (dimA, dimB, a, b) => b !== 0,
    dimensionResultFn: (dimA, dimB) => divideDimensions(dimA, dimB),
    resultFn: (a, b) => a / b,
    trivialityFn: (inputA, inputB) => inputA.name === inputB.name,
  },
}

function mutator(
  inputs,
  endDimension,
  {
    allowedOperations = Object.values(operations),
    maxDepth = 3,
    noEval = false,
  } = {}
) {
  const paths = createPaths(inputs, allowedOperations, maxDepth)

  return paths
}

function createPaths(inputs, operations, maxDepth, depth = 0, previousPaths = []) {
  if (depth === maxDepth) return previousPaths

  const paths = []

  if (previousPaths.length) {
    previousPaths.forEach(path => {
      operations.forEach(operation => {
        inputs.forEach(input => {
          const nextPath = `${path} ${operation.symbol} ${input.name}`

          paths.push(
            nextPath,
            `( ${nextPath}`,
            `${nextPath} )`,
            `${path} ) ${operation.symbol} ${input.name}`
          )
        })
      })
    })
  }
  else {
    inputs.forEach(input => {
      paths.push(
        input.name,
      )
    })
  }

  paths.push(...createPaths(inputs, operations, maxDepth, depth + 1, paths))

  return paths
}

function hasDanglingParenthesis(path) {
  let n = 0

  path.split(' ').forEach(token => {
    if (token === '(') n++
    if (token === ')') n--
  })

  return n > 0
}

Object.assign(mutator, {
  operations,
  dimensionLess,
  multiplyDimensions,
  divideDimensions,
})

module.exports = mutator
