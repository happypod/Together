# T-065 권한별 접근 검증

## 메타

- Priority: P0
- Status: done
- Owner: Codex
- Depends on: T-002, T-006, T-007
- Area: qa, security
- Work type: qa
- Target surface: admin-desktop, admin-mobile, mobile-link, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

역할별 사용자가 허용된 화면과 action만 접근할 수 있고, UI 숨김과 별도로 서버 권한 검증이 동작하는지 확인한다.

## 배경

주민 개인정보, 정산 정보, 운행 기록은 역할별 접근 범위가 다르다. 권한 검증이 UI에만 있으면 API 직접 호출로 우회될 수 있으므로 서버 action과 도메인 서비스에서 권한을 확인해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, VIEWER
- 주요 화면: 전체 관리자 화면, 모바일 링크, CSV, 정산, AuditLog
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 역할별 화면 접근 검증
- 역할별 쓰기 action 검증
- LINKER 배정 건 제한 검증
- TAXI_PARTNER 예약 확정 제한 필드 검증
- VIEWER CSV 권한 제한 검증
- SUPER_ADMIN 전용 권한 변경/정산 잠금 해제 검증
- 권한 없음 화면과 오류 문구 검증

## 제외

- SSO 고도화
- 조직별 멀티테넌시
- 세부 권한 빌더 UI

## 사전설계

- [x] 역할 enum과 권한 원칙을 확인했다.
- [x] 서버 권한 검증이 필수임을 확인했다.
- [x] 제한 사용자별 허용 action을 확인했다.
- [x] 모바일 링크는 토큰 scope가 권한 역할을 대체하지 않음을 확인했다.
- [x] 권한 없음 안내 문구가 쉬워야 함을 확인했다.

## 정합성

- [x] `definitions.md`의 권한 적용 원칙과 일치한다.
- [x] `master_plan.md`의 권한 매트릭스 방향과 일치한다.
- [x] `design_style_guide.md`의 오류 안내 기준을 따른다.
- [x] T-002, T-006, T-007 완료 후 검증하는 선행관계가 맞다.
- [x] UI 숨김만으로 권한을 처리하지 않는다.

## 모델별 지시

### Product/PM

- 역할별 실제 업무 범위가 운영 방식과 맞는지 확인한다.

### Data

- User.role, isActive, AuditLog userId가 검증에 충분한지 확인한다.

### Backend

- action별 requireRole, assigned-linker check, token scope check를 검증한다.

### Frontend

- 권한 없는 버튼 숨김과 권한 없음 안내 화면을 검증한다.

### QA

- 역할별 허용/차단 matrix 테스트를 수행한다.

### Ops

- 초기 관리자 계정과 사용자 비활성화 절차를 확인한다.

## 구현

- 구현 파일 또는 모듈:
  - `src/domain/auth/rbac-policy.ts`: 관리자 route와 protected action 권한 매트릭스 추가
  - `src/domain/auth/permissions.ts`: 정산 잠금 후 수정은 SUPER_ADMIN 전용으로 정리
  - `src/components/layout/access-denied-panel.tsx`: 권한 없음 안내 컴포넌트 추가
  - `src/app/admin/requests/page.tsx`, `src/app/admin/groups/page.tsx`, `src/app/admin/trips/page.tsx`, `src/app/admin/settlements/page.tsx`, `src/app/admin/reports/page.tsx`, `src/app/page.tsx`, `src/app/admin/page.tsx`: 권한 없는 로그인 사용자에게 preview 대신 안내 표시
  - `src/server/trips/trip-operation-service.ts`: 모바일 action 메타 필드가 token scope 검증에 섞이지 않도록 필터 보강
  - `scripts/verify-rbac-access.ts`: 역할별 route/action/mobile-token 권한 매트릭스 검증 추가
  - `scripts/verify-settlement-formulas.ts`: 정산 잠금 후 수정 권한 기대값을 SUPER_ADMIN 전용으로 정렬
- API/Action: all write actions, mobile token submit, CSV preparation
- DB/Migration: 해당 없음
- UI/Route: role-protected routes
- AuditLog: 권한 관련 주요 작업은 기존 action별 로그 경로 유지
- 설정값: 해당 없음

## 완료 기준

- [x] 모든 쓰기 action은 서버에서 권한을 확인한다.
- [x] 비활성 사용자는 접근할 수 없다.
- [x] LINKER와 TAXI_PARTNER는 제한 범위를 벗어나 입력할 수 없다.
- [x] VIEWER의 CSV 권한 제한이 동작한다.
- [x] 권한 없음 화면이 명확하고 쉬운 문구로 표시된다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령:
  - `npx.cmd tsx scripts/verify-rbac-access.ts`
  - `npx.cmd tsx scripts/verify-settlement-formulas.ts`
  - `npx.cmd tsx scripts/verify-state-transitions.ts`
  - `npx.cmd tsx scripts/verify-privacy-rules.ts`
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `corepack.cmd pnpm build`
  - `$env:DATABASE_URL='postgresql://user:password@localhost:5432/together'; corepack.cmd pnpm db:validate`
  - `node --check prisma\seed.mjs`
  - `curl.exe -4 -I http://localhost:3000/admin/requests`
  - `curl.exe -4 -I http://localhost:3000/admin/groups`
  - `curl.exe -4 -I http://localhost:3000/admin/trips`
  - `curl.exe -4 -I http://localhost:3000/admin/settlements`
  - `curl.exe -4 -I http://localhost:3000/admin/reports`
- 결과:
  - `rbac-access-ok`
  - `settlement-formulas-ok`
  - `state-transitions-ok`
  - `privacy-rules-ok`
  - typecheck, lint, build 통과
  - Prisma schema validate 통과
  - seed syntax check 통과
  - 주요 관리자 route HTTP 200 확인
- 수동 확인:
  - Chrome 캡처: `.verification/t065-requests-390x900.png`, `.verification/t065-requests-1280x900.png`
  - Chrome 캡처: `.verification/t065-trips-390x900.png`, `.verification/t065-trips-1280x900.png`
  - Chrome 캡처: `.verification/t065-reports-390x900.png`, `.verification/t065-reports-1280x900.png`
- 남은 리스크:
  - 실제 로그인 세션별 route 접근과 DB 저장 차단은 `.env`와 통합 DB 연결 후 E2E로 재검증한다.
