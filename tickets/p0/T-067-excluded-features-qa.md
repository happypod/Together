# T-067 제외 기능 미구현 검증

## 메타

- Priority: P0
- Status: planned
- Owner: TBD
- Depends on: all P0 UI
- Area: qa, product
- Work type: qa
- Target surface: admin-desktop, admin-mobile, mobile-link, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

MVP 제외 기능이 코드, UI, 메뉴, API, 문구에 구현되거나 암시되지 않았는지 검증한다.

## 배경

P0는 내부 운영관리 핵심 흐름에 집중해야 한다. 제외 기능이 섞이면 일정과 책임 범위가 커지고 운영 리스크가 증가한다.

## 사용자와 화면

- 주요 사용자: 전체 역할
- 주요 화면: 전체 P0 UI, API, 설정, README
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 공개 앱스토어 앱 구조 부재 검증
- 자동 차량 배정, 외부 차량 API 연동 부재 검증
- 자동 결제, 카드 결제 부재 검증
- 실시간 위치 추적 부재 검증
- 기사 전용 앱 부재 검증
- AI 경로 최적화 부재 검증
- 의료상담, 전문 이송, 건강 민감정보 수집 부재 검증
- PDF 자동화 부재 검증

## 제외

- P2 검토 항목의 상세 설계
- 외부 서비스 계약 검토
- 보안 취약점 진단

## 사전설계

- [x] 제외 기능 목록을 `master_plan.md` 기준으로 확인했다.
- [x] P0 UI와 API 전체가 검증 대상임을 확인했다.
- [x] 기능뿐 아니라 문구 암시도 검증 대상임을 확인했다.
- [x] 모바일 링크가 공개 앱으로 확장되지 않아야 함을 확인했다.
- [x] PDF 자동화는 P2로 유지한다.

## 정합성

- [x] `master_plan.md`의 제외 범위와 일치한다.
- [x] `decisions.md`의 D-002와 일치한다.
- [x] `design_style_guide.md`의 금지 패턴과 충돌하지 않는다.
- [x] P0 구현 범위를 확장하지 않는다.
- [x] 제외 기능을 설정값이나 숨김 메뉴로도 만들지 않는다.

## 모델별 지시

### Product/PM

- 제외 기능이 고객 기대나 화면 문구에 섞이지 않았는지 확인한다.

### Data

- 좌표, 카드 결제, 의료 세부정보 등 제외 기능용 필드가 없는지 확인한다.

### Backend

- 외부 차량 API, 결제 API, 실시간 위치 API 코드가 없는지 확인한다.

### Frontend

- 메뉴, 버튼, 안내문에 제외 기능이 노출되지 않는지 확인한다.

### QA

- 코드 검색과 화면 수동 점검을 함께 수행한다.

### Ops

- 환경변수에 제외 기능 관련 키가 추가되지 않았는지 확인한다.

## 구현

- 구현 파일 또는 모듈: excluded feature checklist
- API/Action: all P0 actions
- DB/Migration: all P0 models
- UI/Route: all P0 routes
- AuditLog: 해당 없음
- 설정값: env, AppSetting

## 완료 기준

- [ ] 제외 기능이 코드와 UI에 없다.
- [ ] 제외 기능 관련 환경변수가 없다.
- [ ] 제외 기능을 암시하는 문구가 없다.
- [ ] 모바일 링크가 공개 앱처럼 동작하지 않는다.
- [ ] 검증 기록이 남았다.

## 검증 기록

- 명령:
- 결과:
- 수동 확인:
- 남은 리스크:
