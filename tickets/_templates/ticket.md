# T-000 작업지시서 제목

## 메타

- Priority: P0
- Status: planned
- Owner: TBD
- Depends on: TBD
- Area: product | data | backend | frontend | qa | ops
- Work type: feature | model | api | ui | security | report | qa | ops
- Target surface: admin-desktop | admin-mobile | mobile-link | api | db | report
- Updated at: YYYY-MM-DD

## 목표

이 티켓이 완료되면 사용자가 얻는 결과를 한 문단으로 작성한다.

## 배경

- 왜 이 작업이 필요한지, 어떤 운영 문제를 해결하는지 적는다.
- 관련 문서: `master_plan.md`, `definitions.md`, `workflow_rules.md`

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN | ANCHOR_ADMIN | COUNCIL_OPERATOR | LINKER | TAXI_PARTNER | VIEWER
- 주요 화면: 화면명 또는 API/DB만 해당
- 모바일 우선 여부: required | optional | not_applicable
- 반응형 대상: mobile | tablet | desktop | all
- 디자인 기준: `design_style_guide.md` 적용 | not_applicable

## 범위

- 포함할 작업 1
- 포함할 작업 2

## 제외

- 이번 티켓에서 처리하지 않을 작업 1

## 사전설계

- [ ] 사용자 여정과 운영 흐름을 적었다.
- [ ] 필요한 데이터 모델, enum, 상태값을 확인했다.
- [ ] 권한, 개인정보, AuditLog 필요 여부를 확인했다.
- [ ] 모바일/반응형 영향 범위를 확인했다.
- [ ] 고령 사용자 가독성, 터치, 문구 난이도 영향을 확인했다.
- [ ] open decision이 있으면 `decisions.md` 또는 티켓에 남겼다.

## 정합성

- [ ] `master_plan.md`와 충돌하지 않는다.
- [ ] `definitions.md`의 용어, 상태값, enum과 일치한다.
- [ ] `queue.md`의 선행관계와 맞다.
- [ ] 제외 기능을 우회 구현하지 않는다.
- [ ] 데이터 검증, 권한 검증, 감사로그 기준이 명확하다.
- [ ] `design_style_guide.md`의 글자 크기, 대비, 버튼, 오류 문구 기준과 충돌하지 않는다.

## 모델별 지시

### Product/PM

- 사용자 문제, 운영 시나리오, 완료 기준을 검토한다.

### Data

- 모델, 관계, enum, 인덱스, seed, migration 영향을 검토한다.

### Backend

- Server Action/API 계약, 권한 검증, 입력 검증, AuditLog를 구현한다.

### Frontend

- 고령 사용자 기준의 밝고 가독성 높은 UI, 모바일 우선 레이아웃, 반응형 상태, 폼 UX, 빈/로딩/오류 상태를 구현한다.

### QA

- 상태 전이, 권한, 개인정보, 모바일 화면, 고령 사용자 가독성, 정산 또는 리포트 산식을 검증한다.

### Ops

- 환경변수, 배포, 로그, 백업, 운영 설정 영향을 확인한다.

## 구현

- 구현 파일 또는 모듈:
- API/Action:
- DB/Migration:
- UI/Route:
- AuditLog:
- 설정값:

## 완료 기준

- [ ] 기능이 요구 범위대로 동작한다.
- [ ] 권한과 개인정보 노출 범위가 확인되었다.
- [ ] 모바일 360px, 390px, 768px, desktop 1280px 이상에서 레이아웃이 깨지지 않는다.
- [ ] 터치 대상, 폼 라벨, 오류 메시지, 긴 텍스트 줄바꿈이 확인되었다.
- [ ] 글자 크기, 색상 대비, 버튼 크기, 쉬운 문구가 `design_style_guide.md` 기준을 만족한다.
- [ ] 관련 테스트 또는 수동 검증 기록이 남았다.
- [ ] `workflow_rules.md`의 사전설계 → 정합성 → 구현 → 검증 순서를 따랐다.
- [ ] 필요 시 `status.json`과 `queue.md`가 갱신되었다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
