// crypto.randomUUID()는 "보안 컨텍스트"(HTTPS 또는 localhost)에서만 존재하는 Web Crypto API다.
// 배포 주소가 http://100.125.247.64:8083처럼 HTTPS가 아닌 사설 IP 직접 접속이면 브라우저가
// 이 함수 자체를 아예 안 만들어줘서 호출하는 순간 TypeError가 난다(2026-08-21 발견 — 발급/결제/취소가
// 전부 이걸로 Idempotency-Key를 만들다 보니 네트워크 상태와 무관하게 접속자 전원에게 100% 재현됐음).
// 멱등키는 "요청마다 달라지기만" 하면 되고 암호학적 예측 불가능성까지는 필요 없어서,
// 없으면 Math.random 기반으로 직접 만든다.
export function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
