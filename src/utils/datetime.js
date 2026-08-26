// BE의 LocalDateTime 필드가 타임존 없이 "2026-08-26T09:22:00"(또는 초과 정밀도) 형태로 그대로
// 내려오는데, 관리자 화면 여기저기서 그걸 안 다듬고 그대로 보여주고 있었다(2026-08-26 피드백).
// Date 객체로 파싱하면 브라우저 로컬 타임존으로 재해석될 위험이 있어(서버는 항상 KST 기준 값을
// 그대로 준 것뿐, UTC가 아님) 문자열을 직접 잘라서 관리자 화면 전용 표기로 통일한다.
const ISO_LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/

export function formatDateTime(isoString) {
  if (!isoString) return null
  const match = ISO_LOCAL_DATETIME.exec(isoString)
  if (!match) return isoString
  const [, yyyy, mm, dd, hh, min, ss] = match
  return `${yyyy.slice(2)}-${mm}-${dd} ${hh}시 ${min}분 ${ss}초`
}
