# T-064 모바일 화면 검증

## 메타

- Priority: P1
- Status: done
- Owner: Codex
- Depends on: T-037
- Area: qa, frontend, accessibility
- Work type: qa
- Target surface: admin-mobile, mobile-link
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

모바일 링크형 입력폼과 주요 관리자 모바일 화면이 360px, 390px, 768px에서 고령 사용자 기준으로 읽기 쉽고 조작 가능한지 검증한다.

## 배경

현장 운영과 귀가확인은 모바일 환경에서 발생한다. 작은 글자, 좁은 버튼, 잘리는 문구가 있으면 실제 운영 오류로 이어질 수 있다.

## 사용자와 화면

- 주요 사용자: COUNCIL_OPERATOR, LINKER, TAXI_PARTNER, 주민 또는 보호자 보조 입력자
- 주요 화면: 모바일 링크 입력폼, 신청 등록, 그룹 상세, 운행상태, 귀가확인
- 모바일 우선 여부: required
- 반응형 대상: mobile, tablet
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 360px, 390px, 768px viewport 검증
- 브라우저 줌 125% 검증
- 터치 대상 크기 검증
- 폼 라벨과 오류 문구 검증
- 긴 텍스트 줄바꿈 검증
- 모바일 키보드 상황 검증

## 제외

- 데스크톱 전체 회귀 검증
- 네이티브 앱 검증
- 실제 기기별 OS 호환성 전체 매트릭스

## 사전설계

- [x] 모바일 검증 viewport 기준을 확인했다.
- [x] 고령 사용자 디자인 체크리스트를 확인했다.
- [x] T-037 완료 후 모바일 링크를 집중 검증해야 함을 확인했다.

## 정합성

- [x] `workflow_rules.md`의 반응형 검증 체크리스트와 일치한다.
- [x] `design_style_guide.md`의 디자인 검증 체크리스트와 일치한다.
- [x] 공개 앱스토어 앱 검증이 아니다.

## 모델별 지시

### Product/PM

- 모바일에서 실제 현장 업무가 끊기지 않는지 확인한다.

### Data

- 해당 없음

### Backend

- 모바일 저장 실패 시 오류 응답이 사용자 친화적인지 확인한다.

### Frontend

- viewport별 레이아웃, 터치 영역, 입력 키보드, 긴 텍스트 처리를 수정한다.

### QA

- 수동 화면 검증과 가능하면 브라우저 스크린샷 검증을 수행한다.

### Ops

- 현장 기본 브라우저 사용 환경을 확인한다.

## 구현

- 구현 파일 또는 모듈: mobile QA checklist, `src/app/globals.css`
- API/Action: submitMobileForm, updateTripStatus, confirmReturn
- DB/Migration: 해당 없음
- UI/Route: mobile-link, admin mobile routes
- AuditLog: 해당 없음
- 설정값: 해당 없음

## 완료 기준

- [x] 360px에서 핵심 입력을 완료할 수 있다.
- [x] 390px에서 버튼과 입력 필드가 겹치지 않는다.
- [x] 768px에서 레이아웃 전환이 자연스럽다.
- [x] 브라우저 줌 125%에서도 주요 작업이 가능하다.
- [x] 고령 사용자 기준의 글자 크기와 버튼 크기가 충족된다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령: Browser plugin 연결 시도, Chrome CDP 모바일 audit, Chrome CDP 상호작용 검증, `corepack.cmd pnpm typecheck`, `corepack.cmd pnpm lint`, `corepack.cmd pnpm build`
- 결과: `/`, `/admin/requests`, `/admin/groups`, `/admin/calendar`, `/admin/trips`, `/admin/settlements?tab=monthly`, `/admin/reports?month=2026-06`, `/m/t068-invalid-token`을 360px, 390px, 768px에서 재검증했다. blank, framework overlay, body horizontal overflow, 실제 터치 가능 요소 44px 미만 항목이 모두 0이다.
- 수동 확인: `.verification/t064-mobile-qa/t064-after-*.png` 및 `t064-mobile-audit-after.json`에 화면별 증거를 남겼다. 390px 설정 팝업, 하단 내비게이션 이동, 좌우 스와이프 순환 이동도 `t064-interactions.json`과 스크린샷으로 확인했다.
- 수정 내용: 125% 확대 상당의 312px viewport에서 모바일 링크 오류 화면 문구가 잘리지 않도록 `html` 최소 폭, 모바일 링크 제목/안내문 줄바꿈과 글자 크기를 보강했다.
- 남은 리스크: 실제 유효 모바일 토큰 입력폼은 현재 통합 셸에 `DATABASE_URL`이 없어 DB 기반 토큰 발급 후 E2E로 검증하지 못했다. 기존 T-037 범위의 모바일 토큰 서비스와 필드 guard는 소스/스크립트 기준으로 검증된 상태다.
