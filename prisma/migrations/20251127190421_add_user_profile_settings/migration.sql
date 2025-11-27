-- CreateTable
CREATE TABLE "UserProfileSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showProjects" BOOLEAN NOT NULL DEFAULT true,
    "showTranslationTables" BOOLEAN NOT NULL DEFAULT true,
    "showPoFiles" BOOLEAN NOT NULL DEFAULT true,
    "showEntriesCount" BOOLEAN NOT NULL DEFAULT true,
    "showActivityChart" BOOLEAN NOT NULL DEFAULT true,
    "showLanguageStats" BOOLEAN NOT NULL DEFAULT true,
    "showProjectStats" BOOLEAN NOT NULL DEFAULT true,
    "showRecentActivity" BOOLEAN NOT NULL DEFAULT true,
    "showPosts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfileSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfileSettings_userId_key" ON "UserProfileSettings"("userId");

-- CreateIndex
CREATE INDEX "UserProfileSettings_userId_idx" ON "UserProfileSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserProfileSettings" ADD CONSTRAINT "UserProfileSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
