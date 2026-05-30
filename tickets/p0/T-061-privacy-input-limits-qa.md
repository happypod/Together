# T-061 개인정보 입력 제한 검증

## 메타

- Priority: P0
- Status: planned
- Owner: TBD
- Depends on: T-003, T-006, T-007
- Area: qa, privacy
- Work type: qa
- Target surface: admin-desktop, admin-mobile, mobile-link, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

주민 신청, 운행, 정산, 파일첨부, 모바일 링크 입력에서 고유식별정보와 건강 민감정보가 수집되지 않으며, 목록과 CSV에서 개인정보가 권한 기준대로 보호되는지 검증한다.

## 배경

백천만 동행이동 OS는 주민 연락처와 이동 목적지를 다루므로 개인정보 최소수집과 민감정보 미수집 확인이 실제 화면과 서버 검증에 모두 반영되어야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, VIEWER
- 주요 화면: 주민 신청 등록, 신청 목록, 그룹 상세, 정산, 영수증, 모바일 링크 입력, CSV 내보내기
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 개인정보 동의, 제3자 제공 동의, 민감정보 미수집 확인 필수 여부 검증
- 주민등록번호, 진단명, 처치/상담 내용, 건강 세부정보 입력 유도 문구 부재 검증
- 목록 연락처 마스킹 검증
- 상세 화면 전체 연락처 권한 검증
- CSV 내보내기 권한, 사유, AuditLog 검증
- 영수증 첨부 안내와 파일 메타데이터 검증
- 모바일 링크 입력폼 개인정보 노출 범위 검증

## 제외

- 법률 자문 수준의 개인정보 영향평가
- 외부 보안 진단
- 자동 개인정보 탐지 엔진 구현

## 사전설계

- [x] 개인정보가 노출되는 화면과 API를 식별했다.
- [x] 민감정보 금지 항목을 `definitions.md`와 맞췄다.
- [x] 목록, 상세, CSV의 권한별 표시 기준을 확인했다.
- [x] 모바일/반응형 영향 범위를 확인했다.
- [x] 고령 사용자에게 쉬운 개인정보 안내 문구가 필요함을 확인했다.

## 정합성

- [x] `master_plan.md`의 개인정보 최소수집 기준과 일치한다.
- [x] `definitions.md`의 금지 수집 항목과 일치한다.
- [x] `design_style_guide.md`의 쉬운 문구와 오류 안내 기준을 따른다.
- [x] T-003, T-006, T-007 완료 후 검증하는 선행관계가 맞다.
- [x] 건강 민감정보 수집을 우회 구현하지 않는다.

## 모델별 지시

### Product/PM

- 개인정보 안내 문구가 주민과 현장 운영자 모두 이해 가능한지 확인한다.

### Data

- Resident, MobilityRequest, FileAttachment, AuditLog에 불필요한 원문 개인정보가 저장되지 않는지 확인한다.

### Backend

- 필수 동의 누락, 권한 없는 상세 조회, CSV 내보내기 권한 차단을 검증한다.

### Frontend

- 목록 마스킹, 필수 체크, 민감정보 금지 안내, 오류 문구를 확인한다.

### QA

- 권한별 조회, 저장 실패, CSV 내보내기, 모바일 링크 노출 범위를 테스트한다.

### Ops

- 운영 로그와 AuditLog에 불필요한 개인정보 원문이 남지 않는지 확인한다.

## 구현

- 구현 파일 또는 모듈: QA checklist, privacy test cases
- API/Action: createMobilityRequest, listResidents, exportMonthlyCsv, uploadReceipt
- DB/Migration: 해당 없음
- UI/Route: 신청 등록, 신청 목록, 모바일 링크, 정산/영수증
- AuditLog: CSV, 파일첨부, 주요 수정
- 설정값: 개인정보 보관기간, CSV 권한

## 완료 기준

- [ ] 필수 동의가 없으면 신청 저장이 실패한다.
- [ ] 목록 화면의 연락처가 마스킹된다.
- [ ] 권한 없는 사용자는 전체 연락처와 CSV를 볼 수 없다.
- [ ] 민감정보 입력을 유도하는 UI 문구가 없다.
- [ ] 모바일 360px, 390px, 768px, 1280px 이상에서 개인정보 안내가 잘리지 않는다.
- [ ] 글자 크기, 색상 대비, 버튼 크기, 쉬운 문구가 `design_style_guide.md` 기준을 만족한다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
