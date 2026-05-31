# T-066 운영 금지 표현 사용 여부 검증

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: all P0 UI
- Area: qa, product
- Work type: qa
- Target surface: admin-desktop, admin-mobile, mobile-link, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

UI, 메뉴, 버튼, 도움말, 리포트 문구에서 MVP 성격을 오해시킬 수 있는 의료, 자동 배차, 자동 결제, 할인/환급 표현이 사용되지 않는지 검증한다.

## 배경

소원권역 동행이동 OS는 내부 운영관리 시스템이며 의료상담, 전문 이송, 공개 모빌리티, 자동 결제 서비스가 아니다. 화면 문구가 범위를 오해시키면 운영 책임과 사용자 기대가 왜곡된다.

## 사용자와 화면

- 주요 사용자: 전체 역할
- 주요 화면: 전체 P0 UI, 모바일 링크, 리포트, 오류/빈 상태 문구
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 메뉴명, 화면 제목, 버튼, 안내문, 빈 상태, 오류 문구 검토
- 의료/치료/진단/이송 관련 표현 검토
- 자동 배차, 자동 결제, 할인, 환급 표현 검토
- 공개 플랫폼 또는 앱스토어 앱으로 오해될 문구 검토
- 고령 사용자에게 어려운 행정/기술 용어 검토

## 제외

- 전체 브랜드 카피라이팅
- 홍보물 제작
- 법률 문구 검토

## 사전설계

- [x] 금지 표현 목록을 `master_plan.md`와 맞췄다.
- [x] 운영 기준 용어를 `definitions.md`와 맞췄다.
- [x] 고령 사용자에게 쉬운 문구 기준을 확인했다.
- [x] P0 전체 UI 완료 후 검증하는 구조를 확인했다.
- [x] 리포트 문구도 검증 대상임을 확인했다.

## 정합성

- [x] `design_style_guide.md`의 문구 기준과 일치한다.
- [x] MVP 제외 기능을 문구로 암시하지 않는다.
- [x] 공동예약, 생활이동, 동행링커, 귀가확인 등 운영 용어를 일관되게 사용한다.
- [x] 의료상담 또는 전문 이송 서비스로 오해되지 않는다.
- [x] 공개 모빌리티 플랫폼으로 오해되지 않는다.

## 모델별 지시

### Product/PM

- 운영 목적과 범위에 맞는 용어인지 최종 확인한다.

### Data

- enum 표시명이 금지 표현을 포함하지 않는지 확인한다.

### Backend

- 서버 오류 메시지와 validation message를 검토한다.

### Frontend

- 화면, 버튼, 빈 상태, 오류, 도움말 문구를 검토한다.

### QA

- 정규 검색과 수동 화면 점검을 함께 수행한다.

### Ops

- README, 배포 환경 문구, 리포트 문구도 검토한다.

## 구현

- 구현 파일 또는 모듈: `scripts/verify-forbidden-operational-language.ts`, `src/domain/privacy.ts`, `src/server/reports/report-contracts.ts`, `src/features/settlements/settlement-workspace.tsx`, `src/components/layout/app-chrome.tsx`, `README.md`, `tickets/README.md`
- API/Action: validation messages, report contract messages
- DB/Migration: enum display labels scan only
- UI/Route: all scanned P0 UI roots, `/admin/reports`, `/admin/settlements`
- AuditLog: 해당 없음
- 설정값: 해당 없음

## 완료 기준

- [x] 금지 표현이 UI와 리포트에 없다.
- [x] 주요 용어가 `definitions.md`와 일치한다.
- [x] 오류와 빈 상태 문구가 쉽고 직접적이다.
- [x] 모바일 화면에서도 안내 문구가 잘리지 않는다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령:
  - `npx.cmd tsx scripts\verify-forbidden-operational-language.ts`
  - `npx.cmd tsx scripts\verify-privacy-rules.ts`
  - `npx.cmd tsx scripts\verify-rbac-access.ts`
  - `npx.cmd tsx scripts\verify-settlement-formulas.ts`
  - `npx.cmd tsx scripts\verify-state-transitions.ts`
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `corepack.cmd pnpm build`
  - `$env:DATABASE_URL='postgresql://user:password@localhost:5432/together'; corepack.cmd pnpm db:validate`
  - `node --check prisma\seed.mjs`
  - `curl.exe -4 -I http://localhost:3000/admin/reports`
  - `curl.exe -4 -I http://localhost:3000/admin/settlements`
  - `rg -n "진단|처치|상담|환급|할인|차감|의료|치료|이송|자동 배차|자동 결제|위치 추적|택시 호출|모빌리티 플랫폼|앱스토어|공개 앱|기사 전용 앱" src\app src\components src\features src\server\reports README.md tickets\README.md`
- 결과:
  - `forbidden-operational-language-ok`
  - privacy, RBAC, settlement formula, state transition 검증 통과
  - typecheck, lint, production build 통과
  - Prisma schema validate와 seed syntax check 통과
  - `/admin/reports`, `/admin/settlements` HTTP 200
  - 금지 표현 grep 결과 없음
- 수동 확인:
  - `.verification/t066-reports-390x900.png`
  - `.verification/t066-reports-1280x900.png`
  - `.verification/t066-settlements-390x900.png`
  - `.verification/t066-settlements-1280x900.png`
  - 리포트/정산 화면에서 `민감정보 입력 금지`, `별도 지원 항목`, `건강 세부정보는 입력하지 않습니다` 대체 문구 확인
- 잔여 리스크:
  - `.env`와 실제 PostgreSQL 연결이 없어 DB 커밋 기반 인증 E2E는 후속 DB 연결 티켓에서 검증한다.
  - 인앱 브라우저 런타임은 세션 오류로 열리지 않아 실제 Chrome headless 캡처와 HTTP/HTML 검증으로 대체했다.
