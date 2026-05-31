# T-046 월별 정산표

## 메타

- Priority: P1
- Status: done
- Owner: TBD
- Depends on: T-006
- Area: finance, report, frontend
- Work type: report
- Target surface: admin-desktop, admin-mobile, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

월별 운행 정산 내역을 표와 요약으로 조회하고, 주민 분담액, 앵커 지원금, 실제 요금, 영수증 상태를 확인할 수 있게 한다.

## 배경

정산은 개별 운행뿐 아니라 월별 검토가 필요하다. 운영자는 미정산, 영수증 누락, 지원금 합계를 빠르게 찾아야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER
- 주요 화면: 월별 정산표
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 월별 정산 목록
- 정산 완료/미완료 필터
- 영수증 상태 표시
- 총 택시요금, 주민 분담, 앵커 지원금 합계
- 모바일 요약 카드

## 제외

- 회계 전표 자동 생성
- PDF 자동화
- 외부 회계 시스템 연동

## 사전설계

- [x] 정산표는 Settlement를 기준으로 함을 확인했다.
- [x] 모바일에서는 상세 표보다 요약 카드가 적합함을 확인했다.
- [x] 월 기준은 T-008 reportDateBasis와 연결해야 함을 확인했다.

## 정합성

- [x] T-006 정산 산식과 일치한다.
- [x] T-008 리포트 기준일과 일치한다.
- [x] `design_style_guide.md`의 표/카드 전환 기준을 따른다.

## 모델별 지시

### Product/PM

- 월별 정산 검토에 필요한 핵심 컬럼을 확인한다.

### Data

- Settlement, TaxiReservation, FileAttachment 조회 관계를 확인한다.

### Backend

- 월별 정산 집계와 필터 action을 구현한다.

### Frontend

- 데스크톱 표와 모바일 카드형 요약을 구현한다.

### QA

- 월 경계, 미정산, 영수증 누락, 합계를 검증한다.

### Ops

- CSV 내보내기와 월간 리포트 연결 가능성을 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/server/settlements/settlement-service.ts`, `src/features/settlements/settlement-workspace.tsx`, `src/app/admin/settlements/page.tsx`, `src/app/globals.css`
- API/Action: `listMonthlySettlements`, `summarizeMonthlySettlementRows`
- DB/Migration: 해당 없음
- UI/Route: `/admin/settlements?tab=monthly`
- AuditLog: 조회는 해당 없음, 내보내기 시 T-055
- 설정값: reportDateBasis

## 완료 기준

- [x] 월별 정산표가 조회된다.
- [x] 합계와 필터가 정확하다.
- [x] 영수증 누락을 확인할 수 있다.
- [x] 모바일에서 요약 카드가 읽기 쉽다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령: `corepack.cmd pnpm typecheck`, `corepack.cmd pnpm lint`, `corepack.cmd pnpm build`, `npx.cmd tsx -e "..."`, Chrome DevTools Protocol rendered QA
- 결과: 통과. 월 기준 필터, 정산완료/미정산 필터, 영수증 상태 필터, 총 택시요금/주민 총 분담/앵커 지원금/상생기금 합계가 검증되었다.
- 수동 확인: `/admin/settlements?tab=monthly` 390px 모바일 카드와 1280px 데스크톱 표 렌더링 확인. 스크린샷: `C:\tmp\together-t046-monthly-settlement-qa\t046-monthly-settlement-mobile.png`, `C:\tmp\together-t046-monthly-settlement-qa\t046-monthly-settlement-mobile-cards.png`, `C:\tmp\together-t046-monthly-settlement-qa\t046-monthly-settlement-desktop.png`
- 남은 리스크: `.env`, `DATABASE_URL`, 로컬 PostgreSQL 연결이 없어 DB-backed 인증 E2E와 실제 데이터 마이그레이션 검증은 후속 DB 연결 티켓에서 수행한다.
