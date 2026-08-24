// API 연동 공용 설정.
// 로컬 dev: .env에 VITE_API_BASE_URL 지정 시 그쪽으로 직접 호출.
// 프로덕션(nginx): 비워두면 같은 origin의 /api/...로 요청 (nginx가 api 컨테이너로 프록시).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// 로그인 시스템을 만들 계획이 없어서(2026-08-24 팀 확인) X-User-Id 헤더로 사용자를 식별함
// (BE CouponController/CouponClaimController 기준) - 이게 임시방편이 아니라 계속 쓰는 방식이다.
// 예전엔 전원이 똑같이 1번 유저로 고정돼 있었는데, 팀원 여럿이 동시에 배포 서버를 테스트하면 BE
// 입장에선 "같은 사람이 동시에 여러 요청을 보낸 것"으로 보여서 1인 1회 제한/중복요청 잠금이 오탐으로
// 걸렸다(DUPLICATE_REQUEST_IN_PROGRESS, COUPON_INVALID_STATE_TRANSITION 등, 2026-08-24 팀장님과 확인).
// BE에 유저가 1~1,000,000번까지 전부 시딩돼 있어서(UserSeedRunner, Phase1 100만 유저 시딩 -
// 2026-08-24 원격 DB로 직접 확인함), 브라우저마다 이 범위 안에서 랜덤 ID를 하나 뽑아 localStorage에
// 고정해두면 사람마다 사실상 다른 계정처럼 동작한다.
// 새로고침마다 바뀌면 지갑/주문 이력이 끊기므로 같은 브라우저에서는 반드시 같은 값을 재사용해야 함.
//
// dev 서버(로컬 개발)에서는 랜덤화하지 않고 그냥 1을 쓴다 - 로컬 Docker DB엔 시드 유저가 1명뿐이라
// 랜덤 ID를 뽑으면 USER_NOT_FOUND로 오히려 로컬 개발이 막힌다. 이 문제(동시 테스터 충돌)는 배포된
// 공유 서버(여러 사람이 같이 접속)에서만 실제로 발생하므로, 프로덕션 빌드에서만 랜덤화하면 충분하다.
const TEST_USER_ID_STORAGE_KEY = 'mealiverit_test_user_id'
const TEST_USER_ID_MAX = 1_000_000

function resolveTestUserId() {
  if (import.meta.env.DEV) return 1
  try {
    const stored = localStorage.getItem(TEST_USER_ID_STORAGE_KEY)
    if (stored) return Number(stored)
    const generated = Math.floor(Math.random() * TEST_USER_ID_MAX) + 1
    localStorage.setItem(TEST_USER_ID_STORAGE_KEY, String(generated))
    return generated
  } catch {
    // localStorage 접근 불가(시크릿 모드 등) - 매번 새 ID가 되지만 앱이 죽는 것보단 낫다
    return Math.floor(Math.random() * TEST_USER_ID_MAX) + 1
  }
}

export const TEST_USER_ID = resolveTestUserId()
