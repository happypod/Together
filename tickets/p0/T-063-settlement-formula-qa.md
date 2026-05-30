# T-063 정산 산식 검증

## 메타

- Priority: P0
- Status: planned
- Owner: TBD
- Depends on: T-006, T-008
- Area: qa, finance
- Work type: qa
- Target surface: admin-desktop, admin-mobile, api, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

정산 모드별 주민 분담액, 앵커 지원금, 상생기금 기록, 반올림 정책, 정산 잠금과 수정 사유가 정확히 동작하는지 검증한다.

## 배경

정산은 보조금성 운영과 주민 부담액 안내의 기준이므로 계산 오차, 용어 혼동, 수정 이력 누락이 없어야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER
- 주요 화면: 정산 상세, 관리자 홈, 월간 리포트 요약
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 시범기, 자립전환기, 상생기금 지원, 커스텀 정산 검증
- 원 단위 반올림 또는 절사 정책 검증
- 주민 수 1명, 2명, 3명 케이스 검증
- totalFare 0 이상 정수 검증
- 정산 완료 후 수정 권한과 사유 검증
- 상생기금이 택시요금 차감으로 표시되지 않는지 검증

## 제외

- 자동 결제
- 카드 결제
- 할인, 환급 처리
- 회계 시스템 연동

## 사전설계

- [x] 정산 모드와 산식을 `master_plan.md` 기준으로 확인했다.
- [x] 반올림 정책이 `AppSetting`으로 분리되어야 함을 확인했다.
- [x] 상생기금 회계 분리 원칙을 확인했다.
- [x] 모바일에서 큰 숫자와 단위 표시가 필요함을 확인했다.
- [x] 정산 수정은 사유와 AuditLog가 필수임을 확인했다.

## 정합성

- [x] `definitions.md`의 Settlement 필드와 일치한다.
- [x] `design_style_guide.md`의 금액 표시 기준과 충돌하지 않는다.
- [x] T-006과 T-008 완료 후 검증하는 선행관계가 맞다.
- [x] 자동 결제 또는 환급 처리를 구현하지 않는다.
- [x] 상생기금을 택시요금 차감으로 표시하지 않는다.

## 모델별 지시

### Product/PM

- 주민 분담, 앵커 지원, 상생기금 용어가 오해 없이 표시되는지 확인한다.

### Data

- Settlement, CommunityFund, MonthlyReport 집계 필드가 산식과 맞는지 확인한다.

### Backend

- calculateSettlement 함수와 updateSettlement 권한/사유 검증을 테스트한다.

### Frontend

- 금액 단위, 큰 숫자, 수정 잠금 상태와 사유 입력 UI를 확인한다.

### QA

- 모드별 산식, 반올림, 경계값, 수정 권한, AuditLog를 검증한다.

### Ops

- 월간 보고와 CSV의 금액 컬럼이 같은 산식을 쓰는지 확인한다.

## 구현

- 구현 파일 또는 모듈: settlement formula tests
- API/Action: createSettlement, updateSettlement, getDashboardSummary
- DB/Migration: 해당 없음
- UI/Route: 정산 상세
- AuditLog: SETTLEMENT_LOCK, SETTLEMENT_UNLOCK, UPDATE
- 설정값: fareRoundingPolicy

## 완료 기준

- [ ] 모든 정산 모드의 계산 결과가 기대값과 일치한다.
- [ ] 반올림 정책이 설정값을 따른다.
- [ ] 정산 완료 후 수정은 관리자 권한과 사유가 필요하다.
- [ ] 상생기금은 별도 항목으로 표시된다.
- [ ] 모바일에서 금액과 단위가 잘 읽힌다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
