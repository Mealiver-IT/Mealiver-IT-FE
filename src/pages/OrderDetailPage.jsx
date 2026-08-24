import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useCart } from '../context/CartContext'
import { paymentMethods } from '../data/mockData'

// 주문 내역에서 항목을 눌렀을 때 보여주는 상세 화면 — OrderHistoryPage가 이미 들고 있는
// CartContext.orders 배열에서 orderId로 다시 찾아서 보여준다(별도 API 재조회 없음, GET
// /api/orders/{orderId}는 목록과 응답 모양이 같아서 어차피 더 얻을 정보도 없음 - OrderHistoryPage 주석 참고).
//
// 이번 세션에 만든 주문(items/address/coupon/paymentMethodId 있음)과 BE에서 불러온 과거 주문
// (그 필드들이 아예 없음, orders 테이블이 계급 산정용 최소 스키마라서)이 섞여 있어서, 없는 필드는
// 조건부로 숨기고 과거 주문일 땐 안내 문구를 보여준다.
export default function OrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { orders } = useCart()
  const order = orders.find((o) => String(o.orderId) === orderId)

  if (!order) {
    return (
      <>
        <TopBar title="주문 상세" />
        <div className="screen-content">
          <p className="empty-text">주문 정보를 찾을 수 없습니다.</p>
          <button type="button" className="btn btn-block" onClick={() => navigate('/orders')}>
            주문 내역으로
          </button>
        </div>
      </>
    )
  }

  const paymentLabel = paymentMethods.find((m) => m.id === order.paymentMethodId)?.label
  const isPastOrder = order.items.length === 0 && !order.address // 이번 세션에 만들지 않은 과거 주문 추정

  return (
    <>
      <TopBar title="주문 상세" />
      <div className="screen-content">
        <div className="box-flat">
          <div className="row-between">
            <strong>{order.storeName ?? `주문 #${order.orderId}`}</strong>
            <span
              className="badge"
              style={{ color: order.status === '주문완료' ? 'var(--accent)' : 'var(--danger)' }}
            >
              {order.status}
            </span>
          </div>
          {order.orderedAt && <p className="empty-text">{new Date(order.orderedAt).toLocaleString('ko-KR')}</p>}
        </div>

        {order.items.length > 0 ? (
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
        ) : (
          isPastOrder && (
            <p className="empty-text">
              과거에 만들어진 주문이라 메뉴/배달지 정보가 남아있지 않습니다(주문 시스템이 계급 산정용 최소 정보만 저장해서요).
            </p>
          )
        )}

        <div className="box-flat">
          <div className="field-label">결제 정보</div>
          {order.address && (
            <div className="row-between">
              <span>배달지</span>
              <span>{order.address}</span>
            </div>
          )}
          {paymentLabel && (
            <div className="row-between">
              <span>결제수단</span>
              <span>{paymentLabel}</span>
            </div>
          )}
          {order.coupon && (
            <div className="row-between">
              <span>사용 쿠폰</span>
              <span>{order.coupon.name}</span>
            </div>
          )}
          <div className="row-between summary-total">
            <strong>결제금액</strong>
            <strong>{order.totalPrice.toLocaleString()}원</strong>
          </div>
        </div>

        <button type="button" className="btn btn-block-outline" onClick={() => navigate('/orders')}>
          주문 내역으로
        </button>
      </div>
    </>
  )
}
