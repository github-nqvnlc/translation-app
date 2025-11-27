-- AlterTable
ALTER TABLE "UserProfileSettings" ADD COLUMN     "allowAvatarComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showAvatarLikes" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AvatarLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvatarLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvatarLike_targetUserId_idx" ON "AvatarLike"("targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AvatarLike_userId_targetUserId_key" ON "AvatarLike"("userId", "targetUserId");

-- CreateIndex
CREATE INDEX "AvatarComment_targetUserId_idx" ON "AvatarComment"("targetUserId");

-- CreateIndex
CREATE INDEX "AvatarComment_authorId_idx" ON "AvatarComment"("authorId");

-- AddForeignKey
ALTER TABLE "AvatarLike" ADD CONSTRAINT "AvatarLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarLike" ADD CONSTRAINT "AvatarLike_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarComment" ADD CONSTRAINT "AvatarComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarComment" ADD CONSTRAINT "AvatarComment_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
