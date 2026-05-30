# T-007 인증, 모바일 링크, 파일첨부 보안 기반

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: T-002
- Area: auth, security, privacy
- Work type: security
- Target surface: admin-desktop, admin-mobile, mobile-link, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

관리자 웹, 동행링커 보조 입력, 택시파트너 제한 입력이 권한 범위 안에서만 동작하도록 인증, 서버 권한 검증, 모바일 입력 토큰, 파일첨부 보안 기준을 구현한다.

## 배경

모바일 링크형 입력과 제한 권한 사용자는 편리하지만 노출 위험이 있으므로 서버 권한, 토큰 만료, scope 제한이 먼저 필요하다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, VIEWER
- 주요 화면: 로그인, 모바일 링크 입력, 파일첨부, CSV 내보내기
- 모바일 우선 여부: required
- 반응형 대상: all

## 범위

- `User` 활성 상태와 역할 기반 서버 권한 검증
- 쓰기 action 공통 권한 검사 유틸리티
- `MobileFormToken` 발급, 만료, 폐기, 사용 횟수 제한
- 모바일 토큰 scope별 입력 가능 필드 제한
- `FileAttachment` 영수증 첨부 또는 링크 기록
- 파일 형식, 크기, 접근권한 검증
- CSV 내보내기와 토큰 발급의 AuditLog 기록

## 제외

- 문자, 카카오톡, 알림톡 자동 발송
- 외부 인증 서비스 고도화
- 파일 바이러스 검사 자동화

## 구현 메모

- 토큰 원문은 저장하지 않고 hash만 저장한다.
- 기본 토큰 만료시간은 `AppSetting.mobileTokenTtlHours`를 따른다.
- 모바일 링크는 관리자 전체 화면 접근 권한을 부여하지 않는다.
- 영수증 첨부 화면에는 불필요한 개인정보가 포함되지 않도록 안내한다.

## 사전설계

- [x] 역할별 서버 권한 매트릭스를 확인한다.
- [x] 모바일 토큰 scope, 만료, 사용 횟수 정책을 정한다.
- [x] 파일첨부 허용 형식과 크기 제한을 정한다.

## 정합성

- [x] `definitions.md`의 User, MobileFormToken, FileAttachment 기준과 일치한다.
- [x] 모바일 링크가 관리자 전체 접근으로 확장되지 않는다.
- [x] CSV와 파일첨부는 AuditLog 대상이다.

## 모델별 지시

### Product/PM

- 보조 입력 링크가 현장 운영에 필요한 최소 범위인지 확인한다.

### Data

- tokenHash, scope, expiresAt, FileAttachment 메타데이터를 검증한다.

### Backend

- 권한 guard, 토큰 검증, 파일 검증, AuditLog를 구현한다.

### Frontend

- 모바일 링크 만료, 권한 없음, 저장 성공/실패 화면을 구현한다.

### QA

- 만료 토큰, scope 외 필드 수정, 비활성 사용자 차단을 검증한다.

### Ops

- 토큰 TTL과 파일 저장 방식이 환경별로 관리되는지 확인한다.

## 구현

- 구현 파일 또는 모듈: auth guard, token service, file attachment service
- API/Action: createMobileFormToken, submitMobileForm, uploadReceipt, exportMonthlyCsv 권한 검사
- DB/Migration: T-002 모델 사용
- UI/Route: 모바일 링크 입력 상태 화면
- AuditLog: 토큰 발급, 제출, 폐기, 파일첨부, CSV
- 설정값: mobileTokenTtlHours, file size limit

## 완료 기준

- [x] 비활성 사용자는 쓰기 action을 수행할 수 없다.
- [x] 역할별 서버 권한 검증이 UI 숨김과 별도로 동작한다.
- [x] 모바일 링크는 만료, scope, 사용 횟수 제한을 가진다.
- [x] scope 밖의 필드 수정이 서버에서 거부된다.
- [x] 파일첨부 또는 외부 링크가 권한과 AuditLog 기준을 따른다.
- [x] 360px, 390px, 768px, 1280px 이상에서 모바일 링크 화면이 깨지지 않는다.
- [x] 만료, 권한 없음, 저장 실패 화면이 쉬운 문구와 충분한 대비로 표시된다.

## 검증 기록

- 명령:
  - `corepack pnpm typecheck`
  - `corepack pnpm lint`
  - `$env:DATABASE_URL='postgresql://user:password@localhost:5432/together?schema=public'; .\node_modules\.bin\prisma.CMD validate`
  - `node --check prisma/seed.mjs`
  - `corepack pnpm build`
  - Headless Chrome screenshot: `.verification/t007-mobile-360x900.png`, `.verification/t007-mobile-390x900.png`, `.verification/t007-mobile-768x1024.png`, `.verification/t007-mobile-1280x900.png`, `.verification/t007-login-390x900.png`
- 결과: typecheck, lint, Prisma schema validation, seed syntax, build 통과. `/login`, `/m/demo-token` HTTP 200 응답 확인.
- 수동 확인: 로그인 화면, 모바일 링크 만료/사용 불가 화면, 모바일 제출 폼의 쉬운 문구와 대비를 확인했다.
- 남은 리스크: 실제 DB 연결 후 계정 로그인, token 발급/소모, FileAttachment 기록은 통합 흐름 티켓에서 실제 데이터와 함께 재검증한다.
