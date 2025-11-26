-- CreateTable
CREATE TABLE "PoFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PoEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "msgid" TEXT NOT NULL,
    "msgstr" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PoEntry_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "PoFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PoEntry_fileId_idx" ON "PoEntry"("fileId");
