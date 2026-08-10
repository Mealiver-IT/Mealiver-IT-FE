import { couponEvent } from '../data/mockData'
import { useEventCoupon } from '../context/EventContext'

// 선착순 이벤트 배너 - 홈 화면 / 이벤트 화면에서 공용으로 사용.
// 누르면 쿠폰 발급 처리(팝업 안내) 후 사용 완료 상태(회색)로 전환.
export default function EventBanner() {
  const { claimed, remainingStock, claimCoupon } = useEventCoupon()

  const handleClick = () => {
    if (claimed) return
    if (remainingStock <= 0) {
      alert('선착순 쿠폰이 모두 소진되었습니다.')
      return
    }
    claimCoupon()
    alert('쿠폰이 발급되었습니다!')
  }

  return (
    <button
      type="button"
      className={`event-banner${claimed ? ' claimed' : ''}`}
      onClick={handleClick}
      disabled={claimed || remainingStock <= 0}
    >
      <strong>선착순 이벤트</strong>
      <span>{claimed ? '쿠폰 발급 완료' : remainingStock <= 0 ? '선착순 마감' : `${couponEvent.bannerText} 받기 →`}</span>
    </button>
  )
}
