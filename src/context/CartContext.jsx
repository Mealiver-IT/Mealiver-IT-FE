import { createContext, useContext, useMemo, useState } from 'react'
import { calcCouponDiscount } from '../utils/coupon'
import { createOrder } from '../api/orders'

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
  const checkout = async ({ address, paymentMethodId }) => {
    try {
      const created = await createOrder({
        orderAmount: subtotal,
        paidAmount: totalPrice,
        couponIssueId: appliedCoupon?.issueId ?? null,
      })
      const order = { ...created, storeName, items, address, paymentMethodId, isMock: false }
      setLastOrder(order)
      clearCart()
      return order
    } catch (err) {
      // BE 미연결/유효하지 않은 couponIssueId 등 -> mock으로 대체 (데모용 폴백)
      console.warn(`[CartContext] 실제 주문 API 실패, mock으로 대체 처리: ${err.message}`)
      const order = {
        orderId: `order-${Date.now()}`,
        storeName,
        items,
        address,
        paymentMethodId,
        totalPrice,
        status: '주문완료',
        isMock: true,
      }
      setLastOrder(order)
      clearCart()
      return order
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
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    checkout,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
