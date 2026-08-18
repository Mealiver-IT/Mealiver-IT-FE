import { useEffect, useState } from 'react'

// 라이트/다크 수동 전환. localStorage에 저장된 값이 없으면 OS 설정(prefers-color-scheme)을 따름.
// 한 번 누르면 그때부터는 명시적으로 고정되고, 새로고침해도 유지됨.
const STORAGE_KEY = 'milliverit-theme' // 'light' | 'dark' | 없으면 시스템 설정 따름

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY))

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem(STORAGE_KEY, theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [theme])

  const isDark = theme ? theme === 'dark' : systemPrefersDark()

  const toggle = () => setTheme(isDark ? 'light' : 'dark')

  return { isDark, toggle }
}
