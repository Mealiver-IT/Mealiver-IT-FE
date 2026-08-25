import { useEffect, useMemo, useState } from 'react'
import { fetchAllUsers } from '../../api/admin/users'
import { tierLabel } from '../../utils/membership'
import { searchUsers } from '../../utils/userSearch'

// GET /api/admin/users - 페이지네이션이 없는 API라 100만 시드 유저 전체가 한 번에 내려온다
// (UserAdminService.list() 참고). 받아온 배열 전체를 그대로 <table>에 렌더링하면 브라우저가
// 멈추므로, 검색어를 입력해야만 매칭된 최대 MAX_RESULTS건만 그려서 DOM 폭발을 막는다.
// 근본 해결(서버 페이지네이션/검색 API 추가)은 별도 확인 필요 - README에 기록.
const MAX_RESULTS = 200

const INITIAL_FILTERS = { id: '', loginId: '', name: '' }

export default function AdminUserListPage() {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  useEffect(() => {
    fetchAllUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
  }, [])

  const matches = useMemo(() => (users ? searchUsers(users, filters, MAX_RESULTS) : []), [users, filters])
  const hasQuery = Object.values(filters).some((v) => v.trim())

  const setFilter = (field) => (e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="admin-section">
      <h1 className="admin-page-title">유저 목록</h1>

      {error && <p className="admin-form-error">{error}</p>}
      {users === null && !error && <p className="empty-text">불러오는 중... (유저 수가 많아 시간이 걸릴 수 있습니다)</p>}
      {users && (
        <p className="empty-text">
          총 {users.length.toLocaleString('ko-KR')}명 - 아래 세 칸 중 검색할 항목에만 입력하세요. (결과는 최대 {MAX_RESULTS}건까지 표시)
        </p>
      )}

      <div className="admin-user-search-row">
        <label className="admin-form-field">
          ID
          <input
            type="text"
            inputMode="numeric"
            placeholder="예: 300"
            value={filters.id}
            onChange={setFilter('id')}
            disabled={!users}
          />
        </label>
        <label className="admin-form-field">
          로그인ID
          <input
            type="text"
            placeholder="예: user300"
            value={filters.loginId}
            onChange={setFilter('loginId')}
            disabled={!users}
          />
        </label>
        <label className="admin-form-field">
          이름
          <input
            type="text"
            placeholder="예: 김서연"
            value={filters.name}
            onChange={setFilter('name')}
            disabled={!users}
          />
        </label>
      </div>

      {hasQuery && matches.length === 0 && <p className="empty-text">일치하는 유저가 없습니다.</p>}

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
