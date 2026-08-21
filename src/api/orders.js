import { apiFetch } from './http'
import { generateIdempotencyKey } from '../utils/uuid'

// POST /api/orders — 주문 생성(=결제 완료 처리). 계급 산정용 결제 이력을 남기는 용도라
// 가게/메뉴 정보는 안 받고 orderAmount/paidAmount/couponIssueId만 받음(BE OrderCreateRequest 기준).
// couponIssueId를 넘기면 BE가 해당 쿠폰을 USED로 전이시킴 -> 실제 발급받은 쿠폰(issueId 있는 것)만 넘겨야 함.
export function createOrder({ orderAmount, paidAmount, couponIssueId }) {
  const idempotencyKey = generateIdempotencyKey()
  return apiFetch('/api/orders', {
    method: 'POST',
    withUser: true,
    idempotencyKey,
    body: { orderAmount, paidAmount, couponIssueId: couponIssueId ?? null },
  })
}

// PATCH /api/orders/{orderId}/cancel — 주문 취소.
// 2026-08-19 BE 변경(V8 마이그레이션, Order.couponIssueId 컬럼 추가): 요청 바디를 아예 안 받음 —
// 발급 시점에 Order 자신이 couponIssueId를 저장해두고, 취소 시 서버가 그 값을 그대로 씀.
// 예전엔 여기서 couponIssueId를 body로 보냈는데 이제 BE 컨트롤러에 @RequestBody 파라미터
// 자체가 없어서(무시당함) 제거함.
// withUser: true 추가(2026-08-20 백엔드 가이드) — 이번 변경과 무관하게 원래 있던 누락이었음.
export function cancelOrder(orderId) {
  const idempotencyKey = generateIdempotencyKey()
  return apiFetch(`/api/orders/${orderId}/cancel`, {
    method: 'PATCH',
    withUser: true,
    idempotencyKey,
  })
}

// GET /api/orders — 내 주문 목록 조회(X-User-Id 본인 것만, 최신순, 페이지네이션 없음).
// 주의: OrderResponse엔 여전히 couponIssueId가 없다(BE가 내부적으로 Order 엔티티엔 저장하지만
// 응답 DTO엔 안 실어줌) — 그래서 이 목록으로 불러온 "과거" 주문은 FE 입장에서 어떤 쿠폰이었는지
// 몰라 지갑 UI 복귀는 여전히 못 시킨다(BE 쪽 쿠폰 상태 자체는 알아서 정상 복귀됨, FE 표시만 못 맞춤).
// 이번 세션에서 직접 만든 주문만 CartContext가 클라이언트 쪽에 기억해뒀다가 지갑 복귀까지 가능하다.
export function fetchOrders() {
  return apiFetch('/api/orders', { withUser: true })
}

// GET /api/orders/{orderId} — 주문 상세 조회(신규). 응답 모양은 목록과 동일(storeName/couponIssueId 없음).
// 지금 화면 어디서도 안 쓰지만(주문 내역은 목록 조회만으로 충분), API 계약만 먼저 맞춰둔다.
export function fetchOrder(orderId) {
  return apiFetch(`/api/orders/${orderId}`, { withUser: true })
}
