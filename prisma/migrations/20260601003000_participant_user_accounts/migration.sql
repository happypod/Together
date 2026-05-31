ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'RESIDENT';

ALTER TABLE "Resident" ADD COLUMN "userId" UUID;
ALTER TABLE "Linker" ADD COLUMN "userId" UUID;

CREATE UNIQUE INDEX "Resident_userId_key" ON "Resident"("userId");
CREATE INDEX "Resident_userId_idx" ON "Resident"("userId");

CREATE UNIQUE INDEX "Linker_userId_key" ON "Linker"("userId");
CREATE INDEX "Linker_userId_idx" ON "Linker"("userId");

ALTER TABLE "Resident"
  ADD CONSTRAINT "Resident_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Linker"
  ADD CONSTRAINT "Linker_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
