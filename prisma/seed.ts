import { PrismaClient } from "@prisma/client";
import { createSqliteAdapter } from "../src/lib/prisma-adapter";

const prisma = new PrismaClient({ adapter: createSqliteAdapter() });

const sampleMetadata = [
  { key: "Project-Id-Version", value: "demo-po-viewer" },
  { key: "Language-Team", value: "Vietnamese" },
  { key: "Last-Translator", value: "demo@example.com" },
  { key: "Language", value: "vi" },
];

const sampleEntries = [
  {
    msgid: "Hello world",
    msgstr: "Xin chào thế giới",
    description: "Lời chào mặc định dùng ở trang chủ.",
    references: "app/home/page.tsx:10",
  },
  {
    msgid: "Click to continue",
    msgstr: "Bấm để tiếp tục",
    description: "Hướng dẫn người dùng chuyển bước kế tiếp.",
    references: "app/components/wizard.tsx:42",
  },
  {
    msgid: "Saving changes...",
    msgstr: "Đang lưu thay đổi...",
    description: "Hiển thị khi biểu mẫu đang lưu dữ liệu.",
    references: "app/components/form.tsx:88",
  },
];

async function main() {
  await prisma.poEntry.deleteMany();
  await prisma.poFile.deleteMany();

  await prisma.poFile.create({
    data: {
      filename: "sample.po",
      filesize: 0,
      language: "vi",
      metadata: {
        createMany: {
          data: sampleMetadata,
        },
      },
      entries: {
        createMany: {
          data: sampleEntries,
        },
      },
    },
  });

  console.info(`Seeded sample .po file with ${sampleEntries.length} entries`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

