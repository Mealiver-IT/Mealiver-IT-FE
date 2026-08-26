import { apiFetch } from './http'

// GET /api/members/me/coupons — 내 쿠폰함 조회 (BE CouponController.getIssueCoupons, 구현 완료).
// 체크리스트 이미지엔 /api/users/{userId}/coupons로 적혀있었지만, 명세서 비고란과
// 실제 코드 둘 다 /api/members/me/coupons + X-User-Id 헤더 방식이라 이쪽을 따름.
// ISSUED(사용 가능)만 내려준다 - 결제 화면 쿠폰 선택 토글이 이 API를 그대로 재사용하므로,
// 이미 쓴/회수된/만료된 쿠폰이 섞여서 선택 가능한 것처럼 보이면 안 된다.
export function fetchMyCoupons() {
  return apiFetch('/api/members/me/coupons', { withUser: true })
}

// GET /api/members/me/coupons/all — 쿠폰함 전체 조회(사용가능/사용함/회수됨/만료됨 전부, 2026-08-25 추가됨).
// 종료 상태(USED/CANCELED/EXPIRED)는 BE가 3일 유예 기간까지만 보여주고 그 이후엔 자동으로 빠진다
// (CouponIssueService.getAllVisibleCoupons 참고). 쿠폰함 화면의 "지난 쿠폰" 섹션 전용 - 결제 화면
// 쿠폰 선택 토글은 여전히 위 fetchMyCoupons(ISSUED만)를 쓴다.
export function fetchAllMyCoupons() {
  return apiFetch('/api/members/me/coupons/all', { withUser: true })
}
