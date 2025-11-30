-- AlterTable
ALTER TABLE "ProjectOverviewSettings" ADD COLUMN     "showTranslatorLeaderboard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showTranslatorTimeline" BOOLEAN NOT NULL DEFAULT true;
