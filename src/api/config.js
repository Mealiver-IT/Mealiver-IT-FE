// API 연동 공용 설정.
// 로컬 dev: .env에 VITE_API_BASE_URL 지정 시 그쪽으로 직접 호출.
// 프로덕션(nginx): 비워두면 같은 origin의 /api/...로 요청 (nginx가 api 컨테이너로 프록시).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// 로그인 시스템이 없어서 X-User-Id 헤더로 사용자를 식별함(BE CouponController/CouponClaimController 기준).
// TODO: 실제 어떤 유저 ID로 테스트해야 하는지 팀장님 확인 후 교체 필요. 우선 seed된 첫 유저(1)로 가정.
export const TEST_USER_ID = 1
