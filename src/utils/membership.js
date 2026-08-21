// BE 멤버십 계급은 영문 enum(PRIVATE/PFC/CORPORAL/SERGEANT)으로 온다(GET /api/members/me/membership).
// 화면 표시는 한글이 필요해서 여기서 한 곳으로 모아 변환한다 — 여러 화면에서 각자 매핑 테이블을
// 따로 두면 나중에 한쪽만 고치는 실수가 생기기 쉽다.
export const TIER_LABELS = {
  PRIVATE: '이등병',
  PFC: '일병',
  CORPORAL: '상병',
  SERGEANT: '병장',
}

export function tierLabel(tier) {
  return TIER_LABELS[tier] ?? tier
}

// 계급 순서(낮음→높음). eligibility 판정(내 계급이 캠페인 최소 요구 계급 이상인지)에 사용.
export const TIER_ORDER = ['PRIVATE', 'PFC', 'CORPORAL', 'SERGEANT']

export function meetsMinTier(myTier, minTier) {
  if (!minTier) return true // 캠페인에 최소 계급 제한이 없으면 전 계급 가능
  return TIER_ORDER.indexOf(myTier) >= TIER_ORDER.indexOf(minTier)
}

// BE entity/coupon/TierDiscountPolicy.java와 동일한 값 — RATE 타입 캠페인은 캠페인 자체의
// coupon.discountValue를 무시하고 발급 시점 유저 계급으로 이 표를 적용한다(04_아키텍처.md 6.1절).
// 캠페인마다 달라지는 값이 아니라 프로젝트 전역 고정 정책이라 여기 상수로만 둔다.
export const RATE_DISCOUNT_BY_TIER = {
  PRIVATE: 10,
  PFC: 10,
  CORPORAL: 30,
  SERGEANT: 50,
}
