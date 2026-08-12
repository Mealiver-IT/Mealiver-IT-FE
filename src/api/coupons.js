import { apiFetch } from './http'

// GET /api/members/me/coupons — 내 쿠폰함 조회 (BE CouponController.getIssueCoupons, 구현 완료).
// 체크리스트 이미지엔 /api/users/{userId}/coupons로 적혀있었지만, 명세서 비고란과
// 실제 코드 둘 다 /api/members/me/coupons + X-User-Id 헤더 방식이라 이쪽을 따름.
export function fetchMyCoupons() {
  return apiFetch('/api/members/me/coupons', { withUser: true })
}
