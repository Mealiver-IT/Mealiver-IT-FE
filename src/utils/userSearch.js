// AdminUserListPage 검색 로직 - ID/로그인ID/이름을 각각 별도 입력창으로 받아 AND로 좁힌다
// (한 번엔 "id 300", 다음엔 "로그인id300"처럼 필드별로 따로 찾는 용도라 하나의 통합검색창 대신
// 필드별 입력창 3개를 둔다). 전부 비어 있으면 검색하지 않음(100만 건 전체 렌더 방지, MAX_RESULTS와
// 별개로 애초에 필터가 하나도 안 걸리면 매칭 자체를 안 함).

export function hasAnyFilter(filters) {
  return Object.values(filters).some((v) => v && v.trim())
}

export function matchesUserFilters(user, filters) {
  const id = filters.id?.trim()
  const loginId = filters.loginId?.trim().toLowerCase()
  const name = filters.name?.trim()

  if (id && !String(user.id).includes(id)) return false
  if (loginId && !user.loginId?.toLowerCase().includes(loginId)) return false
  if (name && !user.name?.includes(name)) return false

  return true
}

export function searchUsers(users, filters, maxResults) {
  if (!hasAnyFilter(filters)) return []
  const result = []
  for (const user of users) {
    if (matchesUserFilters(user, filters)) {
      result.push(user)
      if (result.length >= maxResults) break
    }
  }
  return result
}
