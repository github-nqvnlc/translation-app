# Triển khai Translation Workspace lên Vercel

Tài liệu này mô tả trọn bộ quy trình đưa ứng dụng Next.js/Prisma hiện tại lên Vercel, bao gồm các bước chuẩn bị, cấu hình database sản xuất và kiểm thử sau triển khai. Ưu tiên sử dụng npm + Node.js 20 để tương thích với môi trường build mặc định của Vercel.

## 1. Yêu cầu và chuẩn bị

| Hạng mục | Ghi chú |
| --- | --- |
| Tài khoản Vercel | Có quyền tạo Project + Postgres/Storage |
| Kho mã nguồn | GitHub/GitLab/Bitbucket, branch `main` sạch |
| Runtime cục bộ | Node.js ≥ 20, npm ≥ 10, Prisma CLI (`npx prisma -v`) |
| Công cụ | `vercel` CLI (cài bằng `npm i -g vercel`), quyền truy cập DB nếu dùng dịch vụ ngoài |

> SQLite file (`prisma/dev.db`) **không được hỗ trợ** trên môi trường serverless của Vercel. Hãy chuyển sang Postgres do Vercel cung cấp (hoặc Neon/Supabase/Turso) trước khi deploy.

## 2. Chuẩn bị mã nguồn

1. Sao chép repo và cài phụ thuộc: `npm install`.
2. Đồng bộ Prisma Client: `npm run prisma:generate`.
3. Đảm bảo migrations sạch: `npm run prisma:migrate` (hoặc `npx prisma migrate dev`).
4. Kiểm tra chất lượng: `npm run lint && npm run typecheck`.
5. Commit mọi thay đổi (bao gồm migrations mới) trước khi đẩy lên remote.

## 3. Tạo database sản xuất

### 3.1 Tạo Postgres trên Vercel

1. Vào Vercel Dashboard → Storage → **Create Database** → **Postgres**.
2. Đặt tên (ví dụ `translation-db-prod`), chọn region gần người dùng.
3. Sao chép các connection string (`DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`). Lưu tạm trong trình quản lý mật khẩu.

> Nếu bạn dùng dịch vụ khác (Neon, Supabase): vẫn cần 3 biến môi trường tương tự. Đảm bảo option TLS phù hợp.

### 3.2 Cập nhật Prisma sử dụng Postgres

1. Mở `prisma/schema.prisma` và đổi `provider` từ `sqlite` sang `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL") // giúp prisma migrate deploy
   }
   ```
2. Nếu vẫn muốn phát triển cục bộ với SQLite, hãy tạo branch riêng; Prisma không hỗ trợ hai provider cùng lúc.
3. Chạy lại `npx prisma migrate dev --name init-vercel` (hoặc tên phù hợp) để sinh migration cho Postgres.
4. Seed dữ liệu (tùy chọn): `npm run db:seed` — lệnh cần được điều chỉnh để làm việc với Postgres (ví dụ dùng `PrismaClient` mới).

## 4. Thiết lập biến môi trường

### 4.1 Local `.env`

Tạo file `.env.production.local` (không commit) để test build giống Vercel:

```
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB"
DIRECT_URL="postgres://USER:PASSWORD@HOST:PORT/DB?pgbouncer=true"
SHADOW_DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB_shadow"
NEXT_TELEMETRY_DISABLED=1
```

> `SHADOW_DATABASE_URL` bắt buộc nếu bạn chạy `prisma migrate dev` trên CI/CD.

### 4.2 Thiết lập trên Vercel

```
vercel login
vercel link
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add SHADOW_DATABASE_URL
vercel env add NEXT_TELEMETRY_DISABLED 1
```

Lặp lại cho 3 môi trường: `development`, `preview`, `production`. Có thể nhập chuỗi trực tiếp hoặc dùng “Encrypt value from clipboard” trong dashboard.

## 5. Cấu hình build Vercel

| Trường | Giá trị khuyến nghị |
| --- | --- |
| Framework Preset | Next.js |
| Node.js Version | 20.x |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | (để trống – Next.js tự quản lý) |

### Hooks cần cho Prisma

- Thêm script `postinstall`: `"postinstall": "prisma generate"` để Vercel build luôn có Prisma Client.
- Sau build, chạy migration bằng **Post-Deployment Script** (tab Settings → Functions):
  ```
  npx prisma migrate deploy
  ```
  Script này chạy với biến môi trường production, đảm bảo schema đồng bộ trước khi routes hoạt động.

## 6. Triển khai từng bước

1. **Đẩy code lên Git remote** (ví dụ GitHub). Đảm bảo branch `main` chứa migrations mới.
2. **Tạo Project Vercel**  
   - Import repository, chọn branch mặc định.  
   - Vercel tự nhận Next.js và đề xuất cấu hình build.
3. **Khai báo biến môi trường** theo mục 4.2. Có thể dùng `vercel env pull .env.vercel`.
4. **Trigger build đầu tiên** (Preview). Kiểm tra log `npm run build` và `npx prisma migrate deploy`.
5. **Kiểm thử preview**: mở URL preview, thực hiện các thao tác chính (upload .po, tạo bảng dịch) để chắc chắn kết nối Postgres hoạt động.
6. **Promote lên Production**: `vercel --prod` hoặc bấm “Promote to Production”.

## 7. Kiểm tra và vận hành sau deploy

| Tác vụ | Lệnh/Thao tác |
| --- | --- |
| Theo dõi log | `vercel logs <deployment-url> --since 10m` |
| Chạy migration thủ công | `vercel env pull && npx prisma migrate deploy` (chạy cục bộ với ENV production) |
| Seed dữ liệu sản xuất | Tạo script `npm run db:seed:prod` và chạy qua `vercel env pull && NODE_ENV=production npm run db:seed:prod` |
| Backup DB | Dùng tính năng backup của Vercel Postgres hoặc kết nối qua `psql` + cron |

## 8. Khắc phục sự cố thường gặp

- **`PrismaClientInitializationError: Can't reach database`**  
  → Kiểm tra `DATABASE_URL`, bật SSL (`?sslmode=require`) nếu dùng nhà cung cấp ngoài Vercel.

- **`Cannot find module '.prisma/client/default'` trong log build**  
  → Thiếu `prisma generate`; thêm script `postinstall` hoặc chạy thủ công trước `next build`.

- **Migration thất bại do quyền `CREATE DATABASE`**  
  → Thiết lập `SHADOW_DATABASE_URL` với một DB riêng có quyền tạo bảng.

- **Build timeout vì import file lớn**  
  → Dọn dẹp `example/` hoặc mock test khỏi bundle (đặt ở thư mục không nằm trong App Router hoặc dùng `process.env.NODE_ENV` guard).

- **Upload `.po` thất bại trên production**  
  → Kiểm tra dung lượng request (Next.js mặc định 4 MB). Có thể tăng bằng `export const maxDuration = ...` ở API route hoặc cấu hình `sizeLimit` trong `route.ts`.

## 9. Checklist nhanh trước mỗi release

1. `npm run lint && npm run typecheck` thành công.
2. `npm run build` chạy ổn với `.env.production.local`.
3. `npx prisma migrate deploy --preview-feature` mô phỏng thành công trên DB staging.
4. Đã cập nhật `CHANGELOG`/docs nếu có thay đổi migrations hoặc env mới.
5. Đã backup Postgres trước khi migrate dữ liệu lớn.

Giữ checklist này trong quy trình CI sẽ giúp bản phát hành Vercel ổn định và dễ truy vết khi có sự cố.


