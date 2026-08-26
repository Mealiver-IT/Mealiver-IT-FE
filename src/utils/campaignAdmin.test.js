import { describe, expect, it } from 'vitest'
import {
  apiValueToLocalDateTimeInput,
  formatIssuedDiscount,
  localDateTimeInputToApiValue,
  RATE_DISCOUNT_VALUE_PLACEHOLDER,
  suggestElevenAmOpenValue,
  toCampaignCreateRequest,
  validateCampaignForm,
} from './campaignAdmin'

describe('localDateTimeInputToApiValue', () => {
  it('appends seconds to a datetime-local value', () => {
    expect(localDateTimeInputToApiValue('2026-08-25T11:00')).toBe('2026-08-25T11:00:00')
  })

  it('returns null when input is empty (예약 없음)', () => {
    expect(localDateTimeInputToApiValue('')).toBeNull()
    expect(localDateTimeInputToApiValue(null)).toBeNull()
  })

  it('leaves an already-full timestamp untouched', () => {
    expect(localDateTimeInputToApiValue('2026-08-25T11:00:30')).toBe('2026-08-25T11:00:30')
  })
})

describe('apiValueToLocalDateTimeInput', () => {
  it('truncates seconds/nanos back to a datetime-local value', () => {
    expect(apiValueToLocalDateTimeInput('2026-08-25T11:00:00.123')).toBe('2026-08-25T11:00')
  })

  it('returns empty string for null/undefined', () => {
    expect(apiValueToLocalDateTimeInput(null)).toBe('')
    expect(apiValueToLocalDateTimeInput(undefined)).toBe('')
  })
})

describe('suggestElevenAmOpenValue', () => {
  it('suggests today 11:00 when now is before 11am', () => {
    const now = new Date(2026, 7, 25, 9, 30)
    expect(suggestElevenAmOpenValue(now)).toBe('2026-08-25T11:00')
  })

  it('suggests tomorrow 11:00 when now is already past 11am', () => {
    const now = new Date(2026, 7, 25, 14, 0)
    expect(suggestElevenAmOpenValue(now)).toBe('2026-08-26T11:00')
  })

  it('suggests tomorrow 11:00 when now is exactly 11:00:00', () => {
    const now = new Date(2026, 7, 25, 11, 0, 0)
    expect(suggestElevenAmOpenValue(now)).toBe('2026-08-26T11:00')
  })
})

describe('validateCampaignForm', () => {
  const baseValid = {
    name: '오픈런 할인쿠폰',
    totalStock: '10000',
    discountType: 'FIXED',
    discountValue: '3000',
    validHours: '24',
  }

  it('passes for a fully valid FIXED campaign', () => {
    const { valid, errors } = validateCampaignForm(baseValid)
    expect(valid).toBe(true)
    expect(errors).toEqual({})
  })

  it('does not require discountValue for RATE type (계급별 고정 정책이 대신 적용됨)', () => {
    const { valid, errors } = validateCampaignForm({ ...baseValid, discountType: 'RATE', discountValue: '' })
    expect(valid).toBe(true)
    expect(errors.discountValue).toBeUndefined()
  })

  it('rejects a blank name', () => {
    const { valid, errors } = validateCampaignForm({ ...baseValid, name: '   ' })
    expect(valid).toBe(false)
    expect(errors.name).toBeDefined()
  })

  it('rejects non-positive or non-integer totalStock', () => {
    expect(validateCampaignForm({ ...baseValid, totalStock: '0' }).valid).toBe(false)
    expect(validateCampaignForm({ ...baseValid, totalStock: '-5' }).valid).toBe(false)
    expect(validateCampaignForm({ ...baseValid, totalStock: '1.5' }).valid).toBe(false)
  })

  it('rejects validHours below 1', () => {
    expect(validateCampaignForm({ ...baseValid, validHours: '0' }).valid).toBe(false)
  })

  it('requires a discountValue for FIXED type', () => {
    const { valid, errors } = validateCampaignForm({ ...baseValid, discountValue: '' })
    expect(valid).toBe(false)
    expect(errors.discountValue).toBeDefined()
  })
})

