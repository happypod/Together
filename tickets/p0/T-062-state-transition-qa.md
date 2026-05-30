# T-062 상태 전이 검증

## 메타

- Priority: P0
- Status: planned
- Owner: TBD
- Depends on: T-004, T-005
- Area: qa, backend
- Work type: qa
- Target surface: admin-desktop, admin-mobile, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

이동 신청과 공동예약 그룹의 기본 상태, 취소 상태, 예외 상태가 허용된 순서와 권한 안에서만 변경되는지 검증한다.

## 배경

상태 전이가 흐트러지면 예약, 운행, 귀가확인, 정산의 기준 데이터가 무너진다. 서버 검증과 UI 표시가 같은 상태 규칙을 사용해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, VIEWER
- 주요 화면: 신청 상세, 그룹 상세, 예약 확정, 운행상태, 귀가확인
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 기본 상태 전이 순서 검증
- 취소 상태 사유 필수 검증
- 예외 상태 사유 필수 검증
- 권한별 상태 변경 가능 범위 검증
- 상태 변경 AuditLog 기록 검증
- 모바일 상태 배지와 다음 행동 표시 검증

## 제외

- 자동 상태 전이 엔진 고도화
- 외부 알림 연동
- AI 기반 예외 판단

## 사전설계

- [x] 상태 전이 순서를 `definitions.md` 기준으로 확인했다.
- [x] 취소/예외 상태의 사유 필수 조건을 확인했다.
- [x] 권한별 상태 변경 주체를 확인했다.
- [x] 모바일에서 현재 상태와 다음 행동이 명확해야 함을 확인했다.
- [x] 상태 색상은 텍스트와 함께 표시되어야 함을 확인했다.

## 정합성

- [x] `master_plan.md`의 상태 전이와 일치한다.
- [x] `definitions.md`의 상태 표시명과 일치한다.
- [x] `design_style_guide.md`의 상태 표시 기준과 충돌하지 않는다.
- [x] T-004와 T-005 완료 후 검증하는 선행관계가 맞다.
- [x] 자동 배차 또는 외부 API 상태를 만들지 않는다.

## 모델별 지시

### Product/PM

- 운영자가 상태명만 보고 현재 단계와 다음 행동을 이해할 수 있는지 확인한다.

### Data

- MobilityRequest, MobilityGroup, TripLog의 상태 저장 범위와 AuditLog 대상 필드를 확인한다.

### Backend

- 허용되지 않은 전이, 사유 없는 예외, 권한 없는 전이를 차단한다.

### Frontend

- 상태 배지, 다음 행동 버튼, 예외 사유 입력 UI를 검증한다.

### QA

- 정상 전이, 역방향 전이, 건너뛰기, 예외 전이, 취소 전이를 테스트한다.

### Ops

- 상태 변경 실패 로그가 운영 추적에 충분한지 확인한다.

## 구현

- 구현 파일 또는 모듈: state transition test cases
- API/Action: transitionGroupStatus, updateTripStatus, confirmReturn
- DB/Migration: 해당 없음
- UI/Route: 그룹 상세, 운행 입력
- AuditLog: STATUS_CHANGE
- 설정값: 해당 없음

## 완료 기준

- [ ] 기본 상태가 허용 순서대로만 진행된다.
- [ ] 취소와 예외 상태는 사유 없이 저장되지 않는다.
- [ ] 권한 없는 사용자는 상태를 변경할 수 없다.
- [ ] 모든 상태 변경이 AuditLog에 기록된다.
- [ ] 모바일에서 상태와 다음 행동이 명확히 보인다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
