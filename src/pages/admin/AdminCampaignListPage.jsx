import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteCampaign, fetchAllCampaigns } from '../../api/admin/campaigns'
import { CAMPAIGN_STATUS_LABELS, formatDiscount } from '../../utils/campaignAdmin'
import { tierLabel } from '../../utils/membership'

// GET /api/campaigns 목록 + 삭제(DELETE /api/campaigns/{id}).
// 상세/실시간 재고는 AdminCampaignDetailPage로 분리 - 목록에서 다 보여주면 캠페인마다 SSE를
// 동시에 열게 되어 캠페인 수가 늘수록 연결이 불필요하게 쌓인다.
export default function AdminCampaignListPage() {
  const [campaigns, setCampaigns] = useState(null)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = () => {
    setError(null)
    fetchAllCampaigns()
      .then(setCampaigns)
      .catch((e) => setError(e.message))
  }

  useEffect(load, [])

  const handleDelete = async (campaign) => {
    if (!window.confirm(`"${campaign.name}" 캠페인을 삭제할까요? 이미 발급된 쿠폰이 있으면 삭제할 수 없습니다.`)) return
    setDeletingId(campaign.id)
    setError(null)
    try {
      await deleteCampaign(campaign.id)
      load()
    } catch (e) {
      // BE는 이미 쿠폰이 발급된 캠페인 삭제 시 409(CONFLICT)로 거부한다 (CampaignAdminService.delete())
      setError(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <h1 className="admin-page-title">캠페인 관리</h1>
        <Link to="/admin/campaigns/new" className="btn btn-block-outline">
          + 새 캠페인 등록
        </Link>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      {campaigns === null && !error && <p className="empty-text">불러오는 중...</p>}
      {campaigns?.length === 0 && <p className="empty-text">등록된 캠페인이 없습니다.</p>}

      {campaigns?.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>상태</th>
                <th>재고</th>
                <th>대상 등급</th>
                <th>할인</th>
                <th>오픈 시각</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    <Link to={`/admin/campaigns/${c.id}`}>{c.name}</Link>
                  </td>
                  <td>
                    <span className={`admin-status-pill ${c.status}`}>{CAMPAIGN_STATUS_LABELS[c.status] ?? c.status}</span>
                  </td>
                  <td>
                    {c.remainingStock.toLocaleString('ko-KR')} / {c.totalStock.toLocaleString('ko-KR')}
                  </td>
                  <td>{c.minMembershipTier ? tierLabel(c.minMembershipTier) : '전체'}</td>
                  <td>{c.coupon ? formatDiscount(c.coupon.discountType, c.coupon.discountValue) : '-'}</td>
                  <td>{c.openAt ?? '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={deletingId === c.id}
                      onClick={() => handleDelete(c)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
