// AdminDashboardPage의 KPI 카드용 순수 집계 로직 - 캠페인 목록(GET /api/campaigns)에서 뽑아낸다.
// 발급 쿠폰 수는 "누적 발급 이력" API가 따로 없어서(캠페인 단위 통계만 존재), 캠페인 카운터
// (totalStock - remainingStock)를 합산한 근사치를 쓴다 - CampaignAdminService가 발급마다
// 갱신해두는 값이라 실제 발급 이력과 거의 같다(카운터 자체가 어긋난 경우는 검증 배치가 별도로 잡음).
export function summarizeCampaigns(campaigns) {
  const total = campaigns.length
  const open = campaigns.filter((c) => c.status === 'OPEN').length
  const closed = campaigns.filter((c) => c.status === 'CLOSED').length
  const ready = total - open - closed
  const estimatedIssued = campaigns.reduce((sum, c) => sum + Math.max(0, c.totalStock - c.remainingStock), 0)

  return { total, open, closed, ready, estimatedIssued }
}

export function filterOpenCampaigns(campaigns) {
  return campaigns.filter((c) => c.status === 'OPEN')
}
