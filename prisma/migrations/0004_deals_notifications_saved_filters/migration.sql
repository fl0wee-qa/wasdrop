-- CreateEnum
CREATE TYPE "public"."DealSourceType" AS ENUM ('OFFICIAL', 'KEYSHOP');

-- AlterTable Deal
ALTER TABLE "public"."Deal"
ADD COLUMN "sourceType" "public"."DealSourceType" NOT NULL DEFAULT 'OFFICIAL',
ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 80;

-- AlterTable PriceAlert
ALTER TABLE "public"."PriceAlert"
ADD COLUMN "minDiscountPercent" INTEGER,
ADD COLUMN "notifyOnHistoricalLow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "notifyOnFreebie" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "notifyOnNewDeal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastNotifiedAt" TIMESTAMP(3);

-- CreateTable SavedFilter
CREATE TABLE "public"."SavedFilter" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'deals',
  "queryJson" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable NotificationPreference
CREATE TABLE "public"."NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "webPushEnabled" BOOLEAN NOT NULL DEFAULT false,
  "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
  "digestFrequency" TEXT,
  "quietHoursStart" INTEGER,
  "quietHoursEnd" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable NotificationEvent
CREATE TABLE "public"."NotificationEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "linkUrl" TEXT,
  "metadataJson" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Deal_country_sourceType_idx" ON "public"."Deal"("country", "sourceType");
CREATE INDEX "SavedFilter_userId_scope_idx" ON "public"."SavedFilter"("userId", "scope");
CREATE UNIQUE INDEX "SavedFilter_userId_scope_name_key" ON "public"."SavedFilter"("userId", "scope", "name");
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "public"."NotificationPreference"("userId");
CREATE INDEX "NotificationEvent_userId_createdAt_idx" ON "public"."NotificationEvent"("userId", "createdAt");
CREATE INDEX "NotificationEvent_userId_isRead_createdAt_idx" ON "public"."NotificationEvent"("userId", "isRead", "createdAt");

-- Foreign Keys
ALTER TABLE "public"."SavedFilter"
ADD CONSTRAINT "SavedFilter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."NotificationPreference"
ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."NotificationEvent"
ADD CONSTRAINT "NotificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
