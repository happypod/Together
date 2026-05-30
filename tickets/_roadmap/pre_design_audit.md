# Pre-Design Audit

- Audit date: 2026-05-30
- Scope: 전체 로드맵, 큐, 상태 JSON, 정의서, 결정 기록, 워크플로우, 디자인 기준, P0 작업지시서
- Purpose: 전체 티켓 사전설계에 들어가기 전에 부족하거나 누락된 기반이 있는지 검증한다.

## 결론

전체 사전설계는 착수 가능하다. 2026-05-30 추가 작업으로 큐에만 있고 파일이 없던 23개 티켓을 모두 표준 작업지시서 파일로 생성했고, `queue.md`의 모든 항목을 실제 파일 링크로 연결했다.

사전설계 전 필수 보완 2건은 이번 검증 중 바로 반영했다.

- `definitions.md`에 누락되어 있던 핵심 모델 필드 기준 추가
- P0 완료 기준과 Full 1차 MVP 완료 기준 분리

## 검증 결과 요약

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| 큐 총량과 `status.json` 카운트 | Pass | queue 31개 = ready 1 + planned 30 |
| P0 핵심 티켓 파일 | Pass | T-001~T-008 파일 존재 |
| P0 티켓 표준 섹션 | Pass | 배경, 사용자와 화면, 사전설계, 정합성, 모델별 지시, 구현, 검증 기록 포함 |
| 디자인/모바일 기준 | Pass | `design_style_guide.md`, `workflow_rules.md`, 템플릿, P0 티켓에 반영 |
| 핵심 모델 최소 필드 | Fixed | Resident~AuditLog 누락 보완 완료 |
| 완료 기준 범위 충돌 | Fixed | P0 Operational MVP와 Full 1차 MVP로 분리 |
| 큐 항목별 실제 파일 | Fixed | 31개 큐 항목 모두 실제 파일 링크 연결 |
| 구현 전 open decision | Attention | 스택, 반올림, 영수증, 인증, 리포트 기준일, 데이터 이관 |

## 바로 보완한 사항

### 1. 핵심 모델 필드 누락

`master_plan.md`는 세부 필드와 enum을 `definitions.md` 기준으로 본다고 되어 있었지만, `definitions.md`에는 기존 핵심 모델 일부의 필드 표가 없었다.

보완 완료:

- `Resident`
- `MobilityRequest`
- `MobilityGroup`
- `MobilityGroupMember`
- `Linker`
- `TaxiReservation`
- `TripLog`
- `Settlement`
- `SatisfactionSurvey`
- `IncidentReport`
- `CommunityFund`
- `MonthlyReport`
- `AuditLog`

### 2. MVP 완료 기준 충돌

초기 문서에서는 MVP 포함 범위에 캘린더, 월간 리포트, CSV 등이 들어 있었지만, 완료 기준은 P0 티켓 완료만 요구했다. 이러면 P1 기능의 위치가 애매해진다.

보완 완료:

- P0 Operational MVP: 실제 운영 가능한 핵심 흐름
- Full 1차 MVP: P1의 캘린더, 모바일 링크형 입력폼, 월간 리포트, CSV, 통계 포함

관련 결정:

- `decisions.md`의 `D-012. 완료 기준 이원화`

## 남은 누락 또는 주의 사항

### A. 큐에는 있지만 파일이 없는 티켓 23개

해결 완료. 아래 항목은 `queue.md`에만 존재했으나 현재 모두 실제 작업지시서 파일로 생성되었다.

- P0 QA: `T-061`, `T-062`, `T-063`, `T-065`, `T-066`, `T-067`, `T-068`
- P1: `T-031`, `T-036`, `T-037`, `T-045`, `T-046`, `T-052`, `T-053`, `T-054`, `T-055`, `T-064`
- P2: `T-056`, `T-057`, `P2-001`, `P2-002`, `P2-003`, `P2-004`

판정:

- 전체 큐 티켓 사전설계를 진행할 수 있다.
- 모든 신규 파일은 `_templates/ticket.md`, `workflow_rules.md`, `design_style_guide.md` 기준을 반영한다.

### B. 구현 전 결정 필요 항목

아래는 전체 사전설계 중 티켓에 open decision으로 배분해도 되지만, 구현 전에는 반드시 확정해야 한다.

- 프로젝트 스택 최종 확정
- 원 단위 정산 반올림 또는 절사 정책
- 영수증 저장 방식: 파일 업로드 또는 외부 링크
- 인증 방식과 사용자 초대 방식
- 리포트 기준일: `serviceDate` 또는 `returnConfirmedAt`
- 초기 주민 및 동행링커 데이터 이관 방식

### C. P1/P2 티켓은 아직 표준 포맷 미적용

해결 완료. P1/P2 티켓도 P0와 같은 표준 포맷을 적용했다.

필수 섹션:

- 메타
- 목표
- 배경
- 사용자와 화면
- 범위
- 제외
- 사전설계
- 정합성
- 모델별 지시
- 구현
- 완료 기준
- 검증 기록

## 사전설계 착수 조건

### P0 핵심 사전설계

착수 가능.

조건:

- T-001부터 T-008까지 queue 순서대로 진행
- 각 티켓에서 open decision을 해당 티켓에 명확히 연결
- 모바일/디자인 검증 기준 유지

### 전체 큐 사전설계

착수 가능.

완료된 선행 조치:

1. 파일 없는 23개 큐 항목을 실제 티켓 파일로 생성했다.
2. `queue.md`의 각 항목을 파일 링크로 연결했다.
3. `status.json`의 `currentStage`를 `pre_design`으로 갱신했다.
4. P1/P2 티켓도 `design_style_guide.md`와 `workflow_rules.md` 기준을 포함했다.

## 권장 다음 순서

1. open decision 6개를 관련 티켓에 배정한다.
2. P0부터 사전설계 상세화를 시작한다.
3. P0 상세화 후 P1, P2 순으로 확장한다.
4. 상세 사전설계가 끝난 티켓은 필요 시 `ready`로 전환한다.

## 최종 판정

현재 문서 기반은 전체 큐 티켓 사전설계를 시작하기에 충분하다. 구현 착수 전에는 open decision 6개를 관련 티켓에서 확정해야 한다.
