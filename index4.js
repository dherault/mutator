const dimensionLess = '_'
const dimensionAny = '__'

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

const oneInput = {
  name: '1',
  value: 1,
  dimension: dimensionAny,
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
  const tree = createTree(
    {
      path: '',
      a: [],
      endWithInput: false,
      areChildrenInputs: true,
    },
    [
      ...inputs,
      oneInput,
    ],
    allowedOperations,
    maxDepth,
  )

  const validPaths = []

  walkTree(tree, node => {
    if (node.a.length === 0 && node.endWithInput) {
      validPaths.push(node.path.trim())
    }
  })

  return validPaths
}

function createTree(
  node,
  inputs,
  operations,
  maxDepth,
  depth = 0
) {
  const tree = {
    node,
    children: [],
  }

  if (depth >= maxDepth) {
    if (node.a.length > 0 && node.a[node.a.length - 1] > 1) {
      const nextA = node.a.slice()

      nextA.pop()

      if (nextA.length > 0) {
        nextA[nextA.length - 1]++
      }

      tree.children.push(
        createTree(
          {
            path: `${node.path} )`,
            a: nextA,
            endWithInput: true,
            areChildrenInputs: false,
          },
          inputs,
          operations,
          maxDepth,
          depth,
        )
      )
    }
  } else if (node.areChildrenInputs) {
    inputs.forEach(input => {
      const nextA = node.a.slice()

      if (nextA.length > 0) {
        nextA[nextA.length - 1]++
      }

      tree.children.push(
        createTree(
          {
            path: `${node.path} ${input.name}`,
            a: nextA,
            endWithInput: true,
            areChildrenInputs: false,
          },
          inputs,
          operations,
          maxDepth,
          depth + 1,
        )
      )
    })

    // if (depth === 0) console.log(node)

    if (!node.path.endsWith('(') && depth + 1 < maxDepth) {
      const nextA = node.a.slice()

      nextA.push(0)

      tree.children.push(
        createTree(
          {
            path: `${node.path} (`,
            a: nextA,
            endWithInput: false,
            areChildrenInputs: true,
          },
          inputs,
          operations,
          maxDepth,
          depth, // ?
        )
      )
    }
  }
  else {
    operations.forEach(operation => {
      tree.children.push(
        createTree(
          {
            path: `${node.path} ${operation.symbol}`,
            a: node.a,
            endWithInput: false,
            areChildrenInputs: true,
          },
          inputs,
          operations,
          maxDepth,
          depth,
        )
      )
    })

    if (node.a.length > 0 && node.a[node.a.length - 1] > 1) {
      const nextA = node.a.slice()

      nextA.pop()

      if (nextA.length > 0) {
        nextA[nextA.length - 1]++
      }

      tree.children.push(
        createTree(
          {
            path: `${node.path} )`,
            a: nextA,
            endWithInput: true,
            areChildrenInputs: false,
          },
          inputs,
          operations,
          maxDepth,
          depth,
        )
      )
    }
  }

  return tree
}

function walkTree(tree, fn) {
  fn(tree.node)

  tree.children.forEach(child => walkTree(child, fn))
}

Object.assign(mutator, {
  operations,
  dimensionLess,
  multiplyDimensions,
  divideDimensions,
})

module.exports = mutator
