import { describe, expect, it } from 'vitest'
import {
  appendHeartbeat,
  applyStockStreamEvent,
  INITIAL_STOCK_STREAM_STATE,
  loadPersistedHistory,
  MAX_HISTORY_POINTS,
  MIN_POINT_INTERVAL_MS,
  parseSseData,
  savePersistedHistory,
} from './useCampaignStockStream'

// sessionStorage 흉내만 내는 인메모리 스텁 - 실제 브라우저 API 없이 저장/복원 로직만 검증.
function createFakeStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
  }
}

describe('parseSseData', () => {
  it('parses valid JSON', () => {
    expect(parseSseData('{"a":1}')).toEqual({ a: 1 })
  })

  it('returns null for malformed payloads instead of throwing', () => {
    expect(parseSseData('not json')).toBeNull()
  })
})

describe('applyStockStreamEvent', () => {
  it('replaces all fields on snapshot, marks connected, and starts the history series', () => {
    const raw = JSON.stringify({ campaignId: 1, totalStock: 10000, remainingStock: 9999, status: 'OPEN', soldOut: false })
    const next = applyStockStreamEvent(INITIAL_STOCK_STREAM_STATE, 'snapshot', raw, 1000)
    expect(next).toEqual({
      totalStock: 10000,
      remainingStock: 9999,
      status: 'OPEN',
      soldOut: false,
      connected: true,
      lastError: null,
      history: [{ t: 1000, remainingStock: 9999 }],
    })
  })

  it('updates only remainingStock/soldOut on update, deriving soldOut client-side, and appends a history point', () => {
    const snapshotState = { ...INITIAL_STOCK_STREAM_STATE, totalStock: 10000, remainingStock: 5, status: 'OPEN', connected: true, history: [{ t: 1000, remainingStock: 5 }] }
    const next = applyStockStreamEvent(snapshotState, 'update', JSON.stringify({ campaignId: 1, remainingStock: 0 }), 2000)
    expect(next.remainingStock).toBe(0)
    expect(next.soldOut).toBe(true)
    expect(next.totalStock).toBe(10000) // update 이벤트엔 totalStock이 없으므로 기존 값 유지
    expect(next.history).toEqual([{ t: 1000, remainingStock: 5 }, { t: 2000, remainingStock: 0 }])
  })

  it('caps history at MAX_HISTORY_POINTS, dropping the oldest samples first', () => {
    // 각 점 사이 간격이 스로틀(MIN_POINT_INTERVAL_MS)보다 커야 실제로 매번 새 점이 늘어난다.
    const step = MIN_POINT_INTERVAL_MS + 1
    const longHistory = Array.from({ length: MAX_HISTORY_POINTS }, (_, i) => ({ t: i * step, remainingStock: MAX_HISTORY_POINTS - i }))
    const state = { ...INITIAL_STOCK_STREAM_STATE, history: longHistory }
    const now = MAX_HISTORY_POINTS * step + 99999
    const next = applyStockStreamEvent(state, 'update', JSON.stringify({ campaignId: 1, remainingStock: 1 }), now)
    expect(next.history).toHaveLength(MAX_HISTORY_POINTS)
    expect(next.history[0]).toEqual(longHistory[1]) // 가장 오래된 샘플(index 0)이 밀려나감
    expect(next.history[next.history.length - 1]).toEqual({ t: now, remainingStock: 1 })
  })

  it('throttles rapid-fire updates - updates the last point in place instead of growing the array', () => {
    const state = { ...INITIAL_STOCK_STREAM_STATE, totalStock: 10000, remainingStock: 100, history: [{ t: 1000, remainingStock: 100 }] }
    // 스로틀 윈도우 안(MIN_POINT_INTERVAL_MS 미만 경과)에 도착한 이벤트 - 점 개수는 그대로,
    // 마지막 점의 값만 최신으로 갱신돼야 한다(타임스탬프는 원래 점 것을 유지).
    const next = applyStockStreamEvent(state, 'update', JSON.stringify({ campaignId: 1, remainingStock: 50 }), 1000 + MIN_POINT_INTERVAL_MS - 1)
    expect(next.history).toEqual([{ t: 1000, remainingStock: 50 }])
  })

  it('does not throttle when enough time has passed since the last point', () => {
    const state = { ...INITIAL_STOCK_STREAM_STATE, totalStock: 10000, remainingStock: 100, history: [{ t: 1000, remainingStock: 100 }] }
    const next = applyStockStreamEvent(state, 'update', JSON.stringify({ campaignId: 1, remainingStock: 50 }), 1000 + MIN_POINT_INTERVAL_MS)
    expect(next.history).toEqual([{ t: 1000, remainingStock: 100 }, { t: 1000 + MIN_POINT_INTERVAL_MS, remainingStock: 50 }])
  })

  it('updates only status on a status event', () => {
    const state = { ...INITIAL_STOCK_STREAM_STATE, status: 'READY', connected: true }
    const next = applyStockStreamEvent(state, 'status', JSON.stringify({ campaignId: 1, status: 'OPEN' }))
    expect(next.status).toBe('OPEN')
  })

  it('keeps prior state and flags PARSE_ERROR on malformed payloads without dropping the connection', () => {
    const state = { ...INITIAL_STOCK_STREAM_STATE, remainingStock: 42, connected: true }
    const next = applyStockStreamEvent(state, 'update', 'not json')
    expect(next.remainingStock).toBe(42)
    expect(next.connected).toBe(true)
    expect(next.lastError).toBe('PARSE_ERROR')
  })

  it('ignores unknown event names', () => {
    const state = { ...INITIAL_STOCK_STREAM_STATE, remainingStock: 42 }
    const next = applyStockStreamEvent(state, 'heartbeat', JSON.stringify({}))
    expect(next).toBe(state)
  })
})

