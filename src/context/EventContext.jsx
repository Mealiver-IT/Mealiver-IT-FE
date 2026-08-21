import { createContext, useContext, useEffect, useState } from 'react'
import { couponEvents as mockCouponEvents, myCoupons as defaultCoupons, DEFAULT_MEMBERSHIP_TIER } from '../data/mockData'
import { claimCampaignCoupon, fetchCampaignStock, fetchCampaigns } from '../api/campaigns'
import { fetchMyCoupons } from '../api/coupons'
import { fetchMembership } from '../api/membership'
import { RATE_DISCOUNT_BY_TIER } from '../utils/membership'

// 이벤트(선착순 캠페인) 목록/상태 관리 - 실제 DB 캠페인을 GET /api/campaigns로 불러와 이벤트 목록/상세
// 화면에 노출한다. 실패하면(BE 미기동 등) 기존 mock 이벤트 2개로 대체 — 데모 연속성 유지.
//
// ⚠️ 임시 필터 (2026-08-20 팀 확인): 팀 공유 DB에 부하테스트/오염데이터 검증용 캠페인이 대량으로
// 섞여 있어서(phase1-*, phase2-*, DIRTY_* 등, id 17번 이후 대부분), 정상적으로 등록된 캠페인만
// 하드코딩으로 걸러낸다(id 2~16, id 1은 deploy-verify-campaign). 캠페인 테이블 자체엔 "정상/오염"을
// 구분하는 필드가 없어서 ID 범위로 거르는 것 말고는 방법이 없다 — 데이터 정리가 끝나면 이 필터를 지우면 된다.
//
// status는 여기서 필터링하지 않는다 — CLOSED/READY 캠페인도 "마감"/"오픈 예정" 상태로 목록에 그대로
// 노출한다(이벤트 기간 안이면 마감됐다는 사실 자체도 정보다, 그냥 안 보이게 숨기면 안 됨).
// status는 정적 메타데이터가 아니라 eventStates에 넣어서 재고와 같이 폴링으로 계속 갱신한다 —
// 누가 캠페인을 READY→OPEN으로 바꾸면 새로고침 없이도 화면에 반영되도록.
const CLEAN_CAMPAIGN_ID_MIN = 2
const CLEAN_CAMPAIGN_ID_MAX = 16
function isCleanCampaignId(id) {
  return id >= CLEAN_CAMPAIGN_ID_MIN && id <= CLEAN_CAMPAIGN_ID_MAX
}

// BE CampaignResponse -> FE 이벤트 카드 표시용 형태.
// BE엔 "가게" 개념이 없어서(계급 산정용 최소 스키마) 캠페인명을 그대로 가게명 자리에 쓴다.
// RATE 타입은 캠페인 자체의 discountValue를 화면에 안 쓴다 — 실제 적용 할인율은 발급 시점
// 유저 계급으로 결정되는 고정 정책(RATE_DISCOUNT_BY_TIER, TierDiscountPolicy와 동일)이라서다.
function toFEEvent(campaign) {
  const coupon = campaign.coupon ?? {}
  const bannerText =
    coupon.discountType === 'FIXED'
      ? `선착순 ${Number(coupon.discountValue).toLocaleString()}원 쿠폰`
      : '선착순 계급별 할인 쿠폰'
  return {
    eventId: String(campaign.id),
    campaignId: campaign.id,
    storeName: campaign.name,
    bannerText,
    totalStock: campaign.totalStock,
    minMembershipTier: campaign.minMembershipTier ?? null,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue != null ? Number(coupon.discountValue) : null,
    minOrderAmount: coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : null,
    maxDiscountAmount: coupon.maxDiscountAmount != null ? Number(coupon.maxDiscountAmount) : null,
  }
}

// mock couponEvents(BE 미연결 시 폴백)도 같은 shape으로 맞춘다 — discountByLevel은 이제 안 쓰고
// discountType/discountValue 기준으로 통일.
function mockEventToFEEvent(event) {
  return {
    eventId: event.eventId,
    campaignId: event.campaignId,
    storeName: event.storeName,
    bannerText: event.bannerText,
    totalStock: event.totalStock,
    minMembershipTier: null,
    discountType: event.rewardCoupon?.discountType ?? 'FIXED',
    discountValue: event.rewardCoupon?.discountValue ?? 0,
    minOrderAmount: null,
    maxDiscountAmount: null,
    _mockRemainingStock: event.remainingStock,
    _mockRewardCoupon: event.rewardCoupon,
  }
}

