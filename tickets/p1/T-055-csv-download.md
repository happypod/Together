# T-055 CSV 다운로드

## 메타

- Priority: P1
- Status: done
- Owner: Codex
- Depends on: T-052
- Area: report, security, backend
- Work type: feature
- Target surface: admin-desktop, admin-mobile, report, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

월간 리포트 요약 CSV와 운행 상세 CSV를 권한과 개인정보 기준에 맞게 내보낼 수 있게 한다.

## 배경

CSV는 행정 보고와 내부 검토에 필요하지만 개인정보 유출 위험이 있으므로 권한, 사유, AuditLog가 필수다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN 다운로드 가능. VIEWER는 리포트 조회만 가능
- 주요 화면: 월간 리포트, CSV 내보내기 확인
- 모바일 우선 여부: optional
- 반응형 대상: desktop
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 월간 요약 CSV
- 운행 상세 CSV
- 권한 확인
- 다운로드 사유 입력
- 개인정보 마스킹 또는 전체 표시 정책
- AuditLog 기록

## 제외

- 대량 CSV 가져오기
- 스프레드시트 자동 동기화
- PDF 자동화

## 사전설계

- [x] CSV 내보내기는 권한과 AuditLog가 필수임을 확인했다.
- [x] 요약 CSV와 상세 CSV를 분리해야 함을 확인했다.
- [x] 개인정보 표시 기준이 권한별로 달라야 함을 확인했다.

## 정합성

- [x] T-052 월간 리포트 이후 실행한다.
- [x] `master_plan.md`의 CSV 개인정보 기준과 일치한다.
- [x] `definitions.md`의 AuditLog action EXPORT_CSV를 사용한다.

## 모델별 지시

### Product/PM

- CSV 컬럼이 보고와 운영 검토에 충분한지 확인한다.

### Data

- 컬럼 계약, 마스킹 여부, 월 기준을 정의한다.

### Backend

- exportMonthlyCsv 권한, 사유, AuditLog, CSV 생성 로직을 구현한다.

### Frontend

- 다운로드 전 확인과 사유 입력 UI를 구현한다.

### QA

- 권한, 사유 누락, 마스킹, AuditLog를 검증한다.

### Ops

- CSV를 백업 수단으로 안내하지 않도록 문구를 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/server/reports/monthly-csv-export-service.ts`, `src/app/admin/reports/export/route.ts`, `src/app/admin/reports/page.tsx`, `src/app/globals.css`, `src/domain/auth/rbac-policy.ts`, `scripts/verify-rbac-access.ts`
- API/Action: `exportMonthlyCsv`, `POST /admin/reports/export`
- DB/Migration: 해당 없음
- UI/Route: `/admin/reports` CSV 다운로드 카드와 컬럼 계약표
- AuditLog: EXPORT_CSV
- 설정값: reportDateBasis, CSV privacyMode(`minimum`, `masked`, `full`)

## 완료 기준

- [x] 요약 CSV와 상세 CSV가 생성된다.
- [x] 권한 없는 사용자는 다운로드할 수 없다.
- [x] 다운로드 사유가 없으면 실행되지 않는다.
- [x] AuditLog가 기록된다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령: `npx.cmd tsx scripts/verify-rbac-access.ts`, `npx.cmd tsx -e "...createPreviewMonthlyCsvExport..."`, `npx.cmd tsx -e "...exportMonthlyCsv guards..."`, `corepack.cmd pnpm typecheck`, `corepack.cmd pnpm lint`, `corepack.cmd pnpm build`, `curl.exe -4 -i http://localhost:3000/admin/reports/export`, `curl.exe -4 -i -X POST -d "month=2026-06&kind=summary&reason=route-test" http://localhost:3000/admin/reports/export`
- 결과: RBAC, CSV 미리보기, 권한 차단, 타입체크, 린트, 빌드 통과. `GET /admin/reports/export`는 405, 미로그인 `POST`는 401로 차단된다.
- 수동 확인: `.verification/t055-csv-qa/t055-csv-mobile-long.png`, `.verification/t055-csv-qa/t055-csv-desktop-long.png`, CSV 섹션 crop 이미지에서 모바일 1열과 데스크톱 2열 배치, 다운로드 사유, 개인정보 범위, 권한 안내 문구를 확인했다.
- 남은 리스크: 현재 통합 셸에 `DATABASE_URL`이 없어 실제 DB 기반 CSV 다운로드, AuditLog DB commit, 인증 세션 다운로드 E2E는 후속 DB 연결 티켓에서 검증한다. `corepack.cmd pnpm db:validate`도 동일한 이유로 실패했다.
