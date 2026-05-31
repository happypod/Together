# P2-002 사용자 역할 관리 고도화

## 메타

- Priority: P2
- Status: done
- Owner: Codex
- Depends on: T-065
- Area: auth, ops, frontend
- Work type: feature
- Target surface: admin-desktop, api
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-31

## 목표

기본 역할 기반 접근 제어를 넘어 사용자 초대, 역할 변경, 비활성화, 감사 이력을 관리하는 화면과 절차를 고도화한다.

## 배경

P0에서는 최소 RBAC가 우선이다. 운영자가 늘어나면 사용자 생명주기와 권한 변경 이력을 더 명확히 관리해야 한다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN limited
- 주요 화면: 사용자 관리, 역할 변경, 비활성화
- 모바일 우선 여부: optional
- 반응형 대상: desktop
- 디자인 기준: `design_style_guide.md` 적용

## 범위

- 사용자 초대 또는 생성
- 역할 변경
- 사용자 비활성화
- 최근 로그인 확인
- 권한 변경 AuditLog

## 제외

- SSO 전체 연동
- 조직별 멀티테넌시
- 복잡한 권한 빌더

## 사전설계

- [x] T-065 권한 검증 이후 고도화해야 함을 확인했다.
- [x] 권한 변경은 AuditLog 대상임을 확인했다.
- [x] SUPER_ADMIN 전용 범위가 필요함을 확인했다.

## 정합성

- [x] `definitions.md`의 User 모델과 권한 원칙을 따른다.
- [x] P0 최소 RBAC와 충돌하지 않는다.
- [x] `design_style_guide.md`의 위험 작업 확인 기준을 따른다.

## 모델별 지시

### Product/PM

- 실제 운영자 추가/퇴사/역할 변경 절차를 확인한다.

### Data

- User, AuditLog, role history 필요 여부를 검토한다.

### Backend

- 사용자 생성, 역할 변경, 비활성화 권한을 구현한다.

### Frontend

- 위험 작업 확인과 쉬운 권한 설명을 제공한다.

### QA

- 권한 변경, 비활성화, AuditLog를 검증한다.

### Ops

- 초기 관리자 계정과 계정 복구 절차를 확인한다.

## 구현

- 구현 파일 또는 모듈:
  - `src/server/users/user-management-service.ts`
  - `src/app/admin/users/page.tsx`
  - `src/app/admin/users/actions.ts`
  - `src/features/users/user-management-workspace.tsx`
  - `src/domain/auth/permissions.ts`
  - `src/domain/auth/rbac-policy.ts`
- API/Action: `createUser`, `updateUserRole`, `deactivateUser`, `reactivateUser`
- DB/Migration: 신규 테이블 없음. `User.lastLoginAt`과 `AuditLog` 활용
- UI/Route: `/admin/users`
- AuditLog: `CREATE`, `UPDATE`, `STATUS_CHANGE`
- 설정값: invitation policy는 화면 정책 문구와 서버 검증으로 반영

## 완료 기준

- [x] 사용자를 생성 또는 초대할 수 있다.
- [x] 역할 변경이 AuditLog에 남는다.
- [x] 비활성 사용자는 접근할 수 없다.
- [x] 위험 작업 확인이 명확하다.
- [x] 검증 기록이 남았다.

## 검증 기록

- 명령:
  - `npx.cmd tsx scripts\verify-rbac-access.ts`
  - `npx.cmd tsx scripts\verify-user-management.ts`
  - `npx.cmd tsx scripts\verify-p0-acceptance.ts`
  - `corepack.cmd pnpm typecheck`
  - `corepack.cmd pnpm lint`
  - `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/together'; corepack.cmd pnpm db:validate`
  - `corepack.cmd pnpm build`
  - `curl.exe -4 -I http://localhost:3000/admin/users`
- 결과:
  - `ANCHOR_ADMIN`은 제한 역할만 생성/변경할 수 있고 `SUPER_ADMIN`, `ANCHOR_ADMIN` 계정 관리는 거부된다.
  - `VIEWER`는 사용자 생성이 거부된다.
  - 본인 역할 변경과 본인 비활성화는 거부된다.
  - 역할 변경과 비활성화는 확인 체크와 사유가 필요하다.
  - `/admin/users`는 HTTP 200으로 렌더링되고 production build에 포함된다.
- 수동 확인:
  - Browser 플러그인 시도 후 실패하여 Chrome CDP로 1280px, 390px 화면을 확인했다.
  - 사용자 관리 정책, 생성 폼, 4개 미리보기 사용자 카드, 최근 AuditLog 섹션, 모바일 단일 컬럼 레이아웃을 확인했다.
- 남은 리스크:
  - 실제 DB 연결 상태의 사용자 생성/역할 변경/비활성화 commit과 AuditLog persist 검증은 `DATABASE_URL` 준비 후 재검증한다.
  - SSO, 조직별 멀티테넌시, 복잡한 권한 빌더는 제외 범위다.
