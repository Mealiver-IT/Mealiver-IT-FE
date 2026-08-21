import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories, stores } from '../data/mockData'
import FoodIcon from '../components/FoodIcon'
import ThemeToggleButton from '../components/ThemeToggleButton'
import logo from '../assets/logo.png'

// 음식점 고르는 페이지
// 대응: GET /api/categories, GET /api/categories/{categoryId}/stores
export default function HomePage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState(categories[0].id)

  const visibleStores = stores.filter((s) => s.categoryId === activeCategory)

  return (
    <div className="screen-content">
      <div className="brand-row">
        <img src={logo} alt="밀리버릿 로고" className="brand-logo" />
        <ThemeToggleButton />
      </div>

      <div className="row-between box-flat">
        <button type="button" className="btn">
          📍 강남구 역삼동
        </button>
        <button type="button" className="btn icon-btn">
          🔍
        </button>
      </div>

      <input type="text" className="search-input" placeholder="가게, 음식 검색" readOnly />

      <div className="grid-4">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`btn category-btn${activeCategory === c.id ? ' active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="store-list">
        {visibleStores.length === 0 && <p className="empty-text">해당 카테고리 가게가 없습니다.</p>}
        {visibleStores.map((s) => (
          <button key={s.id} type="button" className="list-item store-card" onClick={() => navigate(`/store/${s.id}`)}>
            <div className="thumb-placeholder">
              <FoodIcon name={s.icon} />
            </div>
            <div className="store-card-info">
              <div className="store-card-name">
                {s.name} {s.hasCoupon && <span className="badge">쿠폰</span>}
              </div>
              <div className="store-card-sub">
                ★ {s.rating} ({s.reviewCount}) · 배달비 {s.deliveryFee.toLocaleString()}원
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
