# T-055 CSV 다운로드

## 메타

- Priority: P1
- Status: planned
- Owner: TBD
- Depends on: T-052
- Area: report, security, backend
- Work type: feature
- Target surface: admin-desktop, report, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

월간 리포트 요약 CSV와 운행 상세 CSV를 권한과 개인정보 기준에 맞게 내보낼 수 있게 한다.

## 배경

CSV는 행정 보고와 내부 검토에 필요하지만 개인정보 유출 위험이 있으므로 권한, 사유, AuditLog가 필수다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER allowed
- 주요 화면: 월간 리포트, CSV 내보내기 확인
- 모바일 우선 여부: optional
- 반응형 대상: desktop
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 월간 요약 CSV
- 운행 상세 CSV
- 권한 확인
- 다운로드 사유 입력
- 개인정보 마스킹 또는 전체 표시 정책
- AuditLog 기록

## 제외

- 대량 CSV 가져오기
- 스프레드시트 자동 동기화
- PDF 자동화

## 사전설계

- [x] CSV 내보내기는 권한과 AuditLog가 필수임을 확인했다.
- [x] 요약 CSV와 상세 CSV를 분리해야 함을 확인했다.
- [x] 개인정보 표시 기준이 권한별로 달라야 함을 확인했다.

## 정합성

- [x] T-052 월간 리포트 이후 실행한다.
- [x] `master_plan.md`의 CSV 개인정보 기준과 일치한다.
- [x] `definitions.md`의 AuditLog action EXPORT_CSV를 사용한다.

## 모델별 지시

### Product/PM

- CSV 컬럼이 보고와 운영 검토에 충분한지 확인한다.

### Data

- 컬럼 계약, 마스킹 여부, 월 기준을 정의한다.

### Backend

- exportMonthlyCsv 권한, 사유, AuditLog, CSV 생성 로직을 구현한다.

### Frontend

- 다운로드 전 확인과 사유 입력 UI를 구현한다.

### QA

- 권한, 사유 누락, 마스킹, AuditLog를 검증한다.

### Ops

- CSV를 백업 수단으로 안내하지 않도록 문구를 확인한다.

## 구현

- 구현 파일 또는 모듈: csv export
- API/Action: exportMonthlyCsv
- DB/Migration: 해당 없음
- UI/Route: 월간 리포트 내보내기
- AuditLog: EXPORT_CSV
- 설정값: reportDateBasis

## 완료 기준

- [ ] 요약 CSV와 상세 CSV가 생성된다.
- [ ] 권한 없는 사용자는 다운로드할 수 없다.
- [ ] 다운로드 사유가 없으면 실행되지 않는다.
- [ ] AuditLog가 기록된다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
