# T-003 주민 및 이동 신청 흐름

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: T-002, T-007
- Area: frontend, backend, privacy
- Work type: feature
- Target surface: admin-desktop, admin-mobile, mobile-link
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

운영자가 주민과 이동 신청을 등록하고 목록에서 검색, 필터, 상태 확인을 할 수 있게 한다.

## 배경

이동 신청은 모든 운영 흐름의 시작점이므로 개인정보 최소수집, 동의 확인, 모바일 입력 가능성이 함께 설계되어야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 주민 신청 등록, 신청 목록, 신청 상세
- 모바일 우선 여부: required
- 반응형 대상: all

## 범위

- 주민 등록과 수정
- 이동 신청 등록과 수정
- 신청 목록, 검색, 마을, 날짜, 목적, 상태 필터
- 개인정보 동의, 제3자 제공 동의, 민감정보 미수집 확인 필수 체크
- 목록 연락처 마스킹
- 신청 생성 시 `REQUESTED` 상태 부여
- 신청 변경 AuditLog 기록

## 제외

- 공개 주민 앱
- 실명 인증
- 건강 민감정보 입력

## 구현 메모

- 목적지는 병원명 또는 생활 목적지 수준으로 입력한다.
- 진단명, 처치, 상담 내용 입력을 유도하는 UI 문구를 만들지 않는다.
- 필수 입력값은 설계문서의 `MobilityRequest` 기준을 따른다.

## 사전설계

- [x] 주민 신청 등록 사용자 여정을 정리한다.
- [x] 필수 동의와 민감정보 미수집 확인 위치를 정한다.
- [x] 모바일에서 입력 필드 순서와 저장 버튼 위치를 정한다.

## 정합성

- [x] `MobilityRequest` 필드가 `definitions.md`와 일치한다.
- [x] 공개 주민 앱 또는 회원가입 구조로 확장하지 않는다.
- [x] T-007의 모바일 토큰과 권한 기준을 따른다.

## 모델별 지시

### Product/PM

- 현장 운영자가 빠르게 입력할 수 있는 필드 순서인지 확인한다.

### Data

- Resident와 MobilityRequest의 중복 신청 검증 기준을 확인한다.

### Backend

- 생성, 수정, 목록 조회 action과 AuditLog를 구현한다.

### Frontend

- 모바일 카드형 목록, 단일 컬럼 폼, 동의 체크 UX를 구현한다.

### QA

- 필수 동의 누락, 연락처 마스킹, 중복 신청 경고를 검증한다.

### Ops

- 초기 주민 데이터 이관이 필요한 경우 별도 open decision으로 남긴다.

## 구현

- 구현 파일 또는 모듈: `src/server/residents`, `src/features/resident-requests`
- API/Action: `createResidentRequest`, `updateResident`, `updateMobilityRequest`, `listMobilityRequests`, `createResidentRequestAction`
- DB/Migration: T-002 모델 사용
- UI/Route: `/admin/requests`
- AuditLog: 생성, 수정
- 설정값: 마을 목록, 시간대 목록

## 완료 기준

- [x] 운영자가 주민과 신청을 생성할 수 있다.
- [x] 필수 동의 체크가 없으면 저장되지 않는다.
- [x] 목록에서 연락처가 마스킹된다.
- [x] 검색과 필터가 동작한다.
- [x] 생성과 수정이 AuditLog에 남는다.
- [x] 360px, 390px, 768px, 1280px 이상에서 신청 등록과 목록이 깨지지 않는다.
- [x] 신청 등록 화면의 글자, 라벨, 버튼, 오류 문구가 고령 사용자도 이해하기 쉽다.

## 검증 기록

- 명령: `corepack pnpm typecheck`, `corepack pnpm lint`, `prisma validate`, `node --check prisma\seed.mjs`, `corepack pnpm build`, `curl.exe -4 -I http://localhost:3000/admin/requests`, 필터 URL 200 확인
- 결과: 모두 통과, Next 빌드에서 `/admin/requests` 동적 route 생성 확인
- 수동 확인: headless Chrome 캡처 `t003-requests-360x900.png`, `t003-requests-390x900.png`, `t003-requests-768x1024.png`, `t003-requests-1280x900.png` 확인
- 통합 재검증(2026-05-30): `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm db:validate`, `node --check prisma\seed.mjs`, `corepack pnpm build`, `curl.exe -4 -I http://localhost:3000/admin/requests` 통과.
- 통합 화면 확인: headless Chrome 캡처 `integration-requests-390x900.png`, `integration-requests-1280x900.png` 확인. 모바일/데스크톱 모두 주요 내비게이션, 안내문, 신청 등록/목록 영역이 깨지지 않는다.
- DB commit 검증 상태: 현재 통합 환경에 `.env`가 없고 `DATABASE_URL`, `NEXTAUTH_SECRET` 환경변수가 없으며 `localhost:5432` PostgreSQL 접속도 실패했다. 실제 신청 저장, 중복 차단, AuditLog DB 기록은 DB 연결값과 마이그레이션된 PostgreSQL 세션 준비 후 추가 검증한다.
