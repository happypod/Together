# 백천마을 동행이동 OS 티켓 운영 기준

이 폴더는 백천마을 동행이동 OS MVP를 설계하고 제작하기 위한 작업 관리 공간이다.

## 구조

- `_roadmap/master_plan.md`: 제품, 범위, 아키텍처, 마일스톤의 단일 기준 문서
- `_roadmap/design_review.md`: 마스터플랜 검토 결과와 보완 반영 내역
- `_roadmap/pre_design_audit.md`: 전체 티켓 사전설계 전 누락/정합성 검증 결과
- `_roadmap/pre_design_sequence.md`: 큐 순서별 전체 티켓 사전설계 진행 현황
- `_roadmap/pre_design_optimization.md`: 사전설계 최적화와 구현 배치 전략
- `_roadmap/open_decisions.md`: 구현 전 확정해야 할 결정사항과 권장 기본안
- `_roadmap/implementation_blueprint.md`: 구현 모듈, 라우트, 서비스, 테스트 전략
- `_roadmap/quality_gates.md`: 구현 단계별 품질 게이트
- `_roadmap/traceability_matrix.md`: 요구사항, 티켓, 검증 연결표
- `_roadmap/queue.md`: 실행 순서와 우선순위 큐
- `_roadmap/status.json`: 자동화 또는 에이전트가 읽을 수 있는 현재 상태
- `_roadmap/definitions.md`: 용어, 상태값, 권한, 데이터 모델 약속
- `_roadmap/decisions.md`: 주요 설계 의사결정 기록
- `_roadmap/workflow_rules.md`: 사전설계, 정합성, 구현, 검증 순서와 모바일/작업지시서 규칙
- `_roadmap/design_style_guide.md`: 고령 사용자 중심 디자인 스타일과 UI/UX 규칙
- `_templates/ticket.md`: 신규 티켓 작성 템플릿
- `p0`: MVP 운영에 필수인 작업
- `p1`: 운영 효율과 리포팅 개선 작업
- `p2`: 2단계 검토 또는 확장 작업

## 상태값

- `planned`: 아직 시작하지 않음
- `ready`: 바로 착수 가능
- `in_progress`: 진행 중
- `blocked`: 외부 결정 또는 선행 작업 필요
- `review`: 구현 후 검토 또는 테스트 필요
- `done`: 완료

## 진행 원칙

1. P0 티켓을 먼저 끝낸다.
2. 모든 작업은 사전설계, 정합성, 구현, 검증 순서로 진행한다.
3. 신규 작업지시서는 `_templates/ticket.md`의 표준 포맷을 따른다.
4. 모든 UI 작업은 고령 사용자 기준의 밝고 가독성 높은 스타일을 따른다.
5. 모바일 우선 설계를 기본으로 하고 360px, 390px, 768px, 1280px 이상에서 반응형을 확인한다.
6. MVP 제외 범위는 `_roadmap/master_plan.md`의 제외 기능 기준을 따른다.
7. 주민 연락처 등 개인정보는 목록 화면에서 마스킹하고, 상세 접근은 역할 권한으로 제한한다.
8. 상태 변경, CSV 내보내기, 정산 수정, 주요 생성과 수정은 AuditLog에 남긴다.
9. 기능 구현 전에는 `definitions.md`의 용어와 상태값을 먼저 맞춘다.
10. 구현 배치는 `pre_design_optimization.md`와 `quality_gates.md`의 순서를 따른다.
