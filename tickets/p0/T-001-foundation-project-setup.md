# T-001 프로젝트 초기 세팅

## 메타

- Priority: P0
- Status: done
- Owner: TBD
- Depends on: -
- Area: foundation
- Work type: foundation
- Target surface: admin-desktop, admin-mobile
- 디자인 기준: `design_style_guide.md` 적용
- Updated at: 2026-05-30

## 목표

소원권역 동행이동 OS를 제작할 수 있는 기본 애플리케이션, 개발 스크립트, 환경 파일, 코드 품질 도구, 기본 레이아웃을 준비한다.

## 배경

현재 workspace에는 구현 repo가 없으므로, 이후 P0 기능을 안정적으로 얹을 수 있는 프로젝트 기반이 먼저 필요하다.

## 사용자와 화면

- 주요 사용자: SUPER_ADMIN, ANCHOR_ADMIN, COUNCIL_OPERATOR, VIEWER
- 주요 화면: 관리자 공통 레이아웃, 관리자 홈 placeholder
- 모바일 우선 여부: required
- 반응형 대상: all

## 범위

- Next.js App Router와 TypeScript 프로젝트 생성 또는 기존 repo 구조 확정
- 패키지 매니저와 스크립트 확정
- 기본 레이아웃, 관리자 내비게이션, 공통 페이지 셸 구성
- lint, typecheck, build 스크립트 구성
- `.env.example` 작성
- README에 로컬 실행 방법 기록

## 제외

- 실제 데이터 모델 구현
- 실제 인증 연동
- 배포 자동화

## 구현 메모

- 확정안은 Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL 호환 스키마, Vercel, pnpm이다.
- 프로젝트 스택이 바뀌면 `tickets/_roadmap/decisions.md`에 새 결정 기록을 남긴다.

## 사전설계

- [x] 프로젝트 스택과 패키지 매니저 후보를 확인한다.
- [x] 관리자 웹과 모바일 접근이 모두 가능한 기본 라우팅 구조를 잡는다.
- [x] 개발, 테스트, 빌드 명령을 정한다.

## 정합성

- [x] `master_plan.md`의 기본 스택과 충돌하지 않는다.
- [x] `workflow_rules.md`의 모바일 breakpoint 검증 기준을 반영한다.
- [x] 추후 Prisma, Auth, RBAC 추가가 가능한 구조다.

## 모델별 지시

### Product/PM

- MVP 첫 화면이 내부 운영관리 시스템으로 보이도록 범위를 확인한다.

### Data

- DB 연결 전이라도 Prisma 또는 ORM 폴더가 들어갈 위치를 정한다.

### Backend

- Server Action/API가 들어갈 기본 디렉터리 규칙을 정한다.

### Frontend

- 모바일 단일 컬럼, 데스크톱 확장 레이아웃이 가능한 공통 셸을 만든다.

### QA

- 개발 서버, build, typecheck, lint 가능 여부를 확인한다.

### Ops

- `.env.example`과 실행 README를 준비한다.

## 구현

- 구현 파일 또는 모듈: project root, app shell, README, env example
- API/Action: 해당 없음
- DB/Migration: 해당 없음
- UI/Route: 관리자 기본 라우트
- AuditLog: 해당 없음
- 설정값: 환경변수 예시

## 완료 기준

- [x] 로컬 개발 서버가 실행된다.
- [x] `lint`, `typecheck`, `build` 스크립트가 존재한다.
- [x] 관리자 웹 첫 화면이 비어 있지 않게 렌더링된다.
- [x] 360px, 390px, 768px, 1280px 이상에서 기본 레이아웃이 깨지지 않는다.
- [x] 기본 레이아웃이 밝고 가독성이 높으며 고령 사용자 기준의 글자 크기와 버튼 크기를 반영한다.
- [x] 초기 README와 `.env.example`이 있다.
- [x] `status.json`이 다음 활성 티켓으로 갱신된다.

## 검증 기록

- 명령:
  - `corepack pnpm install --trust-lockfile --config.confirmModulesPurge=false`
  - `corepack pnpm typecheck`
  - `corepack pnpm lint`
  - `corepack pnpm build`
  - PowerShell dev server job + `curl.exe -4 -I http://127.0.0.1:3000`
  - Headless Chrome screenshot: `.verification/t001-360x900.png`, `.verification/t001-390x900.png`, `.verification/t001-768x1024.png`, `.verification/t001-1280x900.png`
- 결과: install, typecheck, lint, build, dev server HTTP 200 OK 확인.
- 수동 확인: 768px와 1280px 캡처에서 레이아웃, 카드 간격, 버튼 크기, 텍스트 대비가 기준을 만족한다. 360px/390px는 모바일 단일 컬럼과 가로 스크롤 내비게이션 구조를 확인했다.
- 남은 리스크: 실제 데이터 모델, 인증, RBAC, AuditLog는 T-002/T-007에서 구현한다.
