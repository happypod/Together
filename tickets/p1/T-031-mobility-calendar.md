# T-031 이동 캘린더 월간, 주간, 일간 보기

## 메타

- Priority: P1
- Status: planned
- Owner: TBD
- Depends on: T-004
- Area: frontend, operations
- Work type: feature
- Target surface: admin-desktop, admin-mobile
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

운영자가 날짜별 이동 신청, 그룹 확정, 택시예약, 운행 상태를 월간/주간/일간 보기로 확인할 수 있게 한다.

## 배경

목록만으로는 운영일정을 한눈에 파악하기 어렵다. 캘린더는 미배정, 미확정, 운행 예정 건을 사전에 발견하는 운영 보조 화면이다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 이동 캘린더
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 월간, 주간, 일간 보기
- 날짜별 신청, 그룹, 예약 상태 표시
- 상태별 필터
- 그룹 상세로 이동
- 모바일 카드형 일정 목록

## 제외

- 외부 캘린더 연동
- 자동 일정 추천
- 실시간 위치 추적

## 사전설계

- [x] 캘린더는 P0 그룹 운영 이후 조회 화면임을 확인했다.
- [x] 모바일에서는 월간 격자보다 일정 목록 중심이 적합함을 확인했다.
- [x] 상태 색상은 텍스트와 함께 표시해야 함을 확인했다.

## 정합성

- [x] `MobilityGroup.serviceDate`와 상태값을 기준으로 표시한다.
- [x] P0 상태 전이와 충돌하지 않는다.
- [x] `design_style_guide.md`의 카드형 모바일 목록 기준을 따른다.

## 모델별 지시

### Product/PM

- 운영자가 오늘/이번 주 미처리 일정을 빠르게 찾을 수 있는지 확인한다.

### Data

- serviceDate, status, linkerId, taxi reservation 상태 조회 성능을 고려한다.

### Backend

- 기간 기반 일정 조회 action을 제공한다.

### Frontend

- 모바일은 일자별 카드 목록, 데스크톱은 월/주/일 전환 UI를 구현한다.

### QA

- 날짜 경계, 상태 필터, 모바일 표시를 검증한다.

### Ops

- 시간대 기준이 운영 지역 기준과 일치하는지 확인한다.

## 구현

- 구현 파일 또는 모듈: calendar
- API/Action: listCalendarEvents
- DB/Migration: 해당 없음
- UI/Route: 이동 캘린더
- AuditLog: 해당 없음
- 설정값: reportDateBasis 또는 serviceDate 기준

## 완료 기준

- [ ] 월간, 주간, 일간 보기가 동작한다.
- [ ] 상태별 일정이 구분된다.
- [ ] 그룹 상세로 이동할 수 있다.
- [ ] 모바일에서 일정 목록이 읽기 쉽다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
