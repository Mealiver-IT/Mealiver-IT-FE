import { apiFetch } from '../http'

// 관리자 캠페인/쿠폰 CRUD (BE CampaignController, CampaignStatsController 기준).
// 이 API들엔 X-User-Id/인증이 없다(관리자 화면에 아직 로그인 시스템이 없는 것과 동일한 이유,
// src/api/config.js 참고) - BE 컨트롤러 주석도 "별도 인증 없음, 다른 admin API들과 동일 패턴"이라고
// 명시함.

// GET /api/campaigns - 캠페인 목록(관리자/소비자 공용)
export function fetchAllCampaigns() {
  return apiFetch('/api/campaigns')
}

// GET /api/campaigns/{id}
export function fetchCampaignById(id) {
  return apiFetch(`/api/campaigns/${id}`)
}

// POST /api/campaigns - 캠페인+쿠폰 정책 동시 생성 (1:1, 04_아키텍처.txt 1절)
export function createCampaign(request) {
  return apiFetch('/api/campaigns', { method: 'POST', body: request })
}

// DELETE /api/campaigns/{id} - 하드 삭제. 이미 쿠폰이 발급된 캠페인은 BE가 409(CONFLICT)로 거부.
export function deleteCampaign(id) {
  return apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' })
}

// PATCH /api/campaigns/{id}/status - 수동 오픈/마감. status=OPEN 시 openAt 생략하면 현재시각,
// closeAt 생략하면 무기한오픈. status=CLOSED 시 openAt/closeAt은 BE가 무시.
export function updateCampaignStatus(id, { status, openAt, closeAt } = {}) {
  return apiFetch(`/api/campaigns/${id}/status`, {
    method: 'PATCH',
    body: { status, openAt: openAt ?? null, closeAt: closeAt ?? null },
  })
}

// GET /api/admin/campaigns/{campaignId}/stats - 발급 현황 통계(총수량/잔여/발급건수)
export function fetchCampaignStats(campaignId) {
  return apiFetch(`/api/admin/campaigns/${campaignId}/stats`)
}

// GET /api/campaigns/{campaignId}/stock - 잔여 재고만 가벼운 폴링용 (Redis 스냅샷 우선, BE 주석 참고).
// 대시보드처럼 캠페인 여러 개를 동시에 보여줄 땐 이걸로 폴링한다 - SSE는 캠페인당 연결 하나를
// 계속 물고 있어서 여러 개 열면 브라우저 오리진당 연결 제한(HTTP/1.1 기본 6개)에 부딪힌다
// (2026-08-27 실측: OPEN 캠페인 6개 = SSE 6개 동시 연결로 대시보드 이탈 시 58초 멎음).
export function fetchCampaignStock(campaignId) {
  return apiFetch(`/api/campaigns/${campaignId}/stock`)
}
