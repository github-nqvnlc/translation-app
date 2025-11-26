-- CreateTable
CREATE TABLE "PoFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" TEXT,

    CONSTRAINT "PoFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoEntry" (
    "id" SERIAL NOT NULL,
    "msgid" TEXT NOT NULL,
    "msgstr" TEXT NOT NULL,
    "description" TEXT,
    "references" TEXT,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoFileMetadata" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "PoFileMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationTable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationEntry" (
    "id" SERIAL NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "description" TEXT,
    "references" TEXT,
    "tableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoEntry_fileId_idx" ON "PoEntry"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "PoFileMetadata_fileId_key_key" ON "PoFileMetadata"("fileId", "key");

-- CreateIndex
CREATE INDEX "TranslationEntry_tableId_idx" ON "TranslationEntry"("tableId");

-- AddForeignKey
ALTER TABLE "PoEntry" ADD CONSTRAINT "PoEntry_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "PoFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoFileMetadata" ADD CONSTRAINT "PoFileMetadata_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "PoFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationEntry" ADD CONSTRAINT "TranslationEntry_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "TranslationTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
