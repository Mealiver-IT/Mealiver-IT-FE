import { apiFetch } from '../http'

// GET /api/admin/users - 유저 목록 (UserResponse: PII는 BE가 이미 마스킹해서 내려줌, PiiMasker 참고)
export function fetchAllUsers() {
  return apiFetch('/api/admin/users')
}

// GET /api/admin/users/count - 대시보드 KPI용. list()는 100만 건 규모에서 수십 초 걸려서
// 총 인원 숫자 하나만 필요할 땐 이걸 쓴다.
export function fetchUserCount() {
  return apiFetch('/api/admin/users/count')
}
