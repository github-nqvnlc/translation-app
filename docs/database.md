# 4. Giới thiệu về Database

Tài liệu này trình bày chi tiết cách kết nối cơ sở dữ liệu, cách tổ chức schema, mối quan hệ giữa các bảng và một số ví dụ minh hoạ trực quan để bạn nắm được “dòng đời dữ liệu” trong Translation Workspace. Phần này cực kỳ quan trọng cho developer vì nó quyết định khả năng mở rộng, hiệu năng truy vấn và độ an toàn khi triển khai ở quy mô lớn.

## 1) Kết nối Database

Hệ thống sử dụng PostgreSQL làm cơ sở dữ liệu chính và Prisma 7 làm ORM. Chuỗi kết nối được cấu hình qua biến môi trường `DATABASE_URL` trong file `.env` như sau:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
```

Lưu ý:
- Nếu dùng nhà cung cấp cloud (Neon, Supabase, RDS…), có thể cần bật SSL: `?sslmode=require`.
- Trong CI/CD, nếu chạy `prisma migrate dev`, bạn có thể cần thêm `SHADOW_DATABASE_URL` để Prisma có thể tạo shadow database phục vụ quá trình migration. Khi triển khai production, thay vào đó hãy dùng `prisma migrate deploy`.
- Tại runtime, Prisma Client được khởi tạo ở `src/lib/prisma.ts` theo mô hình singleton, giúp tránh mở quá nhiều kết nối khi hot-reload trong môi trường dev.

Ví dụ khởi tạo Prisma Client (rút gọn):

```ts
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## 2) Tổ chức schema & mô hình dữ liệu

Hệ thống hiện định nghĩa bốn nhóm bảng chính, đáp ứng hai trung tâm dữ liệu: tệp `.po` và bảng dịch nội bộ (translation tables).

### 2.1 PoFile
- id (String cuid, PK)
- filename (String)
- filesize (Int, bytes)
- uploadedAt (DateTime, default now)
- language (String?) — lấy từ header `Language` của file `.po` nếu có
- Quan hệ 1-n với `PoEntry`
- Quan hệ 1-n với `PoFileMetadata`

### 2.2 PoFileMetadata
- id (String cuid, PK)
- key (String)
- value (String)
- fileId (String) — FK → `PoFile.id`
- Ràng buộc `@@unique([fileId, key])` để tránh trùng khoá header trong cùng một tệp

Mục đích: Lưu lại toàn bộ metadata trong phần header của `.po` (ví dụ `Project-Id-Version`, `Language-Team`, `Language`, `POT-Creation-Date`, …). Việc index và unique theo `[fileId, key]` giúp truy vấn nhanh và đảm bảo tính nhất quán.

### 2.3 PoEntry
- id (Int auto-increment, PK)
- msgid (String)
- msgstr (String)
- description (String?) — ghép các dòng `#. ` của file `.po`
- references (String?) — ghép các dòng `#: `; mỗi vị trí tách dòng để dễ đọc
- fileId (String) — FK → `PoFile.id`
- createdAt (DateTime, default now)
- `@@index([fileId])` để phục vụ truy vấn danh sách nhanh

Mục đích: Lưu trữ từng cặp msgid/msgstr kèm mô tả và tham chiếu vị trí, cho phép hiển thị phân trang, tìm kiếm theo msgid/msgstr/description/references.

### 2.4 TranslationTable
- id (String cuid, PK)
- name (String)
- language (String)
- description (String?)
- createdAt (DateTime, default now)
- updatedAt (DateTime, updated on update)
- Quan hệ 1-n với `TranslationEntry`

### 2.5 TranslationEntry
- id (Int auto-increment, PK)
- sourceText (String)
- translatedText (String)
- description (String?)
- references (String?)
- tableId (String) — FK → `TranslationTable.id`
- createdAt (DateTime)
- updatedAt (DateTime)
- `@@index([tableId])`

Mục đích: Xây một kho thuật ngữ/bảng dịch độc lập với `.po` để tái sử dụng trên nhiều dự án. Đây là không gian linh hoạt, nơi bạn có thể định hình phong cách, thuật ngữ chuẩn và xuất/nhập dữ liệu theo nhu cầu.

## 3) Quan hệ giữa các bảng (sơ đồ khái quát)

Mô tả quan hệ ở mức khái niệm:

```
PoFile (1) ────< (n) PoEntry
   │
   └──────< (n) PoFileMetadata

TranslationTable (1) ────< (n) TranslationEntry
```

- Một tệp `.po` có nhiều entries và nhiều metadata.
- Một bảng dịch có nhiều entries riêng, không ràng buộc trực tiếp với `.po` (điều này giúp chép lại cụm từ chuẩn giữa các dự án, không phụ thuộc file).

Nếu cần đồng bộ hoá giữa PoEntry và TranslationEntry, ta thực hiện ở tầng dịch vụ (service layer) hoặc qua thao tác thủ công trong UI (ví dụ: chọn một số dòng PoEntry → đẩy sang bảng dịch; hoặc ngược lại). Việc tách rời tránh coupling quá sớm, giúp linh hoạt mở rộng sau này (nhiều nguồn dữ liệu, nhiều định dạng).

