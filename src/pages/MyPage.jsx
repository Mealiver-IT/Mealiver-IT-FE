import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useMembershipTier } from '../context/EventContext'
import { TEST_USER_ID } from '../api/config'
import { tierLabel } from '../utils/membership'

// 마이페이지
// 대응: GET /api/members/me/membership(구현됨), GET /api/members/me/coupons(구현됨)
// "주문 내역"은 OrderHistoryPage(/orders)로 이동 — 상세 설명은 그쪽 주석 참고
//
// 프로필 이름: BE에 이름/로그인ID를 돌려주는 API 자체가 없어서(User 엔티티엔 있지만 응답 DTO로
// 안 나감) 실명 대신 config.js가 브라우저별로 고정해둔 TEST_USER_ID를 계정 식별자처럼 보여준다 -
// "username" 하드코딩보다는 적어도 실제로 이 브라우저가 어떤 계정으로 요청 중인지는 알 수 있다.
//
// "밀리버릿 혜택"(GET /api/members/me/benefits) 섹션은 2026-08-25 제거함 — 이 API가 반환하는
// 데이터는 월간 계급 배치(MembershipBenefitBatchJob)가 계급 재산정 직후에만 실제로 채워주는데
// 그 배치가 아직 한 번도 안 돌아서 항상 빈 배열이 오고, 화면은 mock 데이터로 눙치고 있었다 -
// 진짜 발급된 혜택처럼 보이는 게 오히려 오해를 사서, 배치가 실제로 돌기 전까지는 아예 뺀다.
export default function MyPage() {
  const navigate = useNavigate()
  const membershipTier = useMembershipTier()

  const menuButtons = [
    { label: '주문 내역', onClick: () => navigate('/orders') },
    { label: '쿠폰함', onClick: () => navigate('/coupons') },
    { label: '리뷰 관리', onClick: () => alert('리뷰 관리 화면 (자리만 확보)') },
    { label: '즐겨찾기', onClick: () => alert('즐겨찾기 화면 (자리만 확보)') },
  ]

  return (
    <div className="screen-content">
      <TopBar title="마이페이지" showBack={false} />

      <div className="box-flat profile-row">
        <div className="avatar-placeholder">👤</div>
        <div>
          <div className="profile-name">테스트 계정 #{TEST_USER_ID}</div>
          <div className="profile-level">계급: {tierLabel(membershipTier)}</div>
        </div>
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
