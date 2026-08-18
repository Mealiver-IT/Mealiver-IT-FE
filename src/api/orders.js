import { apiFetch } from './http'

// POST /api/orders — 주문 생성(=결제 완료 처리). 계급 산정용 결제 이력을 남기는 용도라
// 가게/메뉴 정보는 안 받고 orderAmount/paidAmount/couponIssueId만 받음(BE OrderCreateRequest 기준).
// couponIssueId를 넘기면 BE가 해당 쿠폰을 USED로 전이시킴 -> 실제 발급받은 쿠폰(issueId 있는 것)만 넘겨야 함.
export function createOrder({ orderAmount, paidAmount, couponIssueId }) {
  const idempotencyKey = crypto.randomUUID()
  return apiFetch('/api/orders', {
    method: 'POST',
    withUser: true,
    idempotencyKey,
    body: { orderAmount, paidAmount, couponIssueId: couponIssueId ?? null },
  })
}

// PATCH /api/orders/{orderId}/cancel — 주문 취소. couponIssueId를 넘기면 해당 쿠폰이 재사용 가능(ISSUED)하게 복귀됨.
export function cancelOrder(orderId, { couponIssueId } = {}) {
  const idempotencyKey = crypto.randomUUID()
  return apiFetch(`/api/orders/${orderId}/cancel`, {
    method: 'PATCH',
    idempotencyKey,
    body: { couponIssueId: couponIssueId ?? null },
  })
}
