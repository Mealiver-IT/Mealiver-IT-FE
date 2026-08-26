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

// GET /api/admin/campaigns/{campaignId}/coupon-issues - 캠페인별 발급 목록 브라우징(최대 100건/페이지).
export function fetchCouponIssuesByCampaign(campaignId, { status = 'ISSUED', page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ status, page: String(page), size: String(size) })
  return apiFetch(`/api/admin/campaigns/${campaignId}/coupon-issues?${params}`)
}

// GET /api/admin/campaigns/{campaignId}/coupon-issues/by-user/{userId} - 특정 유저의 발급 건 직접 조회.
export function fetchCouponIssueByUser(campaignId, userId) {
  return apiFetch(`/api/admin/campaigns/${campaignId}/coupon-issues/by-user/${userId}`)
}
