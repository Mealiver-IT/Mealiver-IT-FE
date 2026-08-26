import { useEffect, useState } from 'react'
import { fetchUserCount, searchUsers as searchUsersApi } from '../../api/admin/users'
import { tierLabel } from '../../utils/membership'
import { hasAnyFilter } from '../../utils/userSearch'

// 검색 입력이 멈추고 이 시간(ms)이 지나야 실제 API 호출 - 키 입력마다 100만 건 테이블에
// LIKE 쿼리를 날리지 않기 위한 디바운스.
const SEARCH_DEBOUNCE_MS = 300

const INITIAL_FILTERS = { id: '', loginId: '', name: '' }

// GET /api/admin/users/search - 이전엔 GET /api/admin/users(페이지네이션 없음)로 100만 유저
// 전체를 내려받아 브라우저에서 필터링했는데, 그 초기 로딩 자체가 느려서(요청) 서버 검색으로 교체.
// 필터가 하나도 없으면 아예 API를 호출하지 않는다(전체 스캔 방지, "검색 안 함" UX 유지).
export default function AdminUserListPage() {
  const [userCount, setUserCount] = useState(null)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [matches, setMatches] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetchUserCount().then(setUserCount).catch(() => {})
  }, [])

  useEffect(() => {
    if (!hasAnyFilter(filters)) {
      setMatches([])
      setSearched(false)
      return
    }

    setSearching(true)
    const timer = setTimeout(() => {
      searchUsersApi(filters)
        .then((result) => {
          setMatches(result)
          setError(null)
        })
        .catch((e) => setError(e.message))
        .finally(() => {
          setSearching(false)
          setSearched(true)
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [filters])

  const setFilter = (field) => (e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="admin-section">
      <h1 className="admin-page-title">유저 목록</h1>

      {error && <p className="admin-form-error">{error}</p>}
      <p className="empty-text">
        총 {userCount == null ? '-' : userCount.toLocaleString('ko-KR')}명 - 아래 세 칸 중 검색할 항목에만 입력하세요. (결과는 최대 200건까지 표시)
      </p>

      <div className="admin-user-search-row">
        <label className="admin-form-field">
          ID
          <input type="text" inputMode="numeric" placeholder="예: 300" value={filters.id} onChange={setFilter('id')} />
        </label>
        <label className="admin-form-field">
          로그인ID
          <input type="text" placeholder="예: user300" value={filters.loginId} onChange={setFilter('loginId')} />
        </label>
        <label className="admin-form-field">
          이름
          <input type="text" placeholder="예: 김서연" value={filters.name} onChange={setFilter('name')} />
        </label>
      </div>

      {searching && <p className="empty-text">검색 중...</p>}
      {!searching && searched && matches.length === 0 && <p className="empty-text">일치하는 유저가 없습니다.</p>}

      {matches.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>로그인ID</th>
                <th>이름</th>
                <th>전화번호</th>
                <th>이메일</th>
                <th>등급</th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.loginId}</td>
                  <td>{u.name}</td>
                  <td>{u.phone}</td>
                  <td>{u.email}</td>
                  <td>{tierLabel(u.membershipTier)}</td>
                  <td>{u.createdAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
