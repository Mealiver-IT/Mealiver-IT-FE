import { useRef, useState } from 'react'
import { computeStockChartGeometry, formatElapsed, nearestPointIndex } from '../../utils/chartGeometry'

const WIDTH = 640
const HEIGHT = 200

// 부하테스트 중 재고가 빠지는 걸 실시간으로 보여주는 area+line 차트 (dataviz 스킬: 단일 시계열 ->
// area, y축은 0~totalStock 고정 스케일, 2px 라인 + ~10% 영역 채움 + 헤어라인 그리드 + 크로스헤어 툴팁).
// 단일 시리즈라 범례는 없음 - 카드 제목(실시간 재고 현황)이 이미 뭘 그리는지 말해준다.
export default function CampaignStockChart({ history, totalStock }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  if (history.length < 2) {
    return (
      <div className="stock-chart-empty">
        데이터를 수집하는 중입니다... (재고 변화가 있을 때마다 점이 찍힙니다)
      </div>
    )
  }

  const geo = computeStockChartGeometry(history, { totalStock, width: WIDTH, height: HEIGHT })
  const { points, gridLines, baselineY, paddingLeft, innerWidth, paddingTop } = geo

  const linePath = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
  const areaPath = `M ${paddingLeft},${baselineY} L ${linePath} L ${points[points.length - 1].x.toFixed(1)},${baselineY} Z`

  const handlePointerMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = WIDTH / rect.width
    const pointerX = (e.clientX - rect.left) * scaleX
    setHoverIndex(nearestPointIndex(points, pointerX))
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null

  return (
    <div className="stock-chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="stock-chart-svg"
        role="img"
        aria-label="캠페인 실시간 재고 추이"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((g) => (
          <g key={g.value}>
            <line x1={paddingLeft} y1={g.y} x2={paddingLeft + innerWidth} y2={g.y} className="stock-chart-gridline" />
            <text x={paddingLeft - 8} y={g.y} className="stock-chart-axis-label" textAnchor="end" dominantBaseline="middle">
              {g.value.toLocaleString('ko-KR')}
            </text>
          </g>
        ))}

        <path d={areaPath} className="stock-chart-area" />
        <path d={`M ${linePath}`} className="stock-chart-line" />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              y1={paddingTop}
              x2={hovered.x}
              y2={baselineY}
              className="stock-chart-crosshair"
            />
            <circle cx={hovered.x} cy={hovered.y} r="5" className="stock-chart-dot" />
          </>
        )}

        <text x={paddingLeft} y={HEIGHT - 6} className="stock-chart-axis-label" textAnchor="start">
          {formatElapsed(points[0].t - points[0].t)} 전
        </text>
        <text x={paddingLeft + innerWidth} y={HEIGHT - 6} className="stock-chart-axis-label" textAnchor="end">
          지금
        </text>
      </svg>

      {hovered && (
        <div
          className="stock-chart-tooltip"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
        >
          <strong>{hovered.remainingStock.toLocaleString('ko-KR')}개 남음</strong>
          <span>{formatElapsed(points[points.length - 1].t - hovered.t)} 전</span>
        </div>
      )}
    </div>
  )
}
