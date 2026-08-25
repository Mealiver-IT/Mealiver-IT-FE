import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useEventCoupon, useEvents, useEventStates } from '../context/EventContext'
import FoodIcon from '../components/FoodIcon'

// 이벤트 목록 페이지 - 진행 중인 선착순 이벤트를 배너 목록으로 노출.
// 배너 클릭 시 해당 이벤트 상세(/event/:eventId)로 이동.
// 대응: GET /api/campaigns (실제 캠페인 목록 연동함 — EventContext 참고, 정상 캠페인 2~16번만 임시 필터링 중)
//
// 2026-08-24 피드백: 마감된 이벤트와 진행 중인 이벤트가 구분 없이 섞여 보여서 확인이 어렵다는 의견 →
// 우상단에 작은 정렬형 드롭다운(전체/진행 중/마감)을 추가(큰 탭 버튼은 과하다는 피드백 반영,
// 무신사 "추천순/가격순" 셀렉트 참고). 기본값은 "진행 중"만 보여주고, CLOSED/READY 자체를 숨기는 게
// 아니라 "전체"를 고르면 여전히 다 보인다 — "마감됐다"는 사실 자체가 정보라는 기존 원칙은 유지.
// 마감 기준은 배지 표시 로직(EventListItem)과 동일하게 status===CLOSED 또는 soldOut. READY(오픈
// 예정)는 아직 안 끝난 거라 "진행 중" 쪽에 포함한다 - 안에서 "오픈 예정" 배지로 계속 구분됨.
const FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'OPEN', label: '진행 중' },
  { key: 'CLOSED', label: '마감' },
]

function isEventClosed(eventStates, eventId) {
  const state = eventStates[eventId]
  if (!state) return false
  return state.status === 'CLOSED' || state.soldOut
}

export default function EventListPage() {
  const { events, eventsFetchFailed } = useEvents()
  const eventStates = useEventStates()
  const [filter, setFilter] = useState('OPEN')

  const filteredEvents = events.filter((event) => {
    if (filter === 'ALL') return true
    const closed = isEventClosed(eventStates, event.eventId)
    return filter === 'CLOSED' ? closed : !closed
  })

  return (
    <>
      <TopBar title="이벤트" showBack={false} />
      <div className="screen-content">
        <div className="event-filter-row">
          <select className="event-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        {eventsFetchFailed && <p className="empty-text">서버 연결 실패로 mock 이벤트를 대신 보여줍니다.</p>}
        {filteredEvents.length === 0 && (
          <p className="empty-text">{filter === 'CLOSED' ? '마감된' : filter === 'OPEN' ? '진행 중인' : ''} 이벤트가 없습니다.</p>
        )}
        <div className="event-list">
          {filteredEvents.map((event) => (
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
