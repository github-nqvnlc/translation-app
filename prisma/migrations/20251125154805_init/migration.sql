-- CreateTable
CREATE TABLE "Translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
