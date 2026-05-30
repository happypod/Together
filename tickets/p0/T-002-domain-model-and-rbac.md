# T-002 도메인 모델과 권한 기반

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: T-001
- Area: data, auth
- Work type: model
- Target surface: db, api
- 디자인 기준: not_applicable
- Updated at: 2026-05-30

## 목표

MVP의 핵심 도메인 모델, 상태값, 권한 역할, AuditLog 기반을 구현해 이후 기능이 같은 규칙을 따르게 한다.

## 배경

주요 기능이 모두 같은 도메인 모델, 상태값, 권한, 감사로그 규칙을 공유해야 이후 구현 정합성이 유지된다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, VIEWER
- 주요 화면: DB/API 기반 작업, 화면 직접 구현 없음
- 모바일 우선 여부: not_applicable
- 반응형 대상: not_applicable

## 범위

- `Resident`, `MobilityRequest`, `MobilityGroup`, `MobilityGroupMember`
- `Linker`, `TaxiReservation`, `TripLog`, `Settlement`
- `SatisfactionSurvey`, `IncidentReport`, `CommunityFund`, `MonthlyReport`, `AuditLog`
- `User`, `FileAttachment`, `MobileFormToken`, `AppSetting`, `ContactLog`
- 이동 목적, 기본 상태, 취소 상태, 예외 상태 enum
- 역할 enum과 권한 매트릭스
- 정산 모드, 반올림 정책, 감사로그 action, 모바일 토큰 scope enum
- AuditLog 쓰기 유틸리티 또는 서비스
- Seed 데이터 초안

## 제외

- 전체 화면 구현
- 실제 외부 인증 서비스 연동
- 외부 API 연동

## 구현 메모

- 연락처와 개인정보는 목록 응답에서 마스킹할 수 있도록 서버 유틸리티를 준비한다.
- 상태 변경 API는 허용된 전이를 확인해야 한다.
- 예외 상태와 취소 상태는 사유 입력을 강제한다.

## 사전설계

- [x] `definitions.md`의 모델, enum, 상태값을 확정한다.
- [x] User, AuditLog, MobileFormToken, FileAttachment, AppSetting 포함 여부를 확인한다.
- [x] 개인정보 마스킹과 서버 권한 검증 범위를 정한다.

## 정합성

- [x] `master_plan.md`의 핵심 엔티티 순서와 일치한다.
- [x] 권한 매트릭스와 enum 표시명이 `definitions.md`와 일치한다.
- [x] 추후 T-003~T-008 구현에 필요한 관계가 빠지지 않는다.

## 모델별 지시

### Product/PM

- 운영 용어와 화면 표시명이 설계 문서와 맞는지 확인한다.

### Data

- 모델, 관계, enum, 인덱스, seed, migration을 설계한다.

### Backend

- 권한 검사와 AuditLog 작성 인터페이스를 정의한다.

### Frontend

- 상태 표시명, 목적 표시명, 권한별 UI 숨김에 필요한 상수를 사용할 수 있게 한다.

### QA

- schema validation, enum 정합성, seed 기반 최소 흐름을 검증한다.

### Ops

- DB 연결과 migration 실행 방식을 문서화한다.

## 구현

- 구현 파일 또는 모듈: schema, constants, auth guard, audit utility
- API/Action: writeAuditLog internal interface
- DB/Migration: initial domain migration
- UI/Route: 해당 없음
- AuditLog: 모델과 작성 유틸리티
- 설정값: seed 기본값

## 완료 기준

- [x] Prisma schema 또는 동등한 데이터 모델이 검증된다.
- [x] 상태값과 권한 상수가 `definitions.md`와 일치한다.
- [x] 주요 쓰기 작업에 AuditLog를 남길 수 있는 인터페이스가 있다.
- [x] Seed 데이터로 최소 운영 흐름을 확인할 수 있다.

## 검증 기록

- 명령:
  - `$env:DATABASE_URL='postgresql://user:password@localhost:5432/together?schema=public'; corepack pnpm db:validate`
  - `$env:DATABASE_URL='postgresql://user:password@localhost:5432/together?schema=public'; corepack pnpm db:generate`
  - `node --check prisma/seed.mjs`
  - `corepack pnpm lint`
  - `corepack pnpm build`
- 결과: Prisma schema valid, Prisma Client generated, seed syntax valid, lint/build 통과.
- 수동 확인: `definitions.md`의 핵심 모델, enum, 권한 원칙이 `prisma/schema.prisma`, `src/domain/definitions.ts`, `src/domain/auth/permissions.ts`에 반영되었다.
- 남은 리스크: 실제 DB 접속과 seed 실행은 운영 DB 연결 문자열 확정 후 수행한다. 인증 세션과 모바일 토큰 서비스의 실제 검증 로직은 T-007에서 구현한다.
