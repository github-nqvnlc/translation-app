# 3. Hướng dẫn setup & clone open source Translation Workspace

Tài liệu này hướng dẫn bạn từ bước đầu tiên (clone repository) cho đến khi chạy được ứng dụng trên máy cục bộ, kèm các lưu ý, lỗi thường gặp và cách khắc phục. Mục tiêu là bất kỳ ai cũng có thể thiết lập môi trường trong vòng vài phút, có dữ liệu mẫu để thử nghiệm, và sẵn sàng mở rộng hoặc triển khai lên hạ tầng riêng.

## 1) Yêu cầu hệ thống

- Node.js: >= 20 (khuyến nghị đồng bộ phiên bản với dự án: 22.x)
- npm: đi kèm Node.js (hoặc pnpm/yarn nếu bạn ưa thích, nhưng hướng dẫn này dùng npm)
- PostgreSQL: một instance có thể kết nối được
  - Có thể dùng local (Docker), hoặc dịch vụ managed như Neon, Supabase, RDS…
- Git: dùng để clone mã nguồn

Tùy chọn (khuyến nghị trong phát triển):
- nvm: quản lý nhiều phiên bản Node dễ dàng
- vercel CLI: nếu bạn định triển khai lên Vercel
- Prisma CLI: chạy một số lệnh di trú dữ liệu (migrate) thuận tiện

## 2) Clone repository & cài đặt phụ thuộc

1. Clone dự án

```bash
git clone <REPO_URL> translation-next-app
cd translation-next-app
```

2. Cài đặt phụ thuộc

```bash
npm install
```

3. Sinh Prisma Client

```bash
npm run prisma:generate
```

Lưu ý: Bất cứ khi nào thay đổi prisma/schema.prisma, bạn phải chạy lại lệnh này để Prisma sinh client mới. Nếu quên, khi chạy app có thể gặp lỗi kiểu “Cannot find module '.prisma/client/default'…”.

## 3) Thiết lập biến môi trường

Tạo file `.env` ở thư mục gốc dự án:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
```

Trong đó bạn thay USER, PASSWORD, HOST, DB_NAME tương ứng với môi trường của bạn. Nếu dùng dịch vụ managed, đảm bảo đã bật SSL khi cần (ví dụ `?sslmode=require`).

Tùy chọn (bật dịch AI):

```env
DEEPL_API_KEY="your_deepl_api_key"
# DEEPL_API_URL="https://api.deepl.com" # nếu provider của bạn yêu cầu endpoint riêng

