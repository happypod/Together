# Implementation Queue

이 큐는 백천만 동행이동 OS MVP 제작 순서의 단일 실행 목록이다.

## Current Focus

1. `T-006`: 정산, AuditLog, 대시보드
2. `T-061`: 개인정보 입력 제한 검증
3. `T-062`: 상태 전이 검증

## P0 Queue

| Order | ID | Ticket | Status | Depends on |
| --- | --- | --- | --- | --- |
| 1 | T-001 | [프로젝트 초기 세팅](../p0/T-001-foundation-project-setup.md) | done | - |
| 2 | T-002 | [도메인 모델과 권한 기반](../p0/T-002-domain-model-and-rbac.md) | done | T-001 |
| 3 | T-007 | [인증, 모바일 링크, 파일첨부 보안 기반](../p0/T-007-auth-mobile-file-security.md) | done | T-002 |
| 4 | T-008 | [운영 설정과 리포트 계약](../p0/T-008-operating-settings-report-contract.md) | done | T-002 |
| 5 | T-003 | [주민 및 이동 신청 흐름](../p0/T-003-resident-request-flow.md) | done | T-002, T-007 |
| 6 | T-004 | [공동예약 그룹 운영 흐름](../p0/T-004-group-operation-flow.md) | done | T-003, T-008 |
| 7 | T-005 | [동행링커, 택시예약, 운행 흐름](../p0/T-005-linker-taxi-trip-flow.md) | done | T-004, T-007 |
| 8 | T-006 | [정산, AuditLog, 대시보드](../p0/T-006-settlement-audit-dashboard.md) | ready | T-005, T-008 |
| 9 | T-061 | [개인정보 입력 제한 검증](../p0/T-061-privacy-input-limits-qa.md) | planned | T-003, T-006, T-007 |
| 10 | T-062 | [상태 전이 검증](../p0/T-062-state-transition-qa.md) | planned | T-004, T-005 |
| 11 | T-063 | [정산 산식 검증](../p0/T-063-settlement-formula-qa.md) | planned | T-006, T-008 |
| 12 | T-065 | [권한별 접근 검증](../p0/T-065-rbac-access-qa.md) | planned | T-002, T-006, T-007 |
| 13 | T-066 | [운영 금지 표현 사용 여부 검증](../p0/T-066-forbidden-operational-language-qa.md) | planned | all P0 UI |
| 14 | T-067 | [제외 기능 미구현 검증](../p0/T-067-excluded-features-qa.md) | planned | all P0 UI |
| 15 | T-068 | [MVP 최종 검수](../p0/T-068-mvp-final-acceptance.md) | planned | all P0 |

## P1 Queue

| Order | ID | Ticket | Status | Depends on |
| --- | --- | --- | --- | --- |
| 1 | T-031 | [이동 캘린더 월간, 주간, 일간 보기](../p1/T-031-mobility-calendar.md) | planned | T-004 |
| 2 | T-036 | [사고 및 민원 입력](../p1/T-036-incident-complaint-input.md) | planned | T-005 |
| 3 | T-037 | [모바일 링크형 입력폼](../p1/T-037-mobile-link-input-forms.md) | planned | T-003, T-005 |
| 4 | T-045 | [상생기금 기록](../p1/T-045-community-fund-record.md) | planned | T-006 |
| 5 | T-046 | [월별 정산표](../p1/T-046-monthly-settlement-table.md) | planned | T-006 |
| 6 | T-052 | [월간 운영리포트](../p1/T-052-monthly-operation-report.md) | planned | T-006 |
| 7 | T-053 | [만족도 통계](../p1/T-053-satisfaction-statistics.md) | planned | T-036 |
| 8 | T-054 | [동행링커 활동통계](../p1/T-054-linker-activity-statistics.md) | planned | T-005 |
| 9 | T-055 | [CSV 다운로드](../p1/T-055-csv-download.md) | planned | T-052 |
| 10 | T-064 | [모바일 화면 검증](../p1/T-064-mobile-screen-qa.md) | planned | T-037 |

## P2 Queue

| Order | ID | Ticket | Status | Depends on |
| --- | --- | --- | --- | --- |
| 1 | T-056 | [인쇄용 월간보고서](../p2/T-056-printable-monthly-report.md) | planned | T-052 |
| 2 | T-057 | [행정 열람용 리포트 화면](../p2/T-057-administrative-view-report.md) | planned | T-052 |
| 3 | P2-001 | [PDF 출력 자동화](../p2/P2-001-pdf-export-automation.md) | planned | T-056 |
| 4 | P2-002 | [사용자 역할 관리 고도화](../p2/P2-002-user-role-management-advanced.md) | planned | T-065 |
| 5 | P2-003 | [취업연계 상담관리 확장](../p2/P2-003-job-consultation-extension.md) | planned | MVP |
| 6 | P2-004 | [MOU 관리 확장](../p2/P2-004-mou-management-extension.md) | planned | MVP |

## Queue Update Rules

- 티켓 시작 시 Status를 `in_progress`로 바꾼다.
- 구현 완료 후 테스트 전이면 `review`로 바꾼다.
- 검증 완료 후 `done`으로 바꾼다.
- 선행 결정이 필요하면 `blocked`로 바꾸고 이유를 티켓에 남긴다.
- `status.json`의 `activeTicket`, `updatedAt`, `counts`도 함께 갱신한다.
