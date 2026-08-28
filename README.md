# 🎫 밀리버릿 (Mealiver-IT-FE)

> `Mealiver-IT` 백엔드의 프론트엔드 — 배달앱 오픈런 선착순 쿠폰 발급 소비자 화면 + 관리자 대시보드

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

---

## 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [기술 스택](#2-기술-스택)
3. [실행 방법](#3-실행-방법)
4. [화면 구성](#4-화면-구성)
   - [소비자 화면](#4-1-소비자-화면)
   - [관리자 대시보드](#4-2-관리자-대시보드)
5. [실시간 재고 반영 방식](#5-실시간-재고-반영-방식)
6. [프로젝트 구조](#6-프로젝트-구조)

---

## 1. 프로젝트 소개

`Mealiver-IT` 백엔드가 구현한 "대규모 트래픽 선착순 쿠폰 발급 시스템"의 프론트엔드입니다. 두 축으로 구성됩니다.

- **소비자 화면**: 오픈런 이벤트 목록 → 쿠폰 발급 → 장바구니/결제 → 쿠폰함까지, 실제로 동작하는 화면입니다. 회원가입/로그인은 과제 범위 밖이라 구현하지 않고 고정 테스트 유저로 동작합니다(가게/메뉴 데이터는 mocking).
- **관리자 대시보드**: 캠페인 CRUD, 실시간 재고 추이, 쿠폰 강제 회수, 유저 검색, 정합성 검증 배치 수동 실행·결과 조회, 오염 데이터 삽입/정리 등을 인증 없이(과제 평가범위 밖) 조작할 수 있는 화면입니다. 부하테스트를 라이브로 시연할 때 "지금 무슨 일이 일어나고 있는지"를 화면으로 보여주는 용도입니다.

백엔드 아키텍처(동시성 제어 V1~V4, 정합성 검증, ERD 등)는 [`Mealiver-IT` 레포 README](https://github.com/Mealiver-IT/Mealiver-IT-BE)를 참고하세요.

---

## 2. 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | React 19, Vite 8 |
| 라우팅 | React Router 7 (소비자 화면 `/*`와 관리자 화면 `/admin/*`을 최상위에서 분리한 뒤, 관리자 쪽만 `AdminLayout`으로 다시 감싸는 표준 중첩 `<Routes>`/`<Outlet>` 구조) |
| 실시간 반영 | `EventSource`(SSE) — 캠페인 상세 페이지의 재고 추이 차트, 관리자 상세 페이지 |
| 테스트 | Vitest — 순수 함수(차트 지오메트리, SSE 리듀서, 날짜 포맷 등) 단위 테스트 |
| 린트 | oxlint |

백엔드 API 인증이 없는 것과 동일한 이유로, 프론트에도 로그인 화면이 없습니다 — 소비자 화면은 고정 테스트 유저(`X-User-Id`)로 동작합니다.

---

## 3. 실행 방법

```bash
npm install
npm run dev       # http://localhost:5173, /api/* 는 vite.config.js 프록시로 http://localhost:8080(로컬 BE)에 전달
npm run build      # 프로덕션 빌드
npm run test       # vitest
npm run lint       # oxlint
```

BE를 다른 호스트(예: 팀 공유 Tailscale 서버)에서 띄웠다면 `.env`에 `VITE_API_BASE_URL`을 지정하면 프록시 대신 그 주소로 직접 호출합니다(`.env.example` 참고).

공유 배포판은 `Mealiver-IT-Infra`의 docker-compose로 BE와 함께 한 번에 뜹니다 — `main` 브랜치 push 시 GitHub Actions가 이미지를 빌드해 GHCR에 푸시하고, 공유 서버가 이를 pull해 재기동합니다.

---

## 4. 화면 구성

### 4-1. 소비자 화면

| 경로 | 화면 |
|---|---|
| `/` | 홈 — 가게 목록(mocking) |
| `/store/:storeId` | 가게 메뉴 |
| `/cart` | 장바구니 |
| `/checkout` | 결제 |
| `/order-complete`, `/orders`, `/orders/:orderId` | 결제완료·주문내역·주문상세 |
| `/coupons` | 쿠폰함 (발급받은 쿠폰 목록, 지난 쿠폰 섹션 포함) |
| `/events`, `/event/:eventId` | 오픈런 이벤트 목록·상세 (선착순 쿠폰 발급 버튼) |
| `/mypage` | 마이페이지 |

### 4-2. 관리자 대시보드

| 경로 | 화면 |
|---|---|
| `/admin` | 대시보드 — 전체 캠페인/누적 발급/전체 유저 KPI, 진행중 캠페인 실시간 재고 미니 카드, 정합성 검증 결과 요약 + 수동 실행, 오염 데이터 삽입/정리 |
| `/admin/campaigns` | 캠페인 목록 (오픈/마감 시각 포함), 삭제 |
| `/admin/campaigns/new` | 캠페인+쿠폰 정책 등록 (오픈 예약시각 지정 가능) |
| `/admin/campaigns/:id` | 캠페인 상세 — 실시간 재고 추이 차트(그래프 초기화 가능), 누적 발급 건수, 유저ID로 발급 건 조회 후 강제 회수 |
| `/admin/users` | 유저 검색 (ID/로그인ID/이름 조합, 서버사이드 검색 — 100만 건 규모라 검색 전엔 전체 조회 안 함) |

---

## 5. 실시간 재고 반영 방식

캠페인 상세 페이지(소비자·관리자 공통)는 `EventSource`로 BE의 `GET /api/campaigns/{id}/stream`을 구독해 발급이 일어날 때마다 재고 숫자와 그래프가 즉시 갱신됩니다.

- **하트비트**: 발급 이벤트가 없어도 5초마다 "지금 값"을 찍어, 트래픽이 뜸한 구간에도 그래프가 그려지도록 합니다. 재고가 0이 되면(soldOut) 하트비트를 멈춰 평평한 꼬리가 계속 늘어나지 않게 합니다.
- **스로틀**: 발급마다 SSE 이벤트가 하나씩 오는데(스로틀 없음), 짧은 시간에 수천 건이 몰리는 부하테스트 상황에서도 그래프 포인트 수가 일정하게 유지되도록 최소 갱신 간격을 둡니다.
- **세션 지속성**: 재고 이력을 `sessionStorage`에 저장해, 다른 화면에 갔다 돌아와도 그래프가 유지됩니다. 오래된 세션 기록이 그래프 x축을 늘어지게 만들면 "그래프 초기화" 버튼으로 리셋할 수 있습니다.
- **대시보드 그리드**: 캠페인 상세와 달리, 대시보드에 동시에 여러 캠페인 카드가 뜨는 화면은 SSE 대신 짧은 주기 폴링(`GET /api/campaigns/{id}/stock`)을 씁니다 — OPEN 캠페인마다 SSE를 하나씩 열면 브라우저의 오리진당 연결 제한(HTTP/1.1 기본 6개)에 걸려 화면 이동 자체가 멎는 문제가 실측으로 확인됐습니다(캠페인 6개 동시 OPEN 상태에서 최대 58초 지연).

---

## 6. 프로젝트 구조

```
src/
  pages/              소비자 화면 (Home, Store, Cart, Checkout, Coupon, Event, MyPage, Order*)
  pages/admin/         관리자 대시보드 (AdminLayout, AdminDashboardPage, AdminCampaign*Page,
                       AdminUserListPage, CampaignStockChart, CouponRevokeSection, OpenCampaignMiniCard)
  api/                 BE 호출 래퍼 (admin/campaigns.js, admin/users.js, admin/dirtyData.js,
                       admin/verification.js, coupons.js, http.js, config.js)
  hooks/               useCampaignStockStream (SSE 리듀서 — 하트비트/스로틀/세션 지속성)
  utils/               순수 함수 (chartGeometry, campaignAdmin, dashboardStats, datetime, userSearch 등)
```

---

> **태진아 Team**
