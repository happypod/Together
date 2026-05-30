# P2-001 PDF 출력 자동화

## 메타

- Priority: P2
- Status: planned
- Owner: TBD
- Depends on: T-056
- Area: report, ops
- Work type: feature
- Target surface: admin-desktop, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

인쇄용 월간보고서를 PDF 파일로 자동 생성하거나 다운로드할 수 있게 한다.

## 배경

PDF 자동화는 1차 MVP 제외 범위였으며, 인쇄용 보고서가 안정화된 뒤 검토해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN
- 주요 화면: 월간보고서 PDF 다운로드
- 모바일 우선 여부: not_applicable
- 반응형 대상: desktop
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- PDF 생성 방식 검토
- 월간보고서 PDF 다운로드
- 개인정보 최소화
- 생성 실패 오류 처리
- 권한과 AuditLog 검토

## 제외

- 전자결재
- 외부 문서 시스템 연동
- 자동 이메일 발송

## 사전설계

- [x] PDF 자동화는 P2임을 확인했다.
- [x] T-056 인쇄용 보고서 안정화 이후 진행해야 함을 확인했다.
- [x] 개인정보 최소화 기준이 필요함을 확인했다.

## 정합성

- [x] MVP P0/P1 범위에 섞지 않는다.
- [x] `design_style_guide.md`의 보고서 가독성 기준을 따른다.
- [x] CSV와 PDF의 용도 차이를 명확히 한다.

## 모델별 지시

### Product/PM

- PDF가 실제 보고 절차에 필요한지 확인한다.

### Data

- PDF에 포함할 지표와 제외할 개인정보를 정의한다.

### Backend

- PDF 생성 런타임과 실패 처리 방식을 설계한다.

### Frontend

- 다운로드 버튼과 생성 상태를 명확히 표시한다.

### QA

- PDF 내용, 페이지 나눔, 권한, 실패 케이스를 검증한다.

### Ops

- 배포 환경에서 PDF 생성 의존성이 동작하는지 확인한다.

## 구현

- 구현 파일 또는 모듈: pdf export
- API/Action: exportMonthlyPdf
- DB/Migration: 해당 없음
- UI/Route: 월간보고서 다운로드
- AuditLog: PDF_EXPORT 권장
- 설정값: reportDateBasis

## 완료 기준

- [ ] PDF가 생성된다.
- [ ] 개인정보 최소화 기준을 따른다.
- [ ] 권한 없는 사용자는 다운로드할 수 없다.
- [ ] 생성 실패 시 쉬운 오류가 표시된다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
