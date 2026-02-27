-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;
