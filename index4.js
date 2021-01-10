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
    priority: 1,
    dimensionConditionFn: (dimA, dimB) => dimA === dimB,
    dimensionResultFn: dimA => dimA,
    resultFn: (a, b) => a + b,
    trivialityFn: () => false,
  },
  soustraction: {
    name: 'soustraction',
    symbol: '-',
    priority: 1,
    dimensionConditionFn: (dimA, dimB) => dimA === dimB,
    dimensionResultFn: dimA => dimA,
    resultFn: (a, b) => a - b,
    trivialityFn: (inputA, inputB) => inputA.name === inputB.name,
  },
  multiplication: {
    name: 'multiplication',
    symbol: '*',
    priority: 2,
    dimensionConditionFn: () => true,
    dimensionResultFn: (dimA, dimB) => multiplyDimensions(dimA, dimB),
    resultFn: (a, b) => a * b,
    trivialityFn: () => false,
  },
  division: {
    name: 'division',
    symbol: '/',
    priority: 2,
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
  // const tree = createOperationTree(
  //   {
  //     path: '',
  //     a: [],
  //     endWithInput: false,
  //     areChildrenInputs: true,
  //   },
  //   [
  //     ...inputs,
  //     oneInput,
  //   ],
  //   allowedOperations,
  //   maxDepth,
  // )

  // const trees = []

  // walkTree(tree, node => {
  //   if (node.a.length === 0 && node.endWithInput) {
  //     const pathTree = createPathTree(node.path.trim())

  //     trees.push(pathTree)
  //   }
  // })

  // return trees
  return createPathTree('( x + 1 ) * y - ( x - 1 ) + ( y * ( x + 1 ) * ( x - 1 * ( y + 1 ) ) )', allowedOperations)
}

function createOperationTree(
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
    if (node.a.length > 0 && node.a[node.a.length - 1].value > 1) {
      const nextA = node.a.slice().map(item => ({ ...item }))

      const { index } = nextA.pop()

      if (nextA.length > 0) {
        nextA[nextA.length - 1].value++
      }

      if (index > 0) {
        tree.children.push(
          createOperationTree(
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
  } else if (node.areChildrenInputs) {
    inputs.forEach(input => {
      const nextA = node.a.slice().map(item => ({ ...item }))

      if (nextA.length > 0) {
        nextA[nextA.length - 1].value++
      }

      tree.children.push(
        createOperationTree(
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

    if (node.a.length < maxDepth && depth + 1 < maxDepth) {
      const nextA = node.a.slice().map(item => ({ ...item }))

      nextA.push({ value: 0, index: depth })

      tree.children.push(
        createOperationTree(
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
        createOperationTree(
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

    if (node.a.length > 0 && node.a[node.a.length - 1].value > 1) {
      const nextA = node.a.slice().map(item => ({ ...item }))

      nextA.pop()

      if (nextA.length > 0) {
        nextA[nextA.length - 1].value++
      }

      tree.children.push(
        createOperationTree(
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

function createPathTree(path, operations) {
  const pathArray = path.split(' ')
  const parenthesis = []

  pathArray.forEach((token, index) => {
    if (token === '(') {
      parenthesis.unshift([index])
    }
    if (token === ')') {
      let i

      for (i = 0; i < parenthesis.length; i++) {
        if (parenthesis[i].length < 2) break;
      }

      parenthesis[i].push(index)
    }
  })

  let offset = 0

  parenthesis.forEach(([minIndex, maxIndex], i) => {
    const diff = maxIndex - minIndex
    const parenthesisPathArray = pathArray.splice(minIndex, diff + 1 - offset)

    parenthesisPathArray.shift()
    parenthesisPathArray.pop()
    pathArray.splice(minIndex, 0, parenthesisPathArray)

    if (parenthesis[i + 1] && parenthesis[i + 1][1] > maxIndex) offset += diff
    else offset = 0
  })

  return createPathTreeFromArray(pathArray, operations)
}

function createPathTreeFromArray(pathArray, operations) {
  console.log('pathArray', pathArray)
  if (pathArray.length === 1) {
    const [nextPathArray] = pathArray

    if (Array.isArray(nextPathArray)) {
      return createPathTreeFromArray(nextPathArray, operations)
    }

    return {
      node: nextPathArray,
      nodeType: 'variable',
    }
  }

  const foundOperations = []

  pathArray.forEach((token, index) => {
    // const node = Array.isArray(token) ? createPathTreeFromArray(token) : token

    const operation = operations.find(operation => token === operation.symbol)

    if (operation) {
      foundOperations.push({ index, operation })
    }
  })

  foundOperations.sort((a, b) => a.operation.priority < b.operation.priority ? -1 : 1)

  // console.log('foundOperations', foundOperations)

  const { index,  operation } = foundOperations[0]

  const left = pathArray.slice(0, index)
  const right = pathArray.slice(index + 1)

  // console.log('left', left)
  // console.log('right', right)

  const tree = {
    node: operation,
    nodeType: 'operation',
    children: [
      createPathTreeFromArray(left, operations),
      createPathTreeFromArray(right, operations),
    ],
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
