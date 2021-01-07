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
  'scalar',
  Object.values(mutator.operations),
)

console.log('results', results)
