import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { couponEvents } from '../data/mockData'
import { useEventCoupon } from '../context/EventContext'
import FoodIcon from '../components/FoodIcon'

// 이벤트 목록 페이지 - 진행 중인 선착순 이벤트를 배너 목록으로 노출.
// 배너 클릭 시 해당 이벤트 상세(/event/:eventId)로 이동.
// 대응: GET /api/coupon-events (목록)
export default function EventListPage() {
  return (
    <>
      <TopBar title="이벤트" showBack={false} />
      <div className="screen-content">
        <div className="event-list">
          {couponEvents.map((event) => (
            <EventListItem key={event.eventId} event={event} />
          ))}
        </div>
      </div>
    </>
  )
}

function EventListItem({ event }) {
  const navigate = useNavigate()
  const { claimed, soldOut } = useEventCoupon(event.eventId)

  return (
    <button
      type="button"
      className={`event-banner${claimed ? ' claimed' : ''}`}
      onClick={() => navigate(`/event/${event.eventId}`)}
    >
      <div className="thumb-placeholder tall">
        <FoodIcon name="coupon" />
      </div>
      <div className="row-between">
        <strong>{event.storeName}</strong>
        {claimed && <span className="badge">발급완료</span>}
        {!claimed && soldOut && <span className="badge">마감</span>}
      </div>
      <span>{event.bannerText} {claimed ? '' : '받기 →'}</span>
    </button>
  )
}
