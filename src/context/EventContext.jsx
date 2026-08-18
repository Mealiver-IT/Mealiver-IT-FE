import { createContext, useContext, useEffect, useState } from 'react'
import { couponEvents, myCoupons as defaultCoupons } from '../data/mockData'
import { claimCampaignCoupon } from '../api/campaigns'
import { fetchMyCoupons } from '../api/coupons'

// 선착순 이벤트 쿠폰 발급 상태 - 이벤트별(eventId)로 잔여수량/발급여부를 관리.
// 대응: GET /api/campaigns/{campaignId}/stock(미구현), POST /api/campaigns/{campaignId}/coupons(구현됨)
// 실제 API를 먼저 시도하고, 실패하면(BE 미기동/네트워크 오류/캠페인 ID 불일치 등) 기존 로컬 mock 동작으로
// 대체함 -> BE가 떠 있으면 진짜로 연동되고, 없으면 데모용 프로토타입으로 계속 동작.

const EventContext = createContext(null)

const initialEventState = Object.fromEntries(
  couponEvents.map((e) => [e.eventId, { remainingStock: e.remainingStock, claimed: false }]),
)

// BE CouponIssueResponse -> FE 쿠폰 표시용 형태로 변환
// issueId: 실제 BE coupon_issue PK. 주문 생성(POST /api/orders) 시 couponIssueId로 그대로 넘겨야 함.
// mock 전용 쿠폰(기본 보유 쿠폰, API 실패 시 폴백 쿠폰)엔 이 필드가 없음 -> 실제 주문 API에는 못 넘김.
function toFECoupon(issue) {
  return {
    id: `issue-${issue.id}`,
    issueId: issue.id,
    name: issue.campaignName ?? `쿠폰 (${issue.couponCode})`,
    discountType: issue.discountType,
    discountValue: Number(issue.discountValue),
    maxDiscount: issue.maxDiscountAmount != null ? Number(issue.maxDiscountAmount) : undefined,
  }
}

// 같은 id 쿠폰이 이미 지갑에 있으면 무시(중복 발급 응답/재클레임 대비), 없으면 추가
function addCouponIfNew(prev, coupon) {
  return prev.some((c) => c.id === coupon.id) ? prev : [...prev, coupon]
}

export function EventProvider({ children }) {
  const [eventStates, setEventStates] = useState(initialEventState)
  const [walletCoupons, setWalletCoupons] = useState(defaultCoupons)

  // 마운트 시 실제 보유 쿠폰 조회 시도 (GET /api/members/me/coupons).
  // 성공하면 기본(mock) 쿠폰 + 실제 발급받은 쿠폰을 합쳐서 보여줌. 실패하면 기본 mock 지갑 그대로 유지.
  useEffect(() => {
    fetchMyCoupons()
      .then((issues) => {
        if (Array.isArray(issues) && issues.length > 0) {
          setWalletCoupons((prev) => issues.reduce((acc, issue) => addCouponIfNew(acc, toFECoupon(issue)), prev))
        }
      })
      .catch((err) => {
        console.warn('[EventContext] 보유 쿠폰 API 조회 실패, mock 데이터 유지:', err.message)
      })
  }, [])

  // 반환값: { ok: true } 성공(실제 발급 또는 BE 미연결 시 mock 폴백) / { ok: false, code, message } BE가
  // 정상 응답했지만 거부한 경우(품절/중복수령/등급미달/미오픈 등, FR-FCFS-031). 호출부(EventPage)가 이 둘을
  // 구분해서 사용자에게 실제 사유를 보여줘야 한다 — 전부 "성공"으로 뭉개면 등급 미달 요청도 발급된 것처럼
  // 보이는 오탐이 생긴다.
  const claimCoupon = async (eventId) => {
    const current = eventStates[eventId]
    if (!current || current.claimed || current.remainingStock <= 0) return { ok: false, message: '이미 처리된 요청입니다.' }
    const event = couponEvents.find((e) => e.eventId === eventId)

    try {
      // 실제 API 시도: POST /api/campaigns/{campaignId}/coupons
      // (계정당 1회 제약 때문에 이미 발급받은 상태로 재요청해도 BE가 기존 발급 건을 그대로 돌려줌 -> addCouponIfNew로 중복 추가 방지)
      const issue = await claimCampaignCoupon(event.campaignId)
      setEventStates((prev) => ({
        ...prev,
        [eventId]: { remainingStock: Math.max(prev[eventId].remainingStock - 1, 0), claimed: true },
      }))
      setWalletCoupons((prev) => addCouponIfNew(prev, toFECoupon(issue)))
      return { ok: true }
    } catch (err) {
      if (err.code) {
        // BE가 실제로 응답했고, 정당한 사유로 거부한 것 -> mock으로 눙치지 말고 사유 그대로 전달
        console.warn(`[EventContext] 발급 거부: ${err.code} - ${err.message}`)
        return { ok: false, code: err.code, message: err.message }
      }
      // code가 없다 = BE에 아예 도달하지 못함(미기동/네트워크 오류/캠페인ID 불일치 등) -> 로컬 mock으로 대체 (데모용 폴백)
      console.warn(`[EventContext] 발급 API 연결 실패, mock으로 대체 처리: ${err.message}`)
      setEventStates((prev) => ({
        ...prev,
        [eventId]: { remainingStock: Math.max(prev[eventId].remainingStock - 1, 0), claimed: true },
      }))
      if (event?.rewardCoupon) {
        setWalletCoupons((prev) => addCouponIfNew(prev, event.rewardCoupon))
      }
      return { ok: true }
    }
  }

  const getEventState = (eventId) => eventStates[eventId] ?? { remainingStock: 0, claimed: false }

  return (
    <EventContext.Provider value={{ eventStates, claimCoupon, getEventState, walletCoupons }}>
      {children}
    </EventContext.Provider>
  )
}

// eventId를 넘기면 해당 이벤트의 발급 상태 + claimCoupon 액션을 반환
export function useEventCoupon(eventId) {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEventCoupon must be used within EventProvider')
  const state = ctx.getEventState(eventId)
  return {
    remainingStock: state.remainingStock,
    claimed: state.claimed,
    claimCoupon: () => ctx.claimCoupon(eventId),
  }
}

// 결제 화면 등에서 "지금 실제로 쓸 수 있는 쿠폰 목록"을 조회할 때 사용 (기본 보유 쿠폰 + 이벤트로 받은 쿠폰)
export function useWalletCoupons() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useWalletCoupons must be used within EventProvider')
  return ctx.walletCoupons
}
