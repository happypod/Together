# Decision Log

## D-001. 시스템 성격

- Date: 2026-05-30
- Status: accepted
- Decision: 백천만 동행이동 OS는 공개 모빌리티 서비스가 아니라 내부 운영관리 시스템으로 제작한다.
- Reason: 주민은 복잡한 회원가입 앱을 사용하지 않고, 운영자가 현장 입력하거나 제한된 링크형 폼으로 보조 입력한다.

## D-002. MVP 제외 기능

- Date: 2026-05-30
- Status: accepted
- Decision: 자동 차량 배정, 외부 차량 요청 API, 자동 결제, 실시간 좌표 추적, 기사 전용 앱, AI 경로 최적화, 의료상담, 건강 민감정보 수집은 MVP에서 제외한다.
- Reason: 1차 목표는 실제 운영 기록과 정산, 권한, 감사로그가 가능한 관리자 웹 MVP다.

## D-003. 공동예약 기본 단위

- Date: 2026-05-30
- Status: accepted
- Decision: 하나의 이동그룹은 주민 최대 3명, 동행링커 1명, 택시 1대를 기준으로 한다.
- Reason: 설계문서의 운영단위와 정산 산식이 이 단위를 기준으로 작성되어 있다.

## D-004. AuditLog 우선 적용 대상

- Date: 2026-05-30
- Status: accepted
- Decision: 생성, 수정, 상태 변경, 정산 수정, CSV 내보내기, 권한 관련 작업은 AuditLog를 남긴다.
- Reason: 개인정보와 보조금성 정산 정보를 다루므로 운영 추적성이 필요하다.

## D-005. 기술 스택 기본안

- Date: 2026-05-30
- Status: accepted
- Decision: Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL 호환 스키마, Vercel 배포, pnpm 패키지 매니저를 기본안으로 확정한다.
- Reason: 관리자 웹 MVP와 서버 액션, 타입 안정성, 관계형 데이터 모델에 적합하다.
- Follow-up: T-001에서 실제 repo 구조와 환경 예시를 이 결정에 맞춰 생성한다.

## D-006. 사용자 모델과 서버 권한 검증

- Date: 2026-05-30
- Status: accepted
- Decision: `User` 모델을 P0 데이터 모델에 포함하고, 모든 쓰기 작업은 서버에서 역할 권한을 검증한다.
- Reason: 설계문서가 `createdByUserId`, 권한 매트릭스, AuditLog를 전제로 하므로 사용자 모델 없이는 구현이 불완전하다.

## D-007. 모바일 링크형 입력 보안

- Date: 2026-05-30
- Status: accepted
- Decision: 모바일 링크형 입력은 `MobileFormToken` 기반으로 구현하고, 토큰에는 scope, 대상 엔티티, 만료시간, 사용 횟수 제한을 둔다.
- Reason: 로그인 없는 보조 입력 링크가 관리자 전체 권한으로 오해되거나 장기 노출되는 위험을 줄여야 한다.

## D-008. 운영 설정 분리

- Date: 2026-05-30
- Status: accepted
- Decision: 기본요금, 최대 그룹 주민 수, 정산 반올림 정책, 모바일 토큰 만료시간, 리포트 기준일은 `AppSetting`으로 분리한다.
- Reason: 문서상의 기본값은 운영 중 바뀔 수 있으므로 코드에 고정하면 유지보수와 검증이 어려워진다.

## D-009. 운영 연락 이력

- Date: 2026-05-30
- Status: accepted
- Decision: 자동 알림은 MVP에서 제외하되, 주민·보호자·동행링커·택시연합과의 수동 연락 확인은 `ContactLog`로 기록할 수 있게 한다.
- Reason: 실제 운영에서는 전화 확인과 변경 안내가 빈번하며, 분쟁과 누락을 줄이기 위한 최소 기록이 필요하다.

## D-010. 파일첨부 공통 모델

