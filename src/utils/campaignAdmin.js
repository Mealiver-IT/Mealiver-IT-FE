// 관리자 캠페인/쿠폰 CRUD 화면 공용 순수 로직.
// BE DTO 기준: CampaignCreateRequest(name, totalStock, minMembershipTier, discountType,
// discountValue, minOrderAmount, maxDiscountAmount, validHours, scheduledOpenAt)

export const DISCOUNT_TYPES = ['FIXED', 'RATE']

export const DISCOUNT_TYPE_LABELS = {
  FIXED: '정액 할인',
  RATE: '정률 할인 (계급별 고정)',
}

export const CAMPAIGN_STATUS_LABELS = {
  READY: '오픈 예정',
  OPEN: '진행중',
  CLOSED: '마감',
}

// RATE 타입은 캠페인의 discountValue를 실제로는 쓰지 않고(발급 시점 유저 계급으로 결정되는
// 고정 정책, src/utils/membership.js의 RATE_DISCOUNT_BY_TIER 참고) BE @NotNull 제약 때문에
// 값 자체는 여전히 보내야 한다 - 폼에서는 입력을 막고 이 더미값을 채워 보낸다.
export const RATE_DISCOUNT_VALUE_PLACEHOLDER = 0

// datetime-local input(값: "yyyy-MM-ddTHH:mm") -> BE LocalDateTime 직렬화 포맷("yyyy-MM-ddTHH:mm:ss").
// 브라우저가 이미 로컬 벽시계 시각으로 다루므로 별도 타임존 변환은 하지 않는다 - 서버가 KST로
// 떠 있다는 전제(로컬 Docker Compose 실행 환경)에서 "정확히 11:00"은 이 값 그대로 전달하면 된다.
export function localDateTimeInputToApiValue(inputValue) {
  if (!inputValue) return null
  return inputValue.length === 16 ? `${inputValue}:00` : inputValue
}

// BE가 내려주는 LocalDateTime 문자열("yyyy-MM-ddTHH:mm:ss[.nnn]") -> datetime-local input 값으로 절삭.
export function apiValueToLocalDateTimeInput(value) {
  if (!value) return ''
  return value.slice(0, 16)
}

// 오늘 날짜의 한국시간 11:00을 datetime-local 기본값으로 제안 (오픈런 이벤트 관행 시각).
// 이미 오늘 11시가 지났으면 다음날 11시를 제안한다.
export function suggestElevenAmOpenValue(now = new Date()) {
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0)
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1)
  }
  const pad = (n) => String(n).padStart(2, '0')
  return `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}T${pad(candidate.getHours())}:${pad(candidate.getMinutes())}`
}

// CampaignCreateRequest 검증 - BE의 @NotBlank/@Positive/@NotNull/@Min(1) 제약과 1:1로 맞춘다
// (백엔드에 없는 규칙을 프론트가 임의로 더 엄격하게 만들지 않음).
export function validateCampaignForm(values) {
  const errors = {}

  if (!values.name || !values.name.trim()) {
    errors.name = '캠페인 이름을 입력하세요.'
  }

  const totalStock = Number(values.totalStock)
  if (!Number.isInteger(totalStock) || totalStock <= 0) {
    errors.totalStock = '총 수량은 1 이상의 정수여야 합니다.'
  }

  if (!DISCOUNT_TYPES.includes(values.discountType)) {
    errors.discountType = '할인 타입을 선택하세요.'
  }

  if (values.discountType === 'FIXED') {
    const discountValue = Number(values.discountValue)
    if (values.discountValue === '' || values.discountValue == null || Number.isNaN(discountValue) || discountValue <= 0) {
      errors.discountValue = '할인 금액을 입력하세요.'
    }
  }

  const validHours = Number(values.validHours)
  if (!Number.isInteger(validHours) || validHours < 1) {
    errors.validHours = '유효 시간은 1 이상의 정수(시간)여야 합니다.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// AdminCampaignFormPage 상태 -> CampaignCreateRequest 바디로 변환.
export function toCampaignCreateRequest(values) {
  return {
    name: values.name.trim(),
    totalStock: Number(values.totalStock),
    minMembershipTier: values.minMembershipTier || null,
    discountType: values.discountType,
    discountValue: values.discountType === 'RATE' ? RATE_DISCOUNT_VALUE_PLACEHOLDER : Number(values.discountValue),
    minOrderAmount: values.minOrderAmount === '' || values.minOrderAmount == null ? null : Number(values.minOrderAmount),
    maxDiscountAmount: values.maxDiscountAmount === '' || values.maxDiscountAmount == null ? null : Number(values.maxDiscountAmount),
    validHours: Number(values.validHours),
    scheduledOpenAt: localDateTimeInputToApiValue(values.scheduledOpenAt),
  }
}

// 캠페인 목록/상세에서 할인 내용을 한 줄로 보여줄 때 공용으로 쓰는 포맷터.
export function formatDiscount(discountType, discountValue) {
  if (discountType === 'RATE') return '계급별 고정 할인율 적용 (10~50%)'
  if (discountType === 'FIXED') return `${Number(discountValue).toLocaleString('ko-KR')}원 할인`
  return '-'
}
