const fs = require('fs')
const path = require('path')
const mutator = require('./index4')

const results = mutator(
  [
    {
      name: 'x',
      value: 1,
      dimension: 'scalar',
    },
    {
      name: 'y',
      value: 2,
      dimension: 'scalar',
    },
  ],
  mutator.dimensionLess,
  {
    maxDepth: 4,
    noEval: true,
  }
)

// results.forEach(path => {
//   if (path.startsWith('( x - 1 )')) console.log(path)
// })
// console.log('results', JSON.stringify(results, null, 2))
// console.log('results', results)

fs.writeFileSync(path.resolve(__dirname, 'output.json'), JSON.stringify(results, null, 2), 'utf-8')
