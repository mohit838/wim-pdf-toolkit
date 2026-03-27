-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'ADMIN');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorPendingSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" "AdminRole",
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsRelease" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "frontendRevalidatedAt" TIMESTAMP(3),
    "frontendRevalidateOk" BOOLEAN,
    "frontendRevalidateNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteShellDraft" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteShellDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteShellPublished" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "SiteShellPublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageDraft" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepagePublished" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "HomepagePublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolContentDraft" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolContentPublished" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "ToolContentPublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoConfigDraft" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoConfigDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoConfigPublished" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "SeoConfigPublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationDraft" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "scope" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "lastPublishedAt" TIMESTAMP(3),
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationPublished" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "scope" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "lastPublishedAt" TIMESTAMP(3),
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "IntegrationPublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPlacementDraft" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "slotId" TEXT NOT NULL,
    "scopes" TEXT[],
    "categories" TEXT[],
    "environment" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "lastPublishedAt" TIMESTAMP(3),
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlacementDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPlacementPublished" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "slotId" TEXT NOT NULL,
    "scopes" TEXT[],
    "categories" TEXT[],
    "environment" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "lastPublishedAt" TIMESTAMP(3),
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "AdPlacementPublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdsTxtDraft" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "lines" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdsTxtDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdsTxtPublished" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "lines" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "AdsTxtPublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPageDraft" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ctaTitle" TEXT,
    "ctaDescription" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPageDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPageSectionDraft" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPageSectionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPagePublished" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ctaTitle" TEXT,
    "ctaDescription" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "LegalPagePublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPageSectionPublished" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "LegalPageSectionPublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqEntryDraft" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqEntryDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqEntryPublished" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "FaqEntryPublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideDraft" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidePublished" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "GuidePublished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "timezone" TEXT,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "VisitorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "PermissionAssignment_module_action_idx" ON "PermissionAssignment"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionAssignment_userId_module_action_key" ON "PermissionAssignment"("userId", "module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_sessionId_key" ON "AdminSession"("sessionId");

-- CreateIndex
CREATE INDEX "AdminSession_userId_expiresAt_idx" ON "AdminSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_module_action_idx" ON "AuditLog"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "CmsRelease_version_key" ON "CmsRelease"("version");

-- CreateIndex
CREATE INDEX "IntegrationDraft_kind_idx" ON "IntegrationDraft"("kind");

-- CreateIndex
CREATE INDEX "IntegrationPublished_kind_idx" ON "IntegrationPublished"("kind");

-- CreateIndex
CREATE INDEX "AdPlacementDraft_slotId_idx" ON "AdPlacementDraft"("slotId");

-- CreateIndex
CREATE INDEX "AdPlacementPublished_slotId_idx" ON "AdPlacementPublished"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalPageDraft_slug_key" ON "LegalPageDraft"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LegalPageSectionDraft_pageId_order_key" ON "LegalPageSectionDraft"("pageId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LegalPagePublished_slug_key" ON "LegalPagePublished"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LegalPageSectionPublished_pageId_order_key" ON "LegalPageSectionPublished"("pageId", "order");

-- CreateIndex
CREATE INDEX "FaqEntryDraft_order_idx" ON "FaqEntryDraft"("order");

-- CreateIndex
CREATE INDEX "FaqEntryPublished_order_idx" ON "FaqEntryPublished"("order");

-- CreateIndex
CREATE UNIQUE INDEX "GuideDraft_slug_key" ON "GuideDraft"("slug");

-- CreateIndex
CREATE INDEX "GuideDraft_category_idx" ON "GuideDraft"("category");

-- CreateIndex
CREATE UNIQUE INDEX "GuidePublished_slug_key" ON "GuidePublished"("slug");

-- CreateIndex
CREATE INDEX "GuidePublished_category_idx" ON "GuidePublished"("category");

-- CreateIndex
CREATE INDEX "VisitorEvent_createdAt_idx" ON "VisitorEvent"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "VisitorEvent_path_idx" ON "VisitorEvent"("path");

-- AddForeignKey
ALTER TABLE "PermissionAssignment" ADD CONSTRAINT "PermissionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteShellPublished" ADD CONSTRAINT "SiteShellPublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepagePublished" ADD CONSTRAINT "HomepagePublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolContentPublished" ADD CONSTRAINT "ToolContentPublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoConfigPublished" ADD CONSTRAINT "SeoConfigPublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationPublished" ADD CONSTRAINT "IntegrationPublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPlacementPublished" ADD CONSTRAINT "AdPlacementPublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdsTxtPublished" ADD CONSTRAINT "AdsTxtPublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalPageSectionDraft" ADD CONSTRAINT "LegalPageSectionDraft_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "LegalPageDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalPagePublished" ADD CONSTRAINT "LegalPagePublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalPageSectionPublished" ADD CONSTRAINT "LegalPageSectionPublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalPageSectionPublished" ADD CONSTRAINT "LegalPageSectionPublished_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "LegalPagePublished"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqEntryPublished" ADD CONSTRAINT "FaqEntryPublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidePublished" ADD CONSTRAINT "GuidePublished_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CmsRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
