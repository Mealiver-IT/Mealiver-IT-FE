import { useEffect } from 'react'
import TopBar from '../components/TopBar'
import { useWalletCoupons, useWalletCouponActions } from '../context/EventContext'
import { formatDiscountDetail } from '../utils/coupon'

// 쿠폰함 — 마이페이지 "쿠폰함" 메뉴에서 진입.
// 대응: GET /api/members/me/coupons (구현됨, 연동함)
//
// walletCoupons(EventContext)는 이미 실제 데이터다 — 앱 마운트 시 GET /api/members/me/coupons로
// 채워지고, 이벤트 발급/주문 취소 성공 시에도 갱신된다. 그동안 "쿠폰함" 버튼이 이 데이터를 보여줄
// 화면 없이 개수만 alert()로 띄우고 있었던 것뿐이라, 이 페이지는 새 데이터 연동이 아니라
// 이미 있던 실제 데이터를 처음으로 화면에 그리는 작업이다.
export default function CouponWalletPage() {
  const coupons = useWalletCoupons()
  const { refreshWalletCoupons } = useWalletCouponActions()

  // 페이지 진입 시 한 번 더 최신 상태로 맞춘다 — 다른 화면에서 오래 머물다 들어와도 최신 쿠폰이 보이도록.
  useEffect(() => {
    refreshWalletCoupons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <TopBar title="쿠폰함" />
      <div className="screen-content">
        {coupons.length === 0 && <p className="empty-text">보유한 쿠폰이 없습니다.</p>}

        <div className="coupon-list">
          {coupons.map((c) => (
            <div key={c.id} className="list-item menu-row">
              <div>
                <div className="menu-name">{c.name}</div>
                <div className="menu-option">{formatDiscountDetail(c)}</div>
                {c.validUntil && (
                  <div className="menu-option">{new Date(c.validUntil).toLocaleDateString('ko-KR')}까지 사용 가능</div>
                )}
              </div>
              <span className="badge">결제 시 사용</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
