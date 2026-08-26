// AdminUserListPage 검색 게이트 - ID/로그인ID/이름 세 필드 중 하나라도 채워졌는지 확인.
// 실제 부분일치 검색(AND 결합)은 서버(UserRepository.search())가 수행한다 - 100만 건을
// 브라우저로 내려받아 필터링하면 초기 로딩이 너무 느려서 서버 검색으로 옮겼다.
// 전부 비어 있으면 이 값이 false가 되어 API 호출 자체를 생략한다(전체 스캔 방지).

export function hasAnyFilter(filters) {
  return Object.values(filters).some((v) => v && v.trim())
}
