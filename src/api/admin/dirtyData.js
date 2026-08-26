import { apiFetch } from '../http'

// POST /api/admin/dirty-data/seed - 검증쿼리 5종 테스트용 오염 데이터(DIRTY_*/dirty_user_*) 삽입.
// unique 제약 때문에 이미 삽입된 상태에서 다시 호출하면 409(DIRTY_DATA_SCRIPT_FAILED) - 먼저 cleanup 필요.
export function seedDirtyData() {
  return apiFetch('/api/admin/dirty-data/seed', { method: 'POST' })
}

// POST /api/admin/dirty-data/cleanup - 위 오염 데이터를 전부 제거.
export function cleanupDirtyData() {
  return apiFetch('/api/admin/dirty-data/cleanup', { method: 'POST' })
}
