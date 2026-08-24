import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { paymentMethods } from '../data/mockData'

// 결제 성공 직후 보여주는 전용 완료 화면 — CheckoutPage.handlePay가 성공 시
// navigate('/order-complete', { state: { order } })로 방금 만든 주문을 그대로 넘겨준다.
// 주문 데이터를 다시 조회하는 API가 아니라 navigation state로만 받는다. 같은 탭에서 새로고침(F5)은
// 브라우저가 History state를 그대로 들고 있어서 order가 유지되지만(직접 확인함), 이 URL을 북마크·공유
// 받아 새 탭/새 세션으로 열거나 주소를 직접 입력해서 들어오면 state가 없다 — 주문 내역으로 안내한다.
export default function OrderCompletePage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const order = state?.order

  if (!order) {
    return (
      <>
        <TopBar title="주문 완료" showBack={false} />
        <div className="screen-content">
          <p className="empty-text">주문 정보를 찾을 수 없습니다. 이 페이지 주소로 직접 들어오신 것 같아요.</p>
          <button type="button" className="btn btn-block" onClick={() => navigate('/orders')}>
            주문 내역 보기
          </button>
        </div>
      </>
    )
  }

  const paymentLabel = paymentMethods.find((m) => m.id === order.paymentMethodId)?.label ?? order.paymentMethodId

  return (
    <>
      <TopBar title="주문 완료" showBack={false} />
      <div className="screen-content">
        <div className="order-complete-page">
          <div className="order-complete-icon" aria-hidden="true">
            ✅
          </div>
          <h2 className="order-complete-title">주문이 완료되었습니다!</h2>
          <p className="order-complete-message">맛있게 준비해서 배달해드릴게요.</p>
        </div>

        <div className="box-flat">
          <div className="field-label">가게</div>
          <div>{order.storeName ?? `주문 #${order.orderId}`}</div>
        </div>

        {order.items.length > 0 && (
          <div className="menu-list">
            <div className="field-label">주문 메뉴</div>
            {order.items.map((item) => (
              <div key={item.itemId} className="list-item menu-row">
                <div>
                  <div className="menu-name">{item.name}</div>
                  {item.option && <div className="menu-option">{item.option}</div>}
                </div>
                <div className="menu-option">
                  {item.price.toLocaleString()}원 × {item.quantity}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="box-flat">
          <div className="field-label">결제 정보</div>
          {order.address && (
            <div className="row-between">
              <span>배달지</span>
              <span>{order.address}</span>
            </div>
          )}
          <div className="row-between">
            <span>결제수단</span>
            <span>{paymentLabel}</span>
          </div>
          {order.coupon && (
            <div className="row-between">
              <span>사용 쿠폰</span>
              <span>{order.coupon.name}</span>
            </div>
          )}
          <div className="row-between summary-total">
            <strong>총 결제금액</strong>
            <strong>{order.totalPrice.toLocaleString()}원</strong>
          </div>
        </div>

        <div className="menu-list">
          <button type="button" className="btn btn-block" onClick={() => navigate('/orders')}>
            주문 내역 보기
          </button>
          <button type="button" className="btn btn-block-outline" onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
      </div>
    </>
  )
}
