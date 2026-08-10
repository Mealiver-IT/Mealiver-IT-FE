import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { stores, menusByStore, storeMenuTabs } from '../data/mockData'
import { useCart } from '../context/CartContext'

// 음식 고르는 페이지 (가게 상세)
// 대응: GET /api/stores/{storeId}/menus (명세서엔 없어 흐름상 추정), POST /api/cart/items
export default function StorePage() {
  const { storeId } = useParams()
  const navigate = useNavigate()
  const { addItem, items, storeId: cartStoreId } = useCart()
  const [orderType, setOrderType] = useState('delivery')

  const store = stores.find((s) => s.id === storeId)
  const menus = menusByStore[storeId] ?? []

  if (!store) return <div className="screen-content">가게 정보를 찾을 수 없습니다.</div>

  const itemCountForThisStore = cartStoreId === storeId ? items.reduce((sum, i) => sum + i.quantity, 0) : 0
  const totalForThisStore = cartStoreId === storeId ? items.reduce((sum, i) => sum + i.price * i.quantity, 0) : 0

  return (
    <>
      <TopBar title={store.name} right={<button type="button" className="btn icon-btn">🔍</button>} />
      <div className="screen-content with-fixed-bottom">
        <div className="tab-row">
          {storeMenuTabs.map((tab, idx) => (
            <button key={tab} type="button" className={`btn tab-btn${idx === 0 ? ' active' : ''}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="menu-list">
          {menus.map((menu) => (
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
