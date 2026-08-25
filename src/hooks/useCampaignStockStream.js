import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../api/config'

// GET /api/admin/campaigns/{campaignId}/stream (SSE) 상태 리듀서.
// 이벤트 3종(CampaignStockStreamService/CampaignStockEmitterRegistry 기준):
//   snapshot: {campaignId,totalStock,remainingStock,status,soldOut} - 최초 접속 시 1회
//   update:   {campaignId,remainingStock} - 발급/재동기화마다
//   status:   {campaignId,status} - READY/OPEN/CLOSED 전환 시
//
// history: 부하테스트 중 재고가 빠지는 걸 실시간 차트로 보여주기 위한 시계열 샘플(CampaignStockChart
// 전용). snapshot/update처럼 remainingStock을 담은 이벤트마다 {t, remainingStock} 포인트를 추가한다.
// 초당 수십~수백 건씩 올 수 있어(발급마다 broadcast) 무한정 쌓지 않고 최근 MAX_HISTORY_POINTS개로 제한.
//
// 그런데 발급/재동기화가 실제로 일어날 때만 찍으면, 부하테스트 시작 전이나 트래픽이 뜸한 구간엔
// 스냅샷 1개뿐이라 그래프 자체가 안 그려진다(선을 그으려면 점이 최소 2개 필요). 그래서 이벤트와
// 별개로 HEARTBEAT_INTERVAL_MS마다 "지금 값 그대로"를 찍는 하트비트를 추가한다 - 변화가 없으면
// 평평한 선이 이어지고, 변화가 있으면 그 사이에 실제 이벤트 점이 끼어들어 그대로 드러난다.
export const MAX_HISTORY_POINTS = 300
export const HEARTBEAT_INTERVAL_MS = 5000

export const INITIAL_STOCK_STREAM_STATE = {
  totalStock: null,
  remainingStock: null,
  status: null,
  soldOut: false,
  connected: false,
  lastError: null,
  history: [],
}

// 순수 함수로 분리 - EventSource 없이 리듀서 로직만 단위테스트하기 위함.
export function parseSseData(rawData) {
  try {
    return JSON.parse(rawData)
  } catch {
    return null // 손상된 페이로드는 무시(연결 유지) - 다음 이벤트에서 다시 맞으면 됨
  }
}

function appendHistoryPoint(history, remainingStock, now) {
  const next = [...history, { t: now, remainingStock }]
  return next.length > MAX_HISTORY_POINTS ? next.slice(next.length - MAX_HISTORY_POINTS) : next
}

export function applyStockStreamEvent(state, eventName, rawData, now = Date.now()) {
  const payload = parseSseData(rawData)
  if (!payload) return { ...state, lastError: 'PARSE_ERROR' }

  if (eventName === 'snapshot') {
    return {
      ...state,
      totalStock: payload.totalStock,
      remainingStock: payload.remainingStock,
      status: payload.status,
      soldOut: payload.soldOut,
      connected: true,
      lastError: null,
      history: appendHistoryPoint(state.history, payload.remainingStock, now),
    }
  }
  if (eventName === 'update') {
    const remainingStock = payload.remainingStock
    return {
      ...state,
      remainingStock,
      soldOut: remainingStock <= 0,
      lastError: null,
      history: appendHistoryPoint(state.history, remainingStock, now),
    }
  }
  if (eventName === 'status') {
    return { ...state, status: payload.status, lastError: null }
  }
  return state
}

// remainingStock을 아직 모르면(최초 snapshot 전) 아무것도 하지 않는다 - 찍을 값이 없음.
export function appendHeartbeat(state, now = Date.now()) {
  if (state.remainingStock == null) return state
  return { ...state, history: appendHistoryPoint(state.history, state.remainingStock, now) }
}

