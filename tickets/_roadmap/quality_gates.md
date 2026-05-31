# Quality Gates

- Date: 2026-05-31
- Purpose: 구현 전후 품질 기준을 명확히 하여 사전설계와 실제 구현이 분리되지 않게 한다.

## Gate 0. Pre-Design Complete

Required before implementation:

- [x] 모든 큐 항목이 실제 티켓 파일로 연결되어 있다.
- [x] 각 티켓은 표준 작업지시서 섹션을 가진다.
- [x] open decision이 관련 티켓에 배정되어 있다.
- [x] P0와 Full 1차 MVP 완료 기준이 분리되어 있다.
- [x] 모바일/디자인 기준이 각 UI 티켓에 반영되어 있다.

Current status: passed.

## Gate 1. Foundation Ready

Required before T-002:

- [x] 프로젝트 스택 확정
- [x] package manager 확정
- [x] local dev server 실행 가능
- [x] lint, typecheck, build script 존재
- [x] `.env.example` 작성
- [x] 기본 모바일/데스크톱 layout shell 존재

## Gate 2. Domain Ready

Required before T-003:

- [x] User, Resident, MobilityRequest, MobilityGroup, Linker, Settlement, AuditLog 모델 존재
- [x] enum과 상태값이 `definitions.md`와 일치
- [x] seed로 최소 운영 흐름 생성 가능
- [x] 마스킹 유틸리티 존재
- [x] AuditLog utility 존재

Current status: passed after T-002 implementation.

## Gate 3. Security Ready

Required before mobile/linker/taxi workflows:

- [x] 서버 권한 guard 존재
- [x] User.isActive 차단 동작
- [x] MobileFormToken service 존재
- [x] token hash 저장
- [x] token scope별 allowed fields 정의
- [x] FileAttachment validation 기준 존재

Current status: passed after T-007 implementation.

## Gate 3.5. Settings And Report Contract Ready

Required before settlement and reporting implementation:

- [x] `AppSetting` 기본 계약과 seed 값 존재
- [x] 정산 반올림 정책이 재사용 가능한 계산 모듈로 분리됨
- [x] 대시보드와 월간 리포트 산식이 순수 함수로 분리됨
- [x] 월간 요약 CSV와 운행 상세 CSV 컬럼 계약 존재
- [x] 리포트 요약 화면이 360px, 390px, 768px, 1280px에서 확인됨

Current status: passed after T-008 implementation.

## Gate 4. Operational Flow Ready

Required before settlement:

- [x] 신청 생성과 목록 조회 가능
- [x] 그룹 생성과 멤버 3명 제한 동작
- [x] 링커 배정 가능
- [x] 택시 예약요청/확정 기록 가능
- [x] 운행상태와 귀가확인 기록 가능
- [x] 상태 전이 실패 케이스가 차단됨

## Gate 5. Settlement Ready

Required before P0 final QA:

- [x] fareRoundingPolicy 확정
- [x] settlement calculator 단위 테스트 존재
- [x] 정산 완료 잠금 동작
- [x] 정산 수정 사유 필수
- [x] 영수증 링크 또는 첨부 메타데이터 저장
- [x] 대시보드 핵심 KPI 집계

## Gate 6. P0 Release Candidate

Required before P0 Operational MVP done:

- [x] T-061 개인정보 검증 통과
- [x] T-062 상태 전이 검증 통과
- [x] T-063 정산 산식 검증 통과
- [x] T-065 권한 검증 통과
- [x] T-066 금지 표현 검증 통과
- [x] T-067 제외 기능 검증 통과
- [x] T-068 최종 검수 통과
- [x] 360px, 390px, 768px, 1280px visual/manual checks complete
- [x] build/typecheck/schema validation pass

## Gate 7. Full 1차 MVP

Required before Full 1차 MVP done:

- [x] 이동 캘린더 동작
- [x] 모바일 링크형 입력폼 동작
- [x] 사고/민원 기록과 만족도 통계 동작
- [x] 상생기금과 월별 정산표 동작
- [x] 월간 운영리포트와 CSV 동작
- [x] 모바일 화면 검증 통과

## Gate 8. P2 Extension Ready

Required before P2 implementation:

- [x] Full 1차 MVP 완료
- [x] P2 scope 재확인
- [x] 개인정보와 문서 보관 정책 재확인
- [x] PDF, 사용자관리, 취업연계, MOU 중 필요한 기능만 선택

Current status: passed after P2-004 implementation. Neon schema migration and initial SUPER_ADMIN bootstrap are complete; authenticated DB-backed E2E remains as the follow-up verification ticket.
