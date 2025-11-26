# Hướng dẫn khởi động

## Yêu cầu hệ thống
- Node.js >= 20 (nên sử dụng cùng phiên bản với dự án: 22.x).
- npm (đi kèm Node.js). Nếu dùng nvm, hãy chạy `nvm use` trước.
- Một instance PostgreSQL mà bạn có quyền kết nối (local Docker, Neon, Supabase, RDS...).

## Thiết lập môi trường
1. **Cài đặt npm packages**
   ```bash
   npm install
   ```
2. **Generate Prisma Client** (BẮT BUỘC sau khi cài đặt)
   ```bash
   npm run prisma:generate
   ```
   ⚠️ **Lưu ý quan trọng**: Sau khi cài đặt `@prisma/client` hoặc thay đổi `prisma/schema.prisma`, bạn PHẢI chạy lệnh này để tạo Prisma Client. Nếu không, ứng dụng sẽ báo lỗi `Cannot find module '.prisma/client/default'`.
3. **Thiết lập biến môi trường**
   - File `.env` cần chứa dòng 
     ```
     DATABASE_URL="postgresql://user:password@host:5432/db_name?schema=public"
     ```
   - Thay thông tin truy cập phù hợp với từng môi trường (local/staging/production).
4. **Migrate & seed dữ liệu**
   ```bash
   npm run prisma:migrate   # tạo migration mới hoặc đồng bộ schema
   npm run db:seed          # làm sạch DB + thêm một tệp .po mẫu
   ```

## Chạy dự án
- **Phát triển**: `npm run dev` → truy cập http://localhost:3000
- **Build production**: 
  ```bash
  npm run build
  npm run start
  ```
- **Prisma Studio**: `npm run prisma:studio` để xem và chỉnh dữ liệu trực quan.

## Bộ lệnh quản lý
| Lệnh | Mô tả |
| --- | --- |
| `npm run lint` | Kiểm tra ESLint |
| `npm run lint:fix` | Tự động sửa lỗi lint hợp lệ |
| `npm run format` | Chạy Prettier (kèm tailwind plugin) |
| `npm run typecheck` | Kiểm tra kiểu TypeScript mà không build |
| `npm run prisma:generate` | Sinh Prisma Client sau khi đổi schema |
| `npm run prisma:migrate` | Tạo & apply migration mới (PostgreSQL) |
| `npm run prisma:studio` | UI dữ liệu |
| `npm run db:seed` | Seed 1 tệp `.po` mẫu |
| `npm run db:reset` | Reset DB + seed lại |

## Các trang chính
- **`/`** (Trang chủ): Giới thiệu dự án, các tính năng và liên kết nhanh đến các trang khác.
- **`/files`**: Danh sách tất cả các tệp .po đã upload, có tính năng tìm kiếm theo tên tệp, ngôn ngữ hoặc metadata. Click vào tên tệp để xem chi tiết.
- **`/upload`**: Trang upload tệp .po mới với form và thông báo trạng thái rõ ràng.
- **`/files/[fileId]`**: Trang chi tiết của từng tệp, hiển thị:
  - Tất cả các entry (msgid/msgstr) với phân trang
  - Tìm kiếm trong các entry
  - Metadata của tệp (header từ file .po)
  - Thông tin ngôn ngữ và số lượng bản dịch
  - Xuất file .po, CSV, Excel, JSON
- **`/translations`**: Danh sách các bảng dịch tùy chỉnh, quản lý độc lập với file .po
- **`/translations/new`**: Tạo bảng dịch mới với tên, ngôn ngữ và mô tả
- **`/translations/[id]`**: Trang chi tiết bảng dịch, hiển thị:
  - Tất cả các entry (Source Text/Translated Text) với phân trang
  - Thêm, sửa, xóa entries
  - Xuất file CSV, Excel, JSON, PO

## Tính năng chính

### Quản lý file .po
- **Upload tệp .po**: Xử lý server-side bởi server action `uploadPoFile`, hỗ trợ tối đa 5MB.
- **CRUD tệp**: Chọn từng dòng hoặc multi-select để xoá; có nút xoá toàn bộ.
- **Viewer phân trang**: Dữ liệu msgid/msgstr được render SSR và tái sử dụng logic từ `example/app.js`.
- **Tìm kiếm nâng cao**: Tìm kiếm trong danh sách tệp hoặc trong từng tệp cụ thể.
- **Xuất file**: Xuất file .po, CSV, Excel, JSON với các thay đổi đã cập nhật.

