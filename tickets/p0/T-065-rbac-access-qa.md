# T-065 권한별 접근 검증

## 메타

- Priority: P0
- Status: planned
- Owner: TBD
- Depends on: T-002, T-006, T-007
- Area: qa, security
- Work type: qa
- Target surface: admin-desktop, admin-mobile, mobile-link, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

역할별 사용자가 허용된 화면과 action만 접근할 수 있고, UI 숨김과 별도로 서버 권한 검증이 동작하는지 확인한다.

## 배경

주민 개인정보, 정산 정보, 운행 기록은 역할별 접근 범위가 다르다. 권한 검증이 UI에만 있으면 API 직접 호출로 우회될 수 있다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, VIEWER
- 주요 화면: 전체 관리자 화면, 모바일 링크, CSV, 정산, AuditLog
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 역할별 화면 접근 검증
- 역할별 쓰기 action 검증
- LINKER 배정 건 제한 검증
- TAXI_PARTNER 예약 확정 제한 필드 검증
- VIEWER CSV 권한 제한 검증
- SUPER_ADMIN 전용 권한 변경/정산 잠금 해제 검증
- 권한 없음 화면과 오류 문구 검증

## 제외

- SSO 고도화
- 조직별 멀티테넌시
- 세부 권한 빌더 UI

## 사전설계

- [x] 역할 enum과 권한 원칙을 확인했다.
- [x] 서버 권한 검증이 필수임을 확인했다.
- [x] 제한 사용자별 허용 action을 확인했다.
- [x] 모바일 링크는 토큰 scope가 권한 역할을 대체하지 않음을 확인했다.
- [x] 권한 없음 안내 문구가 쉬워야 함을 확인했다.

## 정합성

- [x] `definitions.md`의 권한 적용 원칙과 일치한다.
- [x] `master_plan.md`의 권한 매트릭스 방향과 일치한다.
- [x] `design_style_guide.md`의 오류 안내 기준을 따른다.
- [x] T-002, T-006, T-007 완료 후 검증하는 선행관계가 맞다.
- [x] UI 숨김만으로 권한을 처리하지 않는다.

## 모델별 지시

### Product/PM

- 역할별 실제 업무 범위가 운영 방식과 맞는지 확인한다.

### Data

- User.role, isActive, AuditLog userId가 검증에 충분한지 확인한다.

### Backend

- action별 requireRole, assigned-linker check, token scope check를 검증한다.

### Frontend

- 권한 없는 버튼 숨김과 권한 없음 안내 화면을 검증한다.

### QA

- 역할별 허용/차단 matrix 테스트를 수행한다.

### Ops

- 초기 관리자 계정과 사용자 비활성화 절차를 확인한다.

## 구현

- 구현 파일 또는 모듈: RBAC test matrix
- API/Action: all write actions, exportMonthlyCsv
- DB/Migration: 해당 없음
- UI/Route: role-protected routes
- AuditLog: 권한 관련 주요 작업
- 설정값: 해당 없음

## 완료 기준

- [ ] 모든 쓰기 action은 서버에서 권한을 확인한다.
- [ ] 비활성 사용자는 접근할 수 없다.
- [ ] LINKER와 TAXI_PARTNER는 제한 범위를 벗어나 입력할 수 없다.
- [ ] VIEWER의 CSV 권한 제한이 동작한다.
- [ ] 권한 없음 화면이 명확하고 쉬운 문구로 표시된다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
