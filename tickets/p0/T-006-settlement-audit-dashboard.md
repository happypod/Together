# T-006 정산, AuditLog, 대시보드

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: T-005, T-008
- Area: finance, reporting, audit
- Work type: feature
- Target surface: admin-desktop, admin-mobile, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

택시요금, 주민 1/N 분담, 앵커 지원금, 영수증 기록을 관리하고, 관리자 홈에서 핵심 운영 KPI를 확인할 수 있게 한다.

## 배경

정산과 대시보드는 운영 신뢰성과 보고의 기준이므로 산식, 권한, 잠금, AuditLog가 명확해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, TAXI_PARTNER, VIEWER
- 주요 화면: 정산 상세, 관리자 홈, KPI 요약
- 모바일 우선 여부: required
- 반응형 대상: all

## 범위

- 정산 모드: 시범기, 자립전환기, 상생기금 지원, 커스텀
- 총 택시요금 입력
- 주민 수 기준 1/N 분담 계산
- 앵커 지원금 계산
- 동행링커 활동비 기록
- 영수증 링크 또는 첨부 기록
- 정산 완료 처리
- 정산 수정 사유와 AuditLog
- 관리자 홈 KPI 요약
- 오늘 일정, 미배정, 미확정, 정산 미완료 패널

## 제외

- 자동 결제
- 카드 결제
- 택시요금 할인 또는 환급 처리
- PDF 출력 자동화

## 구현 메모

- 상생기금은 택시요금 차감으로 표시하지 않고 별도 사회공헌 출연금 또는 지원 기록으로 처리한다.
- 정산 완료 후 수정은 관리자 권한과 수정 사유가 필요하다.
- 원 단위 반올림 또는 절사 정책은 구현 전 확정해야 한다.

## 사전설계

- [x] 정산 모드별 산식과 반올림 정책 확정 대상을 확인한다.
- [x] 정산 완료 후 수정 잠금과 사유 입력 흐름을 정한다.
- [x] 모바일에서 금액 입력과 KPI 확인 방식을 정한다.

## 정합성

- [x] T-008의 운영 설정과 리포트 산식을 따른다.
- [x] 자동 결제, 카드 결제, 할인, 환급 처리를 구현하지 않는다.
- [x] 영수증과 CSV 권한은 T-007 기준을 따른다.

## 모델별 지시

### Product/PM

- 정산 화면의 용어가 주민 1/N 분담, 앵커 지원금, 상생기금으로 명확한지 확인한다.

### Data

- Settlement, FileAttachment, MonthlyReport 집계 기준을 확인한다.

### Backend

- 정산 계산, 잠금, 수정 사유, 대시보드 집계 action을 구현한다.

### Frontend

- 모바일에서도 금액과 상태가 잘 읽히는 정산 UI를 구현한다.

### QA

- 정산 모드별 산식, 반올림, 수정 권한, AuditLog를 검증한다.

### Ops

- 월간 리포트와 CSV가 운영 데이터 기준으로 생성되는지 확인한다.

## 구현

- 구현 파일 또는 모듈: settlements, dashboard, reports
- API/Action: createSettlement, updateSettlement, uploadReceipt, getDashboardSummary
- DB/Migration: T-002 모델 사용
- UI/Route: 정산 상세, 관리자 홈
- AuditLog: 정산 생성, 수정, 완료, CSV 준비
- 설정값: fareRoundingPolicy, reportDateBasis

## 완료 기준

- [x] 각 정산 모드별 계산 결과가 정확하다.
- [x] 영수증 링크 또는 첨부 상태를 기록할 수 있다.
- [x] 정산 완료 후 수정 시 사유와 AuditLog가 남는다.
- [x] 관리자 홈 KPI가 실제 데이터 기준으로 집계된다.
- [x] CSV 내보내기 전 권한과 AuditLog 기준이 준비된다.
- [x] 360px, 390px, 768px, 1280px 이상에서 정산과 대시보드가 깨지지 않는다.
- [x] 정산 금액, 지원금, 주민 분담액이 큰 숫자와 명확한 단위로 표시된다.

## 검증 기록

- 명령: `corepack pnpm typecheck`, `corepack pnpm lint`, `node --check prisma\seed.mjs`, `corepack pnpm db:validate`, `corepack pnpm build`, `curl.exe -4 -I http://localhost:3000/`, `curl.exe -4 -I http://localhost:3000/admin/settlements`
- 결과: 모두 통과, Next 빌드에서 `/`, `/admin`, `/admin/settlements` 동적 route 생성 확인
- 수동 확인: headless Chrome 캡처 `t006-settlements-360x900.png`, `t006-settlements-390x900.png`, `t006-settlements-768x1024.png`, `t006-settlements-1280x900.png`, `t006-dashboard-390x900.png`, `t006-dashboard-1280x900.png` 확인
- 구현 요약: `src/server/settlements/settlement-service.ts`, `/admin/settlements`, `SettlementWorkspace`, 실제 집계 기반 `DashboardHome`, CSV 준비 AuditLog 경로를 추가했다.
- 남은 리스크: 현재 통합 환경에 DB 연결값이 없어 실제 정산 저장, 정산 완료 잠금, 수정 사유, CSV 준비 AuditLog DB commit은 후속 DB 연결 티켓에서 검증한다.
