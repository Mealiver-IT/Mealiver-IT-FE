import { useEffect, useState } from 'react'
import { fetchAllCampaigns } from '../../api/admin/campaigns'
import { cleanupDirtyData, seedDirtyData } from '../../api/admin/dirtyData'
import { fetchUserCount } from '../../api/admin/users'
import { fetchVerificationLatest, runTierMonthlyVerificationNow, runVerificationNow } from '../../api/admin/verification'
import { filterOpenCampaigns, summarizeCampaigns } from '../../utils/dashboardStats'
import OpenCampaignMiniCard from './OpenCampaignMiniCard'
import VerificationJobCard from './VerificationJobCard'

// 관리자 페이지 랜딩 화면 - 요약 지표 + 진행중 캠페인 실시간 재고 + 최근 정합성 검증 결과(일간/월간
// 배치 둘 다) + 검증 배치 수동 실행 + 오염 데이터 삽입/정리(검증쿼리 5종 데모/재현용).
export default function AdminDashboardPage() {
  const [campaigns, setCampaigns] = useState(null)
  const [userCount, setUserCount] = useState(null)
  const [verification, setVerification] = useState(null)
  const [error, setError] = useState(null)
  const [runningJob, setRunningJob] = useState(null)
  const [dirtyDataBusy, setDirtyDataBusy] = useState(null)
  const [dirtyDataMessage, setDirtyDataMessage] = useState(null)

  const loadVerification = () => fetchVerificationLatest().then(setVerification).catch((e) => setError(e.message))

  useEffect(() => {
    Promise.all([fetchAllCampaigns(), fetchUserCount(), fetchVerificationLatest()])
      .then(([c, u, v]) => {
        setCampaigns(c)
        setUserCount(u)
        setVerification(v)
      })
      .catch((e) => setError(e.message))
  }, [])

  const handleRunVerification = async (jobKey, runFn) => {
    setError(null)
    setRunningJob(jobKey)
    try {
      await runFn()
      await loadVerification()
    } catch (e) {
      setError(e.message)
    } finally {
      setRunningJob(null)
    }
  }

  const handleSeedDirtyData = async () => {
    if (!window.confirm('검증쿼리 테스트용 오염 데이터(DIRTY_*/dirty_user_* 700여건)를 삽입할까요?')) return
    setDirtyDataMessage(null)
    setDirtyDataBusy('seed')
    try {
      await seedDirtyData()
      setDirtyDataMessage('오염 데이터를 삽입했습니다. 검증을 실행하면 이상값으로 잡혀야 정상입니다.')
    } catch (e) {
      setDirtyDataMessage(`실패: ${e.message}`)
    } finally {
      setDirtyDataBusy(null)
    }
  }

  const handleCleanupDirtyData = async () => {
    if (!window.confirm('삽입해둔 오염 데이터(DIRTY_*/dirty_user_*)를 전부 정리할까요?')) return
    setDirtyDataMessage(null)
    setDirtyDataBusy('cleanup')
    try {
      await cleanupDirtyData()
      setDirtyDataMessage('오염 데이터를 정리했습니다.')
    } catch (e) {
      setDirtyDataMessage(`실패: ${e.message}`)
    } finally {
      setDirtyDataBusy(null)
    }
  }

  if (error) return <p className="admin-form-error">{error}</p>
  if (!campaigns) return <p className="empty-text">불러오는 중...</p>

  const stats = summarizeCampaigns(campaigns)
  const openCampaigns = filterOpenCampaigns(campaigns)

  return (
    <div className="admin-section">
      <h1 className="admin-page-title">대시보드</h1>

      <div className="dashboard-kpi-row">
        <div className="box-flat dashboard-kpi-card">
          <span className="empty-text">전체 캠페인</span>
          <span className="dashboard-kpi-value">{stats.total.toLocaleString('ko-KR')}</span>
          <span className="empty-text">진행중 {stats.open} · 마감 {stats.closed} · 오픈예정 {stats.ready}</span>
        </div>
        <div className="box-flat dashboard-kpi-card">
          <span className="empty-text">누적 발급 쿠폰</span>
          <span className="dashboard-kpi-value">{stats.estimatedIssued.toLocaleString('ko-KR')}</span>
        </div>
        <div className="box-flat dashboard-kpi-card">
          <span className="empty-text">전체 유저</span>
          <span className="dashboard-kpi-value">{userCount == null ? '-' : userCount.toLocaleString('ko-KR')}</span>
        </div>
      </div>

      <div className="box-flat">
        <p className="field-label">진행중(OPEN) 캠페인 실시간 재고</p>
        {openCampaigns.length === 0 ? (
          <p className="empty-text">지금 진행중인 캠페인이 없습니다.</p>
        ) : (
          <div className="dashboard-mini-grid">
            {openCampaigns.map((c) => (
              <OpenCampaignMiniCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>

      <VerificationJobCard
        title="최근 정합성 검증 결과 (일간 · 재고/카운터/로그/등급 6종)"
        runLabel="지금 검증 실행"
        runningLabel="실행 중... (최대 1분)"
        summary={verification?.daily}
        running={runningJob === 'daily'}
        onRun={() => handleRunVerification('daily', runVerificationNow)}
      />

      <VerificationJobCard
        title="최근 정합성 검증 결과 (월간 · 계급-주문 정합성)"
        runLabel="지금 검증 실행 (지난달 기준)"
        runningLabel="실행 중..."
        summary={verification?.tierMonthly}
        running={runningJob === 'tierMonthly'}
        onRun={() => handleRunVerification('tierMonthly', runTierMonthlyVerificationNow)}
      />

      <div className="box-flat">
        <p className="field-label">오염 데이터 (검증쿼리 테스트 픽스처)</p>
        <p className="empty-text">DIRTY_*/dirty_user_* 이름으로 격리된 테스트 전용 데이터입니다. 실데이터에는 영향 없습니다.</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn-outline" disabled={dirtyDataBusy !== null} onClick={handleSeedDirtyData}>
            {dirtyDataBusy === 'seed' ? '삽입 중...' : '오염 데이터 삽입'}
          </button>
          <button type="button" className="admin-btn-outline" disabled={dirtyDataBusy !== null} onClick={handleCleanupDirtyData}>
            {dirtyDataBusy === 'cleanup' ? '정리 중...' : '오염 데이터 정리'}
          </button>
          {dirtyDataMessage && <span className="empty-text">{dirtyDataMessage}</span>}
        </div>
      </div>
    </div>
  )
}