describe('appendHeartbeat', () => {
  it('appends the current remainingStock as a new history point, even with no real change', () => {
    const state = { ...INITIAL_STOCK_STREAM_STATE, remainingStock: 30, history: [{ t: 1000, remainingStock: 30 }] }
    const next = appendHeartbeat(state, 6000)
    expect(next.history).toEqual([{ t: 1000, remainingStock: 30 }, { t: 6000, remainingStock: 30 }])
  })

  it('does nothing before the first snapshot arrives (remainingStock still unknown)', () => {
    const next = appendHeartbeat(INITIAL_STOCK_STREAM_STATE, 6000)
    expect(next).toBe(INITIAL_STOCK_STREAM_STATE)
  })

  it('does nothing once the campaign has sold out - stops the flat tail from growing', () => {
    const state = { ...INITIAL_STOCK_STREAM_STATE, remainingStock: 0, soldOut: true, history: [{ t: 1000, remainingStock: 0 }] }
    const next = appendHeartbeat(state, 6000)
    expect(next).toBe(state)
  })

  it('respects the same MAX_HISTORY_POINTS cap as event-driven updates', () => {
    const step = MIN_POINT_INTERVAL_MS + 1
    const longHistory = Array.from({ length: MAX_HISTORY_POINTS }, (_, i) => ({ t: i * step, remainingStock: 7 }))
    const state = { ...INITIAL_STOCK_STREAM_STATE, remainingStock: 7, history: longHistory }
    const now = MAX_HISTORY_POINTS * step + 99999
    const next = appendHeartbeat(state, now)
    expect(next.history).toHaveLength(MAX_HISTORY_POINTS)
    expect(next.history[next.history.length - 1]).toEqual({ t: now, remainingStock: 7 })
  })
})

describe('savePersistedHistory / loadPersistedHistory', () => {
  it('round-trips totalStock and history through storage, keyed by campaignId', () => {
    const storage = createFakeStorage()
    savePersistedHistory(42, { totalStock: 100, history: [{ t: 1, remainingStock: 90 }] }, storage)

    expect(loadPersistedHistory(42, storage)).toEqual({ totalStock: 100, history: [{ t: 1, remainingStock: 90 }] })
  })

  it('keeps different campaigns in separate keys', () => {
    const storage = createFakeStorage()
    savePersistedHistory(1, { totalStock: 10, history: [{ t: 1, remainingStock: 5 }] }, storage)
    savePersistedHistory(2, { totalStock: 20, history: [{ t: 1, remainingStock: 15 }] }, storage)

    expect(loadPersistedHistory(1, storage).totalStock).toBe(10)
    expect(loadPersistedHistory(2, storage).totalStock).toBe(20)
  })

  it('returns null when nothing was saved for that campaign', () => {
    expect(loadPersistedHistory(999, createFakeStorage())).toBeNull()
  })

  it('returns null instead of throwing on corrupted stored JSON', () => {
    const storage = createFakeStorage()
    storage.setItem('mealiverit_admin_stock_history:7', 'not json')
    expect(loadPersistedHistory(7, storage)).toBeNull()
  })

  it('returns null when storage access itself throws (e.g. secret-mode quota errors)', () => {
    const throwingStorage = {
      getItem: () => { throw new Error('access denied') },
      setItem: () => { throw new Error('quota exceeded') },
    }
    expect(() => savePersistedHistory(1, { totalStock: 1, history: [] }, throwingStorage)).not.toThrow()
    expect(loadPersistedHistory(1, throwingStorage)).toBeNull()
  })
})
