const fs = require('fs')
const path = require('path')
const mutator = require('.')

// Remove x + x
mutator.operations.addition.trivialityFn = (hashA, hashB) => hashA === hashB

const scalar = mutator.assignDimension('scalar')
const time = mutator.assignDimension('time')

const results = mutator(
  [
    // {
    //   name: '1',
    //   value: 1,
    //   dimension: mutator.dimensions.dimensionLess,
    // },
    {
      name: 'x',
      value: 3.141592,
      dimension: scalar,
    },
    {
      name: 'y',
      value: 1.618,
      dimension: scalar,
    },
    {
      name: 't',
      value: 100,
      dimension: time,
    },
  ],
  // mutator.dimensions.dimensionLess,
  mutator.divideDimensions(scalar, time),
  {
    maxDepth: 3,
    noEval: true,
    dedupeValues: false,
  }
)

// console.log('results', results)
fs.writeFileSync(path.resolve(__dirname, 'output.json'), JSON.stringify(results, null, 2), 'utf-8')
