# Pre-Design Sequence

- Date: 2026-05-30
- Status: scaffold completed
- Scope: P0, P1, P2 전체 큐 31개 티켓

## 기준

전체 티켓 사전설계는 `queue.md` 순서를 따른다.

```text
사전설계 -> 정합성 -> 구현 -> 검증
```

현재 단계에서는 모든 큐 항목에 표준 작업지시서 파일을 생성했고, 각 티켓에 사전설계와 정합성 기준을 작성했다. 구현 완료 체크리스트와 검증 기록은 실제 구현/검증 단계에서 채운다.

## Optimized References

- 구현 배치: `pre_design_optimization.md`
- 품질 게이트: `quality_gates.md`
- 구현 모듈 경계: `implementation_blueprint.md`
- decision archive: `open_decisions.md`, `decisions.md`
- 요구사항 추적: `traceability_matrix.md`

## P0 Sequence

| Order | ID | Ticket | Pre-design |
| --- | --- | --- | --- |
| 1 | T-001 | [프로젝트 초기 세팅](../p0/T-001-foundation-project-setup.md) | done |
| 2 | T-002 | [도메인 모델과 권한 기반](../p0/T-002-domain-model-and-rbac.md) | done |
| 3 | T-007 | [인증, 모바일 링크, 파일첨부 보안 기반](../p0/T-007-auth-mobile-file-security.md) | done |
| 4 | T-008 | [운영 설정과 리포트 계약](../p0/T-008-operating-settings-report-contract.md) | done |
| 5 | T-003 | [주민 및 이동 신청 흐름](../p0/T-003-resident-request-flow.md) | done |
| 6 | T-004 | [공동예약 그룹 운영 흐름](../p0/T-004-group-operation-flow.md) | done |
| 7 | T-005 | [동행링커, 택시예약, 운행 흐름](../p0/T-005-linker-taxi-trip-flow.md) | done |
| 8 | T-006 | [정산, AuditLog, 대시보드](../p0/T-006-settlement-audit-dashboard.md) | done |
| 9 | T-061 | [개인정보 입력 제한 검증](../p0/T-061-privacy-input-limits-qa.md) | done |
| 10 | T-062 | [상태 전이 검증](../p0/T-062-state-transition-qa.md) | done |
| 11 | T-063 | [정산 산식 검증](../p0/T-063-settlement-formula-qa.md) | done |
| 12 | T-065 | [권한별 접근 검증](../p0/T-065-rbac-access-qa.md) | done |
| 13 | T-066 | [운영 금지 표현 사용 여부 검증](../p0/T-066-forbidden-operational-language-qa.md) | done |
| 14 | T-067 | [제외 기능 미구현 검증](../p0/T-067-excluded-features-qa.md) | done |
| 15 | T-068 | [MVP 최종 검수](../p0/T-068-mvp-final-acceptance.md) | done |

## P1 Sequence

| Order | ID | Ticket | Pre-design |
| --- | --- | --- | --- |
| 1 | T-031 | [이동 캘린더 월간, 주간, 일간 보기](../p1/T-031-mobility-calendar.md) | done |
| 2 | T-036 | [사고 및 민원 입력](../p1/T-036-incident-complaint-input.md) | done |
| 3 | T-037 | [모바일 링크형 입력폼](../p1/T-037-mobile-link-input-forms.md) | done |
| 4 | T-045 | [상생기금 기록](../p1/T-045-community-fund-record.md) | done |
| 5 | T-046 | [월별 정산표](../p1/T-046-monthly-settlement-table.md) | done |
| 6 | T-052 | [월간 운영리포트](../p1/T-052-monthly-operation-report.md) | done |
| 7 | T-053 | [만족도 통계](../p1/T-053-satisfaction-statistics.md) | done |
| 8 | T-054 | [동행링커 활동통계](../p1/T-054-linker-activity-statistics.md) | done |
| 9 | T-055 | [CSV 다운로드](../p1/T-055-csv-download.md) | done |
| 10 | T-064 | [모바일 화면 검증](../p1/T-064-mobile-screen-qa.md) | done |

## P2 Sequence

| Order | ID | Ticket | Pre-design |
| --- | --- | --- | --- |
| 1 | T-056 | [인쇄용 월간보고서](../p2/T-056-printable-monthly-report.md) | done |
| 2 | T-057 | [행정 열람용 리포트 화면](../p2/T-057-administrative-view-report.md) | done |
| 3 | P2-001 | [PDF 출력 자동화](../p2/P2-001-pdf-export-automation.md) | done |
| 4 | P2-002 | [사용자 역할 관리 고도화](../p2/P2-002-user-role-management-advanced.md) | done |
| 5 | P2-003 | [취업연계 상담관리 확장](../p2/P2-003-job-consultation-extension.md) | done |
| 6 | P2-004 | [MOU 관리 확장](../p2/P2-004-mou-management-extension.md) | done |

## Remaining Before Implementation

구현 착수 전 필수 결정은 2026-05-30 기준 모두 accepted 상태이며, 관련 티켓은 아래 결정을 그대로 적용한다.

- 프로젝트 스택 최종 확정: D-005, OD-001, T-001
- 원 단위 정산 처리 정책: D-013, OD-002, T-008, T-006, T-063
- 영수증 저장 방식: D-014, OD-003, T-007, T-006
- 인증 방식과 사용자 초대 범위: D-015, OD-004, T-007, P2-002
- 리포트 기준일: D-016, OD-005, T-008, T-052, T-055
- 초기 주민 및 동행링커 데이터 이관 방식: D-017, OD-006, T-002, T-003, T-005

세부 근거는 `decisions.md`와 `open_decisions.md`의 accepted 항목을 따른다. 이후 기준 변경이 필요하면 기존 결정을 수정하지 않고 새 decision을 추가한다.
