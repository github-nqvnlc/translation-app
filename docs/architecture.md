# Kiến trúc & luồng hoạt động

## Tổng quan
- App Router (`src/app`) dùng **server component** để truy vấn Prisma trực tiếp – không cần API trung gian.
- UI được dựng bằng **Tailwind CSS 4** (utility-first) + bộ icon `lucide-react`.
- Tầng dữ liệu nằm trong `src/lib`, tất cả logic truy cập DB thông qua singleton Prisma Client.

## Luồng render trang chủ
1. Trình duyệt yêu cầu `/` (có thể kèm query `?fileId=`).
2. Server component `app/page.tsx` gọi Prisma để lấy danh sách `PoFile` + `_count` entries.
3. Nếu có `fileId`, truy vấn thêm `PoEntry` tương ứng và truyền xuống client component `PoEntriesPanel`.
4. Upload form dùng server action (`uploadPoFile`) nhận `FormData`, đọc tệp `.po`, parse bằng `parsePo`, lưu vào `PoFile/PoEntry`, `revalidatePath("/")`.
5. Xoá một/ nhiều/ toàn bộ tệp dùng server actions `deleteFiles`, `deleteAllFiles`.

## Các thành phần chính
- `src/app/page.tsx`
  - `dynamic = "force-dynamic"` để giữ SSR.
  - Ghép các section: hero, thẻ tính năng, form upload, bảng quản lý tệp, viewer.
- `src/app/actions/po-actions.ts`
  - `uploadPoFile` (FormData) + `deleteFiles` + `deleteAllFiles`.
- `src/components/po/*`
  - `UploadPoForm`: form client kết nối server action, giữ thông báo.
  - `PoFilesTable`: danh sách tệp, multi-select, gọi server action qua `startTransition`.
  - `PoEntriesPanel`: tái tạo UI từ `example/app.js` (pagination, modal).
- `src/lib/po-parser.ts`
  - Thuật toán parse `msgid/msgstr` từ file `.po`.
- `src/lib/prisma.ts` & `prisma-adapter.ts`
  - Singleton Prisma + adapter `PrismaBetterSqlite3`.

## Server-side rendering
- Viewer nhận dữ liệu đã SSR, pagination xử lý client-side dựa trên props.
- Sau khi upload/xoá, server action gọi `revalidatePath("/")` nên dữ liệu đồng bộ ngay.
- Nếu cần API riêng, có thể trích xuất logic tại `po-actions` sang route handler.

## Kiến trúc đề xuất cho các tính năng mới
1. **Layer hoá dịch vụ**: gom các hàm xử lý `PoFile`/`PoEntry` (upload, xoá, thống kê) vào `src/lib/services`.
2. **Route handlers & actions**: nếu cần nhập dữ liệu từ client, dùng Server Actions (Next.js 16) hoặc API routes.
3. **UI**: chia component nhỏ trong `src/components` khi có nhiều màn hình.
4. **Validation**: thêm zod hoặc valibot khi nhận input client.

## Giám sát & bảo trì
- Kiểm tra định kỳ `prisma/migrations` vào Git để đảm bảo schema đồng bộ.
- Luôn chạy `npm run typecheck` + `npm run lint` trước khi deploy.
- SQLite phù hợp local/dev. Khi triển khai production nên dùng Postgres/MySQL/libSQL để tránh khóa file.

