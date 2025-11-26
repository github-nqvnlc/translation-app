# Hướng dẫn khởi động

## Yêu cầu hệ thống
- Node.js >= 20 (nên sử dụng cùng phiên bản với dự án: 22.x).
- npm (đi kèm Node.js). Nếu dùng nvm, hãy chạy `nvm use` trước.
- Quyền ghi file trong thư mục dự án để tạo database SQLite (`prisma/dev.db`).

## Thiết lập môi trường
1. **Cài đặt npm packages**
   ```bash
   npm install
   ```
2. **Thiết lập biến môi trường**
   - File `.env` đã có sẵn dòng 
     ```
     DATABASE_URL="file:./prisma/dev.db"
     ```
   - Khi triển khai thực tế, cập nhật đường dẫn phù hợp (vd. Turso, libSQL, PostgreSQL...) và đồng bộ cùng adapter tương ứng.
3. **Migrate & seed dữ liệu**
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
| `npm run prisma:migrate` | Tạo & apply migration mới (SQLite) |
| `npm run prisma:studio` | UI dữ liệu |
| `npm run db:seed` | Seed 1 tệp `.po` mẫu |
| `npm run db:reset` | Reset DB + seed lại |

## Tính năng PO Viewer
- **Upload tệp .po** trực tiếp tại trang chủ, xử lý server-side bởi server action `uploadPoFile`.
- **CRUD tệp**: chọn từng dòng hoặc multi-select để xoá; có nút xoá toàn bộ.
- **Viewer phân trang**: dữ liệu msgid/msgstr được render SSR và tái sử dụng logic từ `example/app.js`.
- **Link chuyển tệp**: click tên tệp để chuyển `?fileId=` tương ứng.

## Phong cách mã nguồn
- **TypeScript strict**: giữ `strict: true`, hạn chế `any`.
- **Tailwind**: ưu tiên utility class, khi cần nhóm logic dùng component nhỏ trong `src/app`.
- **Prettier**: luôn chạy `npm run format` trước khi commit để đảm bảo class Tailwind được sắp xếp.
- **SSR trước tiên**: Page chính (`app/page.tsx`) chạy hoàn toàn phía server, tránh thêm `use client` nếu không cần thiết.

## Quy trình đề xuất
1. Chỉnh `prisma/schema.prisma` khi cần model mới.
2. `npm run prisma:migrate` → Prisma tự tạo file migration mới trong `prisma/migrations`.
3. Cập nhật seed nếu cần dữ liệu mẫu.
4. Viết logic tại `src/lib` (service layer) rồi kết nối vào server component hoặc route handler.
5. Chạy `npm run lint && npm run typecheck && npm run test` (khi bổ sung testing) trước khi build.

