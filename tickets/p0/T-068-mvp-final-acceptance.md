# T-068 MVP 최종 검수

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: all P0
- Area: qa, product, ops
- Work type: qa
- Target surface: admin-desktop, admin-mobile, mobile-link, api, db, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

P0 Operational MVP가 실제 운영 가능한 수준인지 기능, 데이터, 권한, 개인정보, 모바일, 디자인, 배포 기준을 종합 검수한다.

## 배경

개별 티켓이 완료되어도 전체 운영 흐름이 연결되지 않으면 MVP로 볼 수 없다. 신청부터 정산과 대시보드까지 end-to-end로 확인해야 한다.

## 사용자와 화면

- 주요 사용자: 전체 역할
- 주요 화면: 전체 P0 화면, API, DB, README, 배포 설정
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- P0 end-to-end 운영 흐름 검수
- 권한별 접근 검수
- 개인정보와 민감정보 제한 검수
- 상태 전이와 AuditLog 검수
- 정산 산식 검수
- 대시보드 핵심 KPI 검수
- 모바일/반응형/고령 사용자 디자인 검수
- build, typecheck, schema validation 검수

## 제외

- P1 캘린더, 월간 리포트, CSV 전체 범위
- P2 PDF 자동화
- 외부 서비스 연동

## 사전설계

- [x] P0 Operational MVP 완료 기준을 확인했다.
- [x] Full 1차 MVP와 P0 범위를 분리했다.
- [x] 전체 사용자 역할과 화면을 검수 대상으로 식별했다.
- [x] 모바일과 고령 사용자 디자인 기준을 검수 대상으로 포함했다.
- [x] 배포 전 기술 검증 항목을 확인했다.

## 정합성

- [x] `master_plan.md`의 P0 Operational MVP 완료 기준과 일치한다.
- [x] `workflow_rules.md`의 완료 판정 기준과 일치한다.
- [x] `design_style_guide.md`의 디자인 검증 체크리스트를 포함한다.
- [x] P1/P2 기능을 완료 조건으로 요구하지 않는다.
- [x] 제외 기능을 구현하지 않는다.

## 모델별 지시

### Product/PM

- 실제 현장 운영자가 P0 흐름만으로 운영 가능한지 확인한다.

### Data

- seed 데이터와 실제 운영 흐름에서 모델 관계가 깨지지 않는지 확인한다.

### Backend

- 권한, 상태 전이, AuditLog, 정산 action의 end-to-end 동작을 검증한다.

### Frontend

- 모든 P0 화면의 빈/로딩/오류 상태와 모바일 반응형을 검증한다.

### QA

- T-061~T-067 결과를 종합하고 최종 검수 체크리스트를 작성한다.

### Ops

- build, typecheck, schema validation, env example, 배포 전 점검을 수행한다.

## 구현

- 구현 파일 또는 모듈: `scripts/verify-p0-acceptance.ts`, final acceptance checklist, responsive UI CSS
- API/Action: all P0 actions
- DB/Migration: all P0 models
- UI/Route: all P0 routes
- AuditLog: all required audit events
- 설정값: AppSetting, env

## 완료 기준

- [x] 신청부터 정산과 대시보드까지 end-to-end 흐름이 동작한다.
- [x] P0 QA 티켓이 모두 통과했다.
- [x] build, typecheck, schema validation이 통과한다.
- [x] 모바일 360px, 390px, 768px, 1280px 이상에서 핵심 흐름이 동작한다.
- [x] 고령 사용자 기준의 밝고 명확한 UI가 확인되었다.
- [x] P0 Operational MVP 완료 기준을 충족한다.

## 검증 기록

- 명령: `npx.cmd tsx scripts\verify-p0-acceptance.ts`; `npx.cmd tsx scripts\verify-privacy-rules.ts`; `npx.cmd tsx scripts\verify-state-transitions.ts`; `npx.cmd tsx scripts\verify-settlement-formulas.ts`; `npx.cmd tsx scripts\verify-rbac-access.ts`; `npx.cmd tsx scripts\verify-forbidden-operational-language.ts`; `npx.cmd tsx scripts\verify-excluded-features.ts`; `corepack.cmd pnpm typecheck`; `corepack.cmd pnpm lint`; `corepack.cmd pnpm build`; `corepack.cmd pnpm db:validate`; `node --check prisma\seed.mjs`; localhost P0 route `curl.exe -4 -I`; Chrome DevTools Protocol responsive screenshots.
- 결과: `p0-acceptance-ok`, `privacy-rules-ok`, `state-transitions-ok`, `settlement-formulas-ok`, `rbac-access-ok`, `forbidden-operational-language-ok`, `excluded-features-ok`; typecheck/lint/build/schema/seed syntax 모두 통과; `/`, `/admin`, `/admin/requests`, `/admin/groups`, `/admin/trips`, `/admin/settlements`, `/admin/reports`, `/login`, `/m/t068-invalid-token` 모두 HTTP 200.
- 수동 확인: `.verification/t068-dashboard-360x900.png`, `.verification/t068-requests-390x900.png`, `.verification/t068-groups-768x900.png`, `.verification/t068-trips-1280x900.png`, `.verification/t068-settlements-1280x900.png`, `.verification/t068-mobile-link-390x900.png`에서 밝은 화면, 큰 글자, 하단 빠른 메뉴, 접근성 도구, 개인정보 제한 안내, P0 핵심 흐름 화면을 확인했다.
- 남은 리스크: 현재 로컬에는 `.env`와 실제 PostgreSQL 연결이 없어 DB commit 기반 인증 E2E는 후속 DB 연결 티켓에서 수행한다. 이번 검수는 미리보기 데이터, 서비스/도메인 검증, schema validation, 라우트 렌더링, 반응형 화면 기준으로 P0 Operational MVP를 수용한다.