// 캠페인 목록/유저 목록 등 다른 화면 갔다가 돌아오면 useCampaignStockStream이 새로 마운트되면서
// history가 빈 배열로 리셋된다 - "나갔다 들어와도 그래프가 남아있으면 좋겠다"는 요청으로,
// 캠페인별로 sessionStorage에 흘려 저장해두고 재접속 시 복원한다. 탭을 닫으면 사라지는 세션 단위
// 저장소를 쓰는 이유: 이 히스토리는 "지금 보고 있는 부하테스트 실측"용 임시 진단 데이터라
// 브라우저를 껐다 켜도 남아야 할 만큼 중요한 값은 아니고, 무한정 쌓이는 걸 막기 위함이기도 하다
// (localStorage로 바꾸고 싶으면 STORAGE로 교체만 하면 됨 - 로직은 동일).
const STORAGE = typeof window !== 'undefined' ? window.sessionStorage : null
const STORAGE_KEY_PREFIX = 'mealiverit_admin_stock_history:'
const PERSIST_THROTTLE_MS = 1000

// storage를 주입 가능하게 둔 이유: 테스트에서 실제 브라우저 sessionStorage 없이(vitest 환경이
// DOM 없는 'node') 순수 로직만 검증하기 위함 - 실제 호출부는 기본값(STORAGE=sessionStorage)을 그대로 씀.
export function loadPersistedHistory(campaignId, storage = STORAGE) {
  try {
    const raw = storage?.getItem(STORAGE_KEY_PREFIX + campaignId)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.history)) return null
    return parsed
  } catch {
    return null // 접근 불가(시크릿 모드 등)나 손상된 데이터는 무시하고 빈 히스토리로 시작
  }
}

export function savePersistedHistory(campaignId, { totalStock, history }, storage = STORAGE) {
  try {
    storage?.setItem(STORAGE_KEY_PREFIX + campaignId, JSON.stringify({ totalStock, history }))
  } catch {
    // 저장 실패(용량 초과 등)는 화면 기능에 영향 없이 조용히 무시 - 이 세션 안에서 계속 보는 건 문제 없음
  }
}

// 캠페인별 실시간 재고 현황(관리자 대시보드) 구독 훅.
export function useCampaignStockStream(campaignId) {
  const [state, setState] = useState(INITIAL_STOCK_STREAM_STATE)
  const lastPersistRef = useRef(0)

  // 하트비트 interval을 5초마다 새로 만들지 않기 위해 campaignId에만 의존하는 별도 effect로 분리.
  useEffect(() => {
    if (!campaignId) return undefined
    const timer = setInterval(() => setState((prev) => appendHeartbeat(prev)), HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [campaignId])

  // history/totalStock이 바뀔 때마다 sessionStorage에 흘려 저장 - 초당 여러 번 오는 update 이벤트마다
  // 매번 쓰면 부하테스트 중엔 오히려 렌더 스레드에 부담이라 최소 PERSIST_THROTTLE_MS 간격으로만 쓴다.
  // (5초 하트비트가 계속 history를 바꿔주므로 조용한 구간에서도 결국엔 따라잡힘 - 못 쓰고 영영 남는
  // 값이 생기지 않는다.)
  useEffect(() => {
    if (!campaignId || state.history.length === 0) return
    const now = Date.now()
    if (now - lastPersistRef.current < PERSIST_THROTTLE_MS) return
    lastPersistRef.current = now
    savePersistedHistory(campaignId, { totalStock: state.totalStock, history: state.history })
  }, [campaignId, state.history, state.totalStock])

  useEffect(() => {
    if (!campaignId) return undefined

    const persisted = loadPersistedHistory(campaignId)
    setState({ ...INITIAL_STOCK_STREAM_STATE, history: persisted?.history ?? [], totalStock: persisted?.totalStock ?? null })
    const source = new EventSource(`${API_BASE_URL}/api/admin/campaigns/${campaignId}/stream`)

    const handle = (eventName) => (event) => {
      setState((prev) => applyStockStreamEvent(prev, eventName, event.data))
    }
    const onSnapshot = handle('snapshot')
    const onUpdate = handle('update')
    const onStatus = handle('status')
    const onError = () => setState((prev) => ({ ...prev, connected: false, lastError: 'CONNECTION_ERROR' }))

    source.addEventListener('snapshot', onSnapshot)
    source.addEventListener('update', onUpdate)
    source.addEventListener('status', onStatus)
    source.addEventListener('error', onError)

    return () => {
      source.removeEventListener('snapshot', onSnapshot)
      source.removeEventListener('update', onUpdate)
      source.removeEventListener('status', onStatus)
      source.removeEventListener('error', onError)
      source.close()
    }
  }, [campaignId])

  return state
}
