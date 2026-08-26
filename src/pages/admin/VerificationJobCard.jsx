import { formatDateTime } from '../../utils/datetime'
import { toAnomalyRows } from '../../utils/verification'

// 검증 배치 1개(daily 또는 tierMonthly)의 최근 실행 요약 + "지금 실행" 트리거를 보여주는 카드.
// AdminDashboardPage가 이 배치를 2개(일간 6종 체크 / 월간 계급-주문 정합성) 나란히 띄우기 위해 분리.
export default function VerificationJobCard({ title, runLabel, summary, running, runningLabel, onRun }) {
  const anomalyRows = summary ? toAnomalyRows(summary.anomalyCounts) : []

  return (
    <div className="box-flat">
      <div className="row-between">
        <p className="field-label">{title}</p>
        <button type="button" className="admin-btn-outline" disabled={running} onClick={onRun}>
          {running ? runningLabel : runLabel}
        </button>
      </div>
      {!summary?.hasRun ? (
        <p className="empty-text">아직 실행된 이력이 없습니다.</p>
      ) : (
        <>
          <div className="row-between">
            <span className={summary.totalAnomalies > 0 ? 'warning-text' : 'empty-text'}>
              {summary.totalAnomalies > 0 ? `⚠️ 이상값 ${summary.totalAnomalies.toLocaleString('ko-KR')}건 발견` : '✅ 이상 없음'}
            </span>
            <span className="empty-text">
              {formatDateTime(summary.startTime)} 실행
              {summary.durationSeconds != null && ` · ${summary.durationSeconds}초 소요`}
            </span>
          </div>
          {anomalyRows.length > 0 && (
            <ul>
              {anomalyRows.map((row) => (
                <li key={row.checkType}>
                  {row.label}: {row.count.toLocaleString('ko-KR')}건
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