GEMINI_API_KEY="your_gemini_api_key"
# GEMINI_TRANSLATION_MODEL="gemini-3-pro-preview" # ví dụ chọn model Gemini 3
```

Gợi ý: Hãy lưu ý hạn mức (quota) của mỗi provider. Với DeepL Free thường có giới hạn 500.000 ký tự/tháng. UI của hệ thống sẽ hiển thị tổng ký tự dự kiến dịch trước khi gửi yêu cầu để bạn chủ động.

## 4) Khởi tạo database: migrate & seed

Sau khi thiết lập DATABASE_URL, chạy:

```bash
npm run prisma:migrate
npm run db:seed
```

- `prisma:migrate` sẽ tạo (hoặc apply) các migration cần thiết để đồng bộ schema vào database.
- `db:seed` sẽ thêm dữ liệu mẫu (ví dụ một tệp `.po`) để bạn có thể mở ứng dụng và xem thử ngay giao diện.

Nếu muốn reset sạch database trong quá trình thử nghiệm:

```bash
npm run db:reset
```

Lệnh này sẽ drop dữ liệu, chạy migrate lại và seed lại để bạn có trạng thái gọn gàng.

## 5) Chạy môi trường phát triển

```bash
npm run dev
```

Sau đó truy cập http://localhost:3000 để bắt đầu. Trang chủ sẽ hiển thị giới thiệu, liên kết nhanh và bạn có thể chuyển đến `/files`, `/upload`, `/translations` để trải nghiệm các tính năng chính.

## 6) Cấu trúc thư mục quan trọng

- `src/app/`: App Router của Next.js (server components là mặc định)
  - `page.tsx`: Trang chủ
  - `files/`: Danh sách và chi tiết tệp `.po`
  - `upload/`: Trang upload
  - `translations/`: Danh sách, tạo mới, chi tiết bảng dịch
  - `docs/`: Giao diện tài liệu (sidebar + nội dung markdown)
- `src/components/`: Các components client (bảng, modal, panel, button…)
- `src/lib/`: Lớp truy cập dữ liệu, dịch vụ parse `.po`, tiện ích validate payload
- `prisma/`: Schema, seed, migrations
- `docs/`: Bộ tài liệu markdown (được render tại `/docs`)

Qua đó, bạn có thể nhanh chóng định vị nơi cần sửa khi triển khai tính năng mới.

## 7) Các lệnh npm hữu ích

- `npm run dev`: chạy môi trường phát triển
- `npm run build` + `npm run start`: chạy production build cục bộ
- `npm run lint`: ESLint theo cấu hình Next.js 16
- `npm run lint:fix`: tự sửa một số lỗi lint
- `npm run format`: Prettier (kèm sắp xếp class Tailwind)
- `npm run typecheck`: TypeScript `--noEmit`
- `npm run prisma:generate`: sinh Prisma Client
- `npm run prisma:migrate`: tạo/apply migration
- `npm run prisma:studio`: mở Prisma Studio để duyệt dữ liệu
- `npm run db:seed`: Seed dữ liệu mẫu
- `npm run db:reset`: Reset database + seed lại

## 8) Lưu ý & lỗi thường gặp

### 8.1 Cannot find module '.prisma/client/default'
- Nguyên nhân: quên chạy `npm run prisma:generate` sau khi cài đặt hoặc cập nhật schema.
- Cách khắc phục: chạy `npm run prisma:generate`. Kiểm tra `node_modules/.prisma/client` đã có chưa.

### 8.2 Kết nối database thất bại (PrismaClientInitializationError)
- Nguyên nhân: `DATABASE_URL` sai, DB chưa chạy, thiếu SSL hoặc sai cổng.
- Cách khắc phục: kiểm tra chuỗi kết nối, bật `sslmode=require` khi cần, thử kết nối bằng `psql` hoặc GUI.

### 8.3 Migration lỗi quyền `CREATE DATABASE`
- Nguyên nhân: một số provider không cho phép tạo shadow DB hoặc quyền không đủ.
- Cách khắc phục: cấu hình `SHADOW_DATABASE_URL` hoặc dùng `prisma migrate deploy` thay vì `dev` trong CI.

### 8.4 Upload `.po` lỗi dung lượng
- Nguyên nhân: file quá lớn so với giới hạn mặc định của Next.js.
- Cách khắc phục: tăng giới hạn size ở API route hoặc cấu hình `maxDuration` theo tài liệu Next.js.

### 8.5 Dịch hàng loạt vượt hạn mức
- Nguyên nhân: số ký tự cần dịch lớn hơn quota còn lại của provider.
- Cách khắc phục: chia nhỏ batch, nâng gói, hoặc chỉ dịch các dòng trống để tiết kiệm.

## 9) Gợi ý triển khai thực tế

- Dùng Docker Compose để dựng Postgres local ổn định, tạo script `dev:db` để khởi động nhanh.
- Thiết lập `.env.local`, `.env.production.local` khác nhau cho dev và prod; tuyệt đối không commit secrets.
- Tạo workflow CI cơ bản: `npm ci && npm run lint && npm run typecheck && npm run build` để bắt lỗi sớm.
- Viết script Post-Deployment (nếu deploy Vercel): `npx prisma migrate deploy` để DB đồng bộ trước khi app chạy.

## 10) Kết luận

Chỉ với vài bước cài đặt, bạn có thể khởi chạy Translation Workspace trên máy cục bộ và bắt đầu quản lý bản dịch ngay. Bộ lệnh npm, cấu trúc thư mục rõ ràng và tài liệu đi kèm sẽ giúp bạn vừa tìm hiểu vừa mở rộng theo nhu cầu. Khi đã sẵn sàng, hãy chuyển sang phần “4. Giới thiệu về Database” để nắm chi tiết cách tổ chức schema, mối quan hệ giữa các bảng và một số gợi ý tối ưu khi dự án phình to.
