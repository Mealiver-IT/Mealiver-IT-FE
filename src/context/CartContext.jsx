import { createContext, useContext, useMemo, useState } from 'react'
import { calcCouponDiscount } from '../utils/coupon'

// 화면 간 상태 공유용 컨텍스트. 실제 API 연동 전까지는 로컬 state로 아래 엔드포인트를 흉내냅니다.
//   GET    /api/cart              -> items, storeName, totalPrice
//   POST   /api/cart/items        -> addItem
//   PATCH  /api/cart/items/{id}   -> updateQuantity
//   DELETE /api/cart/items/{id}   -> removeItem
//   DELETE /api/cart              -> clearCart
//   POST   /api/cart/coupons      -> applyCoupon
//   POST   /api/orders            -> checkout

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

  // POST /api/orders — 가게별 최소 주문금액 미달 시 결제 차단
  const checkout = ({ address, paymentMethodId }) => {
    const order = {
      orderId: `order-${Date.now()}`,
      storeName,
      items,
      address,
      paymentMethodId,
      totalPrice,
      status: '주문완료',
    }
    setLastOrder(order)
    clearCart()
    return order
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
