import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isSameUserRevalidation } from './platformAdminResolution.js'

describe('isSameUserRevalidation', () => {
  it('treats the first resolution as a blocking load', () => {
    assert.equal(isSameUserRevalidation(null, 'user-a'), false)
  })

  it('keeps the panel mounted when the same user is revalidated', () => {
    assert.equal(isSameUserRevalidation('user-a', 'user-a'), true)
  })

  it('blocks again on logout or a different user', () => {
    assert.equal(isSameUserRevalidation('user-a', null), false)
    assert.equal(isSameUserRevalidation('user-a', 'user-b'), false)
  })
})
