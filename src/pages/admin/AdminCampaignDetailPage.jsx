import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteCampaign, fetchCampaignById, fetchCampaignStats, updateCampaignStatus } from '../../api/admin/campaigns'
import { useCampaignStockStream } from '../../hooks/useCampaignStockStream'
import { CAMPAIGN_STATUS_LABELS, formatDiscount } from '../../utils/campaignAdmin'
import { tierLabel } from '../../utils/membership'
import CampaignStockChart from './CampaignStockChart'

// 캠페인 상세 = "쿠폰 조회"(쿠폰은 캠페인과 1:1이라 여기서 같이 보여줌) + 실시간 재고 현황
// (GET /api/admin/campaigns/{id}/stream, SSE) + 발급 통계 + 수동 오픈/마감 + 삭제.
export default function AdminCampaignDetailPage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const live = useCampaignStockStream(campaignId)

  const load = () => {
    setError(null)
    Promise.all([fetchCampaignById(campaignId), fetchCampaignStats(campaignId)])
      .then(([c, s]) => {
        setCampaign(c)
        setStats(s)
      })
      .catch((e) => setError(e.message))
  }

  useEffect(load, [campaignId])

  const handleManualOpen = async () => {
    setBusy(true)
    setError(null)
    try {
      await updateCampaignStatus(campaignId, { status: 'OPEN' })
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleClose = async () => {
    if (!window.confirm('지금 바로 마감할까요? 이후에는 다시 열 수 없습니다.')) return
    setBusy(true)
    setError(null)
    try {
      await updateCampaignStatus(campaignId, { status: 'CLOSED' })
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!campaign) return
    if (!window.confirm(`"${campaign.name}" 캠페인을 삭제할까요? 이미 발급된 쿠폰이 있으면 삭제할 수 없습니다.`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteCampaign(campaignId)
      navigate('/admin/campaigns')
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (!campaign && !error) return <p className="empty-text">불러오는 중...</p>
  if (error && !campaign) return <p className="admin-form-error">{error}</p>

  // SSE는 연결 직후 snapshot 이벤트가 올 때까지 값이 비어있다 - 그 사이엔 최초 fetch로 받은
  // campaign.remainingStock을 그대로 보여줘 화면이 비어보이지 않게 한다.
  const remainingStock = live.remainingStock ?? campaign.remainingStock
  const totalStock = live.totalStock ?? campaign.totalStock
  const status = live.status ?? campaign.status
  const ratio = totalStock > 0 ? Math.max(0, Math.min(100, Math.round((remainingStock / totalStock) * 100))) : 0

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{campaign.name}</h1>
        <span className={`admin-status-pill ${status}`}>{CAMPAIGN_STATUS_LABELS[status] ?? status}</span>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <div className="box-flat admin-stock-card">
        <div className="row-between">
          <span>
            <span className={`admin-live-dot${live.connected ? ' connected' : ''}`} />
            실시간 재고 현황
          </span>
          {stats && <span className="empty-text">누적 발급 {stats.issuedCount.toLocaleString('ko-KR')}건</span>}
        </div>
        <div className="admin-stock-numbers">
          <span className="num">{remainingStock.toLocaleString('ko-KR')}</span>
          <span className="empty-text">/ {totalStock.toLocaleString('ko-KR')} 남음</span>
        </div>
        <div className="stock-bar">
          <div className="stock-bar-fill" style={{ width: `${ratio}%` }} />
        </div>
        <CampaignStockChart history={live.history} totalStock={totalStock} />
      </div>

      <div className="box-flat">
        <p className="field-label">쿠폰 정책</p>
        {campaign.coupon ? (
          <ul>
            <li>{formatDiscount(campaign.coupon.discountType, campaign.coupon.discountValue)}</li>
            <li>대상 등급: {campaign.minMembershipTier ? `${tierLabel(campaign.minMembershipTier)} 이상` : '전체 회원'}</li>
            {campaign.coupon.minOrderAmount != null && <li>최소 주문 금액: {campaign.coupon.minOrderAmount.toLocaleString('ko-KR')}원</li>}
            {campaign.coupon.maxDiscountAmount != null && <li>최대 할인 금액: {campaign.coupon.maxDiscountAmount.toLocaleString('ko-KR')}원</li>}
            <li>발급 후 유효 시간: {campaign.coupon.validHours}시간</li>
          </ul>
        ) : (
          <p className="empty-text">연결된 쿠폰 정책이 없습니다.</p>
        )}
        <p className="empty-text">오픈 시각: {campaign.openAt ?? '미정 (예약 없음)'}</p>
        <p className="empty-text">마감 시각: {campaign.closeAt ?? '무기한'}</p>
      </div>

      <div className="admin-form-actions">
        {status !== 'OPEN' && (
          <button type="button" className="btn btn-block-outline" style={{ width: 'auto' }} disabled={busy} onClick={handleManualOpen}>
            지금 수동 오픈
          </button>
        )}
        {status !== 'CLOSED' && (
          <button type="button" className="btn btn-block-outline" style={{ width: 'auto' }} disabled={busy} onClick={handleClose}>
            지금 마감
          </button>
        )}
        <button type="button" className="btn" disabled={busy} onClick={handleDelete}>
          캠페인 삭제
        </button>
      </div>
    </div>
  )
}
