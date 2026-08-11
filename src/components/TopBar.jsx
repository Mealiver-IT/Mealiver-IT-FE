import { useNavigate } from 'react-router-dom'

// 뒤로가기 + 제목 + (선택)우측 슬롯. 디자인 없이 버튼 위치 확인용.
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
      <div className="top-bar-right">{right}</div>
    </div>
  )
}
