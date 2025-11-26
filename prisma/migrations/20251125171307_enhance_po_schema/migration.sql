-- AlterTable
ALTER TABLE "PoEntry" ADD COLUMN "description" TEXT;
ALTER TABLE "PoEntry" ADD COLUMN "references" TEXT;

-- AlterTable
ALTER TABLE "PoFile" ADD COLUMN "language" TEXT;

-- CreateTable
CREATE TABLE "PoFileMetadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    CONSTRAINT "PoFileMetadata_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "PoFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PoFileMetadata_fileId_key_key" ON "PoFileMetadata"("fileId", "key");
