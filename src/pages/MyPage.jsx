import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { benefits as mockBenefits } from '../data/mockData'
import { useWalletCoupons, useMembershipTier, toFECoupon } from '../context/EventContext'
import { fetchMyBenefits } from '../api/membership'
import { tierLabel } from '../utils/membership'
import { formatDiscountDetail } from '../utils/coupon'

// 마이페이지
// 대응: GET /api/members/me/membership(구현됨), GET /api/members/me/benefits(구현됨), GET /api/members/me/coupons(구현됨)
// "주문 내역"은 OrderHistoryPage(/orders)로 이동 — 상세 설명은 그쪽 주석 참고
export default function MyPage() {
  const navigate = useNavigate()
  const myCoupons = useWalletCoupons()
  const membershipTier = useMembershipTier()
  const [benefits, setBenefits] = useState(mockBenefits)

  // 마운트 시 실제 혜택 조회 시도. 응답 모양이 쿠폰함과 동일해서 EventContext.toFECoupon으로 그대로 변환.
  // 실패하면(BE 미연결 등) mock 혜택 목록을 유지.
  useEffect(() => {
    fetchMyBenefits()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setBenefits(list.map(toFECoupon))
        }
      })
      .catch((err) => {
        console.warn('[MyPage] 혜택 조회 실패, mock 데이터 유지:', err.message)
      })
  }, [])

  const menuButtons = [
    { label: '주문 내역', onClick: () => navigate('/orders') },
    { label: '쿠폰함', onClick: () => alert(`보유 쿠폰 ${myCoupons.length}장 (목데이터)`) },
    { label: '리뷰 관리', onClick: () => alert('리뷰 관리 화면 (자리만 확보)') },
    { label: '즐겨찾기', onClick: () => alert('즐겨찾기 화면 (자리만 확보)') },
  ]

  return (
    <div className="screen-content">
      <TopBar title="마이페이지" showBack={false} />

      <div className="box-flat profile-row">
        <div className="avatar-placeholder">👤</div>
        <div>
          <div className="profile-name">username</div>
          <div className="profile-level">계급: {tierLabel(membershipTier)}</div>
        </div>
      </div>

      <div className="field-label">밀리버릿 혜택</div>
      <div className="menu-list">
        {benefits.map((b) => (
          <div key={b.id} className="list-item">
            <div>
              <div className="menu-name">{b.name}</div>
              <div className="menu-option">{formatDiscountDetail(b)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-4">
        {menuButtons.map((m) => (
          <button key={m.label} type="button" className="btn category-btn" onClick={m.onClick}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="menu-list">
        <button type="button" className="btn btn-block-outline" onClick={() => alert('공지사항 (자리만 확보)')}>
          공지사항
        </button>
        <button type="button" className="btn btn-block-outline" onClick={() => alert('고객센터 (자리만 확보)')}>
          고객센터
        </button>
        <button type="button" className="btn btn-block-outline" onClick={() => navigate('/')}>
          로그아웃
        </button>
      </div>
    </div>
  )
}
