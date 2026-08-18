// "이미지" 텍스트 placeholder 대신 쓰는 작은 인라인 SVG 아이콘 세트.
// 실제 사진은 없지만, 사진 자리 색/형태만으로도 식욕이 자극되도록 함.
// 색은 전부 currentColor 또는 고정 hex로 라이트/다크 어느 배경에서도 잘 보이게 처리.
const ICONS = {
  gimbap: (
    <svg viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="26" fill="#3a2a1c" />
      <circle cx="32" cy="32" r="19" fill="#fdf6e3" />
      <circle cx="24" cy="28" r="3.4" fill="#ff7a30" />
      <circle cx="38" cy="26" r="3" fill="#f4c430" />
      <circle cx="30" cy="38" r="3.2" fill="#4c9a5c" />
      <circle cx="40" cy="36" r="2.6" fill="#e04b3f" />
    </svg>
  ),
  chicken: (
    <svg viewBox="0 0 64 64">
      <path
        d="M32 12c11 0 17 9 16 19-.8 8-5 12-5 18 0 6-5 9-11 9s-11-3-11-9c0-6-4.2-10-5-18-1-10 5-19 16-19z"
        fill="#c8791f"
      />
      <rect x="27" y="4" width="8" height="13" rx="4" fill="#8a6a4a" />
      <circle cx="26" cy="30" r="1.6" fill="#7a4a17" />
      <circle cx="36" cy="26" r="1.6" fill="#7a4a17" />
      <circle cx="32" cy="38" r="1.6" fill="#7a4a17" />
    </svg>
  ),
  ramen: (
    <svg viewBox="0 0 64 64">
      <path d="M12 30h40l-4 20a6 6 0 0 1-6 5H22a6 6 0 0 1-6-5z" fill="#e04b3f" />
      <ellipse cx="32" cy="30" rx="20" ry="5" fill="#f2765f" />
      <path
        d="M22 20c2-4 6-4 6 0M32 18c2-4 6-4 6 0M42 20c2-4 6-4 6 0"
        stroke="#d9d9d9"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),
  sushi: (
    <svg viewBox="0 0 64 64">
      <rect x="10" y="30" width="44" height="18" rx="8" fill="#fdf6e3" />
      <path d="M14 30a18 9 0 0 1 36 0z" fill="#e8583f" />
      <rect x="10" y="30" width="44" height="6" fill="#1c1c1c" opacity="0.85" />
    </svg>
  ),
  coupon: (
    <svg viewBox="0 0 64 64">
      <path
        d="M8 24a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v4a5 5 0 0 0 0 8v4a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-4a5 5 0 0 0 0-8z"
        fill="currentColor"
        opacity="0.9"
      />
      <line x1="32" y1="20" x2="32" y2="44" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.5" strokeDasharray="3 4" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="22" fill="currentColor" opacity="0.5" />
    </svg>
  ),
}

export default function FoodIcon({ name = "default" }) {
  return ICONS[name] ?? ICONS.default
}