## 4) Chỉ mục (Index) và hiệu năng

- `PoEntry` và `TranslationEntry` đều có index theo khoá ngoại (`fileId`, `tableId`) để liệt kê entries nhanh theo bối cảnh.
- Bạn có thể cân nhắc thêm index theo `msgid`/`sourceText` khi quy mô chuỗi tăng rất lớn và nhu cầu tìm kiếm toàn văn tăng cao. Tuy nhiên, hãy đo lường và chọn chiến lược index hợp lý để tránh tăng chi phí ghi.
- Khi cần tìm kiếm nâng cao (full-text search), cân nhắc tích hợp `pg_trgm` (Postgres trigram) hoặc ElasticSearch/OpenSearch cho các use case nặng.

## 5) Luồng ghi dữ liệu khi upload `.po`

1. Người dùng chọn file `.po` trong UI `/upload`.
2. Server Action nhận file, parse theo tiêu chuẩn gettext, trích xuất header → lưu vào `PoFileMetadata` và phân tách entries → lưu vào `PoEntry`.
3. Lưu `PoFile` làm “đầu mối” cho tất cả records bên dưới.
4. Gọi `revalidatePath` (nếu dùng) để làm mới các trang danh sách liên quan.

Trường hợp file nặng hoặc số lượng entries rất lớn, bạn có thể cân nhắc tách bước parse sang hàng đợi (queue) để không chặn response. Tuy nhiên, trong phạm vi hiện tại, SSR + hành động đồng bộ vẫn hoạt động tốt cho kích thước vừa phải.

## 6) Ví dụ truy vấn điển hình với Prisma

Liệt kê danh sách tệp kèm số entries:

```ts
const files = await prisma.poFile.findMany({
  orderBy: { uploadedAt: 'desc' },
  include: {
    _count: { select: { entries: true } },
  },
});
```

Lấy chi tiết một tệp và phân trang entries:

```ts
const file = await prisma.poFile.findUnique({ where: { id: fileId } });
const entries = await prisma.poEntry.findMany({
  where: { fileId },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { id: 'asc' },
});
```

Tìm kiếm entries theo từ khoá:

```ts
const q = keyword.trim();
const results = await prisma.poEntry.findMany({
  where: {
    fileId,
    OR: [
      { msgid: { contains: q, mode: 'insensitive' } },
      { msgstr: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { references: { contains: q, mode: 'insensitive' } },
    ],
  },
  take: 50,
});
```

## 7) An toàn dữ liệu và ràng buộc

- Ràng buộc `@@unique([fileId, key])` ở `PoFileMetadata` đảm bảo mỗi header chỉ xuất hiện một lần cho một file, tránh “đè” dữ liệu.
- Khi xóa một `PoFile`, cần xoá cascade các `PoEntry` và `PoFileMetadata` liên quan (thực hiện ở tầng service hoặc cấu hình Prisma relation mode phù hợp).
- Với `TranslationTable`, tương tự: khi xoá một bảng, xoá các `TranslationEntry` thuộc bảng đó.

## 8) Minh hoạ trực quan: cấu trúc dữ liệu

Hãy hình dung database như một cây:

- Thân cây là `PoFile` – mỗi thân là một tệp `.po` độc lập.
  - Cành 1: `PoFileMetadata` – lá là các cặp `key=value` mô tả file.
  - Cành 2: `PoEntry` – lá là từng dòng msgid/msgstr kèm mô tả.
- Một cây khác song song là `TranslationTable` – mỗi thân là một bảng dịch nội bộ.
  - Cành: `TranslationEntry` – lá là từng cặp source/translated riêng biệt.

Hai cây này không nối rễ trực tiếp; chúng sinh trưởng độc lập để bạn có thể nuôi dưỡng từ điển nội bộ mà không bị ràng buộc bởi file `.po`. Khi cần “ghép cành” (đồng bộ cụm từ), ta làm ở tầng nghiệp vụ.

## 9) Khả năng mở rộng trong tương lai

- Thêm bảng audit log để ghi nhận lịch sử chỉnh sửa (ai, khi nào, thay đổi gì) – hữu ích cho review và compliance.
- Thêm bảng `ProviderQuota` để theo dõi hạn mức AI theo từng môi trường, phục vụ dashboard và cảnh báo sớm.
- Hỗ trợ nhiều `namespace`/`project` nếu bạn muốn đa dự án trong một instance.

## 10) Kết luận

Thiết kế database của Translation Workspace hướng đến sự rõ ràng, dễ truy vấn, dễ bảo trì và đủ linh hoạt để mở rộng. Bằng việc tách biệt hai trung tâm dữ liệu (.po và bảng dịch nội bộ), bạn có thể vừa vận hành nhu cầu trước mắt, vừa chuẩn bị đường cho các tính năng cấp cao (đồng bộ 2 chiều, QA rules, audit trail). Nắm vững phần này, bạn sẽ tự tin hơn trong việc tối ưu hiệu năng, xử lý edge-cases và triển khai ở quy mô lớn.

