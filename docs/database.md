# Cấu hình cơ sở dữ liệu & Prisma

## Công nghệ sử dụng
- **Prisma 7** với file cấu hình trung tâm `prisma.config.ts`.
- **PostgreSQL** là cơ sở dữ liệu chính, quản lý qua biến môi trường `DATABASE_URL`.

## Biến môi trường
```
DATABASE_URL="postgresql://user:password@host:5432/db_name?schema=public"
```
- Thay `user`, `password`, `host`, `db_name` cho từng môi trường (local, staging, production).
- Khi đổi DB, chỉ cần cập nhật lại biến môi trường và chạy lại migrate.

## Prisma config
`prisma.config.ts` định nghĩa:
- `schema`: đường dẫn đến `prisma/schema.prisma`.
- `migrations.path`: nơi lưu migration.
- `migrations.seed`: lệnh `tsx prisma/seed.ts`.
- `datasource.url`: đọc từ biến môi trường.

## Schema hiện tại

### `PoFile`
- `id` (String cuid, khoá chính)
- `filename` (String)
- `filesize` (Int, byte)
- `uploadedAt` (DateTime, default `now()`)
- `language` (String, tùy chọn – lấy từ header `Language`)
- Quan hệ 1-n với `PoEntry`
- Quan hệ 1-n với `PoFileMetadata`

### `PoFileMetadata`
- Lưu từng cặp `key/value` trong phần header của file `.po` (ví dụ `Project-Id-Version`, `Language-Team`, `Language`, …).
- Có ràng buộc `@@unique([fileId, key])` để tránh trùng header.

### `PoEntry`
- `id` (Int, auto increment)
- `msgid`, `msgstr` (String)
- `description` (String?, ghép các dòng `#. `)
- `references` (String?, ghép các dòng `#: ` – xuống dòng giữa các vị trí)
- `fileId` (String) tham chiếu `PoFile`
- `createdAt` (DateTime, default `now()`)
- `@@index([fileId])` để truy vấn nhanh khi render viewer

### `TranslationTable`
- `id` (String cuid, khoá chính)
- `name` (String) - Tên bảng dịch
- `language` (String) - Ngôn ngữ của bảng dịch
- `description` (String?, tùy chọn) - Mô tả về bảng dịch
- `createdAt` (DateTime, default `now()`)
- `updatedAt` (DateTime, auto update)
- Quan hệ 1-n với `TranslationEntry`

### `TranslationEntry`
- `id` (Int, auto increment)
- `sourceText` (String) - Văn bản gốc (tương đương msgid)
- `translatedText` (String) - Bản dịch (tương đương msgstr)
- `description` (String?, tùy chọn) - Mô tả ngữ cảnh
- `references` (String?, tùy chọn) - Vị trí áp dụng
- `tableId` (String) tham chiếu `TranslationTable`
- `createdAt` (DateTime, default `now()`)
- `updatedAt` (DateTime, auto update)
- `@@index([tableId])` để truy vấn nhanh khi render entries

## Tạo/áp dụng migration
```bash
npm run prisma:migrate          # tạo migration mới khi schema thay đổi
```
- Prisma sẽ tạo thư mục `prisma/migrations/<timestamp>_<name>/migration.sql`.
- Shadow database sử dụng chính kết nối PostgreSQL đã cấu hình.

## Sinh Prisma Client
```bash
npm run prisma:generate
```
- Client xuất hiện trong `node_modules/.prisma/client` và được dùng tại `src/lib/prisma.ts`.
- ⚠️ **QUAN TRỌNG**: Bạn PHẢI chạy lệnh này:
  - Sau khi cài đặt `npm install` lần đầu
  - Sau mỗi lần thay đổi `prisma/schema.prisma`
  - Sau khi chạy `npm run prisma:migrate`
- Nếu không chạy, ứng dụng sẽ báo lỗi: `Cannot find module '.prisma/client/default'`

## Khởi tạo Prisma Client
`src/lib/prisma.ts`:
```ts
import { prisma } from "@/lib/prisma";
```
- File này tạo singleton `PrismaClient({ datasourceUrl: process.env.DATABASE_URL })`.
- Prisma được khởi tạo một lần và tái sử dụng ở môi trường dev để tránh vượt quá số lượng kết nối.
- `src/lib/po-parser.ts` chịu trách nhiệm parse `.po` và được server action tái sử dụng.

## Seed dữ liệu
`prisma/seed.ts`:
- Xóa toàn bộ `PoFile`/`PoEntry`.
- Tạo một tệp mẫu `sample.po` (ngôn ngữ `vi`) kèm header metadata và mô tả/tham chiếu cho từng bản dịch.
- Chạy bằng `npm run db:seed`.

## Prisma Studio
```bash
npm run prisma:studio
```
- Mở UI trong trình duyệt để xem/chỉnh bảng `PoFile` và `PoEntry`.

## Thay đổi DB trong tương lai
1. Cập nhật `DATABASE_URL`.
2. Bảo đảm database hiện có schema tương thích (seed/migrate lại nếu cần).
3. Chạy `npm run prisma:migrate` và `npm run prisma:generate` để đồng bộ client.

