import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// 4탭 하단 네비게이션 - 버튼 배치 확인용, 실제 화면 캡처의 하단바(홈/이벤트/마이페이지/장바구니)를 재현
export default function BottomNav() {
  const { items } = useCart()
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bottom-nav-btn${isActive ? ' active' : ''}`}>
        홈
      </NavLink>
      <NavLink to="/events" className={({ isActive }) => `bottom-nav-btn${isActive ? ' active' : ''}`}>
        이벤트
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => `bottom-nav-btn${isActive ? ' active' : ''}`}>
        장바구니{cartCount > 0 ? ` (${cartCount})` : ''}
      </NavLink>
      <NavLink to="/mypage" className={({ isActive }) => `bottom-nav-btn${isActive ? ' active' : ''}`}>
        마이페이지
      </NavLink>
    </div>
  )
}