### Quản lý bảng dịch
- **Tạo bảng dịch**: Tạo các bảng dịch riêng biệt với tên, ngôn ngữ và mô tả tùy chỉnh.
- **CRUD entries**: Thêm, sửa, xóa các bản dịch trong bảng một cách linh hoạt.
- **Quản lý độc lập**: Mỗi bảng dịch hoạt động độc lập, không phụ thuộc vào file .po.
- **Xuất file**: Xuất bảng dịch ra CSV, Excel, JSON hoặc .po.

### API REST
- Cung cấp API endpoints tại `/api/po-files` và `/api/translation-tables` để tích hợp với hệ thống bên ngoài.

## Phong cách mã nguồn
- **TypeScript strict**: giữ `strict: true`, hạn chế `any`.
- **Tailwind**: ưu tiên utility class, khi cần nhóm logic dùng component nhỏ trong `src/app`.
- **Prettier**: luôn chạy `npm run format` trước khi commit để đảm bảo class Tailwind được sắp xếp.
- **SSR trước tiên**: Page chính (`app/page.tsx`) chạy hoàn toàn phía server, tránh thêm `use client` nếu không cần thiết.

## Quy trình đề xuất
1. Chỉnh `prisma/schema.prisma` khi cần model mới.
2. `npm run prisma:migrate` → Prisma tự tạo file migration mới trong `prisma/migrations`.
3. **`npm run prisma:generate`** → Bắt buộc phải chạy sau khi thay đổi schema để cập nhật Prisma Client.
4. Cập nhật seed nếu cần dữ liệu mẫu.
5. Viết logic tại `src/lib` (service layer) rồi kết nối vào server component hoặc route handler.
6. Chạy `npm run lint && npm run typecheck` trước khi build.

## API Routes

### PO Files
- `GET /api/po-files` - Lấy danh sách tệp (hỗ trợ query parameter `?q=` để tìm kiếm)
- `POST /api/po-files` - Tạo tệp mới từ JSON payload
- `GET /api/po-files/[id]` - Lấy thông tin chi tiết một tệp
- `DELETE /api/po-files/[id]` - Xoá một tệp
- `GET /api/po-files/[id]/entries` - Lấy danh sách entries của một tệp
- `GET /api/po-files/[id]/entries/[entryId]` - Lấy thông tin một entry cụ thể
- `PUT /api/po-files/[id]/entries/[entryId]` - Cập nhật một entry
- `DELETE /api/po-files/[id]/entries/[entryId]` - Xoá một entry
- `GET /api/po-files/[id]/export` - Xuất file .po
- `GET /api/po-files/[id]/export/csv` - Xuất file CSV
- `GET /api/po-files/[id]/export/excel` - Xuất file Excel
- `GET /api/po-files/[id]/export/json` - Xuất file JSON

### Translation Tables
- `GET /api/translation-tables` - Lấy danh sách bảng dịch
- `POST /api/translation-tables` - Tạo bảng dịch mới
- `GET /api/translation-tables/[id]` - Lấy thông tin chi tiết bảng dịch
- `PUT /api/translation-tables/[id]` - Cập nhật bảng dịch
- `DELETE /api/translation-tables/[id]` - Xóa bảng dịch
- `GET /api/translation-tables/[id]/entries` - Lấy danh sách entries
- `POST /api/translation-tables/[id]/entries` - Tạo entry mới
- `PUT /api/translation-tables/[id]/entries/[entryId]` - Cập nhật entry
- `DELETE /api/translation-tables/[id]/entries/[entryId]` - Xóa entry
- `GET /api/translation-tables/[id]/export/csv` - Xuất CSV
- `GET /api/translation-tables/[id]/export/excel` - Xuất Excel
- `GET /api/translation-tables/[id]/export/json` - Xuất JSON
- `GET /api/translation-tables/[id]/export/po` - Xuất PO

