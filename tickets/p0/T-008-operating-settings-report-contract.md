# T-008 운영 설정과 리포트 계약

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: T-002
- Area: operations, reporting, finance
- Work type: report
- Target surface: admin-desktop, admin-mobile, report, db
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

기본요금, 그룹 최대 인원, 정산 반올림, 모바일 토큰 만료시간, 월간 리포트 기준일처럼 운영 중 바뀔 수 있는 값을 설정으로 분리하고, 대시보드와 월간 리포트 지표 산식을 확정한다.

## 배경

운영 기본값과 리포트 기준이 코드에 흩어지면 정산과 보고의 신뢰성이 떨어지므로 설정과 산식을 먼저 고정해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER
- 주요 화면: 운영 설정 seed, 대시보드, 월간 리포트, CSV
- 모바일 우선 여부: optional
- 반응형 대상: all

## 범위

- `AppSetting` 초기값 seed
- 기본요금, 기본 주민 수, 최대 그룹 주민 수 설정
- 정산 반올림 정책 설정
- 모바일 토큰 기본 만료시간 설정
- 마을 목록과 시간대 목록 설정
- 월간 리포트 기준일 설정
- 대시보드 KPI와 월간 리포트 산식 정의
- CSV 컬럼 계약 정의
- 수동 연락 기록 `ContactLog` 기본 입력 기준

## 제외

- 고급 설정 UI
- 리포트 PDF 자동 생성
- 문자 자동 발송
- 대량 CSV 가져오기 자동화

## 구현 메모

- 설정값은 코드 상수와 DB 설정이 충돌하지 않도록 우선순위를 정한다.
- 리포트 기준일은 `serviceDate` 또는 `returnConfirmedAt` 중 하나로 확정한다.
- CSV는 월간 요약과 운행 상세를 분리한다.
- 연락 기록에는 민감정보를 쓰지 않도록 안내한다.

## 사전설계

- [x] 기본요금, 최대 그룹 주민 수, 반올림 정책, 리포트 기준일 확정 대상을 확인한다.
- [x] 월간 리포트 지표 산식과 CSV 컬럼을 정한다.
- [x] 모바일에서 리포트 조회 범위를 정한다.

## 정합성

- [x] `master_plan.md`의 리포트 지표 정의와 일치한다.
- [x] PDF 자동화, 문자 자동 발송, 대량 CSV 가져오기를 구현하지 않는다.
- [x] 정산 산식은 T-006에서 재사용 가능해야 한다.

## 모델별 지시

### Product/PM

- 지표명이 운영자와 행정 보고 양쪽에서 이해 가능한지 확인한다.

### Data

- AppSetting seed, MonthlyReport 집계 기준, ContactLog 연결 기준을 설계한다.

### Backend

- 설정 조회, 리포트 산식, CSV 컬럼 계약을 구현한다.

### Frontend

- 모바일에서는 요약 지표 중심, 데스크톱에서는 표와 상세를 제공한다.

### QA

- 설정 변경에 따른 정산 산식과 리포트 산식 변화를 검증한다.

### Ops

- 운영 설정 변경 권한과 변경 기록을 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/server/settings`, `src/server/settlements`, `src/server/reports`
- API/Action: `getOperatingSettings`, `updateAppSetting`, `calculateDashboardSummary`, `calculateMonthlyReportSnapshot`, CSV contract
- DB/Migration: T-002 모델 사용
- UI/Route: `/admin/reports`
- AuditLog: CSV 내보내기, 설정 변경
- 설정값: `defaultFare`, `defaultResidentCount`, `maxGroupResidents`, `fareRoundingPolicy`, `mobileTokenTtlHours`, `reportDateBasis`, `villages`, `timeWindows`

## 완료 기준

- [x] 운영 기본값이 seed로 생성된다.
- [x] 정산 계산이 설정의 반올림 정책을 따른다.
- [x] 대시보드와 월간 리포트 지표 산식이 테스트 가능하게 분리된다.
- [x] CSV 컬럼과 개인정보 표시 기준이 문서화된다.
- [x] 연락 기록을 주요 대상에 연결할 수 있다.
- [x] 360px, 390px, 768px, 1280px 이상에서 리포트 요약이 깨지지 않는다.
- [x] 리포트 요약 지표가 큰 숫자, 명확한 제목, 충분한 대비로 표시된다.

## 검증 기록

- 명령: `corepack pnpm typecheck`, `corepack pnpm lint`, `prisma validate`, `node --check prisma\seed.mjs`, `corepack pnpm build`, `curl.exe -4 -I http://localhost:3000/admin/reports`
- 결과: 모두 통과, `/admin/reports` 200 OK, Next 빌드에서 `/admin/reports` 정적 생성 확인
- 수동 확인: headless Chrome 캡처 `t008-reports-360x900.png`, `t008-reports-390x900.png`, `t008-reports-768x1024.png`, `t008-reports-1280x900.png` 확인
- 남은 리스크: T-006에서 실제 DB 기반 정산 생성/잠금과 대시보드 실데이터 연결을 이어서 구현해야 한다.
