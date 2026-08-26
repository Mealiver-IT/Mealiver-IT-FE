import { NavLink, Outlet } from 'react-router-dom'
import ThemeToggleButton from '../../components/ThemeToggleButton'
import './admin.css'

// 관리자 화면 전용 레이아웃 - 소비자 앱(.phone-frame, 모바일 폭 고정)과 분리된 넓은 데스크톱 레이아웃.
// 로그인 시스템이 없으므로(src/api/config.js 참고) 별도 인증 게이트 없이 바로 진입 가능.
export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">밀리버릿 관리자</div>
        <nav className="admin-nav">
          <NavLink to="/admin/campaigns" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            캠페인 관리
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            유저 목록
          </NavLink>
        </nav>
        <ThemeToggleButton />
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