describe('toCampaignCreateRequest', () => {
  it('maps a FIXED-type form to the BE request shape', () => {
    const request = toCampaignCreateRequest({
      name: '  오픈런 할인쿠폰  ',
      totalStock: '10000',
      minMembershipTier: 'CORPORAL',
      discountType: 'FIXED',
      discountValue: '3000',
      minOrderAmount: '15000',
      maxDiscountAmount: '',
      validHours: '24',
      scheduledOpenAt: '2026-08-25T11:00',
      scheduledCloseAt: '2026-08-26T11:00',
    })
    expect(request).toEqual({
      name: '오픈런 할인쿠폰',
      totalStock: 10000,
      minMembershipTier: 'CORPORAL',
      discountType: 'FIXED',
      discountValue: 3000,
      minOrderAmount: 15000,
      maxDiscountAmount: null,
      validHours: 24,
      scheduledOpenAt: '2026-08-25T11:00:00',
      scheduledCloseAt: '2026-08-26T11:00:00',
    })
  })

  it('forces the RATE placeholder discount value and allows no reservation', () => {
    const request = toCampaignCreateRequest({
      name: '전 회원 쿠폰',
      totalStock: '500',
      minMembershipTier: '',
      discountType: 'RATE',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      validHours: '48',
      scheduledOpenAt: '',
      scheduledCloseAt: '',
    })
    expect(request.discountValue).toBe(RATE_DISCOUNT_VALUE_PLACEHOLDER)
    expect(request.minMembershipTier).toBeNull()
    expect(request.scheduledOpenAt).toBeNull()
    expect(request.scheduledCloseAt).toBeNull()
  })
})

describe('formatIssuedDiscount', () => {
  it('shows the exact tier-resolved percentage for RATE type', () => {
    expect(formatIssuedDiscount('RATE', 0.3, 'CORPORAL')).toBe('30% 할인')
    expect(formatIssuedDiscount('RATE', 0.5, 'SERGEANT')).toBe('50% 할인')
    expect(formatIssuedDiscount('RATE', 0.1, 'PRIVATE')).toBe('10% 할인')
  })

  it('shows the fixed amount for FIXED type', () => {
    expect(formatIssuedDiscount('FIXED', 3000, 'PRIVATE')).toBe('3,000원 할인')
  })

  it('falls back to the generic RATE label when the tier is unknown', () => {
    expect(formatIssuedDiscount('RATE', 0.3, null)).toBe('계급별 고정 할인율 적용 (10~50%)')
  })
})

describe('validateCampaignForm - scheduledCloseAt ordering', () => {
  const baseValid = {
    name: '오픈런 할인쿠폰',
    totalStock: '10000',
    discountType: 'FIXED',
    discountValue: '3000',
    validHours: '24',
  }

  it('rejects a close time at or before the open time', () => {
    const { valid, errors } = validateCampaignForm({
      ...baseValid,
      scheduledOpenAt: '2026-08-25T11:00',
      scheduledCloseAt: '2026-08-25T11:00',
    })
    expect(valid).toBe(false)
    expect(errors.scheduledCloseAt).toBeDefined()
  })

  it('accepts a close time after the open time', () => {
    const { valid, errors } = validateCampaignForm({
      ...baseValid,
      scheduledOpenAt: '2026-08-25T11:00',
      scheduledCloseAt: '2026-08-26T11:00',
    })
    expect(valid).toBe(true)
    expect(errors.scheduledCloseAt).toBeUndefined()
  })

  it('allows a close time with no open time set', () => {
    const { valid, errors } = validateCampaignForm({
      ...baseValid,
      scheduledOpenAt: '',
      scheduledCloseAt: '2026-08-26T11:00',
    })
    expect(valid).toBe(true)
    expect(errors.scheduledCloseAt).toBeUndefined()
  })
})
