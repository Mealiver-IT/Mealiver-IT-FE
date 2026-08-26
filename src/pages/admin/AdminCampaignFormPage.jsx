import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCampaign } from '../../api/admin/campaigns'
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  suggestElevenAmOpenValue,
  toCampaignCreateRequest,
  validateCampaignForm,
} from '../../utils/campaignAdmin'
import { TIER_LABELS, TIER_ORDER } from '../../utils/membership'

const INITIAL_VALUES = {
  name: '',
  totalStock: '',
  minMembershipTier: '',
  discountType: 'FIXED',
  discountValue: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  validHours: '24',
  scheduledOpenAt: suggestElevenAmOpenValue(),
  scheduledCloseAt: '',
}

// POST /api/campaigns - 캠페인 등록(=쿠폰 정책도 동시 등록, 1:1). scheduledOpenAt을 지정하면
// CampaignScheduledOpenBatchJob이 그 시각(1초 주기 폴링)에 자동으로 OPEN 전환한다 - "정확히
// 11시 땡"은 이 값을 정확히 넣는 것으로 충분하고, 별도 크론/타이머를 프론트에서 만들 필요 없음.
// scheduledCloseAt은 BE의 closeAt 컬럼에 미리 저장만 해둔다(오픈 시 덮어쓰지 않고 보존됨) - 자동
// 마감 배치는 없어서 순수 표시/기록용이고, 실제 마감은 여전히 수동 "지금 마감" 버튼으로 처리한다.
export default function AdminCampaignFormPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateCampaignForm(values)
    setErrors(nextErrors)
    if (!valid) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const created = await createCampaign(toCampaignCreateRequest(values))
      navigate(`/admin/campaigns/${created.id}`)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isRate = values.discountType === 'RATE'

  return (
    <div className="admin-section">
      <h1 className="admin-page-title">새 캠페인 등록</h1>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label className="admin-form-field span-2">
          캠페인 이름
          <input type="text" value={values.name} onChange={set('name')} placeholder="예: 오픈런 11시 할인쿠폰" />
          {errors.name && <span className="admin-form-error">{errors.name}</span>}
        </label>

        <label className="admin-form-field">
          총 수량
          <input type="number" min="1" value={values.totalStock} onChange={set('totalStock')} />
          {errors.totalStock && <span className="admin-form-error">{errors.totalStock}</span>}
        </label>

        <label className="admin-form-field">
          대상 최소 등급
          <select value={values.minMembershipTier} onChange={set('minMembershipTier')}>
            <option value="">전체 회원</option>
            {TIER_ORDER.map((tier) => (
              <option key={tier} value={tier}>
                {TIER_LABELS[tier]} 이상
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form-field">
          할인 타입
          <select value={values.discountType} onChange={set('discountType')}>
            {DISCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {DISCOUNT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form-field">
          할인 금액(원)
          <input type="number" min="1" value={isRate ? '' : values.discountValue} onChange={set('discountValue')} disabled={isRate} />
          {isRate ? (
            <span className="admin-form-hint">RATE 타입은 발급 시점 유저 계급별 고정 할인율(10~50%)이 적용되어 이 값은 무시됩니다.</span>
          ) : (
            errors.discountValue && <span className="admin-form-error">{errors.discountValue}</span>
          )}
        </label>

        <label className="admin-form-field">
          최소 주문 금액(원, 선택)
          <input type="number" min="0" value={values.minOrderAmount} onChange={set('minOrderAmount')} />
        </label>

        <label className="admin-form-field">
          최대 할인 금액(원, 선택)
          <input type="number" min="0" value={values.maxDiscountAmount} onChange={set('maxDiscountAmount')} />
        </label>

        <label className="admin-form-field">
          쿠폰 유효 시간(시간)
          <input type="number" min="1" value={values.validHours} onChange={set('validHours')} />
          {errors.validHours && <span className="admin-form-error">{errors.validHours}</span>}
        </label>

        <label className="admin-form-field">
          오픈 예약 시각 (비우면 수동 오픈)
          <input type="datetime-local" step="1" value={values.scheduledOpenAt} onChange={set('scheduledOpenAt')} />
          <span className="admin-form-hint">서버(로컬 Docker Compose) 시계 기준 한국시간으로 동작합니다. 1초 주기로 확인해 정확히 그 시각에 자동 오픈됩니다.</span>
        </label>

        <label className="admin-form-field">
          마감 예약 시각 (비우면 무기한)
          <input type="datetime-local" step="1" value={values.scheduledCloseAt} onChange={set('scheduledCloseAt')} />
          {errors.scheduledCloseAt ? (
            <span className="admin-form-error">{errors.scheduledCloseAt}</span>
          ) : (
            <span className="admin-form-hint">아직 자동으로 마감하는 배치는 없어서, 캠페인 상세에 예정 시각으로만 표시됩니다. 실제 마감은 상세 화면의 "지금 마감" 버튼으로 수동 처리하세요.</span>
          )}
        </label>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-outline" disabled={submitting}>
            {submitting ? '등록 중...' : '캠페인 등록'}
          </button>
          {submitError && <span className="admin-form-error">{submitError}</span>}
        </div>
      </form>
    </div>
  )
}
