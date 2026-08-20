import { createContext, useContext, useEffect, useState } from 'react'
import { couponEvents, myCoupons as defaultCoupons, DEFAULT_MEMBERSHIP_TIER } from '../data/mockData'
import { claimCampaignCoupon, fetchCampaignStock } from '../api/campaigns'
import { fetchMyCoupons } from '../api/coupons'
import { fetchMembership } from '../api/membership'

// 선착순 이벤트 쿠폰 발급 상태 - 이벤트별(eventId)로 잔여수량/발급여부를 관리.
// 대응: GET /api/campaigns/{campaignId}/stock(구현됨, 폴링으로 사용), POST /api/campaigns/{campaignId}/coupons(구현됨)
// 실제 API를 먼저 시도하고, 실패하면(BE 미기동/네트워크 오류/캠페인 ID 불일치 등) 기존 로컬 mock 동작으로
// 대체함 -> BE가 떠 있으면 진짜로 연동되고, 없으면 데모용 프로토타입으로 계속 동작.

const EventContext = createContext(null)

const initialEventState = Object.fromEntries(
  couponEvents.map((e) => [e.eventId, { remainingStock: e.remainingStock, claimed: false, soldOut: e.remainingStock <= 0 }]),
)

// BE CouponIssueResponse -> FE 쿠폰 표시용 형태로 변환.
// GET /api/members/me/benefits 응답도 완전히 같은 모양이라(2026-08-20 백엔드 가이드) 여기서 export해서
// MyPage 혜택 목록에서도 재사용한다.
// issueId: 실제 BE coupon_issue PK. 주문 생성(POST /api/orders) 시 couponIssueId로 그대로 넘겨야 함.
// mock 전용 쿠폰(기본 보유 쿠폰, API 실패 시 폴백 쿠폰)엔 이 필드가 없음 -> 실제 주문 API에는 못 넘김.
export function toFECoupon(issue) {
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

// claimCoupon 실패(BE 미연결) 시 로컬에서 재고를 1 차감하고 soldOut도 같이 갱신하는 헬퍼.
// 실제 API 성공 시에도 동일한 모양으로 낙관적 갱신 후 다음 폴링에서 서버 값으로 맞춰진다.
function decrementLocally(prev, eventId) {
  const next = Math.max(prev[eventId].remainingStock - 1, 0)
  return { ...prev[eventId], remainingStock: next, claimed: true, soldOut: next <= 0 }
}

export function EventProvider({ children }) {
  const [eventStates, setEventStates] = useState(initialEventState)
  const [walletCoupons, setWalletCoupons] = useState(defaultCoupons)
  const [membershipTier, setMembershipTier] = useState(DEFAULT_MEMBERSHIP_TIER)

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

  // 마운트 시 실제 멤버십 계급 조회 시도 (GET /api/members/me/membership). 실패하면 mock 기본 계급 유지.
  useEffect(() => {
    fetchMembership()
      .then((res) => {
        if (res?.tier) setMembershipTier(res.tier)
      })
      .catch((err) => {
        console.warn('[EventContext] 멤버십 계급 조회 실패, mock 기본값 유지:', err.message)
      })
  }, [])

  // GET /api/campaigns/{campaignId}/stock 폴링 — useEventCoupon을 쓰는 화면(이벤트 목록/상세)이
  // 떠 있는 동안 주기적으로 호출돼 잔여 수량을 서버 값으로 갱신한다. 실패해도 조용히 무시하고
  // 마지막으로 알고 있던 값(로컬 mock 또는 이전 폴링 값)을 유지 — 데모 연속성을 위해 에러를 화면에 안 띄움.
  const refreshStock = async (eventId) => {
    const event = couponEvents.find((e) => e.eventId === eventId)
    if (!event) return
    try {
      const stock = await fetchCampaignStock(event.campaignId)
      setEventStates((prev) => ({
        ...prev,
        [eventId]: { ...prev[eventId], remainingStock: stock.remainingStock, soldOut: stock.soldOut },
      }))
    } catch (err) {
      console.warn(`[EventContext] 재고 폴링 실패(eventId=${eventId}): ${err.message}`)
    }
  }

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
      setEventStates((prev) => ({ ...prev, [eventId]: decrementLocally(prev, eventId) }))
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
      setEventStates((prev) => ({ ...prev, [eventId]: decrementLocally(prev, eventId) }))
      if (event?.rewardCoupon) {
        setWalletCoupons((prev) => addCouponIfNew(prev, event.rewardCoupon))
      }
      return { ok: true }
    }
  }

  const getEventState = (eventId) => eventStates[eventId] ?? { remainingStock: 0, claimed: false, soldOut: true }

  // 결제(checkout) 성공 시 실제로 쿠폰이 BE에서 USED로 전이됐으면 지갑에서 지워서
  // "이미 쓴 쿠폰"이 결제 화면 드롭다운에 다시 뜨는 걸 막는다.
  const removeCouponFromWallet = (couponId) => {
    setWalletCoupons((prev) => prev.filter((c) => c.id !== couponId))
  }

  // 주문 취소 성공 시 BE가 쿠폰을 ISSUED로 되돌리므로(markReturnedToIssued), 지갑에도 다시 추가해서
  // "취소했더니 다시 쓸 수 있게 됨"이 화면에서도 일치하게 만든다.
  const restoreCouponToWallet = (coupon) => {
    if (!coupon) return
    setWalletCoupons((prev) => addCouponIfNew(prev, coupon))
  }

  return (
    <EventContext.Provider
      value={{
        eventStates,
        claimCoupon,
        getEventState,
        refreshStock,
        walletCoupons,
        removeCouponFromWallet,
        restoreCouponToWallet,
        membershipTier,
      }}
    >
      {children}
    </EventContext.Provider>
  )
}

// eventId를 넘기면 해당 이벤트의 발급 상태 + claimCoupon 액션을 반환.
// 컴포넌트가 마운트돼 있는 동안 GET /api/campaigns/{campaignId}/stock을 3초 간격으로 폴링해서
// remainingStock/soldOut을 서버 값으로 계속 갱신한다(이벤트 목록/상세 화면 둘 다 이 훅을 쓰므로
// 두 화면 다 "실시간으로 줄어드는" 효과가 남).
export function useEventCoupon(eventId) {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEventCoupon must be used within EventProvider')
  const state = ctx.getEventState(eventId)

  useEffect(() => {
    ctx.refreshStock(eventId)
    const timer = setInterval(() => ctx.refreshStock(eventId), 3000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  return {
    remainingStock: state.remainingStock,
    claimed: state.claimed,
    soldOut: state.soldOut,
    claimCoupon: () => ctx.claimCoupon(eventId),
  }
}

// 결제 화면 등에서 "지금 실제로 쓸 수 있는 쿠폰 목록"을 조회할 때 사용 (기본 보유 쿠폰 + 이벤트로 받은 쿠폰)
export function useWalletCoupons() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useWalletCoupons must be used within EventProvider')
  return ctx.walletCoupons
}

// 주문 성공/취소 시 지갑 쿠폰 상태를 맞추기 위한 액션. CartContext.checkout/cancelOrder에서 사용.
export function useWalletCouponActions() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useWalletCouponActions must be used within EventProvider')
  return { removeCouponFromWallet: ctx.removeCouponFromWallet, restoreCouponToWallet: ctx.restoreCouponToWallet }
}

// 내 멤버십 계급(enum 문자열, 예: 'SERGEANT') 조회. 한글 표시가 필요하면 utils/membership.tierLabel() 사용.
export function useMembershipTier() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useMembershipTier must be used within EventProvider')
  return ctx.membershipTier
}
