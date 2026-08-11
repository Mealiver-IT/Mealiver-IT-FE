// 쿠폰 할인 금액 계산 - CartContext(장바구니 총액 계산)와 CheckoutPage(쿠폰별 할인 미리보기)에서 공용으로 사용.
// 대응: POST /api/cart/coupons (할인 금액 계산·적용)
// 비고: 정률 쿠폰은 최대 할인 한도(maxDiscount) 초과 시 한도까지만 적용
export function calcCouponDiscount(coupon, subtotal) {
  if (!coupon) return 0
  if (coupon.discountType === 'FIXED') return coupon.discountValue
  if (coupon.discountType === 'RATE') {
    const raw = Math.floor((subtotal * coupon.discountValue) / 100)
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw
  }
  return 0
}
