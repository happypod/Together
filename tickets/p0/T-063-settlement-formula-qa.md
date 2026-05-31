# T-063 정산 산식 검증

## 메타

- Priority: P0
- Status: done
- Owner: Codex
- Depends on: T-006, T-008
- Area: qa, finance
- Work type: qa
- Target surface: admin-desktop, admin-mobile, api, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

정산 모드별 주민 부담금, 택시 지원금, 상생기금 기록, 원 단위 절사, 정산 잠금과 수정 사유가 같은 산식과 권한 규칙으로 동작하는지 검증한다.

## 배경

정산은 보조금성 운영과 주민 부담 안내의 기준 데이터다. 계산 오차, 상생기금과 앵커 지원금 혼동, 완료 후 수정 이력 누락이 없어야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER
- 주요 화면: 정산 상세, 관리자 홈, 월간 리포트 요약
- 모바일 우선 여부: required
- 반응형 대상: 360px, 390px, 768px, 1280px
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 시범기, 자립전환기, 상생기금 지원, 직접 입력 정산 검증
- 원 단위 절사와 잔여 차액 처리 검증
- 주민 수 1명, 2명, 3명 케이스 검증
- `totalFare` 0 이상 정수 검증
- 정산 완료 후 수정 권한과 수정 사유 검증
- 상생기금이 택시요금 차감 또는 환급으로 표시되지 않는지 검증

## 제외

- 자동 결제
- 카드 결제
- 할인, 환급 처리
- 회계 시스템 연동
- 실 DB 커밋 검증은 후속 DB 연결 티켓으로 이관

## 사전설계

- [x] 정산 모드와 산식을 `master_plan.md` 기준으로 확인한다.
- [x] 원 단위 처리 정책이 `AppSetting`으로 분리되어야 함을 확인한다.
- [x] 상생기금 회계 분리 원칙을 확인한다.
- [x] 모바일에서 큰 숫자와 단위 표시가 필요함을 확인한다.
- [x] 정산 수정은 사유와 AuditLog가 필수임을 확인한다.

## 정합성

- [x] `definitions.md`의 Settlement 필드와 일치한다.
- [x] `design_style_guide.md`의 금액 표시 기준과 충돌하지 않는다.
- [x] T-006과 T-008 완료 후 검증하는 선행관계가 맞다.
- [x] 자동 결제 또는 환급 처리를 구현하지 않는다.
- [x] 상생기금은 택시요금 차감으로 표시하지 않는다.

## 모델별 지시

### Product/PM

- 주민 부담, 앵커 지원, 상생기금 합계가 오해 없이 표시되는지 확인한다.

### Data

- Settlement, CommunityFund, MonthlyReport 집계 필드가 산식과 맞는지 확인한다.

### Backend

- `calculateSettlement` 함수와 정산 수정 권한/사유 검증을 테스트한다.

### Frontend

- 금액 단위, 큰 숫자, 정산 검증 상태, 수정 사유 입력 UI를 확인한다.

### QA

- 모드별 산식, 절사 경계값, 수정 권한, AuditLog 기대 동작을 검증한다.

### Ops

- 월간 보고와 CSV 금액 컬럼이 같은 산식을 따르는지 확인한다.

## 구현

- 구현 파일 또는 모듈:
  - `src/server/settlements/calculator.ts`: 상생기금 별도 보전, 주민 부담/앵커 지원 합계 검증, 초과 입력 차단
  - `src/server/settlements/settlement-service.ts`: 주민 수 1 이상 검증, 완료 후 수정 사유 필수, `SETTLEMENT_UNLOCK` 감사로그 의도 기록
  - `src/domain/auth/permissions.ts`: 정산 작성은 SUPER_ADMIN/ANCHOR_ADMIN, 잠금 후 수정은 SUPER_ADMIN 전용으로 정렬
  - `src/features/settlements/settlement-workspace.tsx`: 정산 총액, 주민 총 분담, 앵커 지원금, 상생기금, 산식 검증 표시 추가
  - `scripts/verify-settlement-formulas.ts`: 정산 산식, 리포트 집계, 권한 기대값 검증 추가
  - `src/app/layout.tsx`, `src/components/layout/app-shell.tsx`, `src/app/login/page.tsx`, `tickets/_roadmap/master_plan.md`: 프로젝트명 `백천마을` 표기 정합성 보정
- API/Action: `saveSettlement`, `recordSettlementCsvPreparation`, `getDashboardSummaryView`
- DB/Migration: 해당 없음
- UI/Route: `/admin/settlements`
- AuditLog: `CREATE`, `UPDATE`, `SETTLEMENT_LOCK`, `SETTLEMENT_UNLOCK`, `EXPORT_CSV`
- 설정값: `fareRoundingPolicy`

## 완료 기준

- [x] 모든 정산 모드의 계산 결과가 기대값과 일치한다.
- [x] 원 단위 처리 정책이 설정값을 따른다.
- [x] 정산 완료 후 수정은 관리자 권한과 사유가 필요하다.
- [x] 상생기금은 별도 항목으로 표시된다.
- [x] 모바일에서 금액과 단위가 잘 읽힌다.
- [x] 검증 기록을 포함한다.

## 검증 기록

- 명령:
  - `npx.cmd tsx scripts/verify-settlement-formulas.ts`
  - `npx.cmd tsx scripts/verify-state-transitions.ts`
  - `npx.cmd tsx scripts/verify-privacy-rules.ts`
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `corepack.cmd pnpm build`
  - `$env:DATABASE_URL='postgresql://user:password@localhost:5432/together'; corepack.cmd pnpm db:validate`
  - `node --check prisma\seed.mjs`
  - `curl.exe -4 -I http://localhost:3000/admin/settlements`
  - `curl.exe -4 -s http://localhost:3000/admin/settlements | Select-String -Pattern "소원권역 동행이동 OS|산식 검증|상생기금|정산 총액|주민 총 분담|택시요금 차감|환급"`
- 결과:
  - `settlement-formulas-ok`
  - `state-transitions-ok`
  - `privacy-rules-ok`
  - typecheck, lint, build 통과
  - Prisma schema validate 통과
  - seed syntax check 통과
  - `/admin/settlements` HTTP 200 확인
  - 정산 총액, 주민 총 분담, 상생기금, 산식 검증 문구 표시 확인
- 수동 확인:
  - Chrome 캡처: `.verification/t063-settlements-360x900.png`, `.verification/t063-settlements-390x900.png`, `.verification/t063-settlements-768x1024.png`, `.verification/t063-settlements-1280x900.png`
  - 긴 모바일 캡처: `.verification/t063-settlements-detail-390x3600.png`
- 잔여 리스크:
  - `.env`와 실제 PostgreSQL 연결이 없어 정산 저장, 잠금 후 수정, AuditLog 영속성, 실제 CommunityFund 연동 검증은 후속 DB 연결 티켓에서 수행한다.
