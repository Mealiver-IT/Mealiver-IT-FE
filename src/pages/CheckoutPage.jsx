import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useCart } from '../context/CartContext'
import { useWalletCoupons, useWalletCouponActions } from '../context/EventContext'
import { paymentMethods, stores } from '../data/mockData'
import { calcCouponDiscount } from '../utils/coupon'

// 주문/결제 페이지
// 대응: POST /api/cart/coupons(할인 계산, 미연동/mock), POST /api/orders(주문 생성, 실제 연동함 — CartContext 참고)
// 비고: 가게별 최소 주문금액 미달 시 결제 차단
// KAN-72: 쿠폰 선택(드롭다운) + 쿠폰별 할인 미리보기. 팀 논의 후 토글 UI 대신 드롭다운으로 확정.
// 쿠폰 목록은 실제로 발급받은 쿠폰(useWalletCoupons)만 노출 — 이벤트에서 받기 전엔 안 보임
export default function CheckoutPage() {
  const navigate = useNavigate()
  const { storeId, storeName, items, appliedCoupon, subtotal, discount, totalPrice, applyCoupon, checkout, isCheckingOut } =
    useCart()
  const myCoupons = useWalletCoupons()
  const { removeCouponFromWallet } = useWalletCouponActions()
  const [address, setAddress] = useState('')
  const [request, setRequest] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0].id)
  const [freeDeliveryAssist, setFreeDeliveryAssist] = useState(false)

  const store = stores.find((s) => s.id === storeId)
  const belowMinOrder = store ? subtotal < store.minOrderAmount : false

  if (items.length === 0) {
    return (
      <>
        <TopBar title="주문/결제" />
        <div className="screen-content">
          <p className="empty-text">장바구니가 비어 있습니다.</p>
        </div>
      </>
    )
  }

  const handlePay = async () => {
    if (belowMinOrder || isCheckingOut) return
    const result = await checkout({ address, paymentMethodId })
    if (!result.ok) {
      alert(result.message)
      return
    }
    // 실제(mock 아님) 주문이 쿠폰과 함께 성공했을 때만 지갑에서 지운다 — BE가 그 쿠폰을 실제로 USED 처리했을 때만.
    if (!result.order.isMock && result.order.couponIssueId) {
      removeCouponFromWallet(result.order.coupon.id)
    }
    alert(result.order.isMock ? '주문이 완료되었습니다. (mock 처리, 실제 결제 아님)' : '주문이 완료되었습니다.')
    navigate('/mypage')
  }

  return (
    <>
      <TopBar title="주문/결제" />
      <div className="screen-content with-fixed-bottom">
        <div className="box-flat">
          <label className="field-label" htmlFor="address">
            배달지 주소 입력
          </label>
          <input
            id="address"
            type="text"
            className="search-input"
            placeholder="배달지 주소 입력"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="box-flat">
          <label className="field-label" htmlFor="request">
            요청사항
          </label>
          <textarea
            id="request"
            className="request-textarea"
            placeholder="요청사항을 입력해 주세요"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />
        </div>

        <div className="box-flat">
          <div className="field-label">주문 요약</div>
          <div className="row-between">
            <span>{storeName}</span>
            <span>{items.reduce((sum, i) => sum + i.quantity, 0)}개</span>
          </div>
        </div>

        <div className="box-flat">
          <div className="field-label">쿠폰 선택 ({myCoupons.length}장)</div>
          {myCoupons.length === 0 ? (
            <p className="empty-text">사용 가능한 쿠폰이 없습니다.</p>
          ) : (
            <select
              className="search-input"
              value={appliedCoupon?.id ?? ''}
              onChange={(e) => {
                const coupon = myCoupons.find((c) => c.id === e.target.value)
                applyCoupon(coupon ?? null)
              }}
            >
              <option value="">쿠폰 선택 안 함</option>
              {myCoupons.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (적용 시 -{calcCouponDiscount(c, subtotal).toLocaleString()}원)
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          className={`btn toggle-btn${freeDeliveryAssist ? ' active' : ''}`}
          onClick={() => setFreeDeliveryAssist((v) => !v)}
        >
          배달비 할인 쿠폰 {freeDeliveryAssist ? '사용 중' : '사용 안 함'}
        </button>

        <div className="box-flat">
          <div className="field-label">결제방법</div>
          <div className="radio-group">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`btn radio-btn${paymentMethodId === m.id ? ' active' : ''}`}
                onClick={() => setPaymentMethodId(m.id)}
              >
                {paymentMethodId === m.id ? '● ' : '○ '}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="box-flat summary-box">
          <div className="row-between">
            <span>주문금액</span>
            <span>{subtotal.toLocaleString()}원</span>
          </div>
          <div className="row-between">
            <span>할인</span>
            <span>-{discount.toLocaleString()}원</span>
          </div>
          <div className="row-between summary-total">
            <strong>총 결제금액</strong>
            <strong>{totalPrice.toLocaleString()}원</strong>
          </div>
        </div>

        {belowMinOrder && store && (
          <p className="warning-text">
            최소 주문금액 {store.minOrderAmount.toLocaleString()}원 미달로 결제할 수 없습니다.
          </p>
        )}
      </div>

      <div className="fixed-bottom-bar">
        <button type="button" className="btn btn-block" disabled={belowMinOrder || isCheckingOut} onClick={handlePay}>
          {isCheckingOut ? '결제 처리 중...' : '결제하기'}
        </button>
      </div>
    </>
  )
}
