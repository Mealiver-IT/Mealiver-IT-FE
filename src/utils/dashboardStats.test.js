import { describe, expect, it } from 'vitest'
import { filterOpenCampaigns, summarizeCampaigns } from './dashboardStats'

const CAMPAIGNS = [
  { id: 1, status: 'OPEN', totalStock: 100, remainingStock: 40 },
  { id: 2, status: 'CLOSED', totalStock: 200, remainingStock: 0 },
  { id: 3, status: 'READY', totalStock: 50, remainingStock: 50 },
  { id: 4, status: 'OPEN', totalStock: 300, remainingStock: 300 },
]

describe('summarizeCampaigns', () => {
  it('counts total/open/closed/ready correctly', () => {
    const summary = summarizeCampaigns(CAMPAIGNS)
    expect(summary.total).toBe(4)
    expect(summary.open).toBe(2)
    expect(summary.closed).toBe(1)
    expect(summary.ready).toBe(1)
  })

  it('estimates issued count as sum of (totalStock - remainingStock)', () => {
    const summary = summarizeCampaigns(CAMPAIGNS)
    // (100-40) + (200-0) + (50-50) + (300-300) = 60 + 200 + 0 + 0
    expect(summary.estimatedIssued).toBe(260)
  })

  it('never lets a single campaign go negative even if remainingStock > totalStock (bad data)', () => {
    const summary = summarizeCampaigns([{ id: 9, status: 'OPEN', totalStock: 10, remainingStock: 20 }])
    expect(summary.estimatedIssued).toBe(0)
  })

  it('handles an empty campaign list', () => {
    const summary = summarizeCampaigns([])
    expect(summary).toEqual({ total: 0, open: 0, closed: 0, ready: 0, estimatedIssued: 0 })
  })
})

describe('filterOpenCampaigns', () => {
  it('returns only OPEN-status campaigns', () => {
    const open = filterOpenCampaigns(CAMPAIGNS)
    expect(open.map((c) => c.id)).toEqual([1, 4])
  })
})
