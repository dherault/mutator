const mutator = require('./index')

describe('mutator mutates', () => {

  test('with 2 inputs, dimensionless', () => {
    const results = mutator(
      [
        {
          value: 1,
          dimension: 'scalar',
        },
        {
          value: 2,
          dimension: 'scalar',
        },
      ],
      mutator.dimensionLess,
    )

    expect(results).toBe([
      0.5,
      2,
    ])
  })

  test('with 2 inputs, same dimension', () => {
    const results = mutator(
      [
        {
          value: 1,
          dimension: 'scalar',
        },
        {
          value: 2,
          dimension: 'scalar',
        },
      ],
      'scalar',
    )

    expect(results).toBe([
      1,
      2,
      3,
      -1,
    ])
  })

  test('with 2 inputs, dimension square', () => {
    const results = mutator(
      [
        {
          value: 1,
          dimension: 'scalar',
        },
        {
          value: 2,
          dimension: 'scalar',
        },
      ],
      mutator.multiply('scalar', 'scalar'),
    )

    expect(results).toBe([
      2
    ])
  })
})
