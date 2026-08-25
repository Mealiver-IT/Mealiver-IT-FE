import { apiFetch } from '../http'
import { generateIdempotencyKey } from '../../utils/uuid'

// POST /api/admin/coupons/{issueId}/revoke - 발급된 쿠폰 강제 회수 (ISSUED -> CANCELED).
// Idempotency-Key 헤더 필수(BE는 이를 "Idempotency-Key"로 받되 파라미터명은 requestId) - 재시도해도
// 같은 결과가 나오도록 호출마다 새 키를 발급한다(campaigns.js의 claimCampaignCoupon과 동일 패턴).
export function revokeCoupon(issueId) {
  return apiFetch(`/api/admin/coupons/${issueId}/revoke`, {
    method: 'POST',
    idempotencyKey: generateIdempotencyKey(),
  })
}
