import { describe, expect, it } from 'vitest'
import { hasAnyFilter, matchesUserFilters, searchUsers } from './userSearch'

const USERS = [
  { id: 1, loginId: 'user0', name: '김서연' },
  { id: 300, loginId: 'user299', name: '이민서' },
  { id: 1300, loginId: 'user1299', name: '박지우' },
  { id: 2, loginId: 'user1', name: '최서윤' },
]

describe('hasAnyFilter', () => {
  it('is false when every field is blank', () => {
    expect(hasAnyFilter({ id: '', loginId: '  ', name: '' })).toBe(false)
  })

  it('is true when any single field has text', () => {
    expect(hasAnyFilter({ id: '300', loginId: '', name: '' })).toBe(true)
  })
})

describe('matchesUserFilters', () => {
  it('matches by id substring, including partial matches like 300 -> 1300', () => {
    expect(matchesUserFilters(USERS[1], { id: '300', loginId: '', name: '' })).toBe(true)
    expect(matchesUserFilters(USERS[2], { id: '300', loginId: '', name: '' })).toBe(true)
    expect(matchesUserFilters(USERS[0], { id: '300', loginId: '', name: '' })).toBe(false)
  })

  it('matches by loginId case-insensitively', () => {
    expect(matchesUserFilters(USERS[1], { id: '', loginId: 'USER299', name: '' })).toBe(true)
  })

  it('matches by name substring', () => {
    expect(matchesUserFilters(USERS[0], { id: '', loginId: '', name: '서연' })).toBe(true)
    expect(matchesUserFilters(USERS[1], { id: '', loginId: '', name: '서연' })).toBe(false)
  })

  it('combines multiple non-blank filters with AND', () => {
    expect(matchesUserFilters(USERS[1], { id: '300', loginId: 'user299', name: '' })).toBe(true)
    expect(matchesUserFilters(USERS[1], { id: '300', loginId: 'user1', name: '' })).toBe(false)
  })
})

describe('searchUsers', () => {
  it('returns nothing when no filter is active, regardless of list size', () => {
    expect(searchUsers(USERS, { id: '', loginId: '', name: '' }, 200)).toEqual([])
  })

  it('filters by the active field only', () => {
    // 김서연/이민서/최서윤 모두 '서'를 포함 (박지우만 제외)
    const result = searchUsers(USERS, { id: '', loginId: '', name: '서' }, 200)
    expect(result.map((u) => u.id)).toEqual([1, 300, 2])
  })

  it('caps results at maxResults', () => {
    const bigList = Array.from({ length: 500 }, (_, i) => ({ id: i, loginId: `user${i}`, name: '테스트' }))
    const result = searchUsers(bigList, { id: '', loginId: '', name: '테스트' }, 200)
    expect(result).toHaveLength(200)
  })
})
