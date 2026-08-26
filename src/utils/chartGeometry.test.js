import { describe, expect, it } from 'vitest'
import { computeStockChartGeometry, formatElapsed, nearestPointIndex } from './chartGeometry'

const DIMS = { width: 600, height: 180 }

describe('computeStockChartGeometry', () => {
  it('returns empty geometry for an empty history', () => {
    const geo = computeStockChartGeometry([], { totalStock: 100, ...DIMS })
    expect(geo.points).toEqual([])
    expect(geo.gridLines).toEqual([])
  })

  it('scales the y axis against totalStock, not the max sampled value', () => {
    const history = [
      { t: 0, remainingStock: 100 },
      { t: 1000, remainingStock: 60 },
    ]
    const geo = computeStockChartGeometry(history, { totalStock: 1000, ...DIMS })
    // remainingStock 100/1000 -> 거의 바닥 근처(재고가 왕창 빠진 것처럼) 찍혀야 함
    const nearFullY = geo.points[0].y
    const nearBaseline = geo.baselineY
    expect(nearFullY).toBeGreaterThan(geo.paddingTop) // 꼭대기(0)에 붙어있지 않음
    expect(nearBaseline - nearFullY).toBeLessThan(nearBaseline - geo.paddingTop) // 바닥에 훨씬 가까움
  })

  it('places the first point at the left padding and the last point at the right edge', () => {
    const history = [
      { t: 1000, remainingStock: 50 },
      { t: 2000, remainingStock: 40 },
      { t: 3000, remainingStock: 30 },
    ]
    const geo = computeStockChartGeometry(history, { totalStock: 100, ...DIMS })
    expect(geo.points[0].x).toBeCloseTo(geo.paddingLeft)
    expect(geo.points[2].x).toBeCloseTo(geo.paddingLeft + geo.innerWidth)
  })

  it('does not divide by zero when every point shares the same timestamp', () => {
    const history = [
      { t: 5000, remainingStock: 10 },
      { t: 5000, remainingStock: 9 },
    ]
    expect(() => computeStockChartGeometry(history, { totalStock: 100, ...DIMS })).not.toThrow()
  })

  it('produces gridlines at 0, half, and totalStock', () => {
    const history = [{ t: 0, remainingStock: 5 }]
    const geo = computeStockChartGeometry(history, { totalStock: 200, ...DIMS })
    expect(geo.gridLines.map((g) => g.value)).toEqual([0, 100, 200])
  })
})

describe('nearestPointIndex', () => {
  const points = [{ x: 0 }, { x: 10 }, { x: 25 }, { x: 100 }]

  it('returns -1 for an empty points array', () => {
    expect(nearestPointIndex([], 50)).toBe(-1)
  })

  it('snaps to the closest point by x distance', () => {
    expect(nearestPointIndex(points, 12)).toBe(1)
    expect(nearestPointIndex(points, 90)).toBe(3)
    expect(nearestPointIndex(points, 17)).toBe(1) // 10과 25의 중간보다 10에 더 가까움(거리 7 vs 8)
  })
})

describe('formatElapsed', () => {
  it('formats sub-minute durations as seconds', () => {
    expect(formatElapsed(0)).toBe('0s')
    expect(formatElapsed(45000)).toBe('45s')
  })

  it('formats minute-plus durations as "Xm Ys"', () => {
    expect(formatElapsed(90000)).toBe('1m 30s')
  })
})
