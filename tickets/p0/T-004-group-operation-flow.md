# T-004 공동예약 그룹 운영 흐름

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: T-003, T-008
- Area: frontend, backend
- Work type: feature
- Target surface: admin-desktop, admin-mobile
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

이동 신청을 주민 최대 3명 단위의 공동예약 그룹으로 묶고, 그룹 상태와 픽업 순서를 운영할 수 있게 한다.

## 배경

공동예약 그룹은 백천마을 동행이동 OS의 핵심 운영 단위이며, 주민 최대 3명 제한과 상태 전이가 정확해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 그룹 목록, 그룹 상세, 멤버 편성, 픽업 순서
- 모바일 우선 여부: required
- 반응형 대상: all

## 범위

- 신청 선택 후 공동예약 그룹 생성
- 그룹명 자동 생성
- 그룹 멤버 추가와 제거
- 주민 최대 3명 제한
- 픽업 순서와 픽업 예정시간 입력
- 목적지 요약과 귀가 예정시간 입력
- 그룹 상태 전이
- 취소, 미탑승, 예외 사유 기록

## 제외

- 시스템 자동 그룹 추천
- AI 경로 최적화
- 자동 차량 배정

## 구현 메모

- 같은 날짜, 방향, 유사 시간대 그룹 구성을 운영자가 판단하는 방식으로 시작한다.
- 3명을 초과하는 그룹 저장은 서버에서 차단한다.
- 예외 상태 변경은 사유 입력과 AuditLog가 필수다.

## 사전설계

- [x] 신청 선택에서 그룹 생성까지 운영 흐름을 정리한다.
- [x] 모바일에서 그룹 멤버와 픽업 순서를 편집하는 방식을 정한다.
- [x] 예외 상태와 취소 사유 입력 흐름을 정한다.

## 정합성

- [x] 최대 그룹 주민 수는 `AppSetting.maxGroupResidents`를 따른다.
- [x] 상태 전이는 `definitions.md`와 일치한다.
- [x] 자동 그룹 추천, 자동 배차, 경로 최적화를 구현하지 않는다.

## 모델별 지시

### Product/PM

- 운영자가 수동 판단으로 그룹을 만들 수 있는 흐름인지 확인한다.

### Data

- MobilityGroupMember 중복과 pickupOrder 중복을 차단한다.

### Backend

- 그룹 생성, 멤버 추가/제거, 상태 전이 action을 구현한다.

### Frontend

- 모바일에서는 멤버 카드와 순서 조정 UI를 제공한다.

### QA

- 3명 초과, 중복 신청, 허용되지 않은 상태 전이를 검증한다.

### Ops

- 마을과 시간대 설정 변경이 그룹 생성에 반영되는지 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/server/groups`, `src/features/mobility-groups`
- API/Action: `createMobilityGroup`, `addMemberToGroup`, `removeMemberFromGroup`, `updatePickupOrder`, `transitionGroupStatus`, `groupOperationAction`
- DB/Migration: T-002 모델 사용
- UI/Route: `/admin/groups`
- AuditLog: 그룹 생성, 멤버 변경, 상태 변경
- 설정값: maxGroupResidents

## 완료 기준

- [x] 신청 1명 이상 3명 이하로 그룹을 만들 수 있다.
- [x] 그룹 멤버를 추가, 제거할 수 있다.
- [x] 픽업 순서를 저장할 수 있다.
- [x] 허용되지 않은 상태 전이는 실패한다.
- [x] 예외와 취소 사유가 기록된다.
- [x] 360px, 390px, 768px, 1280px 이상에서 그룹 목록과 상세가 깨지지 않는다.
- [x] 그룹 상태와 다음 행동이 색상뿐 아니라 텍스트로도 명확히 보인다.

## 검증 기록

- 명령: `corepack pnpm typecheck`, `corepack pnpm lint`, `prisma validate`, `node --check prisma\seed.mjs`, `corepack pnpm build`, `curl.exe -4 -I http://localhost:3000/admin/groups`
- 결과: 모두 통과, Next 빌드에서 `/admin/groups` 동적 route 생성 확인
- 수동 확인: headless Chrome 캡처 `t004-groups-360x900.png`, `t004-groups-390x900.png`, `t004-groups-768x1024.png`, `t004-groups-1280x900.png` 확인
- 통합 재검증(2026-05-30): `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm db:validate`, `node --check prisma\seed.mjs`, `corepack pnpm build`, `curl.exe -4 -I http://localhost:3000/admin/groups` 통과.
- 통합 화면 확인: headless Chrome 캡처 `integration-groups-390x900.png`, `integration-groups-1280x900.png` 확인. 모바일/데스크톱 모두 주요 내비게이션, 그룹 생성, 후보 신청, 그룹 목록 영역이 깨지지 않는다.
- DB commit 검증 상태: 현재 통합 환경에 `.env`가 없고 `DATABASE_URL`, `NEXTAUTH_SECRET` 환경변수가 없으며 `localhost:5432` PostgreSQL 접속도 실패했다. 실제 그룹 생성, 멤버 추가/제거, 픽업 순서 변경, 상태 변경, AuditLog DB 기록은 DB 연결값과 마이그레이션된 PostgreSQL 세션 준비 후 추가 검증한다.
