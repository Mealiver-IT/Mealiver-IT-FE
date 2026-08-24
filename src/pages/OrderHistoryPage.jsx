import { useState } from 'react'
import TopBar from '../components/TopBar'
import ActionErrorPage from '../components/ActionErrorPage'
import { useCart } from '../context/CartContext'
import { useWalletCouponActions } from '../context/EventContext'
import { orderHistory as pastOrderHistory } from '../data/mockData'

// 주문 내역 페이지 — 마이페이지 "주문 내역" 메뉴에서 진입.
// 대응: GET /api/orders(목록, 구현됨 - 연동함), GET /api/orders/{orderId}(상세, 미사용), PATCH /api/orders/{orderId}/cancel(구현됨, 연동함)
//
// CartContext가 마운트 시 GET /api/orders로 실제 이력을 불러와 이번 세션에 만든 주문과 합쳐서 orders에 담아둔다.
// 다만 BE의 orders 테이블엔 store/메뉴 정보도, 어떤 쿠폰을 썼는지도 안 남아있다(계급 산정용 최소 스키마라서) —
// 그래서 "과거"(이번 세션에 만들지 않은) 주문은 가게명이 없고, 어떤 쿠폰이었는지도 모른다.
export default function OrderHistoryPage() {
  const { orders, historyFetchFailed, requestCancelOrder } = useCart()
  const { restoreCouponToWallet, refreshWalletCoupons } = useWalletCouponActions()
  const [actionError, setActionError] = useState(null) // { code, message, orderId } — 취소 실패 시 ActionErrorPage로 표시

  const attemptCancel = async (orderId) => {
    const order = orders.find((o) => o.orderId === orderId)
    if (!order) return
    setActionError(null)
    const result = await requestCancelOrder(orderId)
    if (!result.ok) {
      setActionError({ code: result.code, message: result.message, orderId })
      return
    }
    // 어떤 쿠폰인지 알고 있으면(이번 세션에 만든 주문) 즉시 반영하고,
    // 과거 주문이라 몰랐던 경우까지 포함해서 서버 기준으로 한 번 더 맞춘다 — BE는 취소 시점에 이미
    // 쿠폰을 ISSUED로 되돌려놨으므로(markReturnedToIssued), 다시 조회하면 그 쿠폰이 잡힌다.
    // 이걸 안 하면 새로고침을 해야만 지갑에 다시 보였다.
    if (order.couponIssueId && order.coupon) {
      restoreCouponToWallet(order.coupon)
    }
    await refreshWalletCoupons()
    alert('주문이 취소되었습니다.')
  }

  const handleCancel = async (order) => {
    const label = order.storeName ?? `주문 #${order.orderId}`
    const ok = window.confirm(`'${label}' (${order.totalPrice.toLocaleString()}원)을 취소할까요?`)
    if (!ok) return
    await attemptCancel(order.orderId)
  }

  // BE 이력 조회가 실패했을 때만(네트워크 오류/서버 다운) mock 이력을 대신 보여준다 — 조회가 됐으면 그게 진짜 이력이라 mock은 사족.
  const showMockFallback = historyFetchFailed && pastOrderHistory.length > 0
  const isEmpty = orders.length === 0 && !showMockFallback

  if (actionError) {
    return (
      <>
        <TopBar title="주문 내역" />
        <div className="screen-content">
          <ActionErrorPage
            code={actionError.code}
            message={actionError.message}
            onRetry={() => attemptCancel(actionError.orderId)}
            onClose={() => setActionError(null)}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="주문 내역" />
      <div className="screen-content">
        {isEmpty && <p className="empty-text">주문 내역이 없습니다.</p>}

        {orders.length > 0 && (
          <div className="menu-list">
            {orders.map((order) => (
              <div key={order.orderId} className="list-item menu-row">
                <div>
                  <div className="menu-name">
                    {order.storeName ?? `주문 #${order.orderId}`}
                    {order.isMock && <span className="badge">mock</span>}
                  </div>
                  <div className="menu-option">
                    {order.items.length > 0 && `${order.items.reduce((sum, i) => sum + i.quantity, 0)}개 · `}
                    {order.totalPrice.toLocaleString()}원
                  </div>
                  <div
                    className="menu-option"
                    style={{ color: order.status === '주문완료' ? 'var(--accent)' : 'var(--danger)' }}
                  >
                    {order.status}
                  </div>
                </div>
                {order.status === '주문완료' && (
                  <button type="button" className="btn btn-small" onClick={() => handleCancel(order)}>
                    주문 취소
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showMockFallback && (
          <>
            <div className="field-label">이전 주문 내역 (mock — 서버 연결 실패로 대신 표시)</div>
            <div className="menu-list">
              {pastOrderHistory.map((order) => (
                <div key={order.orderId} className="list-item menu-row">
                  <div>
                    <div className="menu-name">{order.storeName}</div>
                    <div className="menu-option">
                      {order.date} · {order.totalPrice.toLocaleString()}원
                    </div>
                  </div>
                  <span className="badge">{order.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
