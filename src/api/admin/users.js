import { apiFetch } from '../http'

// GET /api/admin/users - 유저 목록 (UserResponse: PII는 BE가 이미 마스킹해서 내려줌, PiiMasker 참고)
export function fetchAllUsers() {
  return apiFetch('/api/admin/users')
}
