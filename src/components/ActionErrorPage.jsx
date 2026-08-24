import { getErrorTitle } from '../utils/errorMessages'

// claim/order/cancel처럼 상태를 바꾸는 액션이 실패했을 때 쓰는 전용 에러 화면.
// alert()나 화면 구석의 경고 문구 대신, 무슨 일이 있었는지(코드→제목) + 왜(BE 메시지)를
// 하나의 화면으로 분명하게 보여주고 재시도/닫기 선택지를 준다.
// onRetry를 안 넘기면(예: 이미 취소된 주문 등 재시도해도 의미 없는 경우) 재시도 버튼은 숨김.
export default function ActionErrorPage({ code, message, onRetry, onClose }) {
  return (
    <div className="action-error-page">
      <div className="action-error-icon" aria-hidden="true">
        ⚠️
      </div>
      <h2 className="action-error-title">{getErrorTitle(code)}</h2>
      <p className="action-error-message">{message}</p>
      {code && <p className="action-error-code">오류 코드: {code}</p>}
      <div className="action-error-actions">
        {onRetry && (
          <button type="button" className="btn btn-block" onClick={onRetry}>
            다시 시도
          </button>
        )}
        <button type="button" className="btn btn-block-outline" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
