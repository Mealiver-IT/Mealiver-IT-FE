import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCampaignStock } from '../../api/admin/campaigns'
import CampaignStockChart from './CampaignStockChart'

const POLL_INTERVAL_MS = 3000
const MAX_HISTORY_POINTS = 60

// 대시보드의 "진행중 캠페인 실시간 재고" 그리드용 카드 1개.
// 예전엔 캠페인마다 useCampaignStockStream(SSE)을 따로 열었는데, OPEN 캠페인이 6개만 돼도
// 브라우저의 오리진당 연결 제한(HTTP/1.1 기본 6개)에 걸려 대시보드를 벗어나는 네비게이션 자체가
// 최대 1분 가까이 멎었다(2026-08-27 실측: 58초). 상세 페이지처럼 정밀한 실시간성이 필요한 자리가
// 아니라서(그리드에서 추이만 훑어보는 용도) SSE 대신 가벼운 폴링(/stock, Redis 스냅샷 우선)으로
// 바꿔 카드가 몇 개든 오리진당 연결을 하나도 안 붙잡게 했다.
export default function OpenCampaignMiniCard({ campaign }) {
  const [stock, setStock] = useState({ remainingStock: campaign.remainingStock, totalStock: campaign.totalStock })
  const [history, setHistory] = useState([])
  const lastValueRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const poll = () => {
      fetchCampaignStock(campaign.id)
        .then((res) => {
          if (cancelled) return
          setStock({ remainingStock: res.remainingStock, totalStock: res.totalStock })
          // 값이 실제로 바뀔 때만 점을 추가 - 평평한 구간까지 매번 찍으면 스파크라인이 밋밋하게 늘어지기만 함.
          if (lastValueRef.current !== res.remainingStock) {
            lastValueRef.current = res.remainingStock
            setHistory((prev) => {
              const next = [...prev, { t: Date.now(), remainingStock: res.remainingStock }]
              return next.length > MAX_HISTORY_POINTS ? next.slice(next.length - MAX_HISTORY_POINTS) : next
            })
          }
        })
        .catch(() => {})
    }

    poll()
    const timer = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [campaign.id])

  return (
    <Link to={`/admin/campaigns/${campaign.id}`} className="dashboard-mini-card">
      <div className="row-between">
        <span className="dashboard-mini-card-title">{campaign.name}</span>
      </div>
      <div className="dashboard-mini-card-numbers">
        <span className="num">{stock.remainingStock.toLocaleString('ko-KR')}</span>
        <span className="empty-text">/ {stock.totalStock.toLocaleString('ko-KR')} 남음</span>
      </div>
      <CampaignStockChart history={history} totalStock={stock.totalStock} compact />
    </Link>
  )
}
