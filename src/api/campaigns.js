import { apiFetch } from './http'
import { generateIdempotencyKey } from '../utils/uuid'

// GET /api/campaigns/{campaignId} — 이벤트 상세 (잔여수량 포함).
// 비고: 명세서상 "관리자 CRUD용으로 구현됨(응답에 관리자용 필드 포함) — 소비자용으로
// 그대로 쓸지 필드 축소가 필요한지 별도 확인 필요"라고 되어 있음. 확인 전까지는
// 일단 그대로 쓰고, 화면에는 필요한 필드만 골라 표시함.
export function fetchCampaign(campaignId) {
  return apiFetch(`/api/campaigns/${campaignId}`)
}

// GET /api/campaigns — 캠페인 목록 (이벤트 목록 화면용)
export function fetchCampaigns() {
  return apiFetch('/api/campaigns')
}

// GET /api/campaigns/{campaignId}/stock — 선착순 잔여 수량 조회 (구현 완료, 인증 불필요).
// 응답: { campaignId, totalStock, remainingStock, status, soldOut } — soldOut은 서버가 이미 계산해서 줌
// (remainingStock <= 0를 프론트에서 다시 계산할 필요 없음). EventContext가 이걸 주기적으로 폴링해서
// "실시간으로 줄어드는" 재고 카운트다운을 흉내낸다(진짜 SSE/WebSocket 푸시는 아직 없음).
export function fetchCampaignStock(campaignId) {
  return apiFetch(`/api/campaigns/${campaignId}/stock`)
}

// POST /api/campaigns/{campaignId}/coupons — 선착순 쿠폰 발급(claim).
// Idempotency-Key 필수: 같은 키로 재요청해도 같은 결과가 나와야 함(멱등성) -> 요청마다 새 키 발급.
export function claimCampaignCoupon(campaignId) {
  const idempotencyKey = generateIdempotencyKey()
  return apiFetch(`/api/campaigns/${campaignId}/coupons`, {
    method: 'POST',
    withUser: true,
    idempotencyKey,
  })
}
