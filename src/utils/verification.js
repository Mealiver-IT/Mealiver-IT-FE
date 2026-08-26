// BE CheckType.java의 label()과 동일한 값 - 검증 결과 요약 카드에서 영문 enum 이름 대신
// 한글로 보여주기 위한 매핑. 값이 바뀌면 CheckType.java도 같이 고칠 것.
export const CHECK_TYPE_LABELS = {
  STOCK_OVERISSUE: '재고 초과',
  COUNTER_MISMATCH: '카운터-이력 일치',
  STATE_MISSING_LOG: '로그 없는 레코드',
  STATE_INVALID_TRANSITION: '허용 안 된 전이',
  STATE_BROKEN_CHAIN: '로그 체인 연속성',
  TIER_ELIGIBILITY_VIOLATION: '등급 미달 발급',
  TIER_CONSISTENCY_MISMATCH: '계급-주문 정합성',
}

export function checkTypeLabel(checkType) {
  return CHECK_TYPE_LABELS[checkType] ?? checkType
}

// anomalyCounts({checkType: count})를 화면에 뿌리기 좋은 배열로 변환, 건수 많은 순 정렬.
export function toAnomalyRows(anomalyCounts) {
  return Object.entries(anomalyCounts ?? {})
    .map(([checkType, count]) => ({ checkType, label: checkTypeLabel(checkType), count }))
    .sort((a, b) => b.count - a.count)
}
