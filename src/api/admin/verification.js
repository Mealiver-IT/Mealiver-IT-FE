import { apiFetch } from '../http'

// GET /api/admin/verification/latest - { daily, tierMonthly } 각각의 가장 최근 실행 요약.
// Slack/노션으로 알림이 나가는 검증 배치가 실제로 2개(일간 6종 체크 + 월간 계급-주문 정합성)라서
// 둘 다 따로 온다 - 예전엔 daily만 조회해서 tierMonthly 이상값이 대시보드에서 안 보였음.
export function fetchVerificationLatest() {
  return apiFetch('/api/admin/verification/latest')
}

// POST /api/admin/verification/run - DailyConsistencyVerificationJob을 지금 바로 트리거. BE가
// app.consistency-verification.enabled=true로 켜져있지 않으면 503(VERIFICATION_BATCH_DISABLED)이
// 온다. Job 자체가 수 분~수십초 걸릴 수 있어 응답이 올 때까지 블로킹된다 - 호출부가 로딩 상태를 보여줘야 함.
export function runVerificationNow() {
  return apiFetch('/api/admin/verification/run', { method: 'POST' })
}

// POST /api/admin/verification/run-tier-monthly - TierOrdersMismatchJob을 지금 바로 트리거
// (대상 월은 BE가 자동으로 "지난달"로 고정, VerificationBatchScheduler.runMonthly()와 동일).
export function runTierMonthlyVerificationNow() {
  return apiFetch('/api/admin/verification/run-tier-monthly', { method: 'POST' })
}
