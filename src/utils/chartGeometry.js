// CampaignStockChart 전용 순수 스케일링 로직 - SVG 렌더링과 분리해서 단위테스트한다.
// y축은 항상 0~totalStock 고정 스케일(재고가 "가득 찬 상태에서 빠지는" 것을 보여주는 게 목적이라
// remainingStock 최댓값이 아니라 totalStock 기준으로 그려야 드는 양이 실제 소진 비율대로 보인다).

export function computeStockChartGeometry(
  history,
  { totalStock, width, height, paddingLeft = 44, paddingRight = 12, paddingTop = 12, paddingBottom = 24 },
) {
  const innerWidth = width - paddingLeft - paddingRight
  const innerHeight = height - paddingTop - paddingBottom
  const baselineY = paddingTop + innerHeight

  if (history.length === 0) {
    return { points: [], gridLines: [], innerWidth, innerHeight, paddingLeft, paddingTop, baselineY, yMax: 0 }
  }

  const t0 = history[0].t
  const tN = history[history.length - 1].t
  const tSpan = Math.max(tN - t0, 1) // 포인트가 1개뿐이거나 동시각이면 0으로 나누는 것 방지
  const yMax = Math.max(totalStock ?? 0, ...history.map((p) => p.remainingStock), 1)

  const xFor = (t) => paddingLeft + ((t - t0) / tSpan) * innerWidth
  const yFor = (v) => paddingTop + innerHeight - (Math.max(v, 0) / yMax) * innerHeight

  const points = history.map((p) => ({ x: xFor(p.t), y: yFor(p.remainingStock), t: p.t, remainingStock: p.remainingStock }))
  const gridLines = [0, yMax / 2, yMax].map((value) => ({ value: Math.round(value), y: yFor(value) }))

  return { points, gridLines, innerWidth, innerHeight, paddingLeft, paddingTop, baselineY, yMax, t0, tSpan }
}

// 포인터 X좌표에서 가장 가까운 데이터 포인트의 인덱스 - 크로스헤어/툴팁이 스냅할 위치.
export function nearestPointIndex(points, pointerX) {
  if (points.length === 0) return -1
  let best = 0
  let bestDist = Math.abs(points[0].x - pointerX)
  for (let i = 1; i < points.length; i++) {
    const dist = Math.abs(points[i].x - pointerX)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}

export function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}
