import { useState } from 'react'
import { useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import ActionErrorPage from '../components/ActionErrorPage'
import { useEventCoupon, useEvents, useMembershipTier } from '../context/EventContext'
import { tierLabel, meetsMinTier, RATE_DISCOUNT_BY_TIER, TIER_ORDER } from '../utils/membership'
import FoodIcon from '../components/FoodIcon'

// 이벤트 상세 페이지(선착순 쿠폰 수령) - KAN-71
// 대응: GET /api/campaigns(목록, 연동함), GET /api/campaigns/{campaignId}/stock(잔여수량 폴링),
//       POST /api/campaigns/{campaignId}/coupons(발급)
// claimCoupon 실패(BE 거부든 네트워크 오류든)는 ActionErrorPage로 그대로 보여준다 (EventContext 참고)
//
// 할인 표시 로직이 discountType에 따라 갈린다 — RATE 타입은 캠페인 자체 할인율이 아니라
// 발급 시점 유저 계급으로 결정되는 고정 정책(RATE_DISCOUNT_BY_TIER)을 그대로 보여주고,
// FIXED 타입은 캠페인이 정한 금액을 그대로 보여주되 최소 계급 제한(minMembershipTier)이 있으면
// eligibility 문구를 띄운다.
export default function EventPage() {
  const { eventId } = useParams()
  const { events } = useEvents()
  const event = events.find((e) => e.eventId === eventId)
  const { claimed, remainingStock, soldOut, status, claimCoupon } = useEventCoupon(eventId)
  const membershipTier = useMembershipTier()
  const [actionError, setActionError] = useState(null) // { code, message } — 발급 실패 시 ActionErrorPage로 표시

  if (!event) {
    return (
      <>
        <TopBar title="이벤트" />
        <div className="screen-content">이벤트 정보를 찾을 수 없습니다.</div>
      </>
    )
  }

  const isRate = event.discountType === 'RATE'
  const eligible = meetsMinTier(membershipTier, event.minMembershipTier)
  const myDiscountRate = isRate ? RATE_DISCOUNT_BY_TIER[membershipTier] ?? 0 : null
  const stockRatio = Math.max(0, Math.min(100, Math.round((remainingStock / event.totalStock) * 100)))
  const notOpen = status !== 'OPEN' // CLOSED(마감) 또는 READY(오픈 예정) — 캠페인 기간 안이어도 지금은 못 받음

  const handleClaim = async () => {
    if (claimed) return
    if (status === 'READY') {
      alert('아직 오픈 전인 이벤트입니다.')
      return
    }
    if (status === 'CLOSED' || soldOut) {
      alert('선착순 쿠폰이 모두 소진되었거나 마감된 이벤트입니다.')
      return
    }
    if (!eligible) {
      alert(`${tierLabel(event.minMembershipTier)} 이상만 받을 수 있는 쿠폰입니다.`)
      return
    }
    setActionError(null)
    const result = await claimCoupon()
    if (!result.ok) {
      setActionError({ code: result.code, message: result.message })
      return
    }
    alert('쿠폰이 발급되었습니다!')
  }

  if (actionError) {
    return (
      <>
        <TopBar title="이벤트" />
        <div className="screen-content">
          <ActionErrorPage
            code={actionError.code}
            message={actionError.message}
            onRetry={handleClaim}
            onClose={() => setActionError(null)}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="이벤트" />
      <div className="screen-content">
        <div className="thumb-placeholder tall">
          <FoodIcon name="coupon" />
        </div>

        <div className="box-flat">
          <div className="row-between">
            <strong>{event.storeName}</strong>
            <span className="badge">{status === 'CLOSED' ? '마감' : status === 'READY' ? '오픈 예정' : '선착순'}</span>
          </div>
          <p>{event.bannerText}</p>
          {event.minOrderAmount != null && (
            <p className="empty-text">최소 주문금액 {event.minOrderAmount.toLocaleString()}원 이상</p>
          )}
          {event.minMembershipTier && <p className="empty-text">{tierLabel(event.minMembershipTier)} 이상 참여 가능</p>}
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

        {isRate ? (
          <>
            <div className="box-flat">
              <div className="field-label">계급별 할인율</div>
              <div className="tier-rate-list">
                {TIER_ORDER.map((tier) => (
                  <div key={tier} className={`row-between tier-rate-row${tier === membershipTier ? ' my-tier' : ''}`}>
                    <span>
                      {tierLabel(tier)}
                      {tier === membershipTier ? ' (내 계급)' : ''}
                    </span>
                    <span>{RATE_DISCOUNT_BY_TIER[tier]}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="empty-text">
              내 계급({tierLabel(membershipTier)}) 할인율은 <strong>{myDiscountRate}%</strong>가 적용됩니다.
              {event.maxDiscountAmount != null && ` 최대 ${event.maxDiscountAmount.toLocaleString()}원까지 할인됩니다.`} 유의사항:
              1인 1회 발급, 행사 종료 시 잔여 쿠폰 자동 소멸.
            </p>
          </>
        ) : (
          <p className="empty-text">
            <strong>{event.discountValue?.toLocaleString()}원</strong> 할인 쿠폰입니다.
            {!eligible && ` ${tierLabel(event.minMembershipTier)} 이상만 받을 수 있습니다.`} 유의사항: 1인 1회 발급, 행사
            종료 시 잔여 쿠폰 자동 소멸.
          </p>
        )}

        <button
          type="button"
          className={`btn btn-block${claimed ? ' toggle-btn active' : ''}`}
          disabled={claimed || soldOut || notOpen || !eligible}
          onClick={handleClaim}
        >
          {claimed
            ? '쿠폰 발급 완료'
            : status === 'READY'
              ? '오픈 예정'
              : status === 'CLOSED' || soldOut
                ? '선착순 마감'
                : !eligible
                  ? '참여 불가'
                  : `${event.bannerText} 받기`}
        </button>
      </div>
    </>
  )
}
