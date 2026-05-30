# T-036 사고 및 민원 입력

## 메타

- Priority: P1
- Status: planned
- Owner: TBD
- Depends on: T-005
- Area: frontend, backend, operations
- Work type: feature
- Target surface: admin-desktop, admin-mobile, mobile-link
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

운행 중 또는 운행 후 발생한 사고, 민원, 분실, 지연, 귀가 이슈를 기록하고 월간 통계에 반영할 수 있게 한다.

## 배경

사고와 민원은 운영 개선과 책임 추적에 필요하지만 의료 정보나 민감정보를 수집하지 않도록 입력 범위를 제한해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, VIEWER
- 주요 화면: 그룹 상세, 운행 상세, 사고/민원 입력
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- IncidentReport 생성
- 사고 유형, 발생 시각, 내용, 조치 입력
- 민감정보 입력 금지 안내
- 그룹 상세 연결
- 월간 리포트 집계 대상 제공

## 제외

- 보험 청구 자동화
- 법적 신고 자동화
- 의료상담 기록

## 사전설계

- [x] 사고/민원 기록은 IncidentReport로 관리함을 확인했다.
- [x] 건강 민감정보 입력 금지가 필요함을 확인했다.
- [x] 모바일 현장 입력이 가능해야 함을 확인했다.

## 정합성

- [x] `definitions.md`의 IncidentReport 필드와 일치한다.
- [x] 의료상담 또는 전문 이송 업무로 확장하지 않는다.
- [x] `design_style_guide.md`의 오류/경고 문구 기준을 따른다.

## 모델별 지시

### Product/PM

- 사고/민원 유형이 운영자가 실제로 분류 가능한 수준인지 확인한다.

### Data

- IncidentReport와 MobilityGroup 관계, 월간 집계 기준을 확인한다.

### Backend

- createIncidentReport 권한, 입력 검증, AuditLog를 구현한다.

### Frontend

- 모바일에서 큰 입력 영역과 민감정보 금지 안내를 제공한다.

### QA

- 필수 내용, 권한, 민감정보 금지 문구, 월간 집계를 검증한다.

### Ops

- 사고/민원 데이터 보관 정책과 관리자 열람 범위를 확인한다.

## 구현

- 구현 파일 또는 모듈: incident reports
- API/Action: createIncidentReport
- DB/Migration: T-002 모델 사용
- UI/Route: 그룹 상세 내 사고/민원 입력
- AuditLog: CREATE
- 설정값: 해당 없음

## 완료 기준

- [ ] 사고/민원을 그룹에 연결해 저장할 수 있다.
- [ ] 민감정보 입력 금지 안내가 표시된다.
- [ ] 권한 없는 사용자는 입력할 수 없다.
- [ ] 월간 집계에 반영할 수 있다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
