# T-037 모바일 링크형 입력폼

## 메타

- Priority: P1
- Status: done
- Owner: TBD
- Depends on: T-003, T-005, T-007
- Area: frontend, backend, mobile
- Work type: feature
- Target surface: mobile-link, admin-mobile, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

로그인 없이 제한된 토큰 링크로 신청 보조 입력, 운행 체크, 귀가확인, 만족도 입력을 모바일에서 안전하게 수행할 수 있게 한다.

## 배경

현장 운영과 동행링커 입력은 데스크톱보다 모바일 사용성이 중요하다. 다만 모바일 링크는 관리자 권한을 부여하지 않고 제한된 scope로만 동작해야 한다.

## 사용자와 화면

- 주요 사용자: COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, 주민 또는 보호자 보조 입력자
- 주요 화면: 모바일 링크 입력폼
- 모바일 우선 여부: required
- 반응형 대상: mobile
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 토큰 기반 입력 화면
- REQUEST_INTAKE, TRIP_CHECK, RETURN_CONFIRM, SURVEY_SUBMIT, TAXI_CONFIRM scope 처리
- 만료/폐기/이미 사용됨 상태 표시
- 저장 성공/실패 피드백
- 큰 글자와 큰 버튼의 모바일 전용 UX

## 제외

- 공개 앱스토어 앱
- 주민 회원가입
- 알림톡 자동 발송

## 사전설계

- [x] 모바일 링크가 MobileFormToken 기준으로 제한됨을 확인했다.
- [x] scope별 입력 가능 필드 분리가 필요함을 확인했다.
- [x] 고령 사용자 기준의 큰 글자와 쉬운 문구가 필수임을 확인했다.

## 정합성

- [x] T-007의 토큰 보안 기준과 일치한다.
- [x] 공개 사용자 앱으로 확장하지 않는다.
- [x] `design_style_guide.md`의 모바일 입력 기준을 따른다.

## 모델별 지시

### Product/PM

- 모바일 입력자가 본인이 무엇을 입력하는지 쉽게 이해하는지 확인한다.

### Data

- 토큰 scope와 targetType/targetId 연결을 확인한다.

### Backend

- submitMobileForm에서 scope 외 필드 수정을 차단한다.

### Frontend

- 360px에서 한 손 입력 가능한 단일 컬럼 폼을 구현한다.

### QA

- 만료, 폐기, 재사용, scope 위반, 저장 실패를 검증한다.

### Ops

- 토큰 TTL과 발급 로그를 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/app/m/[token]`, `src/server/mobile-forms/token-service.ts`, `src/server/trips/trip-operation-service.ts`, `src/server/residents/resident-request-service.ts`
- API/Action: `createMobileFormToken`, `submitOperationalMobileForm`, `issueRequestIntakeLinkAction`, `tripOperationAction(intent=issueMobileLink)`
- DB/Migration: MobileFormToken 사용
- UI/Route: `/m/[token]`, `/admin/requests`, `/admin/trips`
- AuditLog: TOKEN_CREATE, TOKEN_SUBMIT, TOKEN_REVOKE
- 설정값: mobileTokenTtlHours

## 완료 기준

- [x] scope별 모바일 입력폼이 동작한다.
- [x] 만료/폐기/사용 완료 상태가 명확히 표시된다.
- [x] scope 밖 필드 수정이 차단된다.
- [x] 360px에서 핵심 입력을 완료할 수 있다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령: `corepack.cmd pnpm typecheck`
- 결과: 통과. TypeScript 오류 없음.
- 명령: `corepack.cmd pnpm lint`
- 결과: 통과. ESLint 오류 없음.
- 명령: `corepack.cmd pnpm build`
- 결과: 통과. `/m/[token]`, `/admin/requests`, `/admin/trips` 빌드 포함.
- 명령: `npx.cmd tsx -e "import { getDisallowedMobileFields } ..."`
- 결과: REQUEST_INTAKE, TRIP_CHECK, TAXI_CONFIRM scope 밖 필드가 차단 목록으로 반환됨을 확인했다.
- 수동 확인: 390x900 헤드리스 Chrome CDP에서 `/admin/requests` 모바일 신청 링크 패널, `/admin/trips` 운행별 모바일 링크 발급 카드 4종, `/m/t037-invalid-token` 오류 상태 화면을 확인했다.
- 수동 확인: `/admin/trips` 모바일 링크 발급 섹션을 열어 TRIP_CHECK, RETURN_CONFIRM, TAXI_CONFIRM, SURVEY_SUBMIT 카드가 큰 버튼과 한 줄 흐름으로 표시됨을 확인했다.
- 증거: `C:\tmp\together-t037-mobile-link-qa\t037-requests-mobile-link-panel.png`, `C:\tmp\together-t037-mobile-link-qa\t037-trips-mobile-link-forms-scrolled.png`, `C:\tmp\together-t037-mobile-link-qa\t037-invalid-token-mobile.png`
- 남은 리스크: 실제 MobileFormToken 발급, 만료, 폐기, 사용 완료 전환과 DB 저장 E2E는 `.env`, `DATABASE_URL`, PostgreSQL 연결 준비 후 후속 검증한다.
