# Translation Workspace

Ứng dụng quản lý kho dịch đa ngôn ngữ dựa trên Next.js 16, Prisma 7 và SQLite. Hỗ trợ upload, quản lý và xem chi tiết các tệp `.po` (Portable Object) với giao diện hiện đại và API RESTful đầy đủ.

## ✨ Tính năng

### Quản lý file .po
- 📤 **Upload tệp .po**: Phân tích và lưu trữ metadata, ngôn ngữ và toàn bộ msgid/msgstr
- 🔍 **Tìm kiếm nâng cao**: Tìm kiếm theo tên tệp, ngôn ngữ, metadata hoặc nội dung bản dịch
- 📋 **Quản lý tệp**: Xem danh sách, chi tiết, xoá một hoặc nhiều tệp
- 📄 **Viewer chi tiết**: Xem từng entry với phân trang, tìm kiếm và hiển thị metadata

### Quản lý bảng dịch tùy chỉnh
- 🗂️ **Tạo bảng dịch**: Tạo các bảng dịch riêng biệt không phụ thuộc vào file .po
- ✏️ **CRUD đầy đủ**: Thêm, sửa, xóa entries trong bảng dịch một cách linh hoạt
- 📊 **Quản lý độc lập**: Mỗi bảng dịch có ngôn ngữ và mô tả riêng

### Xuất file đa định dạng
- 📥 **Xuất .po**: Xuất file .po với cấu trúc chuẩn
- 📊 **Xuất CSV/Excel/JSON**: Hỗ trợ nhiều định dạng phổ biến cho cả file .po và bảng dịch

### Khác
- 🔌 **REST API**: API endpoints đầy đủ cho tích hợp với hệ thống bên ngoài
- ⚡ **Server-side rendering**: Tất cả dữ liệu được render phía server để đảm bảo hiệu năng

## 🚀 Bắt đầu nhanh

### Yêu cầu hệ thống
- Node.js >= 20 (khuyến nghị 22.x)
- npm hoặc yarn

### Cài đặt

```bash
# 1. Cài đặt dependencies
npm install

# 2. Generate Prisma Client (BẮT BUỘC)
npm run prisma:generate

# 3. Tạo database và migration
npm run prisma:migrate

# 4. Seed dữ liệu mẫu (tùy chọn)
npm run db:seed

# 5. Chạy development server
npm run dev
```

Truy cập http://localhost:3000 để xem ứng dụng.

> ⚠️ **Lưu ý quan trọng**: Sau khi cài đặt hoặc thay đổi `prisma/schema.prisma`, bạn PHẢI chạy `npm run prisma:generate`. Nếu không, ứng dụng sẽ báo lỗi `Cannot find module '.prisma/client/default'`.

## 📁 Cấu trúc dự án

```
translation-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Trang chủ
│   │   ├── files/             # Quản lý tệp .po
│   │   ├── translations/      # Quản lý bảng dịch
│   │   ├── upload/            # Upload tệp mới
│   │   ├── actions/           # Server Actions
│   │   └── api/               # REST API routes
│   ├── components/            # React Components
│   │   ├── po/                # PO-related components
│   │   └── translations/      # Translation table components
│   └── lib/                   # Utilities & services
│       ├── prisma.ts          # Prisma Client singleton
│       ├── po-parser.ts       # PO file parser
│       └── utils/             # Helper functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed script
└── docs/                      # Documentation
```

## 🛠️ Scripts có sẵn

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy development server |
| `npm run build` | Build cho production |
| `npm run start` | Chạy production server |
| `npm run lint` | Kiểm tra ESLint |
| `npm run lint:fix` | Tự động sửa lỗi lint |
| `npm run format` | Format code với Prettier |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Tạo và áp dụng migration |
| `npm run prisma:studio` | Mở Prisma Studio |
| `npm run db:seed` | Seed dữ liệu mẫu |
| `npm run db:reset` | Reset database và seed lại |

## ✅ CI/CD

Kho đã cấu hình GitHub Actions tại `.github/workflows/ci.yml`:

- Mọi Pull Request và push vào `main` sẽ chạy `npm run lint`, `npm run typecheck` và `npm run build`.
- Với Pull Request, workflow tiếp tục thực thi `npx vercel build` để xác nhận bản build production.

