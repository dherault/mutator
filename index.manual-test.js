const fs = require('fs')
const path = require('path')
const mutator = require('.')

const results = mutator(
  [
    {
      name: '1',
      value: 1,
      dimension: mutator.dimensionLess,
    },
    {
      name: 'x',
      value: 2,
      dimension: mutator.assignDimension('scalar'),
    },
    {
      name: 'y',
      value: 3,
      dimension: mutator.assignDimension('scalar'),
    },
  ],
  mutator.dimensionLess,
  {
    maxDepth: 2,
    noEval: true,
  }
)

// results.forEach(path => {
//   if (path.startsWith('( x - 1 )')) console.log(path)
// })
// console.log('results', JSON.stringify(results, null, 2))
// console.log('results', results)
// console.log('results', results)
fs.writeFileSync(path.resolve(__dirname, 'output.json'), JSON.stringify(results, null, 2), 'utf-8')
