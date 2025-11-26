# Cấu hình cơ sở dữ liệu & Prisma

## Công nghệ sử dụng
- **Prisma 7** với file cấu hình trung tâm `prisma.config.ts`.
- **SQLite** làm database nội bộ, lưu tại `prisma/dev.db`.
- **@prisma/adapter-better-sqlite3** + `better-sqlite3` để tương thích Prisma Client mới (yêu cầu truyền `adapter` khi khởi tạo).

## Biến môi trường
```
DATABASE_URL="file:./prisma/dev.db"
```
- Giá trị `file:` có thể thay bằng `sqlite:///absolute-path` hoặc các URI của hệ quản trị khác.
- Khi triển khai DB khác, cần đồng bộ cả `DATABASE_URL` và adapter tương ứng (vd. `@prisma/adapter-pg` cho PostgreSQL).

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

## Tạo/áp dụng migration
```bash
npm run prisma:migrate          # tạo migration mới khi schema thay đổi
```
- Prisma sẽ tạo thư mục `prisma/migrations/<timestamp>_<name>/migration.sql`.
- SQLite shadow DB được quản lý tự động bằng adapter `PrismaBetterSqlite3`.

## Sinh Prisma Client
```bash
npm run prisma:generate
```
- Client xuất hiện trong `node_modules/@prisma/client` và được dùng tại `src/lib/prisma.ts`.

## Khởi tạo Prisma Client với adapter
`src/lib/prisma.ts`:
```ts
import { prisma } from "@/lib/prisma";
```
- File này tạo singleton `PrismaClient({ adapter: createSqliteAdapter() })`.
- Adapter dựng tại `src/lib/prisma-adapter.ts` (sử dụng `PrismaBetterSqlite3`).
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
2. Cài đặt adapter tương ứng (VD: `npm install @prisma/adapter-pg pg`).
3. Điều chỉnh `createSqliteAdapter` → `createPgAdapter` (đổi tên file nếu cần) và cập nhật import tại `src/lib/prisma.ts` + `prisma/seed.ts`.
4. Chạy lại `npm run prisma:generate`.

