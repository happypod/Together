# Implementation Blueprint

- Date: 2026-05-30
- Scope: P0 Operational MVP 우선, P1/P2 확장 가능 구조
- Goal: 티켓별 구현이 서로 다른 구조로 흩어지지 않도록 모듈 경계, 라우팅, action, 검증 기준을 통일한다.

## 1. Layering

권장 구조는 아래 레이어를 따른다.

```text
UI Routes
-> Server Actions / API
-> Domain Services
-> Repository / ORM
-> Database
```

규칙:

- UI는 권한을 숨김 처리할 수 있지만 최종 권한 검사는 Server Action/API에서 한다.
- Domain Service는 상태 전이, 정산 산식, 토큰 검증, 리포트 산식처럼 재사용되는 업무 규칙을 가진다.
- Repository/ORM 레이어는 DB 접근과 transaction을 담당한다.
- AuditLog는 주요 쓰기 action의 transaction 경계 안에서 기록한다.

## 2. Suggested Module Boundaries

| Module | Related tickets | Responsibilities |
| --- | --- | --- |
| `auth` | T-002, T-007, T-065 | User, role guard, active user check |
| `audit` | T-002, T-007, T-006 | AuditLog utility and redaction |
| `settings` | T-008 | AppSetting, default fare, report basis |
| `residents` | T-003, T-061 | Resident CRUD, masking |
| `requests` | T-003, T-004 | MobilityRequest, consent, duplicate warning |
| `groups` | T-004, T-062 | MobilityGroup, members, pickup order, status transition |
| `linkers` | T-005, T-054 | Linker registry, assignment, activity stats |
| `taxi` | T-005 | TaxiReservation request and confirmation |
| `trips` | T-005, T-062 | TripLog, boarding, return confirmation |
| `settlements` | T-006, T-063 | Settlement formulas, lock, receipt link |
| `files` | T-007, T-006 | FileAttachment metadata and validation |
| `mobileForms` | T-007, T-037 | MobileFormToken and scoped submission |
| `incidents` | T-036 | IncidentReport and complaint records |
| `funds` | T-045 | CommunityFund |
| `reports` | T-006, T-046, T-052, T-053, T-054, T-055 | Dashboard, monthly report, CSV |

## 3. Route Groups

권장 route group:

```text
/admin
/admin/requests
/admin/groups
/admin/linkers
/admin/taxi-reservations
/admin/settlements
/admin/reports
/admin/system
/m/[token]
```

규칙:

- `/m/[token]`은 모바일 링크형 입력 전용이다.
- `/m/[token]`은 관리자 레이아웃을 쓰지 않는다.
- 관리자 화면은 모바일에서도 읽기와 핵심 조작이 가능해야 한다.
- 복잡 편집은 데스크톱에서 더 편하게 확장하되 모바일 핵심 조작은 막지 않는다.

## 4. Data Access Rules

- 목록 API는 기본 pagination을 적용한다.
- 연락처는 목록 projection에서 기본 마스킹한다.
- 상세 projection은 권한별로 분리한다.
- CSV projection은 사유와 권한 검사를 통과한 경우에만 전체 또는 마스킹 컬럼을 선택한다.
- AuditLog before/after에는 필요 이상의 개인정보 원문을 저장하지 않는다.

## 5. Shared Domain Services

### Status Transition

`transitionGroupStatus`는 아래를 공통 처리한다.

- 현재 상태와 다음 상태 검증
- 예외/취소 사유 필수 검증
- 권한 검증
- AuditLog 기록

### Settlement Calculator

정산 계산은 UI 안에서 직접 하지 않는다.

입력:

- settlementMode
- totalFare
- residentCount
- supportFromCommunityFund
- fareRoundingPolicy

출력:

- residentTotalShare
- residentPerPersonShare
- anchorSupportAmount
- communityFundSupportAmount

### Mobile Token Service

토큰 검증은 아래를 공통 처리한다.

- tokenHash match
- expiresAt
- revokedAt
- maxUseCount
- scope
- targetType/targetId
- allowed fields

## 6. UX Implementation Rules

- 모든 UI는 `design_style_guide.md`를 따른다.
- 모바일 360px과 390px에서 핵심 작업을 먼저 확인한다.
- 입력 폼은 라벨을 항상 표시한다.
- 상태는 색상과 텍스트를 함께 표시한다.
- 저장 성공 후 다음 행동을 보여준다.
- 오류는 원인과 다음 행동을 함께 표시한다.

## 7. Test Strategy

| Test type | Minimum target |
| --- | --- |
| Typecheck | all implementation |
| Schema validation | T-002 and migrations |
| Unit test | settlement calculator, status transition, token service |
| Integration test | create request -> group -> trip -> settlement |
| Permission test | T-065 matrix |
| Visual/manual test | 360px, 390px, 768px, 1280px |

## 8. Implementation Batch Optimization

권장 구현 배치:

1. Foundation Batch: T-001
2. Domain Batch: T-002, T-008
3. Security Batch: T-007
4. Intake Batch: T-003
5. Group Batch: T-004
6. Trip Batch: T-005
7. Settlement/Dashboard Batch: T-006
8. P0 QA Batch: T-061, T-062, T-063, T-065, T-066, T-067, T-068
9. Full MVP Batch: P1 tickets
10. Extension Batch: P2 tickets

배치 사이에는 `quality_gates.md`의 gate를 통과해야 한다.
