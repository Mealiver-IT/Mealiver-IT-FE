import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { calcCouponDiscount } from '../utils/coupon'
import { createOrder, cancelOrder as cancelOrderApi, fetchOrders } from '../api/orders'

// BE OrderStatus(COMPLETED/CANCELED/REFUNDED) -> FE 표시 문구
function toFEStatus(beStatus) {
  if (beStatus === 'CANCELED') return '취소됨'
  if (beStatus === 'REFUNDED') return '환불됨'
  return '주문완료'
}

// 화면 간 상태 공유용 컨텍스트. API 연동 안 된 부분은 로컬 state로 흉내냅니다.
//   GET    /api/cart              -> items, storeName, totalPrice (미연동, mock)
//   POST   /api/cart/items        -> addItem (미연동, mock)
//   PATCH  /api/cart/items/{id}   -> updateQuantity (미연동, mock)
//   DELETE /api/cart/items/{id}   -> removeItem (미연동, mock)
//   DELETE /api/cart              -> clearCart (미연동, mock)
//   POST   /api/cart/coupons      -> applyCoupon (미연동, mock)
//   POST   /api/orders            -> checkout (실제 API 연동함. 실패 시 mock 폴백 — EventContext와 동일 패턴)

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [storeId, setStoreId] = useState(null)
  const [storeName, setStoreName] = useState(null)
  const [items, setItems] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [lastOrder, setLastOrder] = useState(null)
  const [orders, setOrders] = useState([]) // 이번 세션에 만든 주문 + BE에서 불러온 과거 이력 - 마이페이지 주문 내역/취소 화면에서 사용
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [historyFetchFailed, setHistoryFetchFailed] = useState(false)

  // 마운트 시 실제 주문 이력 조회 시도 (GET /api/orders). 이번 세션에 만든 주문(local orderId 보유)과
  // 겹치지 않는 것만 추가한다 - 로컬 것은 storeName/items/coupon 정보가 더 풍부해서 덮어쓰지 않음.
  // 주의: BE OrderResponse엔 couponIssueId가 없어서(orders 테이블이 쿠폰 연결을 저장 안 함), 여기서
  // 불러온 과거 주문은 couponIssueId를 null로 둔다 - 취소해도 어떤 쿠폰인지 몰라 복귀시켜줄 수 없다.
  useEffect(() => {
    fetchOrders()
      .then((list) => {
        if (!Array.isArray(list)) return
        setOrders((prev) => {
          const localIds = new Set(prev.map((o) => o.orderId))
          const fetched = list
            .filter((o) => !localIds.has(o.id))
            .map((o) => ({
              orderId: o.id,
              storeName: null, // BE가 가게 정보를 안 갖고 있음(계급 산정용 최소 스키마)
              items: [],
              totalPrice: Number(o.paidAmount),
              status: toFEStatus(o.status),
              couponIssueId: null,
              coupon: null,
              isMock: false,
              orderedAt: o.orderedAt,
            }))
          return [...prev, ...fetched].sort((a, b) => (b.orderedAt ?? '').localeCompare(a.orderedAt ?? ''))
        })
      })
      .catch((err) => {
        console.warn('[CartContext] 주문 이력 조회 실패, 세션 내 주문만 표시:', err.message)
        setHistoryFetchFailed(true)
      })
  }, [])

  // 다른 가게 메뉴를 담으면 명세서 비고대로 교체 확인이 필요 -> 여기서는 confirm으로 대체
  const addItem = (store, menu) => {
    if (storeId && storeId !== store.id) {
      const ok = window.confirm(
        `장바구니에 '${storeName}' 메뉴가 담겨 있어요. 비우고 '${store.name}' 메뉴로 새로 담을까요?`,
      )
      if (!ok) return
      setItems([])
      setAppliedCoupon(null)
    }
    setStoreId(store.id)
    setStoreName(store.name)
    setItems((prev) => {
      const existing = prev.find((i) => i.menuId === menu.id)
      if (existing) {
        return prev.map((i) => (i.menuId === menu.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { itemId: `item-${menu.id}`, menuId: menu.id, name: menu.name, option: menu.option, price: menu.price, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    setItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i)))
  }

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId))
  }

  const clearCart = () => {
    setItems([])
    setStoreId(null)
    setStoreName(null)
    setAppliedCoupon(null)
  }

  const applyCoupon = (coupon) => {
    setAppliedCoupon(coupon)
  }

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])

  const discount = useMemo(() => calcCouponDiscount(appliedCoupon, subtotal), [appliedCoupon, subtotal])

  const totalPrice = Math.max(subtotal - discount, 0)

  // POST /api/orders — 가게별 최소 주문금액 미달 시 결제 차단(호출 전 CheckoutPage에서 확인)
  // 실제 API를 먼저 시도: BE 응답엔 가게/메뉴 정보가 없어서(계급 산정용 결제이력 전용) 화면 표시에 필요한
  // storeName/items/address 등은 프론트에서 별도로 붙여서 저장함.
  // couponIssueId는 실제로 발급받은 쿠폰(issueId 있는 것)일 때만 넘김 — mock 전용 쿠폰은 BE에 존재하지 않아서 생략.
  //
  // 반환값은 EventContext.claimCoupon과 동일한 패턴: { ok: true, order } 성공(실제 주문 또는 BE 미연결 시
  // mock 폴백) / { ok: false, code, message } BE가 정상 응답했지만 거부한 경우. 전부 "성공"으로 뭉개면
  // 유효하지 않은 쿠폰 등으로 실제로는 거부된 주문도 "주문이 완료되었습니다"로 보이는 오탐이 생긴다.
  //
  // isCheckingOut: BE의 POST /api/orders는 Idempotency-Key를 받긴 하지만 실제로 중복 생성을 막진 않는다
  // (orders 테이블에 idempotency_key 제약이 없음) — 재시도/더블클릭이 오면 주문이 그대로 중복 생성된다.
  // BE를 고치는 대신, 요청이 끝나기 전엔 재호출 자체를 막아서 프론트에서 중복 제출을 예방한다.
  const checkout = async ({ address, paymentMethodId }) => {
    if (isCheckingOut) return { ok: false, message: '이미 결제를 처리하는 중입니다.' }
    setIsCheckingOut(true)
    // couponIssueId/coupon은 클로저로 지금 시점 값을 잡아둔다 - clearCart()가 appliedCoupon을 지우기 전에
    // 주문 이력에 남겨야 나중에 "주문 취소" 시 어떤 쿠폰을 되돌려줘야 하는지 알 수 있다.
    const couponIssueId = appliedCoupon?.issueId ?? null
    const coupon = appliedCoupon
    try {
      const created = await createOrder({ orderAmount: subtotal, paidAmount: totalPrice, couponIssueId })
      const order = {
        orderId: created.id, // BE OrderResponse의 PK. PATCH /api/orders/{orderId}/cancel 호출 시 그대로 사용.
        storeName,
        items,
        address,
        paymentMethodId,
        totalPrice,
        status: '주문완료',
        couponIssueId,
        coupon,
        isMock: false,
        orderedAt: created.orderedAt ?? new Date().toISOString(),
      }
      setOrders((prev) => [order, ...prev])
      setLastOrder(order)
      clearCart()
      return { ok: true, order }
    } catch (err) {
      if (err.code) {
        // BE가 실제로 응답했고, 정당한 사유로 거부한 것(유효하지 않은 couponIssueId 등) -> mock으로 눙치지 말 것
        console.warn(`[CartContext] 주문 거부: ${err.code} - ${err.message}`)
        return { ok: false, code: err.code, message: err.message }
      }
      // code가 없다 = BE에 아예 도달하지 못함(미기동/네트워크 오류 등) -> 로컬 mock으로 대체 (데모용 폴백)
      // 실제로 발급/소모된 쿠폰이 아니므로 couponIssueId/coupon은 비워둠(취소 시 되돌려줄 실물이 없음).
      console.warn(`[CartContext] 주문 API 연결 실패, mock으로 대체 처리: ${err.message}`)
      const order = {
        orderId: `order-${Date.now()}`,
        storeName,
        items,
        address,
        paymentMethodId,
        totalPrice,
        status: '주문완료',
        couponIssueId: null,
        coupon: null,
        isMock: true,
        orderedAt: new Date().toISOString(),
      }
      setOrders((prev) => [order, ...prev])
      setLastOrder(order)
      clearCart()
      return { ok: true, order }
    } finally {
      setIsCheckingOut(false)
    }
  }

  // PATCH /api/orders/{orderId}/cancel — 주문 취소.
  // 2026-08-19 BE 변경: couponIssueId를 더 이상 요청 바디로 안 받음 — Order가 발급 시점에
  // 자기 couponIssueId를 저장해두고 취소 시 서버가 알아서 그 쿠폰을 ISSUED로 복귀시킨다.
  // 다만 로컬 target.couponIssueId/coupon은 계속 들고 있어야 한다 — 지갑 UI(walletCoupons)에
  // 다시 노출시키는 건 여전히 FE 책임이라(BE 응답 DTO엔 어차피 couponIssueId가 안 실려 옴).
  //
  // 반환값 패턴은 checkout/claimCoupon과 동일: { ok: true, order } / { ok: false, code?, message }.
  //
  // 상태전이 가드: 이미 '취소됨'인 주문은 여기서 먼저 걸러서 재요청 자체를 막는다 - BE의 Order.cancel()이
  // 현재 상태와 무관하게 무조건 CANCELED로 덮어쓰는 문제(상태 역행 가능)를 프론트에서 선제 방어.
  const requestCancelOrder = async (orderId) => {
    const target = orders.find((o) => o.orderId === orderId)
    if (!target) return { ok: false, message: '주문을 찾을 수 없습니다.' }
    if (target.status === '취소됨') return { ok: false, message: '이미 취소된 주문입니다.' }

    const markCanceled = () => setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: '취소됨' } : o)))

    if (target.isMock) {
      // mock 주문은 BE에 실제로 존재하지 않으므로 로컬 상태만 바꾼다.
      markCanceled()
      return { ok: true, order: target }
    }

    try {
      await cancelOrderApi(orderId)
      markCanceled()
      return { ok: true, order: target }
    } catch (err) {
      if (err.code) {
        console.warn(`[CartContext] 주문 취소 거부: ${err.code} - ${err.message}`)
        return { ok: false, code: err.code, message: err.message }
      }
      console.warn(`[CartContext] 주문 취소 API 연결 실패, 로컬에서만 취소 처리: ${err.message}`)
      markCanceled()
      return { ok: true, order: target }
    }
  }

  const value = {
    storeId,
    storeName,
    items,
    appliedCoupon,
    subtotal,
    discount,
    totalPrice,
    lastOrder,
    orders,
    historyFetchFailed,
    isCheckingOut,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    checkout,
    requestCancelOrder,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
