-- CreateTable
CREATE TABLE "ProjectOverviewSettings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "showSummaryCards" BOOLEAN NOT NULL DEFAULT true,
    "showCompletionCard" BOOLEAN NOT NULL DEFAULT true,
    "showLanguageChart" BOOLEAN NOT NULL DEFAULT true,
    "showRecentUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectOverviewSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectOverviewSettings_projectId_key" ON "ProjectOverviewSettings"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectOverviewSettings" ADD CONSTRAINT "ProjectOverviewSettings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
