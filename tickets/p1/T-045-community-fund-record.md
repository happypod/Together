# T-045 상생기금 기록

## 메타

- Priority: P1
- Status: planned
- Owner: TBD
- Depends on: T-006
- Area: finance, backend, frontend
- Work type: feature
- Target surface: admin-desktop, admin-mobile, report
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

상생기금 조성액과 지원 기록을 택시요금 정산과 분리해 관리하고 월간 리포트에 반영한다.

## 배경

상생기금은 택시요금 할인이나 주민 환급이 아니라 별도 사회공헌 출연금 또는 지원 기록으로 처리해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, VIEWER
- 주요 화면: 정산 상세, 상생기금 기록, 월간 리포트
- 모바일 우선 여부: optional
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- CommunityFund CONTRIBUTION 기록
- CommunityFund SUPPORT_RECORD 기록
- 그룹 또는 월 기준 연결
- 월간 리포트 집계
- 택시요금과 분리 표시

## 제외

- 외부 회계 시스템 연동
- 자동 입출금 처리
- 주민 요금 환급 처리

## 사전설계

- [x] 상생기금은 Settlement와 별도 회계로 표시함을 확인했다.
- [x] 월 기준과 그룹 기준 기록을 모두 허용함을 확인했다.
- [x] 금액 표시는 큰 숫자와 명확한 단위가 필요함을 확인했다.

## 정합성

- [x] `definitions.md`의 CommunityFund 필드와 일치한다.
- [x] 택시요금 차감으로 표시하지 않는다.
- [x] T-006 정산 산식과 충돌하지 않는다.

## 모델별 지시

### Product/PM

- 상생기금 용어가 할인이나 환급으로 오해되지 않는지 확인한다.

### Data

- CommunityFund의 fundType, month, groupId 관계를 확인한다.

### Backend

- 상생기금 생성, 수정, 월간 집계 action을 구현한다.

### Frontend

- 정산 금액과 상생기금 금액을 시각적으로 분리한다.

### QA

- 월별 합계, 그룹 연결, 권한, AuditLog를 검증한다.

### Ops

- 보고용 CSV와 월간 리포트 반영 기준을 확인한다.

## 구현

- 구현 파일 또는 모듈: community fund
- API/Action: createCommunityFundRecord
- DB/Migration: CommunityFund 사용
- UI/Route: 정산 상세 또는 월간 리포트
- AuditLog: CREATE, UPDATE
- 설정값: 해당 없음

## 완료 기준

- [ ] 상생기금 조성과 지원 기록을 저장할 수 있다.
- [ ] 택시요금과 분리 표시된다.
- [ ] 월간 리포트에 합산된다.
- [ ] 권한과 AuditLog가 적용된다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
