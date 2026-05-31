# T-054 동행링커 활동통계

## 메타

- Priority: P1
- Status: done
- Owner: Codex
- Depends on: T-005
- Area: report, operations
- Work type: report
- Target surface: admin-desktop, admin-mobile, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

동행링커별 활동 건수, 활동 상태, 배정 이력, 사고/민원 이력을 월간 기준으로 확인할 수 있게 한다.

## 배경

동행링커 활동통계는 활동비, 교육/관리, 인력 운영 계획에 필요하다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 동행링커 활동통계, 월간 리포트
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 월별 링커 활동 건수
- 활동 링커 수
- 링커별 배정 이력
- 상태별 필터
- 사고/민원 연결 요약

## 제외

- 급여 자동 정산
- 근태 관리 시스템
- 취업연계 고도화

## 사전설계

- [x] 활동통계는 Linker와 MobilityGroup 배정 기준임을 확인했다.
- [x] 활동비 자동 정산과는 분리함을 확인했다.
- [x] 모바일은 요약 중심으로 표시해야 함을 확인했다.

## 정합성

- [x] T-005 링커 배정과 운행 기록 이후 집계한다.
- [x] `definitions.md`의 Linker 필드와 일치한다.
- [x] 월간 리포트의 linkerActivityCount와 연결된다.

## 모델별 지시

### Product/PM

- 활동통계가 링커 운영 관리에 충분한지 확인한다.

### Data

- 그룹 배정 기준과 활동 완료 기준을 정의한다.

### Backend

- 월별 링커 활동 집계 action을 구현한다.

### Frontend

- 링커별 요약 카드와 상세 표를 구현한다.

### QA

- 월별 집계, 활동 상태 필터, 사고/민원 연결을 검증한다.

### Ops

- 활동비 지급 자료와 혼동되지 않도록 문구를 확인한다.

## 구현

- 구현 파일 또는 모듈:
  - `src/server/reports/linker-activity-statistics-service.ts`
  - `src/app/admin/reports/page.tsx`
  - `src/app/globals.css`
- API/Action: getLinkerActivityStats
- DB/Migration: Linker, MobilityGroup 사용
- UI/Route: `/admin/reports?month=YYYY-MM`, `/admin/reports?month=YYYY-MM&linkerStatus=AVAILABLE`
- AuditLog: 해당 없음
- 설정값: reportDateBasis

## 완료 기준

- [x] 월별 링커 활동 건수가 집계된다.
- [x] 활동 링커 수가 계산된다.
- [x] 링커별 배정 이력을 확인할 수 있다.
- [x] 모바일에서 요약이 읽기 쉽다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령:
  - `corepack.cmd pnpm typecheck`
  - `npx.cmd tsx -e "import { createPreviewLinkerActivityStats } ..."`
  - `corepack.cmd pnpm lint`
  - `corepack.cmd pnpm build`
  - `curl.exe -4 -I http://localhost:3000/admin/reports?month=2026-06`
- 결과:
  - 타입체크, 샘플 집계, 린트, 프로덕션 빌드 통과.
  - 시연 데이터 기준 전체 3명, 활동 2명, 배정 3건, 완료 3건, 사고·민원 연결 2건 집계 확인.
  - `linkerStatus=AVAILABLE` 필터에서 김동행 1명, 배정 2건, 완료 2건으로 축소 확인.
- 수동 확인:
  - 모바일 390px 긴 viewport에서 동행링커 활동통계 카드, 상태 필터, 링커별 배정 이력 확인.
  - 데스크톱 1366px 긴 viewport에서 요약 카드, 상태 필터, 동행링커별 활동 표 확인.
  - 스크린샷:
    - `C:\tmp\together-t054-linker-activity-qa\t054-linker-activity-mobile-tall.png`
    - `C:\tmp\together-t054-linker-activity-qa\t054-linker-activity-desktop-tall.png`
    - `C:\tmp\together-t054-linker-activity-qa\t054-linker-activity-filter-mobile-tall.png`
- 남은 리스크:
  - 현재 셸에 `.env`, `DATABASE_URL`, 로컬 PostgreSQL 연결이 없어 DB 커밋 기반 인증 E2E는 후속 DB 연결 티켓에서 검증한다.
  - Browser 플러그인은 `windows sandbox failed: spawn setup refresh`로 실패하여 헤드리스 Chrome 대체 검증을 사용했다.
