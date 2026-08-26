import { describe, expect, it } from 'vitest'
import { checkTypeLabel, toAnomalyRows } from './verification'

describe('checkTypeLabel', () => {
  it('maps known BE CheckType enum names to Korean labels', () => {
    expect(checkTypeLabel('STOCK_OVERISSUE')).toBe('재고 초과')
    expect(checkTypeLabel('COUNTER_MISMATCH')).toBe('카운터-이력 일치')
  })

  it('falls back to the raw value for an unknown check type', () => {
    expect(checkTypeLabel('SOME_NEW_CHECK')).toBe('SOME_NEW_CHECK')
  })
})

describe('toAnomalyRows', () => {
  it('converts the counts map to rows sorted by count descending', () => {
    const rows = toAnomalyRows({ STATE_MISSING_LOG: 100, STOCK_OVERISSUE: 1, COUNTER_MISMATCH: 101 })
    expect(rows).toEqual([
      { checkType: 'COUNTER_MISMATCH', label: '카운터-이력 일치', count: 101 },
      { checkType: 'STATE_MISSING_LOG', label: '로그 없는 레코드', count: 100 },
      { checkType: 'STOCK_OVERISSUE', label: '재고 초과', count: 1 },
    ])
  })

  it('returns an empty array for no anomalies or a missing map', () => {
    expect(toAnomalyRows({})).toEqual([])
    expect(toAnomalyRows(undefined)).toEqual([])
  })
})
