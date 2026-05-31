# T-057 행정 열람용 리포트 화면

## 메타

- Priority: P2
- Status: done
- Owner: Codex
- Depends on: T-052
- Area: report, auth, frontend
- Work type: feature
- Target surface: admin-desktop, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

행정 열람자가 월간 운영성과를 개인정보 최소 노출 기준으로 볼 수 있는 별도 리포트 화면을 제공한다.

## 배경

행정 열람은 운영자 화면과 목적이 다르다. 전체 개인정보와 세부 운영 메모를 노출하지 않고 성과 지표 중심으로 제공해야 한다.

## 사용자와 화면

- 주요 사용자: VIEWER, ANCHOR_ADMIN, SUPER_ADMIN
- 주요 화면: 행정 열람용 리포트
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 개인정보 최소화 리포트 화면
- 월별 핵심 지표
- 운행/정산/만족도 요약
- CSV 권한과 분리된 조회 권한
- VIEWER 전용 표시 범위

## 제외

- 공개 대시보드
- 외부 공유 링크
- 행정 시스템 연동

## 사전설계

- [x] 행정 열람은 내부 VIEWER 권한으로 제한해야 함을 확인했다.
- [x] 개인정보 최소화가 핵심임을 확인했다.
- [x] T-052 리포트 지표를 재사용해야 함을 확인했다.

## 정합성

- [x] `definitions.md`의 VIEWER 권한 원칙과 일치한다.
- [x] 공개 플로우로 확장하지 않는다.
- [x] `design_style_guide.md`의 리포트 표시 기준을 따른다.

## 모델별 지시

### Product/PM

- 행정 열람에 필요한 지표와 불필요한 개인정보를 구분한다.

### Data

- 개인 식별 컬럼 제거 또는 마스킹 기준을 정의한다.

### Backend

- VIEWER 전용 조회 projection을 구현한다.

### Frontend

- 성과 지표 중심의 밝고 명확한 화면을 구현한다.

### QA

- VIEWER 권한과 개인정보 미노출을 검증한다.

### Ops

- 행정 열람 계정 발급 절차를 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/server/reports/administrative-report-service.ts`, `src/app/admin/reports/administrative/page.tsx`, `src/app/admin/reports/page.tsx`, `src/app/globals.css`
- API/Action: `getMonthlyReport` 기반 `createAdministrativeReportProjection`
- DB/Migration: 해당 없음
- UI/Route: `/admin/reports/administrative?month=YYYY-MM`
- AuditLog: 해당 없음. CSV 다운로드와 AuditLog는 기존 CSV 기능으로 분리
- 설정값: `reportDateBasis`

## 완료 기준

- [x] VIEWER가 개인정보 최소화 리포트를 조회할 수 있다.
- [x] 상세 연락처와 민감 메모가 노출되지 않는다.
- [x] 월간 리포트 수치와 일치한다.
- [x] 모바일에서도 요약 지표가 읽기 쉽다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령:
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `corepack.cmd pnpm build`
  - `curl.exe -4 -I http://localhost:3000/admin/reports/administrative?month=2026-06`
  - Chrome CDP 렌더링 검증: `/admin/reports?month=2026-06`에서 행정 열람 링크 진입, `/admin/reports/administrative?month=2026-06` 데스크톱/모바일 캡처
- 결과:
  - typecheck/lint/build 통과
  - `/admin/reports/administrative?month=2026-06` HTTP 200
  - 행정 열람 화면에서 핵심 지표 8개와 개인정보 제외 규칙 4개 렌더링 확인
  - 전화번호 패턴, preview resident/linker 내부 ID, 외부 공유 링크 노출 없음
  - 모바일 390px에서 가로 넘침 없음
- 수동 확인:
  - `.verification/t057-admin-report-qa/t057-admin-report-desktop.png`
  - `.verification/t057-admin-report-qa/t057-admin-report-mobile-viewport.png`
- 잔여 리스크:
  - 현재 검증은 `DATABASE_URL` 없는 미리보기 데이터 기준이다. DB 연동 후 인증된 VIEWER 계정으로 실데이터 수치와 권한 범위를 재검증한다.
