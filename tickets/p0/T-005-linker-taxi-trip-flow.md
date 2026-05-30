# T-005 동행링커, 택시예약, 운행 흐름

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: T-004, T-007
- Area: frontend, backend, operations
- Work type: feature
- Target surface: admin-desktop, admin-mobile, mobile-link
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

동행링커를 등록하고 그룹에 배정하며, 택시연합 예약요청과 확정, 운행상태와 귀가확인을 기록한다.

## 배경

운행 당일에는 모바일 입력과 제한 권한 사용자가 많으므로 링커, 택시파트너, 운영자의 입력 범위를 명확히 분리해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, VIEWER
- 주요 화면: 동행링커 목록, 그룹 운행 상세, 택시예약 확정, 귀가확인
- 모바일 우선 여부: required
- 반응형 대상: all

## 범위

- 동행링커 등록, 목록, 상태 필터
- 교육, 실습, 개인정보보호 서약, 보험 등록 여부 기록
- 그룹에 동행링커 배정
- 택시연합 예약요청 기록
- 예약 확정 정보 입력: 차량번호, 기사 연락처, 예상요금, 실제요금, 영수증 여부
- 운행상태 체크: 링커 탑승, 주민 탑승, 목적지 도착, 생활업무 수행, 귀가 출발, 전체 귀가확인
- 특이사항 입력

## 제외

- 기사 전용 앱
- 외부 차량 요청 API
- 실시간 위치 추적

## 구현 메모

- 택시 확정 정보는 수동 입력을 기본으로 한다.
- 링커 본인은 배정된 건만 입력할 수 있어야 한다.
- 택시 파트너는 예약 확정에 필요한 제한 필드만 입력할 수 있어야 한다.

## 사전설계

- [x] 동행링커 배정, 예약요청, 운행상태, 귀가확인 여정을 정리한다.
- [x] 모바일 링크로 입력 가능한 필드와 관리자 전용 필드를 분리한다.
- [x] 택시파트너 제한 입력 범위를 정한다.

## 정합성

- [x] T-007의 토큰 scope와 서버 권한 기준을 따른다.
- [x] 외부 차량 API, 기사 전용 앱, 실시간 위치 추적을 구현하지 않는다.
- [x] 운행 상태는 `definitions.md` 상태값과 충돌하지 않는다.

## 모델별 지시

### Product/PM

- 현장 입력자가 최소 탭 수로 귀가확인을 완료할 수 있는지 확인한다.

### Data

- Linker, TaxiReservation, TripLog 관계와 필수 필드를 확인한다.

### Backend

- 배정 건 권한, 택시 확정, 운행상태 업데이트 action을 구현한다.

### Frontend

- 모바일 운행 체크 UI와 택시예약 확정 폼을 구현한다.

### QA

- 배정되지 않은 링커 입력 차단, 택시파트너 제한 필드, 귀가확인을 검증한다.

### Ops

- 택시연합 수동 연락 기록이 필요한 경우 ContactLog와 연결한다.

## 구현

- 구현 파일 또는 모듈: linkers, taxi reservations, trip logs
- API/Action: assignLinkerToGroup, requestTaxiReservation, confirmTaxiReservation, updateTripStatus, confirmReturn
- DB/Migration: T-002 모델 사용
- UI/Route: 링커 목록, 예약 확정, 운행 체크
- AuditLog: 배정, 예약요청, 예약확정, 운행상태 변경
- 설정값: mobileTokenTtlHours

## 완료 기준

- [x] 동행링커를 등록하고 활동 상태를 관리할 수 있다.
- [x] 그룹에 링커를 배정할 수 있다.
- [x] 예약요청과 예약확정 정보를 기록할 수 있다.
- [x] 운행상태와 귀가확인을 순서대로 기록할 수 있다.
- [x] 권한별 입력 가능 범위가 서버에서 제한된다.
- [x] 360px, 390px, 768px, 1280px 이상에서 운행 입력과 귀가확인이 깨지지 않는다.
- [x] 운행상태와 귀가확인은 큰 터치 영역과 쉬운 문구로 입력할 수 있다.

## 검증 기록

- 명령: `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm db:validate`, `node --check prisma\seed.mjs`, `corepack pnpm build`, `curl.exe -4 -I http://localhost:3000/admin/trips`
- 결과: 모두 통과, Next 빌드에서 `/admin/trips` 동적 route 생성 확인
- 수동 확인: headless Chrome 캡처 `t005-trips-360x900.png`, `t005-trips-390x900.png`, `t005-trips-768x1024.png`, `t005-trips-1280x900.png` 확인
- 구현 요약: `src/server/trips` 서비스, `/admin/trips` 화면, `tripOperationAction`, 모바일 토큰 제출의 TAXI_CONFIRM/TRIP_CHECK/RETURN_CONFIRM 실제 반영 경로를 추가했다.
- 남은 리스크: 현재 통합 환경에 DB 연결값이 없어 실제 링커 등록, 그룹 배정, 택시 확정, 운행 체크, 귀가확인 DB commit은 후속 DB 연결 티켓에서 검증한다.
