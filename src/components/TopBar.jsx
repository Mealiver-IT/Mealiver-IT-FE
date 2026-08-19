import { useNavigate } from 'react-router-dom'
import ThemeToggleButton from './ThemeToggleButton'

// 뒤로가기 + 제목 + (선택)우측 슬롯. 우측엔 페이지별 커스텀 버튼 + 라이트/다크 전환 버튼이 같이 뜸.
export default function TopBar({ title, showBack = true, right = null }) {
  const navigate = useNavigate()
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        {showBack && (
          <button type="button" className="btn icon-btn" onClick={() => navigate(-1)}>
            &larr;
          </button>
        )}
      </div>
      <div className="top-bar-title">{title}</div>
      <div className="top-bar-right">
        {right}
        <ThemeToggleButton />
      </div>
    </div>
  )
}
