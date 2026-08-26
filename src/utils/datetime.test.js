import { describe, expect, test } from 'vitest'
import { formatDateTime } from './datetime'

describe('formatDateTime', () => {
  test('formats a LocalDateTime string into YY-MM-DD HH시 mm분 ss초', () => {
    expect(formatDateTime('2026-08-26T09:22:00')).toBe('26-08-26 09시 22분 00초')
  })

  test('ignores fractional seconds', () => {
    expect(formatDateTime('2026-08-25T17:25:31.045501')).toBe('26-08-25 17시 25분 31초')
  })

  test('returns null for null or undefined', () => {
    expect(formatDateTime(null)).toBeNull()
    expect(formatDateTime(undefined)).toBeNull()
  })

  test('returns the original string unchanged when it does not match the expected shape', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date')
  })
})
