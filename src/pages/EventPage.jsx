import { useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { couponEvents, membership } from '../data/mockData'
import { useEventCoupon } from '../context/EventContext'

// 이벤트 상세 페이지(선착순 쿠폰 수령) - KAN-71
// 대응: GET /api/campaigns/{campaignId}(상세, 구현됨), POST /api/campaigns/{campaignId}/coupons(발급, 구현됨)
// claimCoupon은 실제 API를 먼저 시도하고 실패 시 로컬 mock으로 대체함 (EventContext 참고)
export default function EventPage() {
  const { eventId } = useParams()
  const event = couponEvents.find((e) => e.eventId === eventId)
  const { claimed, remainingStock, claimCoupon } = useEventCoupon(eventId)

  if (!event) {
    return (
      <>
        <TopBar title="이벤트" />
        <div className="screen-content">이벤트 정보를 찾을 수 없습니다.</div>
      </>
    )
  }

  const myDiscountRate = event.discountByLevel[membership.level] ?? 0
  const soldOut = remainingStock <= 0
  const stockRatio = Math.max(0, Math.min(100, Math.round((remainingStock / event.totalStock) * 100)))

  const handleClaim = async () => {
    if (claimed) return
    if (soldOut) {
      alert('선착순 쿠폰이 모두 소진되었습니다.')
      return
    }
    await claimCoupon()
    alert('쿠폰이 발급되었습니다!')
  }

  return (
    <>
      <TopBar title="이벤트" />
      <div className="screen-content">
        <div className="thumb-placeholder tall">이벤트 배너 이미지</div>

        <div className="box-flat">
          <div className="row-between">
            <strong>{event.storeName}</strong>
            <span className="badge">선착순</span>
          </div>
          <p>{event.bannerText}</p>
        </div>

        <div className="box-flat">
          <div className="field-label">잔여 수량</div>
          <div className="stock-bar">
            <div className="stock-bar-fill" style={{ width: `${stockRatio}%` }} />
          </div>
          <p className="empty-text">
            {remainingStock.toLocaleString()} / {event.totalStock.toLocaleString()}장 남음 ({stockRatio}%)
          </p>
        </div>

        <div className="box-flat">
          <div className="field-label">계급별 할인율</div>
          <div className="tier-rate-list">
            {Object.entries(event.discountByLevel).map(([tier, rate]) => (
              <div key={tier} className={`row-between tier-rate-row${tier === membership.level ? ' my-tier' : ''}`}>
                <span>
                  {tier}
                  {tier === membership.level ? ' (내 계급)' : ''}
                </span>
                <span>{rate}%</span>
              </div>
            ))}
          </div>
        </div>

        <p className="empty-text">
          내 계급({membership.level}) 할인율은 <strong>{myDiscountRate}%</strong>가 적용됩니다. 유의사항: 1인 1회 발급,
          발급 후 7일 이내 사용, 행사 종료 시 잔여 쿠폰 자동 소멸.
        </p>

        <button
          type="button"
          className={`btn btn-block${claimed ? ' toggle-btn active' : ''}`}
          disabled={claimed || soldOut}
          onClick={handleClaim}
        >
          {claimed ? '쿠폰 발급 완료' : soldOut ? '선착순 마감' : `${event.bannerText} 받기`}
        </button>
      </div>
    </>
  )
}