const EventContext = createContext(null)

// BE CouponIssueResponse -> FE 쿠폰 표시용 형태로 변환.
// GET /api/members/me/benefits 응답도 완전히 같은 모양이라(2026-08-20 백엔드 가이드) 여기서 export해서
// MyPage 혜택 목록에서도 재사용한다.
// issueId: 실제 BE coupon_issue PK. 주문 생성(POST /api/orders) 시 couponIssueId로 그대로 넘겨야 함.
export function toFECoupon(issue) {
  const isRate = issue.discountType === 'RATE'
  return {
    id: `issue-${issue.id}`,
    issueId: issue.id,
    name: issue.campaignName ?? `쿠폰 (${issue.couponCode})`,
    discountType: issue.discountType,
    // RATE 쿠폰은 BE가 발급 시점에 TierDiscountPolicy.rateFor()로 계산해서 저장하는데, 그 값이
    // 0.10/0.30/0.50처럼 "소수"다(2026-08-21 실제 발급 응답으로 확인: discountValue: 0.10).
    // 반면 utils/coupon.js의 calcCouponDiscount/formatDiscountDetail은 discountValue를 "퍼센트 정수"로
    // 기대한다(10을 그대로 %로 보여주고, /100 해서 할인액을 계산) — 단위를 안 맞추면 10% 할인이
    // 0.1%로 계산돼서 할인액이 100배 작게 나온다(예: 27,000원 주문에 27원만 할인). 100을 곱해 단위를 맞춘다.
    // FIXED는 원 단위 그대로라 손댈 필요 없음.
    discountValue: isRate ? Number(issue.discountValue) * 100 : Number(issue.discountValue),
    maxDiscount: issue.maxDiscountAmount != null ? Number(issue.maxDiscountAmount) : undefined,
    validUntil: issue.validUntil ?? null, // 쿠폰함 화면에서 "~까지 사용 가능" 표시용. mock 쿠폰엔 없음(null)
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
  const [events, setEvents] = useState([]) // 이벤트 메타데이터(캠페인 목록) - 실제 API 또는 mock 폴백
  const [eventStates, setEventStates] = useState({}) // eventId -> { remainingStock, claimed, soldOut }
  const [eventsFetchFailed, setEventsFetchFailed] = useState(false)
  const [walletCoupons, setWalletCoupons] = useState(defaultCoupons)
  const [membershipTier, setMembershipTier] = useState(DEFAULT_MEMBERSHIP_TIER)

  // 마운트 시 실제 캠페인 목록 조회 (GET /api/campaigns). 성공하면 정상 캠페인(2~16번, 위 주석 참고)만
  // 걸러서 이벤트 목록으로 쓰고, 실패하면(BE 미연결 등) 기존 mock 이벤트 2개로 대체한다.
  useEffect(() => {
    fetchCampaigns()
      .then((campaigns) => {
        const clean = (Array.isArray(campaigns) ? campaigns : []).filter((c) => isCleanCampaignId(c.id))
        const mapped = clean.map(toFEEvent)
        setEvents(mapped)
        setEventStates(
          Object.fromEntries(
            clean.map((c) => [
              String(c.id),
              { remainingStock: c.remainingStock, claimed: false, soldOut: c.remainingStock <= 0, status: c.status },
            ]),
          ),
        )
      })
      .catch((err) => {
        console.warn('[EventContext] 캠페인 목록 조회 실패, mock 이벤트로 대체:', err.message)
        const mapped = mockCouponEvents.map(mockEventToFEEvent)
        setEvents(mapped)
        setEventStates(
          Object.fromEntries(
            mapped.map((e) => [
              e.eventId,
              { remainingStock: e._mockRemainingStock, claimed: false, soldOut: e._mockRemainingStock <= 0, status: 'OPEN' },
            ]),
          ),
        )
        setEventsFetchFailed(true)
      })
  }, [])

  // GET /api/members/me/coupons를 다시 불러와 지갑을 서버 기준으로 맞춘다.
  // "지금 실제로 쓸 수 있는(ISSUED) 쿠폰"만 내려주는 API라, 취소로 되돌아온 쿠폰이 있으면 여기서 다시 잡힌다.
  // 이번 세션에 만든 주문이 아니어서(couponIssueId를 몰라서) restoreCouponToWallet으로 못 되돌리는 경우의
  // 안전망 — 새로고침해야만 보이던 걸 취소 직후에 바로 보이게 하려고 추가함.
  const refreshWalletCoupons = () => {
    return fetchMyCoupons()
      .then((issues) => {
        if (Array.isArray(issues) && issues.length > 0) {
          setWalletCoupons((prev) => issues.reduce((acc, issue) => addCouponIfNew(acc, toFECoupon(issue)), prev))
        }
      })
      .catch((err) => {
        console.warn('[EventContext] 보유 쿠폰 API 조회 실패, mock 데이터 유지:', err.message)
      })
  }

  // 마운트 시 1회 실행
  useEffect(() => {
    refreshWalletCoupons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const findEvent = (eventId) => events.find((e) => e.eventId === eventId)

  // GET /api/campaigns/{campaignId}/stock 폴링 — useEventCoupon을 쓰는 화면(이벤트 목록/상세)이
  // 떠 있는 동안 주기적으로 호출돼 잔여 수량을 서버 값으로 갱신한다. 실패해도 조용히 무시하고
  // 마지막으로 알고 있던 값(로컬 mock 또는 이전 폴링 값)을 유지 — 데모 연속성을 위해 에러를 화면에 안 띄움.
  const refreshStock = async (eventId) => {
    const event = findEvent(eventId)
    if (!event || eventsFetchFailed) return // mock 폴백 상태에선 폴링할 실제 캠페인이 없음
    try {
      const stock = await fetchCampaignStock(event.campaignId)
      setEventStates((prev) => ({
        ...prev,
        [eventId]: { ...prev[eventId], remainingStock: stock.remainingStock, soldOut: stock.soldOut, status: stock.status },
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
    if (!current || current.claimed || current.remainingStock <= 0 || current.status !== 'OPEN') {
      return { ok: false, message: '이미 처리된 요청입니다.' }
    }
    const event = findEvent(eventId)
    if (!event) return { ok: false, message: '이벤트 정보를 찾을 수 없습니다.' }

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
      const rewardCoupon =
        event._mockRewardCoupon ??
        {
          id: `mock-coupon-${eventId}`,
          name: event.storeName,
          discountType: event.discountType,
          discountValue: event.discountType === 'RATE' ? RATE_DISCOUNT_BY_TIER[membershipTier] : event.discountValue,
          maxDiscount: event.maxDiscountAmount,
        }
      setWalletCoupons((prev) => addCouponIfNew(prev, rewardCoupon))
      return { ok: true }
    }
  }

  const getEventState = (eventId) => eventStates[eventId] ?? { remainingStock: 0, claimed: false, soldOut: true, status: 'CLOSED' }

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
        events,
        eventsFetchFailed,
        eventStates,
        claimCoupon,
        getEventState,
        refreshStock,
        walletCoupons,
        removeCouponFromWallet,
        restoreCouponToWallet,
        refreshWalletCoupons,
        membershipTier,
      }}
    >
      {children}
    </EventContext.Provider>
  )
}

// 이벤트(캠페인) 메타데이터 목록 조회 - 이벤트 목록/상세 화면에서 사용
export function useEvents() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEvents must be used within EventProvider')
  return { events: ctx.events, eventsFetchFailed: ctx.eventsFetchFailed }
}

// eventId를 넘기면 해당 이벤트의 발급 상태 + claimCoupon 액션을 반환.
// 컴포넌트가 마운트돼 있는 동안 GET /api/campaigns/{campaignId}/stock을 3초 간격으로 폴링해서
// remainingStock/soldOut을 서버 값으로 계속 갱신한다(이벤트 목록/상세 화면 둘 다 이 훅을 쓰므로
// 두 화면 다 "실시간으로 줄어드는" 효과가 남). mock 폴백 상태에선 폴링하지 않는다(캠페인 ID가 가짜라서).
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
    status: state.status, // 'READY' | 'OPEN' | 'CLOSED'
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
  return {
    removeCouponFromWallet: ctx.removeCouponFromWallet,
    restoreCouponToWallet: ctx.restoreCouponToWallet,
    refreshWalletCoupons: ctx.refreshWalletCoupons,
  }
}

// 내 멤버십 계급(enum 문자열, 예: 'SERGEANT') 조회. 한글 표시가 필요하면 utils/membership.tierLabel() 사용.
export function useMembershipTier() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useMembershipTier must be used within EventProvider')
  return ctx.membershipTier
}
