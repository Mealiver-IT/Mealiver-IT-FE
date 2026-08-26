import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { useWalletCoupons, useWalletCouponActions, toFECoupon } from '../context/EventContext'
import { fetchAllMyCoupons } from '../api/coupons'
import { formatDiscountDetail } from '../utils/coupon'

// 종료 상태 쿠폰 배지 문구. BE CouponStatus 기준(ISSUED는 위쪽 "사용 가능한 쿠폰"에서 이미 다룸).
const PAST_STATUS_LABEL = {
  USED: '사용완료',
  CANCELED: '회수됨',
  EXPIRED: '만료됨',
}

// 쿠폰함 — 마이페이지 "쿠폰함" 메뉴에서 진입.
// 대응: GET /api/members/me/coupons(사용 가능만, 구현됨), GET /api/members/me/coupons/all(전체, 2026-08-25 추가)
//
// "사용 가능한 쿠폰"은 EventContext.walletCoupons(ISSUED만) 그대로 재사용한다 - 결제 화면 쿠폰 선택
// 토글과 같은 데이터라 여기서 새로 불러올 필요가 없고, 발급/취소 성공 시 이미 자동 갱신된다.
// "지난 쿠폰"(사용함/회수됨/만료됨)은 새 /all API로 이 화면에서만 별도로 불러온다 - walletCoupons에
// 섞으면 결제 화면 드롭다운에 못 쓰는 쿠폰까지 선택 가능한 것처럼 뜨는 문제가 생기기 때문에 일부러 분리함.
export default function CouponWalletPage() {
  const coupons = useWalletCoupons()
  const { refreshWalletCoupons } = useWalletCouponActions()
  const [pastCoupons, setPastCoupons] = useState([])

  // 페이지 진입 시 사용 가능한 쿠폰은 최신 상태로 맞추고(다른 화면에서 오래 머물다 들어와도 반영되도록),
  // 지난 쿠폰은 /all에서 status가 ISSUED가 아닌 것만 걸러서 별도로 담아둔다.
  useEffect(() => {
    refreshWalletCoupons()
    fetchAllMyCoupons()
      .then((list) => {
        if (Array.isArray(list)) {
          setPastCoupons(list.filter((issue) => issue.status !== 'ISSUED').map(toFECoupon))
        }
      })
      .catch((err) => {
        console.warn('[CouponWalletPage] 지난 쿠폰 조회 실패:', err.message)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <TopBar title="쿠폰함" />
      <div className="screen-content">
        <div className="field-label">사용 가능한 쿠폰</div>
        {coupons.length === 0 && <p className="empty-text">사용 가능한 쿠폰이 없습니다.</p>}
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

        {pastCoupons.length > 0 && (
          <>
            <div className="field-label">지난 쿠폰</div>
            <div className="coupon-list">
              {pastCoupons.map((c) => (
                <div key={c.id} className="list-item menu-row past-coupon">
                  <div>
                    <div className="menu-name">{c.name}</div>
                    <div className="menu-option">{formatDiscountDetail(c)}</div>
                  </div>
                  <span className="badge badge-muted">{PAST_STATUS_LABEL[c.status] ?? c.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
