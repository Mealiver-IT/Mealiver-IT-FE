import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useEventCoupon, useEvents } from '../context/EventContext'
import FoodIcon from '../components/FoodIcon'

// 이벤트 목록 페이지 - 진행 중인 선착순 이벤트를 배너 목록으로 노출.
// 배너 클릭 시 해당 이벤트 상세(/event/:eventId)로 이동.
// 대응: GET /api/campaigns (실제 캠페인 목록 연동함 — EventContext 참고, 정상 캠페인 2~16번만 임시 필터링 중)
//
// CLOSED/READY 캠페인도 숨기지 않고 목록에 그대로 보여준다 — "마감됐다"는 사실 자체가 정보라서다.
// 대신 클릭해서 받을 수는 없게(비활성 처리) 구분만 해둔다.
export default function EventListPage() {
  const { events, eventsFetchFailed } = useEvents()

  return (
    <>
      <TopBar title="이벤트" showBack={false} />
      <div className="screen-content">
        {eventsFetchFailed && <p className="empty-text">서버 연결 실패로 mock 이벤트를 대신 보여줍니다.</p>}
        {events.length === 0 && <p className="empty-text">진행 중인 이벤트가 없습니다.</p>}
        <div className="event-list">
          {events.map((event) => (
            <EventListItem key={event.eventId} event={event} />
          ))}
        </div>
      </div>
    </>
  )
}

function EventListItem({ event }) {
  const navigate = useNavigate()
  const { claimed, soldOut, status } = useEventCoupon(event.eventId)
  const inactive = claimed || soldOut || status !== 'OPEN'

  const statusBadge = claimed
    ? '발급완료'
    : status === 'CLOSED' || soldOut
      ? '마감'
      : status === 'READY'
        ? '오픈 예정'
        : null

  return (
    <button
      type="button"
      className={`event-banner${inactive ? ' claimed' : ''}`}
      onClick={() => navigate(`/event/${event.eventId}`)}
    >
      <div className="thumb-placeholder tall">
        <FoodIcon name="coupon" />
      </div>
      <div className="row-between">
        <strong>{event.storeName}</strong>
        {statusBadge && <span className="badge">{statusBadge}</span>}
      </div>
      <span>
        {event.bannerText} {inactive ? '' : '받기 →'}
      </span>
    </button>
  )
}
