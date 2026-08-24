// claim/order/cancel처럼 상태를 바꾸는 액션이 실패했을 때 ActionErrorPage에 보여줄 제목을 코드별로 매핑.
// 실제 사유 문장(message)은 BE가 이미 한글로 내려주므로 그대로 쓰고, 여기서는 "무슨 종류의 실패인지"
// 한눈에 보이는 짧은 제목만 붙인다. 목록에 없는 코드는 기본 제목으로 폴백.
//
// NETWORK_ERROR는 BE가 내려주는 코드가 아니라, 응답 자체를 못 받았을 때(미기동/네트워크 순단/타임아웃)
// FE가 붙이는 자체 코드다 — 예전엔 이 경우를 "성공"으로 위장해서 실제로 발급/결제되지 않은 걸
// 발급/결제된 것처럼 보여주는 버그가 있었다(2026-08-21 RATE 쿠폰 27원 사건 계기로 제거).
const ERROR_TITLES = {
  NETWORK_ERROR: '서버에 연결할 수 없습니다',
  SOLD_OUT: '선착순 마감',
  ALREADY_ISSUED: '이미 발급받은 쿠폰입니다',
  MEMBERSHIP_TIER_NOT_ELIGIBLE: '참여 조건 미달',
  CAMPAIGN_NOT_OPEN: '아직 참여할 수 없는 이벤트입니다',
  DUPLICATE_REQUEST_IN_PROGRESS: '요청이 중복 처리 중입니다',
  COUPON_INVALID_STATE_TRANSITION: '사용할 수 없는 쿠폰입니다',
  COUPON_NOT_FOUND: '쿠폰을 찾을 수 없습니다',
}

export function getErrorTitle(code) {
  return ERROR_TITLES[code] ?? '요청을 처리하지 못했습니다'
}
