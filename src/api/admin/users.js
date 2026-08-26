import { apiFetch } from '../http'

// GET /api/admin/users/count - 대시보드 KPI용. 전체 목록은 100만 건 규모에서 수십 초 걸려서
// 총 인원 숫자 하나만 필요할 땐 이걸 쓴다.
export function fetchUserCount() {
  return apiFetch('/api/admin/users/count')
}

// GET /api/admin/users/search - 유저 목록 화면 검색. 세 필터 다 비우면 BE가 빈 배열을 반환한다
// (전체 목록을 내려받아 브라우저에서 필터링하던 예전 방식은 초기 로딩이 너무 느려서 제거함).
export function searchUsers({ id = '', loginId = '', name = '' } = {}) {
  const params = new URLSearchParams({ id, loginId, name })
  return apiFetch(`/api/admin/users/search?${params}`)
}
