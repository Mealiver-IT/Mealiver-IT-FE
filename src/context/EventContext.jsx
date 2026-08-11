import { createContext, useContext, useState } from 'react'
import { couponEvent } from '../data/mockData'

// 선착순 이벤트 쿠폰 발급 상태 - 홈 화면 배너 / 이벤트 화면 배너가 상태를 공유하도록 별도 컨텍스트로 관리.
// 대응: GET /api/coupon-events/{eventId}/stock, POST /api/coupon-events/{eventId}/claim

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const [remainingStock, setRemainingStock] = useState(couponEvent.remainingStock)
  const [claimed, setClaimed] = useState(false)

  const claimCoupon = () => {
    if (claimed || remainingStock <= 0) return false
    // 실제로는 POST /api/coupon-events/{eventId}/claim (멱등키, 원자적 재고 차감)
    setRemainingStock((prev) => Math.max(prev - 1, 0))
    setClaimed(true)
    return true
  }

  return (
    <EventContext.Provider value={{ remainingStock, claimed, claimCoupon }}>{children}</EventContext.Provider>
  )
}

export function useEventCoupon() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEventCoupon must be used within EventProvider')
  return ctx
}
