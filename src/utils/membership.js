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
