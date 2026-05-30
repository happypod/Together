# T-056 인쇄용 월간보고서

## 메타

- Priority: P2
- Status: planned
- Owner: TBD
- Depends on: T-052
- Area: report, frontend
- Work type: report
- Target surface: admin-desktop, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

월간 운영리포트를 인쇄에 적합한 레이아웃으로 조회하고 출력할 수 있게 한다.

## 배경

행정 보고와 회의 자료에는 화면용 대시보드보다 인쇄에 맞는 요약 보고서가 필요할 수 있다. 다만 PDF 자동화는 별도 P2 기능으로 분리한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER
- 주요 화면: 인쇄용 월간보고서
- 모바일 우선 여부: not_applicable
- 반응형 대상: desktop
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 인쇄 전용 CSS 또는 print view
- 월간 지표 요약
- 정산 요약
- 만족도/사고/민원 요약
- 개인정보 최소화

## 제외

- PDF 자동 생성
- 전자결재 연동
- 외부 보고서 템플릿 연동

## 사전설계

- [x] T-052 월간 리포트 이후 가능한 기능임을 확인했다.
- [x] PDF 자동화와 분리해야 함을 확인했다.
- [x] 개인정보를 최소화한 인쇄 레이아웃이 필요함을 확인했다.

## 정합성

- [x] Full 1차 MVP 이후 확장 기능이다.
- [x] `design_style_guide.md`의 밝고 명확한 보고서 기준을 따른다.
- [x] PDF 자동화는 P2-001로 분리한다.

## 모델별 지시

### Product/PM

- 인쇄 보고서에 필요한 지표와 문구를 확정한다.

### Data

- T-052 리포트 산식을 재사용한다.

### Backend

- 별도 집계보다 getMonthlyReport 결과 재사용을 우선한다.

### Frontend

- print media layout과 페이지 나눔을 구현한다.

### QA

- 인쇄 미리보기, 개인정보 노출, 긴 텍스트 줄바꿈을 검증한다.

### Ops

- 브라우저 인쇄 기준과 운영 환경을 확인한다.

## 구현

- 구현 파일 또는 모듈: printable report
- API/Action: getMonthlyReport
- DB/Migration: 해당 없음
- UI/Route: 인쇄용 보고서
- AuditLog: 해당 없음
- 설정값: reportDateBasis

## 완료 기준

- [ ] 인쇄 미리보기에서 보고서가 깨지지 않는다.
- [ ] 개인정보가 최소화되어 표시된다.
- [ ] 월간 리포트 수치와 일치한다.
- [ ] PDF 자동화를 구현하지 않는다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
