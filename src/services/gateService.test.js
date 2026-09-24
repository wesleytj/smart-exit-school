import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nextDisplayOrder } from './gateOrder.js'

describe('nextDisplayOrder', () => {
  it('starts at 1 when the school has no gates', () => {
    assert.equal(nextDisplayOrder([]), 1)
  })

  it('places the next gate after the highest display_order', () => {
    assert.equal(nextDisplayOrder([
      { display_order: 1 },
      { display_order: 4 }
    ]), 5)
  })
})
