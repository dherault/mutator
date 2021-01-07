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
  },
  soustraction: {
    name: 'soustraction',
    symbol: '-',
    dimensionConditionFn: (dimA, dimB) => dimA === dimB,
    dimensionResultFn: dimA => dimA,
    resultFn: (a, b) => a - b,
  },
  multiplication: {
    name: 'multiplication',
    symbol: '*',
    dimensionConditionFn: () => true,
    dimensionResultFn: (dimA, dimB) => multiplyDimensions(dimA, dimB),
    resultFn: (a, b) => a * b,
  },
  division: {
    name: 'division',
    symbol: '/',
    dimensionConditionFn: (dimA, dimB, a, b) => b !== 0,
    dimensionResultFn: (dimA, dimB) => divideDimensions(dimA, dimB),
    resultFn: (a, b) => a / b,
  },
}

function mutator(inputs, endDimension, allowedOperations, maxDepth = 3) {
  // console.log('allowOperations', allowedOperations)
  const tree = createTree(
    { value: 'root', dimension: dimensionLess },
    'none',
    inputs,
    endDimension,
    allowedOperations,
    0,
    maxDepth
  )

  let results = walkTree(tree, (node, accumulator, operation) => {
    if (accumulator === null) return accumulator
    if (operation === 'none') return accumulator
    if (!operation.dimensionConditionFn(node.dimension, accumulator.dimension, node.value, accumulator.value)) return null

    return {
      value: operation.resultFn(node.value, accumulator.value),
      dimension: operation.dimensionResultFn(node.dimension, accumulator.dimension),
      path: `${node.name} ${operation.symbol} (${accumulator.path})`,
    }
  })
  .filter(result => result !== null)
  .map(result => simplifyDimensions(result))
  .filter(result => result.dimension === endDimension)

  // console.log('tree', JSON.stringify(tree, null, 2))
  // tree.children.forEach(child => {
  //   console.log('child', child)
  // })
  console.log('results', JSON.stringify(results, null, 2))

  return []
}

function createTree(node, operation, inputs, endDimension, allowedOperations, depth, maxDepth) {
  const tree = {
    node,
    operation,
    children: [],
  }

  if (depth === maxDepth) return tree

  if (depth === maxDepth - 1) {
    inputs.forEach(input => {
      tree.children.push(
        createTree(
          input,
          'none',
          inputs,
          endDimension,
          allowedOperations,
          depth + 1,
          maxDepth,
        )
      )
    })
  }
  else {
    inputs.forEach(input => {
      allowedOperations.forEach(operation => {
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
      ...tree.node,
      path: tree.node.name,
    }
  }

  const accumulators = tree.children.map(child => walkTree(child, fn)).flat()

  return accumulators.map(accumulator => fn(tree.node, accumulator, tree.operation))
}

Object.assign(mutator, {
  operations,
  dimensionLess,
  multiplyDimensions,
  divideDimensions,
})

module.exports = mutator
