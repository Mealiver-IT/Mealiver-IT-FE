// "이미지" 텍스트 placeholder 대신 쓰는 작은 인라인 SVG 아이콘 세트.
// 실제 사진은 없지만, 사진 자리 색/형태만으로도 식욕이 자극되도록 함.
// 색은 전부 currentColor 또는 고정 hex로 라이트/다크 어느 배경에서도 잘 보이게 처리.
// 주요 면(김밥 김, 치킨 살, 라면 국물)엔 옅은 그라디언트를 줘서 납작한 도형이 아니라
// 살짝 입체감 있게 보이도록 함 — 그라디언트 id는 아이콘별로 고정 문자열이라 같은 아이콘이
// 한 화면에 여러 번 떠도(가게 목록 등) 서로 같은 정의를 가리킬 뿐이라 문제 없음.
const ICONS = {
  gimbap: (
    <svg viewBox="0 0 64 64">
      <defs>
        <radialGradient id="gimbapNori" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#4a3626" />
          <stop offset="100%" stopColor="#2c2013" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#gimbapNori)" />
      <circle cx="32" cy="32" r="19" fill="#fdf6e3" />
      <circle cx="24" cy="28" r="3.4" fill="#ff7a30" />
      <circle cx="38" cy="26" r="3" fill="#f4c430" />
      <circle cx="30" cy="38" r="3.2" fill="#4c9a5c" />
      <circle cx="40" cy="36" r="2.6" fill="#e04b3f" />
    </svg>
  ),
  chicken: (
    <svg viewBox="0 0 64 64">
      <defs>
        <linearGradient id="chickenSkin" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#e0995a" />
          <stop offset="100%" stopColor="#b3691a" />
        </linearGradient>
      </defs>
      <path
        d="M32 12c11 0 17 9 16 19-.8 8-5 12-5 18 0 6-5 9-11 9s-11-3-11-9c0-6-4.2-10-5-18-1-10 5-19 16-19z"
        fill="url(#chickenSkin)"
      />
      <rect x="27" y="4" width="8" height="13" rx="4" fill="#8a6a4a" />
      <circle cx="26" cy="30" r="1.6" fill="#7a4a17" />
      <circle cx="36" cy="26" r="1.6" fill="#7a4a17" />
      <circle cx="32" cy="38" r="1.6" fill="#7a4a17" />
    </svg>
  ),
  ramen: (
    <svg viewBox="0 0 64 64">
      <defs>
        <linearGradient id="ramenBroth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f2765f" />
          <stop offset="100%" stopColor="#c53a2c" />
        </linearGradient>
      </defs>
      <path d="M12 30h40l-4 20a6 6 0 0 1-6 5H22a6 6 0 0 1-6-5z" fill="url(#ramenBroth)" />
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
      <defs>
        <linearGradient id="sushiTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f2735a" />
          <stop offset="100%" stopColor="#e8583f" />
        </linearGradient>
      </defs>
      <rect x="10" y="30" width="44" height="18" rx="8" fill="#fdf6e3" />
      <path d="M14 30a18 9 0 0 1 36 0z" fill="url(#sushiTop)" />
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
