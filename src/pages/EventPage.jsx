import TopBar from '../components/TopBar'
import EventBanner from '../components/EventBanner'

// 이벤트 페이지 - 홈 화면과 동일한 선착순 이벤트 배너를 그대로 노출.
// 배너 클릭 시 쿠폰 발급 처리는 EventBanner/EventContext에서 공용으로 처리.
export default function EventPage() {
  return (
    <>
      <TopBar title="이벤트" />
      <div className="screen-content">
        <EventBanner />
      </div>
    </>
  )
}
