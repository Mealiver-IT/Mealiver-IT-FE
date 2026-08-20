import { apiFetch } from './http'

// GET /api/members/me/membership — 내 멤버십 계급 조회.
// 응답: { tier: 'PRIVATE'|'PFC'|'CORPORAL'|'SERGEANT', tierCalculatedAt }
// 주의(2026-08-20 백엔드 가이드): validOrderCountThisMonth/ordersUntilNextLevel 같은 주문수 필드는
// 응답에 없고 추가할 계획도 없음 — "다음 등급까지 N건" UI는 이 API로 못 만든다. MyPage에서 뺐음.
export function fetchMembership() {
  return apiFetch('/api/members/me/membership', { withUser: true })
}

// GET /api/members/me/benefits — 계급별 혜택(쿠폰) 조회.
// 응답 모양이 쿠폰함(GET /api/members/me/coupons)과 완전히 동일한 배열이라
// EventContext.toFECoupon()을 그대로 재사용해서 화면 표시용으로 변환한다.
export function fetchMyBenefits() {
  return apiFetch('/api/members/me/benefits', { withUser: true })
}
