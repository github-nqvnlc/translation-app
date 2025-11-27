# Kiến trúc & luồng hoạt động

## Tổng quan
- App Router (`src/app`) dùng **server component** để truy vấn Prisma trực tiếp – không cần API trung gian.
- UI được dựng bằng **Tailwind CSS 4** (utility-first) + bộ icon `lucide-react`.
- Tầng dữ liệu nằm trong `src/lib`, tất cả logic truy cập DB thông qua singleton Prisma Client.

## Cấu trúc các trang

### Trang chủ (`/`)
- Server component `app/page.tsx` hiển thị giới thiệu và các liên kết nhanh.
- Không có logic truy vấn database, chỉ là landing page.

### Trang danh sách tệp (`/files`)
1. Server component `app/files/page.tsx` nhận query parameter `?q=` để tìm kiếm.
2. Truy vấn Prisma với filter động theo `filename`, `language`, hoặc `metadata`.
3. Render danh sách tệp với component `PoFilesTable` (client component).
4. Hỗ trợ multi-select và xoá nhiều tệp cùng lúc qua server actions.

### Trang upload (`/upload`)
1. Server component `app/upload/page.tsx` render form upload.
2. Client component `UploadPoForm` gọi server action `uploadPoFile`.
3. Server action parse file `.po`, lưu vào database và `revalidatePath("/")`.

### Trang chi tiết tệp (`/files/[fileId]`)
1. Server component `app/files/[fileId]/page.tsx` nhận `fileId` từ params.
2. Truy vấn `PoFile`, `PoFileMetadata` và `PoEntry` tương ứng.
3. Hỗ trợ tìm kiếm trong entries qua query parameter `?q=`.
4. Render `PoEntriesPanel` (client component) để hiển thị và phân trang entries.
5. Cung cấp các nút xuất file .po, CSV, Excel, JSON.

### Trang quản lý bảng dịch (`/translations`)
1. Server component `app/translations/page.tsx` hiển thị danh sách các bảng dịch.
2. Truy vấn `TranslationTable` với số lượng entries.
3. Click vào bảng dịch để xem chi tiết.

### Trang tạo bảng dịch (`/translations/new`)
1. Server component `app/translations/new/page.tsx` render form tạo bảng dịch.
2. Server action tạo `TranslationTable` mới và redirect đến trang chi tiết.

### Trang chi tiết bảng dịch (`/translations/[id]`)
1. Server component `app/translations/[id]/page.tsx` nhận `id` từ params.
2. Truy vấn `TranslationTable` và tất cả `TranslationEntry` tương ứng.
3. Render `TranslationEntriesPanel` (client component) để quản lý entries.
4. Cung cấp các nút xuất file CSV, Excel, JSON, PO.

## Các thành phần chính

### Server Components & Pages
- `src/app/page.tsx` - Trang chủ, landing page
- `src/app/files/page.tsx` - Danh sách tệp với tìm kiếm
- `src/app/files/[fileId]/page.tsx` - Chi tiết tệp với entries và metadata
- `src/app/upload/page.tsx` - Trang upload tệp mới
- `src/app/translations/page.tsx` - Danh sách bảng dịch
- `src/app/translations/new/page.tsx` - Tạo bảng dịch mới
- `src/app/translations/[id]/page.tsx` - Chi tiết bảng dịch với entries
- Tất cả đều dùng `dynamic = "force-dynamic"` để đảm bảo SSR.

### Server Actions
- `src/app/actions/po-actions.ts`
  - `uploadPoFile`: Nhận FormData, parse file `.po`, lưu vào database (giới hạn 5MB)
  - `deleteFiles`: Xoá một hoặc nhiều tệp theo danh sách ID
  - `deleteAllFiles`: Xoá toàn bộ tệp trong database

### API Routes

#### PO Files
- `src/app/api/po-files/route.ts` - GET (list), POST (create)
- `src/app/api/po-files/[id]/route.ts` - GET (detail), DELETE
- `src/app/api/po-files/[id]/entries/route.ts` - GET (list entries)
- `src/app/api/po-files/[id]/entries/[entryId]/route.ts` - GET, PUT, DELETE
- `src/app/api/po-files/[id]/export/route.ts` - GET (export .po)
- `src/app/api/po-files/[id]/export/csv/route.ts` - GET (export CSV)
- `src/app/api/po-files/[id]/export/excel/route.ts` - GET (export Excel)
- `src/app/api/po-files/[id]/export/json/route.ts` - GET (export JSON)

#### Translation Tables
- `src/app/api/translation-tables/route.ts` - GET (list), POST (create)
- `src/app/api/translation-tables/[id]/route.ts` - GET (detail), PUT (update), DELETE
- `src/app/api/translation-tables/[id]/entries/route.ts` - GET (list entries), POST (create entry)
- `src/app/api/translation-tables/[id]/entries/[entryId]/route.ts` - PUT (update), DELETE
- `src/app/api/translation-tables/[id]/export/csv/route.ts` - GET (export CSV)
- `src/app/api/translation-tables/[id]/export/excel/route.ts` - GET (export Excel)
- `src/app/api/translation-tables/[id]/export/json/route.ts` - GET (export JSON)
- `src/app/api/translation-tables/[id]/export/po/route.ts` - GET (export PO)

### Client Components
- `src/components/po/UploadPoForm`: Form upload với thông báo trạng thái
- `src/components/po/PoFilesTable`: Bảng danh sách tệp, multi-select, xoá
- `src/components/po/PoEntriesPanel`: Viewer entries với phân trang và modal
- `src/components/translations/TranslationEntriesPanel`: Quản lý entries trong bảng dịch với CRUD đầy đủ
- `src/components/translations/DeleteTableButton`: Button xóa bảng dịch với confirm dialog

### Library & Utilities
- `src/lib/po-parser.ts`: Parse file `.po` thành cấu trúc dữ liệu
- `src/lib/prisma.ts`: Singleton Prisma Client kết nối PostgreSQL
- `src/lib/utils/po-payload.ts`: Validation và parse payload cho API

## Server-side rendering
- Tất cả các trang đều là Server Components, truy vấn database trực tiếp.
- Viewer entries nhận dữ liệu đã SSR, pagination xử lý client-side dựa trên props.
- Sau khi upload/xoá, server action gọi `revalidatePath("/")` để đồng bộ dữ liệu ngay.
- API routes cung cấp JSON endpoints cho tích hợp bên ngoài, không cần trích xuất logic từ server actions.

## Kiến trúc đề xuất cho các tính năng mới
1. **Layer hoá dịch vụ**: gom các hàm xử lý `PoFile`/`PoEntry` (upload, xoá, thống kê) vào `src/lib/services`.
2. **Route handlers & actions**: nếu cần nhập dữ liệu từ client, dùng Server Actions (Next.js 16) hoặc API routes.
3. **UI**: chia component nhỏ trong `src/components` khi có nhiều màn hình.
4. **Validation**: thêm zod hoặc valibot khi nhận input client.

## Giám sát & bảo trì
- Kiểm tra định kỳ `prisma/migrations` vào Git để đảm bảo schema đồng bộ.
- Luôn chạy `npm run typecheck` + `npm run lint` trước khi deploy.
- Hạ tầng hiện dùng PostgreSQL, có thể mở rộng sang các managed service như Neon, Supabase hoặc RDS.