- Date: 2026-05-30
- Status: accepted
- Decision: 영수증 등 첨부는 `FileAttachment` 공통 모델로 관리하고, MVP에서는 영수증 링크 또는 제한 파일첨부 중 하나로 시작한다.
- Reason: 정산 증빙은 권한, 파일 크기, 개인정보 포함 안내가 필요하며, 모델 없이 문자열 링크만 두면 추후 확장이 어렵다.

## D-011. 고령 사용자 중심 디자인 기준

- Date: 2026-05-30
- Status: accepted
- Decision: 모든 UI는 고령 사용자를 고려해 밝고 가독성이 높으며 명확한 화면 구성을 우선한다. 상세 기준은 `design_style_guide.md`를 따른다.
- Reason: 현장 운영과 보조 입력에서 고령 사용자가 직접 확인하거나 입력할 수 있으므로, 작은 글자, 낮은 대비, 복잡한 화면, 불명확한 오류 문구는 운영 실수를 늘릴 수 있다.

## D-012. 완료 기준 이원화

- Date: 2026-05-30
- Status: accepted
- Decision: 완료 기준은 P0 Operational MVP와 Full 1차 MVP로 나눈다. P0는 실제 운영 가능한 핵심 흐름, Full 1차 MVP는 P1의 캘린더, 모바일 링크형 입력폼, 월간 리포트, CSV, 통계를 포함한다.
- Reason: 초기 마스터플랜의 포함 범위에는 P1 기능이 포함되어 있었지만 완료 기준은 P0만 요구해 범위 해석 충돌이 있었다.

## D-013. 정산 원 단위 처리 정책

- Date: 2026-05-30
- Status: accepted
- Decision: 주민 1인 분담액은 원 단위 `FLOOR`로 계산한다. 잔여 원 단위 차액은 기본적으로 `anchorSupportAmount`에 반영하고, 예외는 `CUSTOM` 조정과 사유 기록으로 처리한다.
- Reason: 정산 테스트, 월간 리포트, CSV가 동일한 금액 기준을 사용해야 하며, 원 단위 오차를 명시적으로 추적할 수 있어야 한다.

## D-014. 영수증 저장 방식

- Date: 2026-05-30
- Status: accepted
- Decision: P0는 `receiptUrl` 또는 외부 저장 URL을 `FileAttachment` 메타데이터로 기록한다. 앱 내 직접 업로드는 저장소와 권한 정책 확정 후 별도 확장으로 진행한다.
- Reason: 영수증 증빙은 P0에서 필요하지만, 파일 저장소 확정 전에도 URL 메타데이터 방식으로 정산 흐름을 검증할 수 있다.

## D-015. P0 인증 방식

- Date: 2026-05-30
- Status: accepted
- Decision: P0는 이메일/비밀번호 기반 세션 인증과 초기 seed `SUPER_ADMIN` 계정으로 시작한다. 사용자 초대, 비밀번호 재설정, 세부 역할 관리 고도화는 P2-002에서 확장한다.
- Reason: 초기 운영 MVP는 서버 권한 검증과 감사로그가 우선이며, 고급 계정 운영 기능은 핵심 운영 흐름 이후로 분리하는 편이 안전하다.

## D-016. 리포트 기준일

- Date: 2026-05-30
- Status: accepted
- Decision: 월간 리포트와 CSV의 기본 월 분류는 `serviceDate` 기준으로 한다. 성과 확정 건수는 `RETURN_CONFIRMED` 이상 상태를 기준으로 집계한다.
- Reason: 운영 일정 기준과 성과 확정 기준을 분리해야 대시보드, 월간 리포트, CSV 수치가 서로 일관된다.

## D-017. 초기 데이터 이관 방식

- Date: 2026-05-30
- Status: accepted
- Decision: MVP 초기에는 seed 데이터와 운영자 수동 입력을 기본으로 한다. 대량 CSV import는 MVP 필수 범위에서 제외하고 추후 별도 티켓으로 분리한다.
- Reason: 개인정보 동의 확인과 데이터 품질 검증 없이 대량 이관을 먼저 넣으면 초기 운영 리스크가 커진다.
