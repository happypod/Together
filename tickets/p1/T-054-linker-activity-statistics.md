# T-054 동행링커 활동통계

## 메타

- Priority: P1
- Status: planned
- Owner: TBD
- Depends on: T-005
- Area: report, operations
- Work type: report
- Target surface: admin-desktop, admin-mobile, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

동행링커별 활동 건수, 활동 상태, 배정 이력, 사고/민원 이력을 월간 기준으로 확인할 수 있게 한다.

## 배경

동행링커 활동통계는 활동비, 교육/관리, 인력 운영 계획에 필요하다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 동행링커 활동통계, 월간 리포트
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 월별 링커 활동 건수
- 활동 링커 수
- 링커별 배정 이력
- 상태별 필터
- 사고/민원 연결 요약

## 제외

- 급여 자동 정산
- 근태 관리 시스템
- 취업연계 고도화

## 사전설계

- [x] 활동통계는 Linker와 MobilityGroup 배정 기준임을 확인했다.
- [x] 활동비 자동 정산과는 분리함을 확인했다.
- [x] 모바일은 요약 중심으로 표시해야 함을 확인했다.

## 정합성

- [x] T-005 링커 배정과 운행 기록 이후 집계한다.
- [x] `definitions.md`의 Linker 필드와 일치한다.
- [x] 월간 리포트의 linkerActivityCount와 연결된다.

## 모델별 지시

### Product/PM

- 활동통계가 링커 운영 관리에 충분한지 확인한다.

### Data

- 그룹 배정 기준과 활동 완료 기준을 정의한다.

### Backend

- 월별 링커 활동 집계 action을 구현한다.

### Frontend

- 링커별 요약 카드와 상세 표를 구현한다.

### QA

- 월별 집계, 활동 상태 필터, 사고/민원 연결을 검증한다.

### Ops

- 활동비 지급 자료와 혼동되지 않도록 문구를 확인한다.

## 구현

- 구현 파일 또는 모듈: linker activity stats
- API/Action: getLinkerActivityStats
- DB/Migration: Linker, MobilityGroup 사용
- UI/Route: 동행링커 활동통계
- AuditLog: 해당 없음
- 설정값: reportDateBasis

## 완료 기준

- [ ] 월별 링커 활동 건수가 집계된다.
- [ ] 활동 링커 수가 계산된다.
- [ ] 링커별 배정 이력을 확인할 수 있다.
- [ ] 모바일에서 요약이 읽기 쉽다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
