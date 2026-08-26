// 목데이터: API 명세서(밀리버릿_API명세서.csv)의 도메인 구조를 근거로 임의 생성.
// 실제 API 응답 스키마가 확정되면 필드명만 맞춰서 교체하면 됩니다.
// 대응 엔드포인트를 각 섹션 주석에 표기해 두었습니다.

// GET /api/categories
export const categories = [
  { id: 'korean', name: '한식', mainExposed: true },
  { id: 'chicken', name: '치킨', mainExposed: true },
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
    icon: 'gimbap',
    rating: 4.9,
    reviewCount: '2.1k+',
    deliveryFee: 2500,
    minOrderAmount: 12000,
    hasCoupon: true,
  },
  {
    id: 'store-2',
    categoryId: 'chicken',
    name: '바삭 치킨 하우스',
    icon: 'chicken',
    rating: 4.9,
    reviewCount: '2.1k+',
    deliveryFee: 2500,
    minOrderAmount: 15000,
    hasCoupon: false,
  },
  {
    id: 'store-3',
    categoryId: 'korean',
    name: '맛있는 국밥집',
    icon: 'ramen',
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
    icon: 'sushi',
    rating: 4.8,
    reviewCount: '900+',
    deliveryFee: 3000,
    minOrderAmount: 18000,
    hasCoupon: true,
  },
  // 2026-08-25 추가: 한식/일식 말고는 가게가 하나도 없어서 카테고리 탭(중식/분식/야식/피자/디저트)을
  // 누르면 항상 "해당 카테고리 가게가 없습니다"만 떴다 - 카테고리당 최소 1곳씩 채움.
  // 전용 아이콘이 없는 카테고리는 FoodIcon의 fallback인 'default'(회색 원)를 그대로 씀.
  {
    id: 'store-5',
    categoryId: 'chinese',
    name: '짬뽕지존',
    icon: 'default',
    rating: 4.7,
    reviewCount: '1.5k+',
    deliveryFee: 3000,
    minOrderAmount: 14000,
    hasCoupon: false,
  },
  {
    id: 'store-6',
    categoryId: 'snack',
    name: '엽기떡볶이',
    icon: 'default',
    rating: 4.6,
    reviewCount: '3.2k+',
    deliveryFee: 2000,
    minOrderAmount: 10000,
    hasCoupon: true,
  },
  {
    id: 'store-7',
    categoryId: 'night',
    name: '포장마차 야식당',
    icon: 'default',
    rating: 4.5,
    reviewCount: '1.1k+',
    deliveryFee: 3500,
    minOrderAmount: 20000,
    hasCoupon: false,
  },
  {
    id: 'store-8',
    categoryId: 'pizza',
    name: '피자마루',
    icon: 'default',
    rating: 4.8,
    reviewCount: '2.4k+',
    deliveryFee: 3000,
    minOrderAmount: 16000,
    hasCoupon: false,
  },
  {
    id: 'store-9',
    categoryId: 'dessert',
    name: '달콤베이커리',
    icon: 'default',
    rating: 4.9,
    reviewCount: '800+',
    deliveryFee: 2500,
    minOrderAmount: 8000,
    hasCoupon: true,
  },
]

