import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { CartProvider } from './context/CartContext'
import { EventProvider } from './context/EventContext'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import StorePage from './pages/StorePage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import MyPage from './pages/MyPage'
import EventListPage from './pages/EventListPage'
import EventPage from './pages/EventPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import CouponWalletPage from './pages/CouponWalletPage'
import OrderCompletePage from './pages/OrderCompletePage'
import OrderDetailPage from './pages/OrderDetailPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminCampaignListPage from './pages/admin/AdminCampaignListPage'
import AdminCampaignFormPage from './pages/admin/AdminCampaignFormPage'
import AdminCampaignDetailPage from './pages/admin/AdminCampaignDetailPage'
import AdminUserListPage from './pages/admin/AdminUserListPage'

// 소비자용 폰 프로토타입(.phone-frame) - 기존 화면 전부 그대로.
function ConsumerApp() {
  return (
    <CartProvider>
      <EventProvider>
        <div className="phone-frame">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/store/:storeId" element={<StorePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-complete" element={<OrderCompletePage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/coupons" element={<CouponWalletPage />} />
            <Route path="/events" element={<EventListPage />} />
            <Route path="/event/:eventId" element={<EventPage />} />
          </Routes>
          <BottomNav />
        </div>
      </EventProvider>
    </CartProvider>
  )
}

// 디자인 없이 버튼 배치만 확인하기 위한 저충실도 프로토타입.
// 화면 흐름: 홈(가게목록) -> 가게(메뉴) -> 장바구니 -> 주문/결제, + 마이페이지 / 선착순 이벤트
// /admin/*은 별도 레이아웃(관리자 - 캠페인/쿠폰 CRUD, 실시간 재고, 유저 목록)이라 AdminLayout을
// 부모 Route(Outlet)로 두고 그 아래에 중첩시킨다 - phone-frame 안에 admin 화면이 끼어들지 않는다.
// (별도의 <Routes>를 하나 더 중첩시키는 방식은 절대경로 자식이 매칭되지 않아 빈 화면이 됨 - 표준
// 중첩 Route/Outlet 패턴만 이 React Router 버전에서 안정적으로 동작함.)
function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/campaigns" replace />} />
        <Route path="campaigns" element={<AdminCampaignListPage />} />
        <Route path="campaigns/new" element={<AdminCampaignFormPage />} />
        <Route path="campaigns/:campaignId" element={<AdminCampaignDetailPage />} />
        <Route path="users" element={<AdminUserListPage />} />
      </Route>
      <Route path="/*" element={<ConsumerApp />} />
    </Routes>
  )
}

export default App
