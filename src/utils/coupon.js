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

// 쿠폰의 할인 조건을 한 줄 문구로 요약. 마이페이지 "밀리버릿 혜택" 목록에서 사용.
// GET /api/members/me/benefits 응답이 title/desc를 안 주고 쿠폰함과 동일한 discountType/discountValue만
// 주기 때문에(2026-08-20 백엔드 가이드), 여기서 프론트가 직접 문구를 조합한다.
export function formatDiscountDetail(coupon) {
  if (!coupon) return ''
  if (coupon.discountType === 'FIXED') {
    return coupon.discountValue === 0 ? '무료' : `${coupon.discountValue.toLocaleString()}원 할인`
  }
  if (coupon.discountType === 'RATE') {
    const cap = coupon.maxDiscount ? ` (최대 ${coupon.maxDiscount.toLocaleString()}원)` : ''
    return `${coupon.discountValue}% 할인${cap}`
  }
  return ''
}
