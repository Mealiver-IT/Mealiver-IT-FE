import { Route, Routes } from 'react-router-dom'
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

// 디자인 없이 버튼 배치만 확인하기 위한 저충실도 프로토타입.
// 화면 흐름: 홈(가게목록) -> 가게(메뉴) -> 장바구니 -> 주문/결제, + 마이페이지 / 선착순 이벤트
function App() {
  return (
    <CartProvider>
      <EventProvider>
        <div className="phone-frame">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/store/:storeId" element={<StorePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/events" element={<EventListPage />} />
            <Route path="/event/:eventId" element={<EventPage />} />
          </Routes>
          <BottomNav />
        </div>
      </EventProvider>
    </CartProvider>
  )
}

export default App
