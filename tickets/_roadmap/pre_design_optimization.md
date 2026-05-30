# Pre-Design Optimization

- Date: 2026-05-30
- Status: completed
- Scope: 전체 사전설계 고도화

## 목표

31개 티켓의 사전설계를 단순 목록에서 구현 가능한 설계 체계로 고도화한다.

## 최적화 방향

1. open decision을 티켓과 gate에 연결한다.
2. 구현 모듈 경계를 정해 중복 구현을 줄인다.
3. 품질 게이트를 배치 사이에 둔다.
4. 요구사항과 검증 티켓의 추적성을 확보한다.
5. P0 Operational MVP와 Full 1차 MVP 범위를 계속 분리한다.

## 추가 산출물

- `open_decisions.md`: 구현 전 결정사항과 권장 기본안
- `implementation_blueprint.md`: 모듈, route, service, test 전략
- `quality_gates.md`: Gate 0부터 Gate 8까지 품질 기준
- `traceability_matrix.md`: 요구사항, 티켓, 검증 연결

## Optimized Implementation Strategy

### Batch 1. Foundation

- T-001
- Gate: Foundation Ready
- Output: 실행 가능한 앱 shell, script, env example

### Batch 2. Domain and Settings

- T-002
- T-008
- Gate: Domain Ready
- Output: schema, enum, seed, settings, report basis

### Batch 3. Security and Tokens

- T-007
- Gate: Security Ready
- Output: server guard, mobile token, file metadata, audit utility

### Batch 4. Intake

- T-003
- Gate: Domain Ready + Security Ready
- Output: resident/request flow, consent, masking

### Batch 5. Group Operation

- T-004
- Gate: Operational Flow Ready
- Output: group creation, member limit, pickup order, status transition

### Batch 6. Trip Operation

- T-005
- Gate: Operational Flow Ready
- Output: linker assignment, taxi reservation, trip log, return confirmation

### Batch 7. Settlement and Dashboard

- T-006
- Gate: Settlement Ready
- Output: settlement calculator, lock, receipt, KPI

### Batch 8. P0 QA

- T-061
- T-062
- T-063
- T-065
- T-066
- T-067
- T-068
- Gate: P0 Release Candidate
- Output: P0 Operational MVP acceptance

### Batch 9. Full 1차 MVP

- P1 tickets
- Gate: Full 1차 MVP
- Output: calendar, mobile forms, monthly report, CSV, statistics

### Batch 10. Extensions

- P2 tickets
- Gate: P2 Extension Ready
- Output: selected post-MVP extensions

## Cross-Ticket Reuse Targets

| Reusable target | Avoids duplication in |
| --- | --- |
| `requireRole` / `requireAssignedLinker` | T-003, T-004, T-005, T-006, T-055 |
| `writeAuditLog` | all write actions |
| `maskPhone` / privacy projection | T-003, T-055, T-061 |
| `transitionGroupStatus` | T-004, T-005, T-062 |
| `calculateSettlement` | T-006, T-046, T-052, T-063 |
| `validateMobileToken` | T-007, T-037 |
| `getReportDateBasis` | T-008, T-031, T-046, T-052, T-055 |
| responsive layout shell | all UI tickets |

## Implementation Risks After Decisions

- 실제 repo가 아직 없으므로 T-001에서 확정 스택 기준으로 구조, 스크립트, 환경 예시를 생성해야 한다.
- DB 호스팅은 PostgreSQL 호환을 전제로 하되, 실제 연결 문자열과 운영 환경 변수는 배포 환경에서 확정한다.
- 영수증은 P0에서 외부 URL 메타데이터 방식으로 시작하며, 직접 업로드는 저장소와 접근 권한이 확정된 뒤 확장한다.
- 인증은 P0 최소 계정/세션 방식으로 시작하며, 초대와 비밀번호 복구는 P2-002 범위로 관리한다.
- accepted decision 변경이 필요하면 기존 문서를 덮어쓰지 않고 새 decision을 추가해 추적성을 유지한다.

## Final Recommendation

구현은 반드시 T-001부터 시작한다. T-001 완료 후 T-002와 T-008을 먼저 처리하고, T-007을 거친 뒤 T-003 이후 업무 흐름으로 들어간다. 현재 open decision은 모두 accepted 상태이므로, T-001은 별도 의사결정 대기 없이 착수 가능하다.
