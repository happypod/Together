# Prisma

P0 기본 결정은 PostgreSQL 호환 스키마, Prisma, 서버 권한 검증, AuditLog 우선 적용입니다.

## Commands

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
corepack pnpm db:validate
corepack pnpm db:generate
corepack pnpm db:seed
```

## Files

- `schema.prisma`: 핵심 도메인 모델과 enum
- `seed.mjs`: 최소 운영 흐름 seed 초안
- `migrations/20260530000000_initial_domain/migration.sql`: 초기 PostgreSQL SQL migration
