# Open Decisions

- Date: 2026-05-30
- Purpose: 구현 착수 전 확정이 필요한 결정을 한곳에 모은다.
- Rule: 각 결정은 관련 티켓의 사전설계 단계에서 확정하고, 확정 후 `decisions.md`에 accepted decision으로 옮긴다.
- Current Summary: 2026-05-30 기준으로 구현 착수 전 필수 open decision 6건은 모두 accepted 상태다. 이후 변경은 새 decision 항목으로 남긴다.

## OD-001. 프로젝트 스택 최종 확정

- Status: accepted
- Related tickets: T-001, T-002
- Required before: T-001 implementation
- Resolution: Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL 호환 스키마, Vercel 배포, pnpm 패키지 매니저를 기본 스택으로 확정한다.
- Notes:
  - DB는 PostgreSQL 호환을 전제로 설계하며, 실제 호스팅은 Supabase Postgres 또는 동등한 PostgreSQL 서비스를 사용할 수 있다.
  - 인증과 파일 저장 방식은 OD-003, OD-004 결정을 따른다.
- Risk controlled: 프로젝트 초기 구조, 타입, ORM, 배포 기준을 T-001에서 바로 고정할 수 있다.

## OD-002. 정산 원 단위 처리 정책

- Status: accepted
- Related tickets: T-008, T-006, T-063
- Required before: T-006 implementation
- Resolution: 주민 1인 분담액은 원 단위 `FLOOR`로 계산한다. 잔여 원 단위 차액은 기본적으로 `anchorSupportAmount`에 반영하고, 예외는 `CUSTOM` 조정과 사유 기록으로 처리한다.
- Notes:
  - 10원/100원 단위 절사는 기본 적용하지 않는다.
  - 정산 정책 값은 `AppSetting`으로 분리한다.
  - 정산 잠금 후 수정은 AuditLog와 수정 사유를 필수로 남긴다.
- Risk controlled: 정산 테스트, 월간 리포트, CSV 금액 기준이 동일해진다.

## OD-003. 영수증 저장 방식

- Status: accepted
- Related tickets: T-007, T-006, T-055
- Required before: T-006 implementation
- Resolution: P0는 `receiptUrl` 또는 외부 저장 URL을 `FileAttachment` 메타데이터로 기록한다. 앱 내 직접 업로드는 저장소와 권한 정책이 확정된 후 별도 확장으로 진행한다.
- Notes:
  - 허용 형식은 이미지 또는 PDF를 기본으로 한다.
  - 기본 최대 크기 기준은 10MB로 둔다.
  - 외부 URL이라도 접근 권한, 개인정보 포함 여부, 등록자, 등록 시각을 함께 관리한다.
- Risk controlled: 정산 증빙 UI와 보안 검증을 P0에서 지연 없이 설계할 수 있다.

## OD-004. 인증 방식과 사용자 초대 방식

- Status: accepted
- Related tickets: T-007, P2-002
- Required before: T-007 implementation
- Resolution: P0는 이메일/비밀번호 기반 세션 인증과 초기 seed `SUPER_ADMIN` 계정으로 시작한다. 사용자 초대, 비밀번호 재설정, 세부 역할 관리 고도화는 P2-002에서 확장한다.
- Notes:
  - 모든 쓰기 작업은 서버 권한 검증을 통과해야 한다.
  - 모바일 링크형 입력은 로그인 계정이 아니라 `MobileFormToken` 범위로 제한한다.
  - 초기 계정 정보는 운영 환경 변수 또는 seed 절차에서만 관리한다.
- Risk controlled: 권한 검증 주체와 모바일 토큰 발급 주체가 명확해진다.

## OD-005. 리포트 기준일

- Status: accepted
- Related tickets: T-008, T-052, T-055
- Required before: T-052 implementation
- Resolution: 월간 리포트와 CSV의 기본 월 분류는 `serviceDate` 기준으로 한다. 성과 확정 건수는 `RETURN_CONFIRMED` 이상 상태를 기준으로 집계한다.
- Notes:
  - 취소 건은 별도 집계하거나 기본 성과 집계에서 제외한다.
  - 정산 미완료 건은 완료 건과 섞지 않고 pending으로 표시한다.
  - 리포트 기준은 `AppSetting`에 저장하되 기본값은 `serviceDate`다.
- Risk controlled: 대시보드, 월간 리포트, CSV 수치 기준이 통일된다.

## OD-006. 초기 주민 및 동행링커 데이터 이관 방식

- Status: accepted
- Related tickets: T-002, T-003, T-005
- Required before: T-003 implementation
- Resolution: MVP 초기에는 seed 데이터와 운영자 수동 입력을 기본으로 한다. 대량 CSV import는 MVP 필수 범위에서 제외하고 추후 별도 티켓으로 분리한다.
- Notes:
  - 기존 데이터가 있다면 운영자가 개인정보 동의 여부를 확인한 뒤 수동 등록한다.
  - seed는 시연과 QA에 필요한 최소 샘플만 포함한다.
  - 주민, 보호자, 동행링커 연락처는 목록 화면에서 마스킹한다.
- Risk controlled: 초기 테스트 데이터 범위가 명확해지고 개인정보 이관 리스크를 줄인다.

## Decision Workflow

1. 관련 티켓의 사전설계에서 decision candidate를 검토한다.
2. 권장 기본안을 채택하거나 새 대안을 작성한다.
3. 확정된 내용은 `decisions.md`에 accepted 항목으로 추가한다.
4. `status.json.openDecisions`에서 해당 항목을 제거하거나 상태 메모를 갱신한다.
