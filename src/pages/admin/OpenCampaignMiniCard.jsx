import { Link } from 'react-router-dom'
import { useCampaignStockStream } from '../../hooks/useCampaignStockStream'
import CampaignStockChart from './CampaignStockChart'

// 대시보드의 "진행중 캠페인 실시간 재고" 그리드용 카드 1개. 캠페인마다 SSE 훅을 따로 열어야 해서
// (React 훅 규칙상 반복문 안에서 직접 호출 불가) 별도 컴포넌트로 분리했다.
export default function OpenCampaignMiniCard({ campaign }) {
  const live = useCampaignStockStream(campaign.id)
  const remainingStock = live.remainingStock ?? campaign.remainingStock
  const totalStock = live.totalStock ?? campaign.totalStock

  return (
    <Link to={`/admin/campaigns/${campaign.id}`} className="dashboard-mini-card">
      <div className="row-between">
        <span className="dashboard-mini-card-title">{campaign.name}</span>
        <span className={`admin-live-dot${live.connected ? ' connected' : ''}`} />
      </div>
      <div className="dashboard-mini-card-numbers">
        <span className="num">{remainingStock.toLocaleString('ko-KR')}</span>
        <span className="empty-text">/ {totalStock.toLocaleString('ko-KR')} 남음</span>
      </div>
      <CampaignStockChart history={live.history} totalStock={totalStock} compact />
    </Link>
  )
}
