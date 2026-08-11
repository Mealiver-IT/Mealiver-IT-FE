import { createContext, useContext, useState } from 'react'
import { couponEvents, myCoupons as defaultCoupons } from '../data/mockData'

// 선착순 이벤트 쿠폰 발급 상태 - 이벤트별(eventId)로 잔여수량/발급여부를 관리.
// 대응: GET /api/coupon-events/{eventId}/stock, POST /api/coupon-events/{eventId}/claim
// 클레임에 성공하면 rewardCoupon을 지갑(walletCoupons)에 추가함 -> 결제 화면 쿠폰 목록은 이 지갑을 참조.
// (받지 않은 이벤트 쿠폰은 결제 화면에 노출되면 안 됨)

const EventContext = createContext(null)

const initialEventState = Object.fromEntries(
  couponEvents.map((e) => [e.eventId, { remainingStock: e.remainingStock, claimed: false }]),
)

export function EventProvider({ children }) {
  const [eventStates, setEventStates] = useState(initialEventState)
  const [walletCoupons, setWalletCoupons] = useState(defaultCoupons)

  const claimCoupon = (eventId) => {
    const current = eventStates[eventId]
    if (!current || current.claimed || current.remainingStock <= 0) return false
    // 실제로는 POST /api/coupon-events/{eventId}/claim (멱등키, 원자적 재고 차감)
    setEventStates((prev) => ({
      ...prev,
      [eventId]: { remainingStock: Math.max(prev[eventId].remainingStock - 1, 0), claimed: true },
    }))
    const event = couponEvents.find((e) => e.eventId === eventId)
    if (event?.rewardCoupon) {
      setWalletCoupons((prev) => [...prev, event.rewardCoupon])
    }
    return true
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
