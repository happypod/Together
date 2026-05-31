# 백천마을 동행이동 OS

관리자 웹 중심의 공동예약형 생활이동 및 동행링커 운영관리 시스템입니다.

## 로컬 실행

```powershell
corepack enable
corepack pnpm install
corepack pnpm dev
```

기본 개발 서버는 `http://localhost:3000`에서 실행됩니다.

## 검증 명령

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

## 환경 변수

`.env.example`을 기준으로 `.env.local`을 구성합니다.

- `DATABASE_URL`: PostgreSQL 호환 DB 연결 문자열
- `NEXTAUTH_SECRET`: 세션 서명용 비밀값
- `INITIAL_SUPER_ADMIN_EMAIL`: 초기 관리자 이메일
- `INITIAL_SUPER_ADMIN_PASSWORD`: 초기 관리자 비밀번호
- `RECEIPT_MAX_FILE_MB`: 영수증 첨부 기준 크기
- `MOBILE_FORM_TOKEN_TTL_HOURS`: 모바일 링크형 입력 토큰 만료 시간
- `REPORT_DATE_BASIS`: 월간 리포트 기준일 기본값
- `SETTLEMENT_ROUNDING_POLICY`: 정산 원 단위 처리 기본값

## 구현 순서

작업은 `tickets/_roadmap/queue.md` 순서를 따릅니다.

```text
사전설계 -> 정합성 -> 구현 -> 검증
```