// GET /api/stores/{storeId}/menus 에 대응 (명세서엔 별도 항목 없어 카트/주문 흐름 기준으로 추정)
// 2026-08-25 수정: 예전엔 storeMenuTabs라는 탭 목록 하나를 모든 가게가 공용으로 썼었다(치킨집/국밥집도
// "김밥/라면" 탭이 그대로 뜨는 오류) - 이제 각 메뉴에 category를 붙이고, StorePage가 "이 가게 메뉴에
// 실제로 있는 카테고리"만 뽑아서 탭으로 보여준다(+"대표메뉴" = 전체). 탭도 클릭하면 실제로 필터링됨
// (예전엔 버튼에 onClick 자체가 없어서 눌러도 아무 반응이 없었음).
export const menusByStore = {
  'store-1': [
    { id: 'menu-1', name: '참치김밥', option: '신선한 참치와 야채', price: 4500, category: '김밥' },
    { id: 'menu-2', name: '야채김밥', option: '아삭한 제철 야채', price: 4500, category: '김밥' },
    { id: 'menu-3', name: '치즈김밥', option: '고소한 치즈 듬뿍', price: 4500, category: '김밥' },
    { id: 'menu-4', name: '라면', option: '얼큰한 국물', price: 5000, category: '라면' },
  ],
  'store-2': [
    { id: 'menu-5', name: '후라이드 치킨', option: '기본', price: 18000, category: '후라이드' },
    { id: 'menu-6', name: '양념 치킨', option: '기본', price: 19000, category: '양념' },
  ],
  'store-3': [
    { id: 'menu-7', name: '국밥', option: '기본', price: 9500, category: '국밥' },
    { id: 'menu-8', name: '수육 국밥', option: '곱빼기', price: 12000, category: '수육국밥' },
  ],
  'store-4': [
    { id: 'menu-9', name: '연어 초밥 세트', option: '기본', price: 16000, category: '초밥' },
    { id: 'menu-10', name: '광어 초밥 세트', option: '기본', price: 15000, category: '초밥' },
    { id: 'menu-11', name: '새우튀김', option: '바삭한 튀김 5개', price: 8000, category: '사이드' },
  ],
  'store-5': [
    { id: 'menu-12', name: '짜장면', option: '기본', price: 7000, category: '면' },
    { id: 'menu-13', name: '짬뽕', option: '얼큰한 국물', price: 8000, category: '면' },
    { id: 'menu-14', name: '탕수육', option: '중(小)', price: 18000, category: '요리' },
  ],
  'store-6': [
    { id: 'menu-15', name: '엽기 떡볶이', option: '2인분', price: 13000, category: '떡볶이' },
    { id: 'menu-16', name: '로제 떡볶이', option: '2인분', price: 14000, category: '떡볶이' },
    { id: 'menu-17', name: '순대', option: '한 접시', price: 6000, category: '분식' },
  ],
  'store-7': [
    { id: 'menu-18', name: '곱창전골', option: '2인분', price: 25000, category: '곱창' },
    { id: 'menu-19', name: '닭발', option: '매운맛', price: 18000, category: '안주' },
    { id: 'menu-20', name: '골뱅이무침', option: '소면 사리 포함', price: 20000, category: '안주' },
  ],
  'store-8': [
    { id: 'menu-21', name: '콤비네이션 피자', option: 'L 사이즈', price: 19000, category: '피자' },
    { id: 'menu-22', name: '페퍼로니 피자', option: 'L 사이즈', price: 20000, category: '피자' },
    { id: 'menu-23', name: '갈릭 브레드', option: '기본', price: 5000, category: '사이드' },
  ],
  'store-9': [
    { id: 'menu-24', name: '티라미수', option: '조각 케이크', price: 6500, category: '케이크' },
    { id: 'menu-25', name: '마카롱 세트', option: '6구', price: 12000, category: '마카롱' },
    { id: 'menu-26', name: '아이스 아메리카노', option: 'ICE', price: 4500, category: '음료' },
  ],
}

// GET /api/members/me/membership — 실제 응답: { tier: 'PRIVATE'|'PFC'|'CORPORAL'|'SERGEANT', tierCalculatedAt }.
// 2026-08-20 백엔드 가이드: validOrderCountThisMonth/ordersUntilNextLevel 같은 주문수 필드는 BE에
// 아예 없고 추가할 계획도 없어서(완료 주문의 completed_at이 실제 주문 API로는 안 채워지는 별개 이슈 때문에
// 이번엔 뺀 것) MyPage의 "다음 등급까지 N건" UI 자체를 없앴다. 여기 있는 건 BE 미연결 시 폴백용 기본 계급뿐.
export const DEFAULT_MEMBERSHIP_TIER = 'SERGEANT'

// GET /api/members/me/benefits — 실제 응답은 쿠폰함(GET /api/members/me/coupons)과 완전히 동일한 배열
// 모양이라({id, couponCode, campaignName, discountType, discountValue, maxDiscountAmount, ...}),
// title/desc를 안 주고 discountType+discountValue로 프론트가 문구를 조합해야 한다
// (EventContext.toFECoupon + utils/coupon.formatDiscountDetail 재사용). 아래는 BE 미연결 시 폴백용 mock —
// 같은 모양(discountType/discountValue)으로 맞춰뒀다.
export const benefits = [
  { id: 'benefit-1', name: '무료배달 쿠폰', discountType: 'FIXED', discountValue: 0 },
  { id: 'benefit-2', name: '20% 할인 쿠폰', discountType: 'RATE', discountValue: 20 },
]

// GET /api/members/me/coupons
// 이벤트로 받는 쿠폰(선착순)은 여기 포함하지 않음 — 발급 시점에 EventContext가 이 목록에 추가함.
// 여기 있는 건 이벤트와 무관하게 이미 지급된(멤버십 혜택 등) 쿠폰.
export const myCoupons = [{ id: 'coupon-2', name: '10% 할인 쿠폰', discountType: 'RATE', discountValue: 10, maxDiscount: 3000 }]

// GET /api/campaigns 실패 시(BE 미연결 등) 폴백용 mock — EventContext.mockEventToFEEvent가 실제
// 캠페인과 같은 shape으로 변환해서 쓴다. RATE 타입 할인율은 이제 캠페인마다 다른 값이 아니라
// utils/membership.RATE_DISCOUNT_BY_TIER(TierDiscountPolicy와 동일) 고정 정책을 따르므로 여기 필드로
// 안 둔다. rewardCoupon: 선착순 쿠폰 받기 성공 시 지급되는 쿠폰(BE 미연결 상황의 폴백 전용).
// campaignId: 실제 BE campaign.id(Long) 매핑용 — mock 폴백에서만 쓰이고 실제 API 성공 시엔 무시됨.
export const couponEvents = [
  {
    eventId: 'event-1',
    campaignId: 1,
    title: '선착순 이벤트',
    storeName: '바삭 치킨 하우스',
    bannerText: '선착순 5,000원 쿠폰',
    totalStock: 10000,
    remainingStock: 3120,
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
