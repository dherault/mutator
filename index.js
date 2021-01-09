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

const initialInput = {
  value: 'root',
  dimension: dimensionLess,
}

const noop = {
  name: 'noop',
  symbol: 'noop',
  dimensionConditionFn: () => false,
  dimensionResultFn: () => null,
  resultFn: () => null,
  trivialityFn: () => false,
}

function mutator(
  inputs,
  endDimension, {
    allowedOperations = Object.values(operations),
    maxDepth = 3,
    noEval = false,
  } = {}) {
  // console.log('allowOperations', allowedOperations)
  const tree = createTree(
    initialInput,
    noop,
    inputs,
    endDimension,
    allowedOperations,
    0,
    maxDepth
  )

  console.log('tree', JSON.stringify(tree, null, 2))

  const paths = new Set()
  let results = []

  walkTree(tree, accumulate)
  .flat()
  .filter(accumulator => accumulator !== null)
  .map(accumulator => simplifyDimensions(accumulator))
  // .filter(accumulator => accumulator.dimension === endDimension)
  .forEach(accumulator => {
    if (paths.has(accumulator.path)) return

    delete accumulator.dimension
    delete accumulator.n

    paths.add(accumulator.path)
    results.push(accumulator)
  })

  results = results.map(accumulator => {
    if (!noEval) {
      accumulator.value = eval(replaceWithInputsValues(accumulator.path, inputs, allowedOperations))
    }

    return accumulator
  })

  return results
}

function createTree(node, operation, inputs, endDimension, allowedOperations, depth, maxDepth) {
  const tree = {
    node,
    operation,
    children: [],
  }

  if (depth === maxDepth) return tree

  inputs.forEach(input => {
    if (operation.trivialityFn(node, input)) return

    tree.children.push(
      createTree(
        input,
        noop,
        inputs,
        endDimension,
        allowedOperations,
        depth + 1,
        maxDepth,
      )
    )
  })

  if (depth < maxDepth - 1) {
    inputs.forEach(input => {
      allowedOperations.forEach(operation => {
        if (operation.trivialityFn(node, input)) return

        tree.children.push(
          createTree(
            input,
            operation,
            inputs,
            endDimension,
            allowedOperations,
            depth + 1,
            maxDepth,
          )
        )
      })
    })
  }


  return tree
}

function walkTree(tree, fn) {
  if (!tree.children.length) {
    return {
      value: tree.node.value,
      dimension: tree.node.dimension,
      path: tree.node.name,
    }
  }

  const accumulators = tree.children.map(child => walkTree(child, fn)).flat()

  return accumulators.map(accumulator => fn(tree.node, accumulator, tree.operation))
}

function accumulate(node, accumulators, operation) {
  let accumulatorArray = accumulators

  if (!Array.isArray(accumulators)) accumulatorArray = [accumulators]

  return accumulatorArray.map(accumulator => {
    if (accumulator === null) return accumulator
    if (operation.name === 'noop') return accumulator
    if (!operation.dimensionConditionFn(node.dimension, accumulator.dimension, node.value, accumulator.value)) return null

    const accumulatorChildren = [
      {
        dimension: operation.dimensionResultFn(node.dimension, accumulator.dimension),
        path: `${node.name} ${operation.symbol} ${accumulator.path}`,
        n: accumulator.n || 0,
      },
      {
        dimension: operation.dimensionResultFn(node.dimension, accumulator.dimension),
        path: `(${node.name} ${operation.symbol} ${accumulator.path}`,
        n: accumulator.n ? accumulator.n + 1 : 1,
      }
    ]

    if (accumulator.n && accumulator.n > 0) {
      accumulatorChildren.push(
        {
          dimension: operation.dimensionResultFn(node.dimension, accumulator.dimension),
          path: `${node.name} ${operation.symbol} ${accumulator.path})`,
          n: accumulator.n - 1,
        },
        {
          dimension: operation.dimensionResultFn(node.dimension, accumulator.dimension),
          path: `${node.name}) ${operation.symbol} ${accumulator.path}`,
          n: accumulator.n - 1,
        }
      )
    }

    return accumulatorChildren
  })
  .flat()
}

function replaceWithInputsValues(path, inputs, allowedOperations) {
  return path
  .split(' ')
  .map(token => {
    if (token === '(' || token === ')') return token
    if (allowedOperations.find(operation => operation.symbol === token)) return token

    const input = inputs.find(input => input.name === token)

    if (input) return input.value

    throw new Error('Unknown token') // TODO, check for spaces in inputs names and delete this line
  })
  .join(' ')


}

Object.assign(mutator, {
  operations,
  dimensionLess,
  multiplyDimensions,
  divideDimensions,
})

module.exports = mutator
