# T-052 월간 운영리포트

## 메타

- Priority: P1
- Status: planned
- Owner: TBD
- Depends on: T-006
- Area: report, backend, frontend
- Work type: report
- Target surface: admin-desktop, admin-mobile, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

월별 운행건수, 이용 주민 수, 동행링커 활동, 평균 요금, 지원금, 만족도, 사고/민원 등 운영 성과를 조회할 수 있게 한다.

## 배경

월간 리포트는 사업 운영 성과와 행정 보고의 기준이다. 지표 산식이 고정되어야 CSV와 화면의 수치가 일치한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 월간 운영리포트
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 월간 리포트 요약
- 지표별 산식 적용
- 월 선택
- 전월 대비 또는 단순 비교 영역
- 모바일 요약 지표 카드

## 제외

- PDF 자동화
- 행정 전용 별도 포털
- 외부 BI 연동

## 사전설계

- [x] 리포트 지표 산식을 `master_plan.md` 기준으로 확인했다.
- [x] 기준일은 T-008 reportDateBasis를 따라야 함을 확인했다.
- [x] 모바일에서는 큰 숫자 카드 중심이 적합함을 확인했다.

## 정합성

- [x] T-008 운영 설정과 리포트 계약을 따른다.
- [x] T-046 월별 정산표와 금액 기준이 충돌하지 않는다.
- [x] `design_style_guide.md`의 리포트 표시 기준을 따른다.

## 모델별 지시

### Product/PM

- 행정 보고에 필요한 핵심 지표가 빠지지 않았는지 확인한다.

### Data

- MonthlyReport 저장 또는 실시간 집계 기준을 결정한다.

### Backend

- getMonthlyReport 산식과 집계 쿼리를 구현한다.

### Frontend

- 요약 카드, 지표 표, 월 선택 UI를 구현한다.

### QA

- 지표별 산식과 월 경계를 검증한다.

### Ops

- 보고 기준일과 생성 시점을 운영 정책으로 기록한다.

## 구현

- 구현 파일 또는 모듈: monthly reports
- API/Action: getMonthlyReport
- DB/Migration: MonthlyReport 사용 또는 캐시
- UI/Route: 월간 운영리포트
- AuditLog: 해당 없음
- 설정값: reportDateBasis

## 완료 기준

- [ ] 월간 리포트 지표가 조회된다.
- [ ] 산식이 문서 기준과 일치한다.
- [ ] 모바일에서 요약 지표가 읽기 쉽다.
- [ ] VIEWER 권한으로 조회 가능 범위가 제한된다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
