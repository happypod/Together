# Traceability Matrix

- Date: 2026-05-30
- Purpose: 요구사항, 설계 기준, 티켓, 검증 항목을 연결한다.

## Core Requirements

| Requirement | Source | Primary tickets | QA tickets |
| --- | --- | --- | --- |
| 관리자 홈 KPI | master_plan P0 | T-006 | T-068 |
| 주민 신청 등록/목록 | master_plan P0 | T-003 | T-061, T-068 |
| 공동예약 그룹 생성 | master_plan P0 | T-004 | T-062, T-068 |
| 주민 최대 3명 제한 | master_plan 운영단위 | T-004, T-008 | T-062 |
| 동행링커 등록/배정 | master_plan P0 | T-005 | T-065 |
| 택시연합 예약요청/확정 | master_plan P0 | T-005 | T-062, T-065 |
| 운행상태와 귀가확인 | master_plan P0 | T-005 | T-062, T-064 |
| 정산 산식과 영수증 | master_plan P0 | T-006, T-007, T-008 | T-063 |
| 개인정보 최소수집 | definitions privacy | T-003, T-007 | T-061 |
| AuditLog | decisions D-004 | T-002, T-006, T-007 | T-061, T-065 |
| RBAC | definitions roles | T-002, T-007 | T-065 |
| 모바일 우선 | workflow_rules | T-001, T-003, T-005, T-037 | T-064 |
| 고령 사용자 UI | design_style_guide | all UI tickets | T-064, T-068 |
| 월간 리포트 | master_plan P1 | T-052 | T-055, T-064 |
| CSV 내보내기 | master_plan P1 | T-055 | T-061, T-065 |
| 제외 기능 미구현 | decisions D-002 | all tickets | T-067 |

## Open Decisions Mapping

| Decision | Related tickets | Blocking gate |
| --- | --- | --- |
| OD-001 프로젝트 스택 | T-001, T-002 | Gate 1 |
| OD-002 정산 원 단위 | T-008, T-006, T-063 | Gate 5 |
| OD-003 영수증 저장 | T-007, T-006, T-055 | Gate 5 |
| OD-004 인증/초대 | T-007, P2-002 | Gate 3 |
| OD-005 리포트 기준일 | T-008, T-052, T-055 | Gate 7 |
| OD-006 초기 데이터 이관 | T-002, T-003, T-005 | Gate 2 |

## Verification Coverage

| Risk | Coverage |
| --- | --- |
| 개인정보 과수집 | T-061, T-067 |
| 상태 전이 오류 | T-062 |
| 정산 오류 | T-063 |
| 권한 우회 | T-065 |
| MVP 범위 오해 | T-066, T-067 |
| 모바일 사용성 부족 | T-064, T-068 |
| 리포트 수치 불일치 | T-052, T-055, T-063 |
| 확장 기능의 조기 혼입 | T-067, quality gates |
