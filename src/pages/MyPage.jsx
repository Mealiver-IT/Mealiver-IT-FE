import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { membership, benefits, orderHistory } from '../data/mockData'
import { useWalletCoupons } from '../context/EventContext'

// 마이페이지
// 대응: GET /api/members/me/membership, GET /api/members/me/benefits,
//       GET /api/orders, GET /api/members/me/coupons
export default function MyPage() {
  const navigate = useNavigate()
  const myCoupons = useWalletCoupons()

  const menuButtons = [
    { label: '주문 내역', onClick: () => alert(`주문 내역 ${orderHistory.length}건 (목데이터)`) },
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
          <div className="profile-level">계급: {membership.level}</div>
        </div>
      </div>

      <p className="empty-text">
        다음 계급까지 주문 {membership.ordersUntilNextLevel}회 남음 (최근 30일 유효 주문 {membership.validOrderCountLast30Days}건)
      </p>

      <div className="field-label">밀리버릿 혜택</div>
      <div className="menu-list">
        {benefits.map((b) => (
          <div key={b.id} className="list-item">
            <div>
              <div className="menu-name">{b.title}</div>
              <div className="menu-option">{b.desc}</div>
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
