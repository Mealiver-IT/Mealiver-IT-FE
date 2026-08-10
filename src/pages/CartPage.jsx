import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useCart } from '../context/CartContext'

// 장바구니 페이지
// 대응: GET /api/cart, PATCH /api/cart/items/{itemId}, DELETE /api/cart/items/{itemId}, DELETE /api/cart
export default function CartPage() {
  const navigate = useNavigate()
  const { storeId, storeName, items, updateQuantity, removeItem, clearCart, subtotal } = useCart()

  return (
    <>
      <TopBar title="장바구니" />
      <div className="screen-content with-fixed-bottom">
        {items.length === 0 ? (
          <p className="empty-text">장바구니가 비어 있습니다.</p>
        ) : (
          <>
            <div className="row-between box-flat">
              <strong>{storeName}</strong>
              <button type="button" className="btn btn-small" onClick={clearCart}>
                전체 비우기
              </button>
            </div>

            <div className="menu-list">
              {items.map((item) => (
                <div key={item.itemId} className="list-item menu-row">
                  <div>
                    <div className="menu-name">{item.name}</div>
                    <div className="menu-option">{item.option}</div>
                    <div className="menu-price">{item.price.toLocaleString()}원</div>
                  </div>
                  <div className="qty-controls">
                    <button type="button" className="btn icon-btn" onClick={() => updateQuantity(item.itemId, item.quantity - 1)}>
                      -
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button type="button" className="btn icon-btn" onClick={() => updateQuantity(item.itemId, item.quantity + 1)}>
                      +
                    </button>
                    <button type="button" className="btn icon-btn" onClick={() => removeItem(item.itemId)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-block-outline" onClick={() => navigate(`/store/${storeId}`)}>
              + 메뉴 추가하기
            </button>
          </>
        )}
      </div>

      <div className="fixed-bottom-bar">
        <button type="button" className="btn btn-block" disabled={items.length === 0} onClick={() => navigate('/checkout')}>
          총 {subtotal.toLocaleString()}원 결제하기
        </button>
      </div>
    </>
  )
}
