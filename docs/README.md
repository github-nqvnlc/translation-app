# Translation Workspace – Tổng quan

Tài liệu này mô tả ngắn gọn kiến trúc và các bước cần thiết để vận hành dự án Next.js/Prisma trong thư mục `/Users/vanloc/Documents/project/translation-next-app`.

## Thành phần chính
- **Next.js 16 (App Router)** với kết xuất phía server mặc định và hỗ trợ React Server Components.
- **TypeScript** cho kiểm tra kiểu tĩnh, **ESLint + Prettier** để lint/format thống nhất (kèm plugin tailwind).
- **Tailwind CSS 4** chạy qua `@tailwindcss/postcss`, kết hợp theme tuỳ chỉnh tại `src/app/globals.css`.
- **Prisma 7 + SQLite** dùng driver `@prisma/adapter-better-sqlite3` để tương thích CLI mới.
- **lucide-react** cung cấp bộ biểu tượng dạng SVG.
- **Module PO Viewer**: tính năng upload/CRUD tệp `.po`, lưu msgid/msgstr vào DB, phân trang và xem chi tiết giống giao diện mẫu gốc.

## Bắt đầu nhanh
1. Cài đặt phụ thuộc  
   ```bash
   npm install
   ```
2. Tạo migration + generate Prisma Client (khi thay đổi schema)  
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```
3. Seed dữ liệu mẫu (tùy chọn nhưng hữu ích cho màn hình chính)  
   ```bash
   npm run db:seed
   ```
4. Chạy môi trường phát triển với SSR đầy đủ  
   ```bash
   npm run dev
   ```

## Cấu trúc thư mục nổi bật
- `src/app/page.tsx` – màn hình chính: upload tệp, bảng danh sách PO, viewer msgid/msgstr SSR.
- `src/app/actions/po-actions.ts` – server actions cho upload/xoá tệp.
- `src/components/po/*` – các client component tái hiện UI trong thư mục `example/`.
- `src/lib/prisma.ts` & `src/lib/prisma-adapter.ts` – Prisma Client với adapter SQLite mới.
- `src/lib/po-parser.ts` – logic phân tích tệp `.po` (msgid/msgstr) tái sử dụng từ bản HTML gốc.
- `prisma/schema.prisma` – gồm `PoFile`, `PoEntry` và `PoFileMetadata` (lưu header).
- `prisma/seed.ts` – Seed một tệp `.po` mẫu (chạy qua `tsx`).
- `docs/` – Bộ tài liệu chi tiết (xem thêm `getting-started.md`, `database.md`, `architecture.md`).

## Công cụ & lệnh hữu ích
- `npm run lint` / `npm run lint:fix` – đảm bảo chuẩn Next.js + TypeScript.
- `npm run format` – Prettier kèm plugin sắp xếp class Tailwind.
- `npm run typecheck` – chạy `tsc --noEmit`.
- `npm run prisma:studio` – UI quản lý dữ liệu SQLite.

> Chi tiết từng hạng mục (setup, database, kiến trúc) xem trong các file còn lại của thư mục `docs`.

