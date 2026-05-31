# T-045 상생기금 기록

## 메타

- Priority: P1
- Status: done
- Owner: TBD
- Depends on: T-006
- Area: finance, backend, frontend
- Work type: feature
- Target surface: admin-desktop, admin-mobile, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

상생기금 조성액과 지원 기록을 택시요금 정산과 분리해 관리하고 월간 리포트에 반영한다.

## 배경

상생기금은 택시요금 할인이나 주민 환급이 아니라 별도 사회공헌 출연금 또는 지원 기록으로 처리해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER
- 주요 화면: 정산 상세, 상생기금 기록, 월간 리포트
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- CommunityFund CONTRIBUTION 기록
- CommunityFund SUPPORT_RECORD 기록
- 그룹 또는 월 기준 연결
- 월간 리포트 집계
- 택시요금과 분리 표시

## 제외

- 외부 회계 시스템 연동
- 자동 입출금 처리
- 주민 요금 환급 처리

## 사전설계

- [x] 상생기금은 Settlement와 별도 회계로 표시함을 확인했다.
- [x] 월 기준과 그룹 기준 기록을 모두 허용함을 확인했다.
- [x] 금액 표시는 큰 숫자와 명확한 단위가 필요함을 확인했다.

## 정합성

- [x] `definitions.md`의 CommunityFund 필드와 일치한다.
- [x] 택시요금 차감으로 표시하지 않는다.
- [x] T-006 정산 산식과 충돌하지 않는다.

## 모델별 지시

### Product/PM

- 상생기금 용어가 할인이나 환급으로 오해되지 않는지 확인한다.

### Data

- CommunityFund의 fundType, month, groupId 관계를 확인한다.

### Backend

- 상생기금 생성, 수정, 월간 집계 action을 구현한다.

### Frontend

- 정산 금액과 상생기금 금액을 시각적으로 분리한다.

### QA

- 월별 합계, 그룹 연결, 권한, AuditLog를 검증한다.

### Ops

- 보고용 CSV와 월간 리포트 반영 기준을 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/server/funds/community-fund-service.ts`, `src/features/settlements/settlement-workspace.tsx`, `src/app/admin/reports/page.tsx`
- API/Action: `saveCommunityFundRecord`, `listCommunityFundRecords`, `getCommunityFundMonthlySummary`, `settlementAction`
- DB/Migration: CommunityFund 사용
- UI/Route: `/admin/settlements?tab=funds`, `/admin/reports`
- AuditLog: CREATE, UPDATE
- 설정값: 해당 없음

## 완료 기준

- [x] 상생기금 조성과 지원 기록을 저장할 수 있다.
- [x] 택시요금과 분리 표시된다.
- [x] 월간 리포트에 합산된다.
- [x] 권한과 AuditLog가 적용된다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령:
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `corepack.cmd pnpm build`
  - `npx.cmd tsx -e "... summarizeCommunityFunds ..."`
  - `npx.cmd tsx -e "... calculateMonthlyReportSnapshot ..."`
  - headless Chrome DevTools Protocol 렌더링 검증: `/admin/settlements?tab=funds` 390px, 1280px, `/admin/reports` 390px
- 결과:
  - 타입, 린트, 프로덕션 빌드 통과
  - 월 상생기금 조성액 30,000원과 지원 기록 12,000원이 분리 집계됨
  - 월간 리포트 계산은 `CONTRIBUTION` 30,000원만 `communityFundAmount`로 반영함
  - 정산 화면은 상생기금 탭에서 조성액, 지원 기록, 월 조회, 생성/수정 폼, 기존 기록 카드를 표시함
- 수동 확인:
  - `C:\tmp\together-t045-community-fund-qa\t045-settlements-funds-mobile-focused.png`
  - `C:\tmp\together-t045-community-fund-qa\t045-settlements-funds-desktop-focused.png`
  - `C:\tmp\together-t045-community-fund-qa\t045-reports-funds-mobile-focused.png`
- 남은 리스크:
  - 현재 셸에 `.env`, `DATABASE_URL`, 로컬 PostgreSQL 연결이 없어 인증 사용자 기반 DB E2E와 실제 AuditLog 영속성은 후속 DB 연결 티켓에서 검증한다.
