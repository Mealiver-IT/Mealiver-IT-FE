import { API_BASE_URL, TEST_USER_ID } from './config'

// BE 공용 응답 포맷(ApiResponse.java/GlobalExceptionHandler.java) 기준 fetch 래퍼.
//   성공: { success: true, data: ... }
//   실패: { code: "...", message: "..." } (형태가 다름 — success 필드 없음)
export async function apiFetch(path, { method = 'GET', headers = {}, withUser = false, idempotencyKey, body: requestBody } = {}) {
  const finalHeaders = { ...headers }
  if (withUser) finalHeaders['X-User-Id'] = String(TEST_USER_ID)
  if (idempotencyKey) finalHeaders['Idempotency-Key'] = idempotencyKey
  if (requestBody !== undefined) finalHeaders['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: requestBody !== undefined ? JSON.stringify(requestBody) : undefined,
  })

  let responseBody = null
  try {
    responseBody = await res.json()
  } catch {
    // 응답 바디가 없거나(204 등) JSON이 아닌 경우
  }

  if (!res.ok) {
    const message = responseBody?.message ?? `요청 실패 (${res.status})`
    const error = new Error(message)
    // BE 도메인 에러(ErrorResponse.java)는 { code, message } 형태로 옴 (예: SOLD_OUT, ALREADY_ISSUED,
    // MEMBERSHIP_TIER_NOT_ELIGIBLE, CAMPAIGN_NOT_OPEN). 이 code가 있으면 "서버가 정상 응답했지만 요청이
    // 거부된 것"이고, 없으면(네트워크 오류 등) BE 자체에 도달 못한 것 — 호출부가 이 둘을 구분해서
    // 전자는 실제 사유를 안내하고, 후자만 mock 폴백으로 넘어가야 한다 (FR-FCFS-031, 08_개발표준 3절).
    error.code = responseBody?.code
    throw error
  }
  return responseBody?.data
}
