import { describe, expect, it } from 'vitest'
import { hasAnyFilter } from './userSearch'

describe('hasAnyFilter', () => {
  it('is false when every field is blank', () => {
    expect(hasAnyFilter({ id: '', loginId: '  ', name: '' })).toBe(false)
  })

  it('is true when any single field has text', () => {
    expect(hasAnyFilter({ id: '300', loginId: '', name: '' })).toBe(true)
  })
})
