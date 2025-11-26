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
1. **Cài đặt phụ thuộc**  
   ```bash
   npm install
   ```

2. **Generate Prisma Client** (BẮT BUỘC)  
   ```bash
   npm run prisma:generate
   ```
   ⚠️ Không bỏ qua bước này! Ứng dụng sẽ không chạy được nếu thiếu Prisma Client.

3. **Tạo migration và seed dữ liệu mẫu**  
   ```bash
   npm run prisma:migrate
   npm run db:seed
   ```

4. **Chạy môi trường phát triển**  
   ```bash
   npm run dev
   ```
   Truy cập http://localhost:3000

## Cấu trúc thư mục nổi bật

### Pages (Server Components)
- `src/app/page.tsx` – Trang chủ, landing page với giới thiệu và liên kết nhanh
- `src/app/files/page.tsx` – Danh sách tệp với tìm kiếm nâng cao
- `src/app/files/[fileId]/page.tsx` – Chi tiết tệp với entries, metadata và tìm kiếm
- `src/app/upload/page.tsx` – Trang upload tệp mới
- `src/app/translations/page.tsx` – Danh sách bảng dịch tùy chỉnh
- `src/app/translations/new/page.tsx` – Tạo bảng dịch mới
- `src/app/translations/[id]/page.tsx` – Chi tiết bảng dịch với CRUD entries

### Server Actions & API
- `src/app/actions/po-actions.ts` – Server actions cho upload/xoá tệp
- `src/app/api/po-files/` – REST API endpoints cho CRUD operations và export
- `src/app/api/translation-tables/` – REST API endpoints cho quản lý bảng dịch và export

### Components (Client)
- `src/components/po/UploadPoForm` – Form upload với thông báo trạng thái
- `src/components/po/PoFilesTable` – Bảng danh sách tệp, multi-select, xoá
- `src/components/po/PoEntriesPanel` – Viewer entries với phân trang và modal
- `src/components/translations/TranslationEntriesPanel` – Quản lý entries trong bảng dịch với CRUD
- `src/components/translations/DeleteTableButton` – Button xóa bảng dịch với confirm

### Library & Utilities
- `src/lib/prisma.ts` & `src/lib/prisma-adapter.ts` – Prisma Client với adapter SQLite
- `src/lib/po-parser.ts` – Logic phân tích tệp `.po` (msgid/msgstr)
- `src/lib/utils/po-payload.ts` – Validation và parse payload cho API

### Database
- `prisma/schema.prisma` – Schema gồm `PoFile`, `PoEntry`, `PoFileMetadata`, `TranslationTable` và `TranslationEntry`
- `prisma/seed.ts` – Seed một tệp `.po` mẫu (chạy qua `tsx`)
- `prisma/migrations/` – Các file migration đã áp dụng

### Documentation
- `docs/` – Bộ tài liệu chi tiết (xem thêm `getting-started.md`, `database.md`, `architecture.md`)

## Công cụ & lệnh hữu ích
- `npm run lint` / `npm run lint:fix` – đảm bảo chuẩn Next.js + TypeScript.
- `npm run format` – Prettier kèm plugin sắp xếp class Tailwind.
- `npm run typecheck` – chạy `tsc --noEmit`.
- `npm run prisma:studio` – UI quản lý dữ liệu SQLite.

> Chi tiết từng hạng mục (setup, database, kiến trúc) xem trong các file còn lại của thư mục `docs`.

