# 통합 환경 재검증 기록

## 범위

- 대상 티켓: `T-003` 주민 및 이동 신청 흐름, `T-004` 공동예약 그룹 운영 흐름
- 대상 화면: `/`, `/admin/requests`, `/admin/groups`
- 기준일: 2026-05-30

## 통과 항목

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm db:validate`
- `node --check prisma\seed.mjs`
- `corepack pnpm build`
- `curl.exe -4 -I http://localhost:3000/`
- `curl.exe -4 -I http://localhost:3000/admin/requests`
- `curl.exe -4 -I http://localhost:3000/admin/groups`

## 화면 확인

- 요청 화면 모바일: `.verification/integration-requests-390x900.png`
- 요청 화면 데스크톱: `.verification/integration-requests-1280x900.png`
- 그룹 화면 모바일: `.verification/integration-groups-390x900.png`
- 그룹 화면 데스크톱: `.verification/integration-groups-1280x900.png`

확인 결과 390px와 1280px에서 주요 내비게이션, 안내문, 폼, 목록 영역이 빈 화면이나 가로 넘침 없이 표시된다.

## 미완료 항목

현재 작업 환경에는 `.env` 파일이 없고 현재 셸에도 `DATABASE_URL`, `NEXTAUTH_SECRET` 환경변수가 없다. `localhost:5432` PostgreSQL 연결도 실패했다.

따라서 아래 항목은 DB 연결값과 마이그레이션된 PostgreSQL 세션이 준비된 후 추가 검증해야 한다.

- 실제 주민 신청 저장 DB commit
- 중복 신청 차단 DB 검증
- 신청 생성/수정 AuditLog 저장
- 공동예약 그룹 생성 DB commit
- 그룹 멤버 추가/제거와 픽업 순서 변경 DB commit
- 상태 전이와 취소/예외 사유 AuditLog 저장

## 다음 검증 조건

1. `.env` 또는 셸 환경변수에 `DATABASE_URL`과 `NEXTAUTH_SECRET`을 설정한다.
2. 대상 PostgreSQL DB에 Prisma 마이그레이션을 적용한다.
3. 검증용 운영자 계정으로 T-003/T-004 서버 액션을 실행하고 생성 데이터를 정리한다.
