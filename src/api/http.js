import { API_BASE_URL, TEST_USER_ID } from './config'

// BE 공용 응답 포맷(ApiResponse.java/GlobalExceptionHandler.java) 기준 fetch 래퍼.
//   성공: { success: true, data: ... }
//   실패: { code: "...", message: "..." } (형태가 다름 — success 필드 없음)
export async function apiFetch(path, { method = 'GET', headers = {}, withUser = false, idempotencyKey } = {}) {
  const finalHeaders = { ...headers }
  if (withUser) finalHeaders['X-User-Id'] = String(TEST_USER_ID)
  if (idempotencyKey) finalHeaders['Idempotency-Key'] = idempotencyKey

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers: finalHeaders })

  let body = null
  try {
    body = await res.json()
  } catch {
    // 응답 바디가 없거나(204 등) JSON이 아닌 경우
  }

  if (!res.ok) {
    const message = body?.message ?? `요청 실패 (${res.status})`
    throw new Error(message)
  }
  return body?.data
}
