# P2-004 MOU 관리 확장

## 메타

- Priority: P2
- Status: done
- Owner: Codex
- Depends on: MVP
- Area: product, data, frontend
- Work type: feature
- Target surface: admin-desktop, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

관련 기관 MOU 현황을 기록하고 월간 리포트의 MOU 수 지표에 반영할 수 있게 확장한다.

## 배경

MOU 관리는 이동 운영의 핵심 P0 흐름은 아니지만 사업 성과 보고에 필요한 확장 지표다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER
- 주요 화면: MOU 관리, 월간 리포트
- 모바일 우선 여부: yes
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- MOU 기관명, 체결일, 상태 기록
- 월간 MOU 수 집계
- 관련 문서 링크 또는 첨부 검토
- VIEWER 조회 범위

## 제외

- 전자계약
- 문서 결재
- 외부 기관 포털 연동

## 사전설계

- [x] MOU 관리는 P2 확장임을 확인했다.
- [x] MonthlyReport의 mouCount와 연결됨을 확인했다.
- [x] 문서 첨부가 필요하면 FileAttachment를 재사용할 수 있음을 확인했다.

## 정합성

- [x] MVP 핵심 이동 운영과 분리한다.
- [x] `FileAttachment` 공통 모델과 충돌하지 않는다.
- [x] `design_style_guide.md`의 리포트 표시 기준을 따른다.

## 모델별 지시

### Product/PM

- MOU 관리에 필요한 최소 필드와 상태를 확정한다.
- MVP 확장 범위는 기관명, 기관 유형, 체결일, 운영 기간, 상태, 문서 링크/첨부 기록, 협력 범위 요약으로 제한한다.

### Data

- `MouRecord` 모델과 `MouStatus` enum을 추가한다.
- 월간 리포트의 `mouCount`는 `MouRecord.signedAt`의 해당 월 체결 건수만 집계한다.

### Backend

- `saveMouRecord`, `listMouRecords`, `listReportMouRecords`를 구현한다.
- 저장은 SUPER_ADMIN, ANCHOR_ADMIN만 허용하고, VIEWER는 조회 범위를 제한한다.
- CREATE, UPDATE, UPLOAD_FILE AuditLog 경로를 연결한다.

### Frontend

- `/admin/mou-records`에서 월/상태 필터, 요약 카드, 등록 폼, 기관별 카드 목록을 제공한다.
- 모바일에서는 큰 입력, 단일 열 카드, 하단 FontAwesome 네비와 충돌하지 않는 레이아웃을 유지한다.

### QA

- 월간 집계, 파일첨부 기록, 권한, VIEWER projection, 개인정보 입력 제한을 검증한다.
- Browser 플러그인 실패 시 Chrome CDP 대체 경로로 데스크톱/모바일 화면을 검증한다.

### Ops

- 실제 문서 파일 저장소와 DB 연결은 후속 DB 통합 검증에서 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/server/mous/mou-record-service.ts`, `src/features/mous/mou-record-workspace.tsx`
- API/Action: `mouRecordAction`, `saveMouRecord`, `listMouRecords`, `listReportMouRecords`
- DB/Migration: `MouRecord`, `MouStatus`, `prisma/migrations/20260531000300_mou_record/migration.sql`
- UI/Route: `/admin/mou-records`, `/admin/reports`
- AuditLog: CREATE, UPDATE, UPLOAD_FILE
- 설정값: 파일 보관 정책은 공통 `FileAttachment` 정책을 따른다.

## 완료 기준

- [x] MOU 기록을 생성하고 조회할 수 있다.
- [x] 월간 리포트에 MOU 수가 반영된다.
- [x] 문서 첨부 시 권한과 개인정보 기준을 따른다.
- [x] VIEWER 조회 범위가 제한된다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령:
  - `corepack.cmd pnpm db:generate`
  - `npx.cmd tsx scripts\verify-mou-records.ts`
  - `npx.cmd tsx scripts\verify-rbac-access.ts`
  - `npx.cmd tsx scripts\verify-forbidden-operational-language.ts`
  - `npx.cmd tsx scripts\verify-p0-acceptance.ts`
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/together'; corepack.cmd pnpm db:validate`
  - `corepack.cmd pnpm build`
  - `curl.exe -4 -I http://localhost:3000/admin/mou-records`
- 결과:
  - P2-004 전용 검증, RBAC, 금칙어, P0 수락, 타입체크, lint, Prisma validate, production build 통과.
  - `/admin/mou-records` HTTP 200 확인.
  - 월간 리포트의 `mouCount`가 2026-06 preview 기준 3건으로 계산됨.
- 수동 확인:
  - Browser 플러그인은 Windows sandbox setup refresh 오류로 실패했다.
  - Chrome CDP 대체 검증에서 1440px 데스크톱, ACTIVE 필터 상호작용, 390px 모바일 화면을 확인했다.
  - 스크린샷: `.verification/p2-004-mou-qa/desktop-mou-records.png`, `.verification/p2-004-mou-qa/desktop-filter-active.png`, `.verification/p2-004-mou-qa/mobile-mou-records.png`
- 남은 리스크:
  - 실제 DB `MouRecord` migration 적용, 인증 사용자 저장, AuditLog/FileAttachment commit 검증은 `DATABASE_URL` 제공 후 후속 DB 통합 검증에서 진행한다.
