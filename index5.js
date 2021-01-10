const dimensionLess = '_'
const dimensionAny = '__'

function multiplyDimensions(dimA, dimB) {
  if (dimA === dimensionLess && dimB === dimensionLess) return dimensionLess
  if (dimA === dimensionLess) return dimB
  if (dimB === dimensionLess) return dimA

  return `(${dimA} __*__ ${dimB})`
}

function divideDimensions(dimA, dimB) {
  if (dimA === dimB) return dimensionLess
  if (dimB === dimensionLess) return dimA

  return `(${dimA} __/__ ${dimB})`
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
    createPath: (inputA, inputB) => `(${inputA} + ${inputB})`,
  },
  soustraction: {
    name: 'soustraction',
    symbol: '-',
    priority: 1,
    dimensionConditionFn: (dimA, dimB) => dimA === dimB,
    dimensionResultFn: dimA => dimA,
    resultFn: (a, b) => a - b,
    trivialityFn: (hashA, hashB) => hashA === hashB,
    createPath: (inputA, inputB) => `(${inputA} - ${inputB})`,
  },
  multiplication: {
    name: 'multiplication',
    symbol: '*',
    priority: 2,
    dimensionConditionFn: () => true,
    dimensionResultFn: (dimA, dimB) => multiplyDimensions(dimA, dimB),
    resultFn: (a, b) => a * b,
    trivialityFn: () => false,
    createPath: (inputA, inputB) => `(${inputA} * ${inputB})`,
  },
  division: {
    name: 'division',
    symbol: '/',
    priority: 2,
    dimensionConditionFn: (dimA, dimB, a, b) => b !== 0,
    dimensionResultFn: (dimA, dimB) => divideDimensions(dimA, dimB),
    resultFn: (a, b) => a / b,
    trivialityFn: (hashA, hashB) => hashA === hashB,
    createPath: (inputA, inputB) => `(${inputA} / ${inputB})`,
  },
}

const rootNode = '__root__'

function mutator(
  inputs,
  endDimension,
  {
    allowedOperations = Object.values(operations),
    maxDepth = 3,
    noEval = false,
  } = {}
) {

  const tree = createOperationsTree({ node: rootNode }, allowedOperations, maxDepth)
  const paths = createPaths(tree, inputs)

  return paths.map(({ hash, dimension, value }) => ({ hash, dimension, value }))
}

function createOperationsTree(tree, operations, maxDepth, depth = 0) {
  if (depth === maxDepth) return tree

  tree.children = []

  operations.forEach(operation => {
    const childTree = { node: operation }

    createOperationsTree(childTree, operations, maxDepth, depth + 1)

    tree.children.push(childTree)
  })

  return tree
}

function createPaths(tree, inputs) {
  reverseWalkTree(tree, childTree => {
    childTree.paths = []

    const operation = childTree.node

    if (operation === rootNode) {
      childTree.children.forEach(child => {
        childTree.paths.push(...child.paths)
      })

      return
    }

    inputs.forEach(input1 => {
      inputs.forEach(input2 => {
        if (operation.trivialityFn(input1.name, input2.name)) return
        if (!operation.dimensionConditionFn(input1.dimension, input2.dimension, input1.value, input2.value)) return

        const path = {
          operation,
          a: { input: input1 },
          b: { input: input2 },
          dimension: operation.dimensionResultFn(input1.dimension, input2.dimension),
          value: operation.resultFn(input1.value, input2.value),
        }

        path.hash = hashPath(path)

        childTree.paths.push(path)
      })
    })

    if (childTree.children) {
      childTree.children.forEach(child1 => {
        child1.paths.forEach(path1 => {
          childTree.children.forEach(child2 => {
            child2.paths.forEach(path2 => {
              if (operation.trivialityFn(path1.hash, path2.hash)) return
              if (!operation.dimensionConditionFn(path1.dimension, path2.dimension, path1.value, path2.value)) return

              const path = {
                operation,
                a: path1,
                b: path2,
                dimension: simplifyDimensions(operation.dimensionResultFn(path1.dimension, path2.dimension)),
                value: operation.resultFn(path1.value, path2.value),
              }

              path.hash = hashPath(path)

              childTree.paths.push(path)
            })
          })

          inputs.forEach(input => {
            if (operation.dimensionConditionFn(path1.dimension, input.dimension, path1.value, input.value)) {
              const path = {
                operation,
                a: path1,
                b: { input },
                dimension: simplifyDimensions(operation.dimensionResultFn(path1.dimension, input.dimension)),
                value: operation.resultFn(path1.value, input.value),
              }

              path.hash = hashPath(path)

              childTree.paths.push(path)
            }


            if (operation.dimensionConditionFn(input.dimension, path1.dimension, input.value, path1.value)) {
              const path = {
                operation,
                a: { input },
                b: path1,
                dimension: simplifyDimensions(operation.dimensionResultFn(input.dimension, path1.dimension)),
                value: operation.resultFn(input.value, path1.value),
              }

              path.hash = hashPath(path)

              childTree.paths.push(path)
            }
          })
        })
      })
    }
  })

  return tree.paths
}

function reverseWalkTree(tree, fn) {
  if (tree.children) tree.children.forEach(childTree => reverseWalkTree(childTree, fn))

  fn(tree)
}

function hashPath({ operation, a, b }) {
  const left = a.input ? a.input.name : a.hash
  const right = b.input ? b.input.name : b.hash

  return operation.createPath(left, right)
}

Object.assign(mutator, {
  operations,
  dimensionLess,
  multiplyDimensions,
  divideDimensions,
})

module.exports = mutator
