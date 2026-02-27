-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('VIEW_GAME', 'VIEW_NEWS', 'WISHLIST_ADD', 'WISHLIST_REMOVE', 'ALERT_CREATE', 'ALERT_DELETE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "preferredCountry" TEXT DEFAULT 'US',
    "steamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Game" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "externalIdsJson" JSONB,
    "description" TEXT,
    "releaseDate" TIMESTAMP(3),
    "genresJson" JSONB,
    "developer" TEXT,
    "publisher" TEXT,
    "systemReqMin" TEXT,
    "systemReqRec" TEXT,
    "steamAppId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameImage" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Deal" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "originalPriceCents" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceSnapshot" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "originalPriceCents" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "targetPriceCents" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewsSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "contentSnippet" TEXT,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminCuration" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "itemsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "message" TEXT,
    "logsJson" JSONB,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "gameId" TEXT,
    "newsArticleId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_steamId_key" ON "public"."User"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "public"."Store"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "public"."Game"("slug");

-- CreateIndex
CREATE INDEX "GameImage_gameId_type_idx" ON "public"."GameImage"("gameId", "type");

-- CreateIndex
CREATE INDEX "Deal_country_discountPercent_idx" ON "public"."Deal"("country", "discountPercent");

-- CreateIndex
CREATE INDEX "Deal_country_priceCents_idx" ON "public"."Deal"("country", "priceCents");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_gameId_storeId_country_key" ON "public"."Deal"("gameId", "storeId", "country");

-- CreateIndex
CREATE INDEX "PriceSnapshot_gameId_country_date_idx" ON "public"."PriceSnapshot"("gameId", "country", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PriceSnapshot_gameId_storeId_country_date_key" ON "public"."PriceSnapshot"("gameId", "storeId", "country", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_gameId_key" ON "public"."WishlistItem"("userId", "gameId");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_isActive_idx" ON "public"."PriceAlert"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NewsSource_feedUrl_key" ON "public"."NewsSource"("feedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "public"."NewsArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_url_key" ON "public"."NewsArticle"("url");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "public"."NewsArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_category_idx" ON "public"."NewsArticle"("category");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "public"."AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "JobRun_jobName_startedAt_idx" ON "public"."JobRun"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_createdAt_idx" ON "public"."UserActivity"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameImage" ADD CONSTRAINT "GameImage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deal" ADD CONSTRAINT "Deal_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deal" ADD CONSTRAINT "Deal_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceAlert" ADD CONSTRAINT "PriceAlert_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewsArticle" ADD CONSTRAINT "NewsArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."NewsSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserActivity" ADD CONSTRAINT "UserActivity_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

