import { useEffect, useState } from 'react'
import { fetchCouponIssueByUser, fetchCouponIssuesByCampaign, revokeCoupon } from '../../api/admin/coupons'
import { formatIssuedDiscount } from '../../utils/campaignAdmin'
import { formatDateTime } from '../../utils/datetime'
import { tierLabel } from '../../utils/membership'

const PAGE_SIZE = 20

// 관리자 쿠폰 강제 회수 UI - 캠페인 상세 페이지에 끼워넣는 섹션.
// 1) 유저 ID로 직접 찾기 (uk_campaign_user 인덱스라 대량 발급 캠페인에서도 즉시 조회됨)
// 2) 최근 발급(ISSUED) 목록 페이징 브라우징 - 섹션이 뜨자마자 첫 페이지를 바로 불러온다(예전엔
// "목록 열기" 버튼을 한 번 더 눌러야 했음). 둘 다 같은 회수 액션(POST /api/admin/coupons/{id}/revoke)을 공유.
export default function CouponRevokeSection({ campaignId }) {
  const [userIdInput, setUserIdInput] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [searching, setSearching] = useState(false)

  const [page, setPage] = useState(null)
  const [pageError, setPageError] = useState(null)
  const [loadingPage, setLoadingPage] = useState(false)

  const [revokingId, setRevokingId] = useState(null)

  const loadPage = (pageNumber) => {
    setLoadingPage(true)
    setPageError(null)
    fetchCouponIssuesByCampaign(campaignId, { status: 'ISSUED', page: pageNumber, size: PAGE_SIZE })
      .then(setPage)
      .catch((e) => setPageError(e.message))
      .finally(() => setLoadingPage(false))
  }

  useEffect(() => {
    loadPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!userIdInput.trim()) return
    setSearching(true)
    setSearchError(null)
    setSearchResult(null)
    try {
      const result = await fetchCouponIssueByUser(campaignId, userIdInput.trim())
      setSearchResult(result)
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleRevoke = async (issue, onDone) => {
    if (!window.confirm(`발급건 #${issue.id} (유저 ${issue.userId})을 강제 회수할까요? 되돌릴 수 없습니다.`)) return
    setRevokingId(issue.id)
    try {
      await revokeCoupon(issue.id)
      onDone()
    } catch (err) {
      window.alert(`회수 실패: ${err.message}`)
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="admin-section">
      <p className="field-label">쿠폰 강제 회수</p>

      <form className="admin-user-search-row" onSubmit={handleSearch}>
        <label className="admin-form-field">
          유저 ID로 찾기
          <input
            type="number"
            min="1"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="예: 300"
          />
        </label>
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-outline" disabled={searching}>
            {searching ? '조회 중...' : '조회'}
          </button>
        </div>
      </form>
      {searchError && <p className="admin-form-error">{searchError}</p>}
      {searchResult && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>발급ID</th>
                <th>유저ID</th>
                <th>상태</th>
                <th>계급</th>
                <th>할인</th>
                <th>발급시각</th>
                <th>회수</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{searchResult.id}</td>
                <td>{searchResult.userId}</td>
                <td>
                  <span className={`admin-status-pill ${searchResult.status}`}>{searchResult.status}</span>
                </td>
                <td>{tierLabel(searchResult.issuedMembershipTier)}</td>
                <td>{formatIssuedDiscount(searchResult.discountType, searchResult.discountValue, searchResult.issuedMembershipTier)}</td>
                <td>{formatDateTime(searchResult.issuedAt)}</td>
                <td>
                  {searchResult.status === 'ISSUED' ? (
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={revokingId === searchResult.id}
                      onClick={() => handleRevoke(searchResult, () => setSearchResult({ ...searchResult, status: 'CANCELED' }))}
                    >
                      회수
                    </button>
                  ) : (
                    <span className="empty-text">회수 불가</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p className="empty-text">최근 발급(ISSUED) 목록</p>
      {pageError && <p className="admin-form-error">{pageError}</p>}
      {page === null && !pageError && <p className="empty-text">불러오는 중...</p>}
      {page && (
        <>
          {page.items.length === 0 ? (
            <p className="empty-text">발급된(ISSUED) 쿠폰이 없습니다.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>발급ID</th>
                    <th>유저ID</th>
                    <th>계급</th>
                    <th>할인</th>
                    <th>발급시각</th>
                    <th>만료시각</th>
                    <th>회수</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.id}</td>
                      <td>{issue.userId}</td>
                      <td>{tierLabel(issue.issuedMembershipTier)}</td>
                      <td>{formatIssuedDiscount(issue.discountType, issue.discountValue, issue.issuedMembershipTier)}</td>
                      <td>{formatDateTime(issue.issuedAt)}</td>
                      <td>{formatDateTime(issue.validUntil)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-small"
                          disabled={revokingId === issue.id}
                          onClick={() => handleRevoke(issue, () => loadPage(page.page))}
                        >
                          회수
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="row-between">
            <button type="button" className="admin-btn-outline" disabled={loadingPage || page.page <= 0} onClick={() => loadPage(page.page - 1)}>
              이전
            </button>
            <span className="empty-text">
              {page.page + 1} / {Math.max(page.totalPages, 1)} 페이지 (총 {page.totalElements.toLocaleString('ko-KR')}건)
            </span>
            <button
              type="button"
              className="admin-btn-outline"
              disabled={loadingPage || page.page + 1 >= page.totalPages}
              onClick={() => loadPage(page.page + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  )
}
