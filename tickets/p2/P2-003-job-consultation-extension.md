# P2-003 취업연계 상담관리 확장

## 메타

- Priority: P2
- Status: planned
- Owner: TBD
- Depends on: MVP
- Area: product, data, frontend
- Work type: feature
- Target surface: admin-desktop, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

동행링커 또는 주민의 취업연계 상담 건수를 별도 기록하고 월간 성과에 반영할 수 있게 확장한다.

## 배경

설계문서에는 취업연계 상담 지표가 있으나 P0/P1 핵심 이동 운영과는 별도 확장 영역이다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 취업연계 상담관리, 월간 리포트
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 상담 건수 기록
- 상담 대상과 분야 기록
- 월간 리포트 반영
- 개인정보 최소화

## 제외

- 전문 직업상담 시스템
- 외부 고용 플랫폼 연동
- 민감 상담 내용 수집

## 사전설계

- [x] 취업연계는 P2 확장임을 확인했다.
- [x] 상담 내용은 민감정보가 될 수 있어 최소 기록이 필요함을 확인했다.
- [x] MonthlyReport의 jobConsultationCount와 연결됨을 확인했다.

## 정합성

- [x] MVP 핵심 이동 운영과 분리한다.
- [x] 개인정보 최소수집 기준을 따른다.
- [x] `design_style_guide.md`의 쉬운 입력 기준을 따른다.

## 모델별 지시

### Product/PM

- 상담관리의 실제 운영 주체와 기록 범위를 확정한다.

### Data

- 별도 JobConsultation 모델 필요 여부를 검토한다.

### Backend

- 상담 건수 기록과 월간 집계를 구현한다.

### Frontend

- 민감정보 입력 금지 안내를 포함한 간단한 입력 UI를 만든다.

### QA

- 개인정보 최소화와 월간 집계를 검증한다.

### Ops

- 상담 기록 보관기간을 확인한다.

## 구현

- 구현 파일 또는 모듈: job consultations
- API/Action: createJobConsultation
- DB/Migration: JobConsultation 후보
- UI/Route: 취업연계 상담관리
- AuditLog: CREATE, UPDATE
- 설정값: retention policy

## 완료 기준

- [ ] 상담 건수를 기록할 수 있다.
- [ ] 민감 상담 내용 입력을 유도하지 않는다.
- [ ] 월간 리포트에 반영된다.
- [ ] 권한과 AuditLog가 적용된다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
