# T-031 이동 캘린더 월간, 주간, 일간 보기

## 메타

- Priority: P1
- Status: done
- Owner: TBD
- Depends on: T-004
- Area: frontend, operations
- Work type: feature
- Target surface: admin-desktop, admin-mobile
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

운영자가 날짜별 이동 신청, 그룹 확정, 택시예약, 운행 상태를 월간/주간/일간 보기로 확인할 수 있게 한다.

## 배경

목록만으로는 운영일정을 한눈에 파악하기 어렵다. 캘린더는 미배정, 미확정, 운행 예정 건을 사전에 발견하는 운영 보조 화면이다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 이동 캘린더
- 모바일 우선 여부: required
- 반응형 대상: all
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 월간, 주간, 일간 보기
- 날짜별 신청, 그룹, 예약 상태 표시
- 상태별 필터
- 그룹 상세로 이동
- 모바일 카드형 일정 목록

## 제외

- 외부 캘린더 연동
- 자동 일정 추천
- 실시간 위치 추적

## 사전설계

- [x] 캘린더는 P0 그룹 운영 이후 조회 화면임을 확인했다.
- [x] 모바일에서는 월간 격자보다 일정 목록 중심이 적합함을 확인했다.
- [x] 상태 색상은 텍스트와 함께 표시해야 함을 확인했다.

## 정합성

- [x] `MobilityGroup.serviceDate`와 상태값을 기준으로 표시한다.
- [x] P0 상태 전이와 충돌하지 않는다.
- [x] `design_style_guide.md`의 카드형 모바일 목록 기준을 따른다.

## 모델별 지시

### Product/PM

- 운영자가 오늘/이번 주 미처리 일정을 빠르게 찾을 수 있는지 확인한다.

### Data

- serviceDate, status, linkerId, taxi reservation 상태 조회 성능을 고려한다.

### Backend

- 기간 기반 일정 조회 action을 제공한다.

### Frontend

- 모바일은 일자별 카드 목록, 데스크톱은 월/주/일 전환 UI를 구현한다.

### QA

- 날짜 경계, 상태 필터, 모바일 표시를 검증한다.

### Ops

- 시간대 기준이 운영 지역 기준과 일치하는지 확인한다.

## 구현

- 구현 파일 또는 모듈: `src/server/calendar/calendar-service.ts`, `src/features/mobility-calendar/mobility-calendar-workspace.tsx`
- API/Action: `listCalendarEvents(user, filters)`, `buildCalendarWindow(filters)`, `summarizeCalendarEvents(events)`
- DB/Migration: 해당 없음
- UI/Route: `/admin/calendar`
- AuditLog: 해당 없음
- 설정값: `MobilityGroup.serviceDate`, `MobilityRequest.desiredDate` 기준

## 완료 기준

- [x] 월간, 주간, 일간 보기가 동작한다.
- [x] 상태별 일정이 구분된다.
- [x] 그룹 상세로 이동할 수 있다.
- [x] 모바일에서 일정 목록이 읽기 쉽다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령: `corepack.cmd pnpm typecheck`
- 결과: 통과. TypeScript 오류 없음.
- 명령: `corepack.cmd pnpm lint`
- 결과: 통과. ESLint 오류 없음.
- 명령: `corepack.cmd pnpm build`
- 결과: 통과. `/admin/calendar` 동적 라우트가 production build에 포함됨.
- 수동 확인: 헤드리스 Chrome CDP로 `http://127.0.0.1:3000/admin/calendar?view=month`를 1280x900, 390x900에서 확인했다. 모바일에서 월간 격자는 숨김 처리되고 일정 목록이 표시되며, 월간에서 주간으로 버튼 클릭 전환 후 URL과 활성 보기(`주간`)가 갱신됨을 확인했다. 일간 직접 진입도 확인했다.
- 수동 확인: 데스크톱 일간 보기에서 요일 헤더가 숨겨지고 1일 일정 그리드만 표시됨을 확인했다.
- 수동 확인: 하단 내비게이션은 7개 항목 모두 FontAwesome 아이콘으로 렌더링되고 모바일 스크린샷상 텍스트 없이 한 줄로 표시됨을 확인했다.
- 브라우저 도구: 인앱 Browser 연결은 `node_repl kernel exited unexpectedly`로 실패하여 CDP 검증으로 대체했다.
- 증거: `C:\tmp\together-t031-calendar-qa\t031-calendar-desktop-month.png`, `C:\tmp\together-t031-calendar-qa\t031-calendar-desktop-day.png`, `C:\tmp\together-t031-calendar-qa\t031-calendar-mobile-month.png`, `C:\tmp\together-t031-calendar-qa\t031-calendar-mobile-week.png`, `C:\tmp\together-t031-calendar-qa\t031-calendar-mobile-day.png`
- 남은 리스크: 실제 로그인 권한과 DB 데이터 기반 E2E는 `.env`, `DATABASE_URL`, PostgreSQL 연결 준비 후 후속 검증한다.
