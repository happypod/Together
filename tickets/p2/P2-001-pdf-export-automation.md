# P2-001 PDF 출력 자동화

## 메타

- Priority: P2
- Status: done
- Owner: Codex
- Depends on: T-056
- Area: report, ops
- Work type: feature
- Target surface: admin-desktop, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

인쇄용 월간보고서를 PDF 파일로 자동 생성하거나 다운로드할 수 있게 한다.

## 배경

PDF 자동화는 1차 MVP 제외 범위였으며, 인쇄용 보고서가 안정화된 뒤 검토해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN
- 주요 화면: 월간보고서 PDF 다운로드
- 모바일 우선 여부: not_applicable
- 반응형 대상: desktop
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- PDF 생성 방식 검토
- 월간보고서 PDF 다운로드
- 개인정보 최소화
- 생성 실패 오류 처리
- 권한과 AuditLog 검토

## 제외

- 전자결재
- 외부 문서 시스템 연동
- 자동 이메일 발송

## 사전설계

- [x] PDF 자동화는 P2임을 확인했다.
- [x] T-056 인쇄용 보고서 안정화 이후 진행해야 함을 확인했다.
- [x] 개인정보 최소화 기준이 필요함을 확인했다.

## 정합성

- [x] MVP P0/P1 범위에 섞지 않는다.
- [x] `design_style_guide.md`의 보고서 가독성 기준을 따른다.
- [x] CSV와 PDF의 용도 차이를 명확히 한다.

## 모델별 지시

### Product/PM

- PDF가 실제 보고 절차에 필요한지 확인한다.

### Data

- PDF에 포함할 지표와 제외할 개인정보를 정의한다.

### Backend

- PDF 생성 런타임과 실패 처리 방식을 설계한다.

### Frontend

- 다운로드 버튼과 생성 상태를 명확히 표시한다.

### QA

- PDF 내용, 페이지 나눔, 권한, 실패 케이스를 검증한다.

### Ops

- 배포 환경에서 PDF 생성 의존성이 동작하는지 확인한다.

## 구현

- 구현 파일 또는 모듈:
  - `src/server/reports/monthly-pdf-export-service.ts`
  - `src/app/admin/reports/pdf/route.ts`
  - `src/server/reports/export-audit.ts`
  - `src/app/admin/reports/page.tsx`
  - `src/lib/fa-icons.ts`
- API/Action: `exportMonthlyPdf`, `POST /admin/reports/pdf`
- DB/Migration: `prisma/migrations/20260531000100_pdf_export_audit_action/migration.sql`
- UI/Route: 월간보고서 화면의 사유 입력형 PDF 다운로드 카드
- AuditLog: `PDF_EXPORT`
- 설정값: `reportDateBasis`

## 완료 기준

- [x] PDF가 생성된다.
- [x] 개인정보 최소화 기준을 따른다.
- [x] 권한 없는 사용자는 다운로드할 수 없다.
- [x] 생성 실패 시 쉬운 오류가 표시된다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령:
  - `corepack.cmd pnpm db:generate`
  - `npx.cmd tsx scripts\verify-rbac-access.ts`
  - `npx.cmd tsx -e "...createPreviewMonthlyPdfExport..."`
  - `npx.cmd tsx -e "...exportMonthlyPdf VIEWER guard..."`
  - `curl.exe -4 -I http://localhost:3000/admin/reports/pdf`
  - `curl.exe -4 -i -X POST -d "month=2026-06&reason=route-test" http://localhost:3000/admin/reports/pdf`
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/together'; corepack.cmd pnpm db:validate`
  - `corepack.cmd pnpm build`
- 결과:
  - 미리보기 PDF는 `%PDF-1.4`, `application/pdf`, `/UniKS-UCS2-H` 기반으로 생성된다.
  - 미리보기 PDF 문자열에서 전화번호 패턴은 검출되지 않았다.
  - `GET/HEAD /admin/reports/pdf`는 405와 `Allow: POST`를 반환한다.
  - 비로그인 `POST /admin/reports/pdf`는 401을 반환한다.
  - VIEWER 역할의 `exportMonthlyPdf` 호출은 `AuthorizationError`로 거부된다.
  - typecheck, lint, schema validate, production build 통과.
- 수동 확인:
  - Chrome CDP로 `/admin/reports?month=2026-06`의 PDF 다운로드 카드를 1280px, 390px에서 확인했다.
  - Chrome PDF 뷰어로 `.verification/p2-001-pdf-qa/preview-monthly-report.pdf` 렌더링을 확인했다.
- 남은 리스크:
  - 실제 DB 연결과 인증 세션에서의 `PDF_EXPORT` AuditLog commit은 `DATABASE_URL` 준비 후 재검증한다.
  - PDF는 경량 서버 생성 방식으로 구현했으며, 전자결재/외부 문서시스템/자동 이메일 발송은 제외 범위다.
