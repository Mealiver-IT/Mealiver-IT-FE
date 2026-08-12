// 목데이터: API 명세서(밀리버릿_API명세서.csv)의 도메인 구조를 근거로 임의 생성.
// 실제 API 응답 스키마가 확정되면 필드명만 맞춰서 교체하면 됩니다.
// 대응 엔드포인트를 각 섹션 주석에 표기해 두었습니다.

// GET /api/categories
export const categories = [
  { id: 'korean', name: '한식', mainExposed: true },
  { id: 'chinese', name: '중식', mainExposed: true },
  { id: 'japanese', name: '일식', mainExposed: true },
  { id: 'snack', name: '분식', mainExposed: true },
  { id: 'night', name: '야식', mainExposed: true },
  { id: 'pizza', name: '피자', mainExposed: true },
  { id: 'dessert', name: '디저트', mainExposed: true },
]

// GET /api/categories/{categoryId}/stores
export const stores = [
  {
    id: 'store-1',
    categoryId: 'korean',
    name: '김밥천국',
    rating: 4.9,
    reviewCount: '2.1k+',
    deliveryFee: 2500,
    minOrderAmount: 12000,
    hasCoupon: true,
  },
  {
    id: 'store-2',
    categoryId: 'korean',
    name: '바삭 치킨 하우스',
    rating: 4.9,
    reviewCount: '2.1k+',
    deliveryFee: 2500,
    minOrderAmount: 15000,
    hasCoupon: false,
  },
  {
    id: 'store-3',
    categoryId: 'chinese',
    name: '맛있는 국밥집',
    rating: 4.9,
    reviewCount: '2.1k+',
    deliveryFee: 2500,
    minOrderAmount: 12000,
    hasCoupon: false,
  },
  {
    id: 'store-4',
    categoryId: 'japanese',
    name: '스시야',
    rating: 4.8,
    reviewCount: '900+',
    deliveryFee: 3000,
    minOrderAmount: 18000,
    hasCoupon: true,
  },
]

// 가게 내 탭 (대표메뉴 / 김밥 / 라면 등) — 화면 배치 확인용, 필터 로직은 없음
export const storeMenuTabs = ['대표메뉴', '김밥', '라면']

// GET /api/stores/{storeId}/menus 에 대응 (명세서엔 별도 항목 없어 카트/주문 흐름 기준으로 추정)
export const menusByStore = {
  'store-1': [
    { id: 'menu-1', name: '참치김밥', option: '신선한 참치와 야채', price: 4500 },
    { id: 'menu-2', name: '야채김밥', option: '아삭한 제철 야채', price: 4500 },
    { id: 'menu-3', name: '치즈김밥', option: '고소한 치즈 듬뿍', price: 4500 },
    { id: 'menu-4', name: '라면', option: '얼큰한 국물', price: 5000 },
  ],
  'store-2': [
    { id: 'menu-5', name: '후라이드 치킨', option: '기본', price: 18000 },
    { id: 'menu-6', name: '양념 치킨', option: '기본', price: 19000 },
  ],
  'store-3': [
    { id: 'menu-7', name: '국밥', option: '기본', price: 9500 },
    { id: 'menu-8', name: '수육 국밥', option: '곱빼기', price: 12000 },
  ],
  'store-4': [
    { id: 'menu-9', name: '연어 초밥 세트', option: '기본', price: 16000 },
    { id: 'menu-10', name: '광어 초밥 세트', option: '기본', price: 15000 },
  ],
}

// GET /api/members/me/membership
export const membership = {
  level: '병장',
  validOrderCountLast30Days: 28,
  ordersUntilNextLevel: 2,
}

// GET /api/members/me/benefits
export const benefits = [
  { id: 'benefit-1', title: '무료배달 쿠폰', desc: '병장 등급 전용, 매일 자동 지급되는 무료배달 쿠폰' },
  { id: 'benefit-2', title: '20% 할인 쿠폰', desc: '주문 시 바로 사용할 수 있는 할인 쿠폰' },
]

// GET /api/members/me/coupons
// 이벤트로 받는 쿠폰(선착순)은 여기 포함하지 않음 — 발급 시점에 EventContext가 이 목록에 추가함.
// 여기 있는 건 이벤트와 무관하게 이미 지급된(멤버십 혜택 등) 쿠폰.
export const myCoupons = [{ id: 'coupon-2', name: '10% 할인 쿠폰', discountType: 'RATE', discountValue: 10, maxDiscount: 3000 }]

// GET /api/coupon-events (목록), GET /api/coupon-events/{eventId} (상세)
// rewardCoupon: 선착순 쿠폰 받기 성공 시 지급되는 쿠폰 (POST .../claim 응답에 해당, 클레임 전엔 결제 화면에 노출 안 됨)
// campaignId: 실제 BE campaign.id(Long) 매핑용 — DB에 캠페인 시딩 스크립트가 없어서
// 지금 어떤 ID가 실제로 존재하는지 확인 불가. 우선 1, 2로 가정. 확인되면 교체 필요.
export const couponEvents = [
  {
    eventId: 'event-1',
    campaignId: 1,
    title: '선착순 이벤트',
    storeName: '바삭 치킨 하우스',
    bannerText: '선착순 5,000원 쿠폰',
    totalStock: 10000,
    remainingStock: 3120,
    discountByLevel: { 이등병: 5, 병장: 10, 원사: 20 },
    rewardCoupon: { id: 'coupon-event-1', name: '선착순 5,000원 쿠폰', discountType: 'FIXED', discountValue: 5000 },
  },
  {
    eventId: 'event-2',
    campaignId: 2,
    title: '선착순 이벤트',
    storeName: '맛있는 국밥집',
    bannerText: '선착순 3,000원 쿠폰',
    totalStock: 5000,
    remainingStock: 812,
    discountByLevel: { 이등병: 5, 병장: 10, 원사: 20 },
    rewardCoupon: { id: 'coupon-event-2', name: '선착순 3,000원 쿠폰', discountType: 'FIXED', discountValue: 3000 },
  },
]

// GET /api/orders
export const orderHistory = [
  { orderId: 'order-1', storeName: '김밥천국', totalPrice: 9500, status: '배달완료', date: '2026-08-05' },
  { orderId: 'order-2', storeName: '바삭 치킨 하우스', totalPrice: 21500, status: '배달완료', date: '2026-07-28' },
]

// 결제수단 선택 버튼 배치 확인용
export const paymentMethods = [
  { id: 'kakaopay', label: '카카오페이' },
  { id: 'tosspay', label: '토스페이' },
  { id: 'card', label: '신용카드' },
]
