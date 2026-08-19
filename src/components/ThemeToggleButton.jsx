import { useTheme } from '../hooks/useTheme'

// 라이트/다크 수동 전환 버튼. 기존 top-bar 아이콘 버튼과 동일한 스타일(.btn.icon-btn)을 재사용.
export default function ThemeToggleButton() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      type="button"
      className="btn icon-btn"
      onClick={toggle}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
