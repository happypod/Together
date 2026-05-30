# T-053 만족도 통계

## 메타

- Priority: P1
- Status: planned
- Owner: TBD
- Depends on: T-036
- Area: report, frontend, backend
- Work type: report
- Target surface: admin-desktop, admin-mobile, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

이용자 만족도, 동행링커 만족도, 택시 만족도, 비용 부담, 재이용 의향을 월간 리포트와 별도 통계로 확인할 수 있게 한다.

## 배경

만족도는 생활이동 서비스의 개선 지표다. 사고/민원과 함께 해석할 수 있어야 운영 개선 방향을 잡을 수 있다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 만족도 통계, 월간 리포트
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- SatisfactionSurvey 입력값 집계
- 월별 평균 점수
- 개선 요청과 불편사항 목록
- 사고/민원 여부와 연결
- 모바일 요약 카드

## 제외

- 고급 통계 분석
- 외부 설문 도구 연동
- 자동 문자 설문 발송

## 사전설계

- [x] SatisfactionSurvey 필드와 지표를 확인했다.
- [x] 사고/민원과 같이 해석해야 함을 확인했다.
- [x] 모바일에서는 평균 점수와 주요 불편사항 중심으로 표시해야 함을 확인했다.

## 정합성

- [x] T-036 사고/민원 입력 이후 통계가 가능하다.
- [x] `definitions.md`의 SatisfactionSurvey 필드와 일치한다.
- [x] `design_style_guide.md`의 요약 지표 표시 기준을 따른다.

## 모델별 지시

### Product/PM

- 만족도 항목이 운영 개선에 실제로 쓰일 수 있는지 확인한다.

### Data

- 평균 계산, 결측치 처리, 월 기준을 정의한다.

### Backend

- 만족도 집계 action을 구현한다.

### Frontend

- 평균 점수와 주관식 항목을 가독성 있게 표시한다.

### QA

- 점수 범위, 평균 계산, 월 필터를 검증한다.

### Ops

- 개인 식별 가능 주관식 문구 노출 범위를 확인한다.

## 구현

- 구현 파일 또는 모듈: satisfaction statistics
- API/Action: getSatisfactionStats
- DB/Migration: SatisfactionSurvey 사용
- UI/Route: 만족도 통계
- AuditLog: 해당 없음
- 설정값: reportDateBasis

## 완료 기준

- [ ] 만족도 평균이 정확히 집계된다.
- [ ] 불편사항과 개선 요청을 조회할 수 있다.
- [ ] 개인정보 노출 위험이 낮다.
- [ ] 모바일에서 핵심 지표가 읽기 쉽다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
