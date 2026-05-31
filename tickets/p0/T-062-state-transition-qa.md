# T-062 상태 전이 검증

## 메타

- Priority: P0
- Status: done
- Owner: Codex
- Depends on: T-004, T-005
- Area: qa, backend
- Work type: qa
- Target surface: admin-desktop, admin-mobile, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

이동 신청과 공동예약 그룹의 기본 상태, 취소 상태, 예외 상태가 허용된 순서와 권한 안에서만 변경되는지 검증한다. 서버 검증, UI 안내, AuditLog 기록, 모바일 반응형 표시가 같은 상태 규칙을 사용하도록 정합성을 맞춘다.

## 배경

상태 전이가 흩어지면 예약, 운행, 귀가확인, 정산 기준 데이터가 무너진다. T-062에서는 상태 전이 규칙을 도메인 공통 함수로 정리하고, 그룹 운영과 운행 운영 서비스가 같은 규칙을 사용하도록 보강했다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, VIEWER
- 주요 화면: 신청 상세, 그룹 상세, 예약 확정, 운행상태, 귀가확인
- 모바일 우선 여부: required
- 반응형 대상: 360px, 390px, 768px, 1280px
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 기본 상태 전이 순서 검증
- 취소 상태 사유 필수 검증
- 예외 상태 사유 필수 검증
- 권한별 상태 변경 가능 범위 검증
- 상태 변경 AuditLog 기록 검증
- 모바일 상태 배지와 다음 행동 표시 검증

## 제외

- 자동 상태 전이 엔진 고도화
- 외부 알림 연동
- AI 기반 예외 판단
- 실 DB 커밋 검증은 후속 DB 연결 티켓으로 이관

## 사전설계

- [x] 상태 전이 순서를 `definitions.md` 기준으로 확인한다.
- [x] 취소/예외 상태의 사유 필수 조건을 확인한다.
- [x] 권한별 상태 변경 주체를 확인한다.
- [x] 모바일에서 현재 상태와 다음 행동이 명확해야 함을 확인한다.
- [x] 상태 색상과 텍스트가 함께 표시되어야 함을 확인한다.

## 정합성

- [x] `master_plan.md`의 상태 전이와 일치한다.
- [x] `definitions.md`의 상태 표시명과 일치한다.
- [x] `design_style_guide.md`의 상태 표시 기준과 충돌하지 않는다.
- [x] T-004와 T-005 완료 후 검증하는 선행관계가 맞다.
- [x] 자동 배차 또는 외부 API 상태를 만들지 않는다.

## 모델별 지시

### Product/PM

- 운영자가 상태명만 보고 현재 단계와 다음 행동을 이해할 수 있는지 확인한다.

### Data

- MobilityRequest, MobilityGroup, TripLog의 상태 저장 범위와 AuditLog 저장 필드를 확인한다.

### Backend

- 허용되지 않은 전이, 사유 없는 예외, 권한 없는 전이를 차단한다.

### Frontend

- 상태 배지, 다음 행동 버튼, 예외 사유 입력 UI를 검증한다.

### QA

- 정상 전이, 역방향 전이, 건너뛰기, 예외 전이, 취소 전이를 테스트한다.

### Ops

- 상태 변경 실패 로그가 운영 추적에 충분한지 확인한다.

## 구현

- 구현 파일 또는 모듈:
  - `src/domain/status.ts`: 다음 상태 행동 계산과 표시 문구 함수 추가
  - `src/server/groups/mobility-group-service.ts`: 그룹 상태 변경 시 활성 신청 상태 동기화와 STATUS_CHANGE AuditLog 보강
  - `src/server/trips/trip-operation-service.ts`: 링커 배정, 택시요청, 택시확정, 운행중, 귀가확정 단계별 상태 전이 검증과 신청 상태 동기화
  - `src/features/trip-operations/trip-operation-workspace.tsx`: 현재 상태별 다음 행동 안내와 불가능한 조작 비활성화
  - `src/features/mobility-groups/mobility-group-workspace.tsx`: 상태 배지 표준화
  - `src/features/resident-requests/resident-request-workspace.tsx`: 상태 배지 표준화
  - `src/app/globals.css`: 상태별 색상 배지와 보조 안내 문구 스타일 추가
  - `scripts/verify-state-transitions.ts`: 상태 전이 QA 스크립트 추가
- API/Action: `transitionGroupStatus`, `assignLinkerToGroup`, `requestTaxiReservation`, `applyTaxiConfirmation`, `applyTripStep`, `applyReturnConfirmation`
- DB/Migration: 해당 없음
- UI/Route: `/admin/groups`, `/admin/trips`
- AuditLog: `STATUS_CHANGE`
- 설정값: 해당 없음

## 완료 기준

- [x] 기본 상태가 허용 순서대로만 진행된다.
- [x] 취소와 예외 상태는 사유 없이 저장되지 않는다.
- [x] 권한 없는 사용자는 상태를 변경할 수 없다.
- [x] 모든 주요 상태 변경이 AuditLog에 기록된다.
- [x] 모바일에서 상태와 다음 행동이 명확히 보인다.
- [x] 검증 기록을 포함한다.

## 검증 기록

- 명령:
  - `npx.cmd tsx scripts/verify-state-transitions.ts`
  - `npx.cmd tsx scripts/verify-privacy-rules.ts`
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `corepack.cmd pnpm build`
  - `$env:DATABASE_URL='postgresql://user:password@localhost:5432/together'; corepack.cmd pnpm db:validate`
  - `node --check prisma\seed.mjs`
  - `curl.exe -4 -I http://localhost:3000/admin/groups`
  - `curl.exe -4 -I http://localhost:3000/admin/trips`
  - `curl.exe -4 -s http://localhost:3000/admin/groups | Select-String -Pattern "다음 행동|링커모집|그룹확정"`
  - `curl.exe -4 -s http://localhost:3000/admin/trips | Select-String -Pattern "현재 상태의 다음 행동|다음 행동|택시확정|동행링커 탑승"`
- 결과:
  - `state-transitions-ok`
  - `privacy-rules-ok`
  - typecheck, lint, build 통과
  - Prisma schema validate 통과
  - seed syntax check 통과
  - `/admin/groups`, `/admin/trips` HTTP 200 확인
  - 그룹 화면에 `그룹확정`, `다음 행동: 링커모집, 운영취소` 표시 확인
  - 운행 화면에 `택시확정`, `현재 상태의 다음 행동: 동행링커 탑승` 표시 확인
- 수동 확인:
  - Chrome 캡처: `.verification/t062-groups-360x900.png`, `.verification/t062-groups-390x900.png`, `.verification/t062-groups-768x1024.png`, `.verification/t062-groups-1280x900.png`
  - Chrome 캡처: `.verification/t062-trips-360x900.png`, `.verification/t062-trips-390x900.png`, `.verification/t062-trips-768x1024.png`, `.verification/t062-trips-1280x900.png`
  - 긴 모바일 캡처: `.verification/t062-groups-detail-390x3200.png`, `.verification/t062-trips-detail-390x3200.png`
- 잔여 리스크:
  - `.env`와 실제 PostgreSQL 연결이 없어 상태 전이 DB 커밋 및 AuditLog 영속성 검증은 후속 DB 연결 티켓에서 수행한다.