> **Secrets bắt buộc** (thiết lập trong Settings → Secrets → Actions):
>
> - `DATABASE_URL`
> - `VERCEL_TOKEN`
> - `VERCEL_ORG_ID`
> - `VERCEL_PROJECT_ID`
>
> Workflow sẽ tự động dừng bước Vercel nếu các secrets này chưa được cấu hình.

## 📚 Tài liệu

Xem thêm chi tiết trong thư mục `docs/`:

- [`docs/getting-started.md`](docs/getting-started.md) - Hướng dẫn chi tiết về setup và sử dụng
- [`docs/database.md`](docs/database.md) - Cấu hình database và Prisma
- [`docs/architecture.md`](docs/architecture.md) - Kiến trúc và luồng hoạt động

## 🔌 API Endpoints

### PO Files
- `GET /api/po-files` - Lấy danh sách tệp (query: `?q=` để tìm kiếm)
- `POST /api/po-files` - Tạo tệp mới từ JSON payload
- `GET /api/po-files/[id]` - Lấy thông tin chi tiết một tệp
- `DELETE /api/po-files/[id]` - Xoá một tệp
- `GET /api/po-files/[id]/export` - Xuất file .po
- `GET /api/po-files/[id]/export/csv` - Xuất file CSV
- `GET /api/po-files/[id]/export/excel` - Xuất file Excel
- `GET /api/po-files/[id]/export/json` - Xuất file JSON

### PO Entries
- `GET /api/po-files/[id]/entries` - Lấy danh sách entries của một tệp
- `GET /api/po-files/[id]/entries/[entryId]` - Lấy thông tin một entry
- `PUT /api/po-files/[id]/entries/[entryId]` - Cập nhật một entry
- `DELETE /api/po-files/[id]/entries/[entryId]` - Xoá một entry

### Translation Tables
- `GET /api/translation-tables` - Lấy danh sách bảng dịch
- `POST /api/translation-tables` - Tạo bảng dịch mới
- `GET /api/translation-tables/[id]` - Lấy thông tin chi tiết bảng dịch
- `PUT /api/translation-tables/[id]` - Cập nhật bảng dịch
- `DELETE /api/translation-tables/[id]` - Xóa bảng dịch
- `GET /api/translation-tables/[id]/export/csv` - Xuất CSV
- `GET /api/translation-tables/[id]/export/excel` - Xuất Excel
- `GET /api/translation-tables/[id]/export/json` - Xuất JSON
- `GET /api/translation-tables/[id]/export/po` - Xuất PO

### Translation Entries
- `GET /api/translation-tables/[id]/entries` - Lấy danh sách entries
- `POST /api/translation-tables/[id]/entries` - Tạo entry mới
- `PUT /api/translation-tables/[id]/entries/[entryId]` - Cập nhật entry
- `DELETE /api/translation-tables/[id]/entries/[entryId]` - Xóa entry

## 🛠️ Công nghệ sử dụng

- **Next.js 16** - React framework với App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Prisma 7** - ORM với SQLite
- **Tailwind CSS 4** - Utility-first CSS framework
- **lucide-react** - Icon library

## 👤 Tác giả

- **Nguyễn Văn Lộc** ([github-nqvnlc](https://github.com/github-nqvnlc)) – Fullstack Developer tại Windify, Đà Nẵng, Việt Nam.
- Website cá nhân: [locnv.vercel.app](http://locnv.vercel.app)

## © Bản quyền

Translation Workspace thuộc bản quyền © Nguyễn Văn Lộc. Mọi đóng góp hoặc phân phối lại vui lòng giữ nguyên ghi công và dẫn nguồn về repository này cùng hồ sơ GitHub của tác giả.

## 🤝 Sponsor

- Ủng hộ qua GitHub Sponsors: [github.com/sponsors/github-nqvnlc](https://github.com/sponsors/github-nqvnlc)
- Hợp tác doanh nghiệp: liên hệ trực tiếp qua website [locnv.vercel.app](http://locnv.vercel.app) để đặt lịch tư vấn.

## 📝 License

MIT
