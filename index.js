const dimensions = { dimensionLess: 1 }
const rootNode = '__root__'
const primesSequence = primes()

const multiplyDimensions = (dimA, dimB) => dimA * dimB
const divideDimensions = (dimA, dimB) => dimA / dimB

const operations = {
  addition: {
    name: 'addition',
    symbol: '+',
    priority: 1,
    reverse: false,
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
    reverse: true,
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
    reverse: false,
    dimensionConditionFn: () => true,
    dimensionResultFn: multiplyDimensions,
    resultFn: (a, b) => a * b,
    trivialityFn: (hashA, hashB) => hashA === '1' || hashB === '1',
    createPath: (inputA, inputB) => `(${inputA} * ${inputB})`,
  },
  division: {
    name: 'division',
    symbol: '/',
    priority: 2,
    reverse: true,
    dimensionConditionFn: (dimA, dimB, a, b) => b !== 0,
    dimensionResultFn: divideDimensions,
    resultFn: (a, b) => a / b,
    trivialityFn: (hashA, hashB) => hashA === hashB || hashB === '1',
    createPath: (inputA, inputB) => `(${inputA} / ${inputB})`,
  },
}

function mutator(
  inputs,
  endDimension,
  {
    allowedOperations = Object.values(operations),
    maxDepth = 3,
    dedupeValues = false,
  } = {}
) {
  const tree = createOperationsTree({ node: rootNode }, allowedOperations, maxDepth)
  const paths = createPaths(tree, inputs)
  let results = paths
  .filter(path => path.dimension === endDimension)
  .map(({ hash, value }) => ({ path: removeParenthesis(hash), value }))
  .sort((a, b) => a.path.length < b.path.length ? -1 : 1)

  if (dedupeValues) {
    results = results
    .filter((path, i, paths) => !paths.some((p, j) => i > j && Math.abs(p.value - path.value) < 0.0000000001))
  }

  return results
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

    inputs.forEach((input1, i) => {
      inputs.forEach((input2, j) => {
        if (operation.trivialityFn(input1.name, input2.name)) return
        if (!operation.dimensionConditionFn(input1.dimension, input2.dimension, input1.value, input2.value)) return
        if (!operation.reverse && i > j) return

        const path = {
          a: input1,
          b: input2,
          dimension: operation.dimensionResultFn(input1.dimension, input2.dimension),
          value: operation.resultFn(input1.value, input2.value),
        }

        path.hash = hashPath(path, operation)

        childTree.paths.push(path)
      })
    })

    if (childTree.children) {
      childTree.children.forEach(child1 => {
        child1.paths.forEach((path1, i) => {
          childTree.children.forEach(child2 => {
            child2.paths.forEach((path2, j) => {
              if (operation.trivialityFn(path1.hash, path2.hash)) return
              if (!operation.dimensionConditionFn(path1.dimension, path2.dimension, path1.value, path2.value)) return
              if (!operation.reverse && i > j) return

              const path = {
                a: path1,
                b: path2,
                dimension: operation.dimensionResultFn(path1.dimension, path2.dimension),
                value: operation.resultFn(path1.value, path2.value),
              }

              path.hash = hashPath(path, operation)

              childTree.paths.push(path)
            })
          })

          inputs.forEach(input => {
            if (
              operation.dimensionConditionFn(path1.dimension, input.dimension, path1.value, input.value)
              && !operation.trivialityFn(path1.hash, input.name)
            ) {
              const path = {
                a: path1,
                b: input,
                dimension: operation.dimensionResultFn(path1.dimension, input.dimension),
                value: operation.resultFn(path1.value, input.value),
              }

              path.hash = hashPath(path, operation)

              childTree.paths.push(path)
            }

            if (
              operation.dimensionConditionFn(input.dimension, path1.dimension, input.value, path1.value)
              && !operation.trivialityFn(input.name, path1.hash)
              && operation.reverse
            ) {
              const path = {
                a: input,
                b: path1,
                dimension: operation.dimensionResultFn(input.dimension, path1.dimension),
                value: operation.resultFn(input.value, path1.value),
              }

              path.hash = hashPath(path, operation)

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

function hashPath({ a, b }, operation) {
  const left = a.hash || a.name
  const right = b.hash || b.name

  return operation.createPath(left, right)
}

function removeParenthesis(hash) {
  return hash.slice(1, hash.length - 1)

}

function isPrime(n) {
  const sqrtN = Math.sqrt(n)

  for (let i = 2; i <= sqrtN; i++) {
    if (n % i === 0) {
      return false
    }
  }

  return true
}

function* primes() {
  let n = 2

  while (true) {
    if (isPrime(n)) {
      yield n
    }

    n++
  }
}

function assignDimension(name) {
  if (dimensions[name]) return dimensions[name]

  return dimensions[name] = primesSequence.next().value
}

Object.assign(mutator, {
  operations,
  assignDimension,
  dimensions,
  multiplyDimensions,
  divideDimensions,
})

module.exports = mutator
