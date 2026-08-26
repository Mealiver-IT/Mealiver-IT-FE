import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { stores, menusByStore } from '../data/mockData'
import { useCart } from '../context/CartContext'

const ALL_TAB = '대표메뉴'

// 음식 고르는 페이지 (가게 상세)
// 대응: GET /api/stores/{storeId}/menus (명세서엔 없어 흐름상 추정), POST /api/cart/items
//
// 메뉴 탭: 가게마다 메뉴에 실제로 있는 category만 뽑아서 탭으로 보여준다(+"대표메뉴" = 전체) -
// 예전엔 모든 가게가 "대표메뉴/김밥/라면"을 공용으로 써서 치킨집에도 김밥 탭이 뜨는 오류가 있었고,
// 탭 버튼에 onClick 자체가 없어 눌러도 필터링이 안 됐다(2026-08-25 피드백으로 발견).
export default function StorePage() {
  const { storeId } = useParams()
  const navigate = useNavigate()
  const { addItem, items, storeId: cartStoreId } = useCart()
  const [orderType, setOrderType] = useState('delivery')
  const [activeTab, setActiveTab] = useState(ALL_TAB)

  const store = stores.find((s) => s.id === storeId)
  const menus = menusByStore[storeId] ?? []
  const tabs = [ALL_TAB, ...new Set(menus.map((m) => m.category))]

  // 가게를 옮겨다니면(예: 김밥천국 -> 바삭 치킨 하우스) 이전 가게에서 고른 탭이 새 가게엔
  // 없는 카테고리일 수 있어서(김밥 탭 선택 상태로 넘어가면 치킨집 메뉴가 전부 안 보임), 항상 리셋한다.
  useEffect(() => {
    setActiveTab(ALL_TAB)
  }, [storeId])

  if (!store) return <div className="screen-content">가게 정보를 찾을 수 없습니다.</div>

  const visibleMenus = activeTab === ALL_TAB ? menus : menus.filter((m) => m.category === activeTab)

  const itemCountForThisStore = cartStoreId === storeId ? items.reduce((sum, i) => sum + i.quantity, 0) : 0
  const totalForThisStore = cartStoreId === storeId ? items.reduce((sum, i) => sum + i.price * i.quantity, 0) : 0

  return (
    <>
      <TopBar title={store.name} right={<button type="button" className="btn icon-btn">🔍</button>} />
      <div className="screen-content with-fixed-bottom">
        <div className="tab-row">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`btn tab-btn${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="menu-list">
          {visibleMenus.map((menu) => (
            <div key={menu.id} className="list-item menu-row">
              <div>
                <div className="menu-name">{menu.name}</div>
                <div className="menu-option">{menu.option}</div>
                <div className="menu-price">{menu.price.toLocaleString()}원</div>
              </div>
              <button type="button" className="btn icon-btn plus-btn" onClick={() => addItem(store, menu)}>
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed-bottom-bar">
        <div className="row-between">
          <button
            type="button"
            className={`btn order-type-btn${orderType === 'delivery' ? ' active' : ''}`}
            onClick={() => setOrderType('delivery')}
          >
            배달주문
          </button>
          <button
            type="button"
            className={`btn order-type-btn${orderType === 'pickup' ? ' active' : ''}`}
            onClick={() => setOrderType('pickup')}
          >
            포장주문
          </button>
        </div>
        <button
          type="button"
          className="btn btn-block"
          disabled={itemCountForThisStore === 0}
          onClick={() => navigate('/cart')}
        >
          {itemCountForThisStore}개 담기 {totalForThisStore.toLocaleString()}원
        </button>
      </div>
    </>
  )
}
