const mutator = require('./index')

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
  Object.values(mutator.operations),
  3
)

console.log('results', results)
