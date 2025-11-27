# 5. Giới thiệu về API

Phần này mô tả chi tiết các API REST mà Translation Workspace cung cấp để bạn có thể tích hợp vào quy trình tự động (CI/CD), các công cụ nội bộ (dashboard, bot) hoặc phục vụ phân tích. Tài liệu sẽ đi kèm các ví dụ payload, phản hồi và một số lưu ý vận hành để tránh rủi ro khi làm việc với dữ liệu bản dịch ở quy mô lớn.

Lưu ý: Các ví dụ minh hoạ URL dưới đây giả định ứng dụng chạy tại http://localhost:3000. Khi triển khai production, thay bằng domain thật của bạn. Tất cả endpoints đều trả về JSON (trừ các endpoint export file có thể trả về nhị phân).

## 1) Nhóm API Po Files (.po)

Đây là nhóm phục vụ quản lý tệp `.po` và các entry tương ứng. Bản chất, một `PoFile` là đầu mối, bao gồm metadata (headers) và nhiều `PoEntry` (msgid/msgstr, mô tả, references).

### 1.1 Liệt kê tệp
- GET `/api/po-files`
- Query params: `q` (tìm kiếm theo tên, ngôn ngữ, metadata – phụ thuộc implement), `page`, `pageSize`

Ví dụ:
```
GET /api/po-files?q=vi&page=1&pageSize=20
```
Phản hồi (rút gọn):
```json
{
  "items": [
    { "id": "cku...", "filename": "sample.po", "language": "vi", "uploadedAt": "2024-08-18T..." }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

### 1.2 Tạo tệp từ JSON
- POST `/api/po-files`
- Body: JSON mô tả file và entries. Với dự án hiện tại, tệp thường được tạo qua upload server action. API này hữu ích khi bạn muốn nhập dữ liệu có cấu trúc từ hệ thống khác.

Payload mẫu:
```json
{
  "filename": "from-api.po",
  "language": "vi",
  "entries": [
    { "msgid": "Hello", "msgstr": "Xin chào" },
    { "msgid": "Bye", "msgstr": "Tạm biệt" }
  ],
  "metadata": {
    "Project-Id-Version": "1.0.0",
    "Language": "vi"
  }
}
```

### 1.3 Lấy chi tiết tệp
- GET `/api/po-files/[id]`
- Trả về thông tin `PoFile` và (tuỳ cấu hình) số lượng entries, metadata.

### 1.4 Xoá tệp
- DELETE `/api/po-files/[id]`
- Lưu ý: Hành động rủi ro, cần xác nhận ở UI. Khi xoá tệp, entries/metadata liên quan cũng bị xoá theo.

### 1.5 Liệt kê entries của tệp
- GET `/api/po-files/[id]/entries`
- Query: `q`, `page`, `pageSize`

Phản hồi (rút gọn):
```json
{
  "items": [
    { "id": 1, "msgid": "Continue", "msgstr": "Tiếp tục", "description": "Button", "references": "src/..." }
  ],
  "total": 148,
  "page": 1,
  "pageSize": 50
}
```

### 1.6 CRUD một entry
- GET `/api/po-files/[id]/entries/[entryId]`
- PUT `/api/po-files/[id]/entries/[entryId]` – cập nhật msgstr/description/references
- DELETE `/api/po-files/[id]/entries/[entryId]`

Ví dụ cập nhật:
```json
{
  "msgstr": "Tiếp tục",
  "description": "Nút CTA tiếp tục",
  "references": "components/Button.tsx:12"
}
```

### 1.7 Export tệp
- GET `/api/po-files/[id]/export` – trả về `.po`
- GET `/api/po-files/[id]/export/csv` – trả về CSV
- GET `/api/po-files/[id]/export/excel` – trả về Excel (.xlsx)
- GET `/api/po-files/[id]/export/json` – trả về JSON

Lưu ý: Các endpoint này trả về nội dung file. Tuỳ client, bạn cần đặt `Content-Disposition` hoặc sử dụng `fetch` để tải.

### 1.8 Dịch hàng loạt (DeepL/Gemini)
- POST `/api/po-files/[id]/entries/batch-translate`
- POST `/api/po-files/[id]/entries/batch-translate/gemini`

Payload mẫu:
```json
{
  "entryIds": [1,2,3,4,5],
  "overwrite": false
}
```

Phản hồi (rút gọn):
```json
{
  "translated": 4,
  "skipped": 1,
  "characters": 384
}
```

`characters` giúp đối chiếu hạn mức gói. Khi `overwrite=false`, hệ thống chỉ dịch các dòng trống để tiết kiệm.

## 2) Nhóm API Translation Tables (bảng dịch nội bộ)

Translation Table là kho “thuật ngữ nội bộ” độc lập với `.po`, giúp bạn tái sử dụng từ/cụm từ chuẩn trong nhiều dự án.

### 2.1 Bảng dịch
- GET `/api/translation-tables` – danh sách bảng
- POST `/api/translation-tables` – tạo bảng mới
- GET `/api/translation-tables/[id]` – chi tiết
- PUT `/api/translation-tables/[id]` – cập nhật
- DELETE `/api/translation-tables/[id]` – xoá

Tạo bảng mới (payload):
```json
{
  "name": "Kho_thuat_ngu_chung",
  "language": "vi",
  "description": "Dùng chung cho các dự án web nội bộ"
}
```

### 2.2 Entries của bảng dịch
- GET `/api/translation-tables/[id]/entries` – liệt kê
- POST `/api/translation-tables/[id]/entries` – thêm dòng
- PUT `/api/translation-tables/[id]/entries/[entryId]` – cập nhật
- DELETE `/api/translation-tables/[id]/entries/[entryId]` – xoá

Ví dụ thêm dòng:
```json
{
  "sourceText": "Sign in",
  "translatedText": "Đăng nhập",
  "description": "Link trên header",
  "references": "components/Header.tsx:18"
}
```

### 2.3 Export bảng dịch
- GET `/api/translation-tables/[id]/export/csv`
- GET `/api/translation-tables/[id]/export/excel`
- GET `/api/translation-tables/[id]/export/json`
- GET `/api/translation-tables/[id]/export/po`

Các endpoint này giúp bạn chuyển dữ liệu bảng dịch về định dạng phù hợp với pipeline hiện có hoặc bàn giao ngoài.

### 2.4 Dịch hàng loạt cho bảng dịch
- POST `/api/translation-tables/[id]/entries/batch-translate`
- POST `/api/translation-tables/[id]/entries/batch-translate/gemini`

Payload & phản hồi tương tự nhóm `.po`. Cũng hỗ trợ `overwrite` để kiểm soát ghi đè.

## 3) Mẫu code tích hợp

### 3.1 Tải danh sách tệp về để đồng bộ
```ts
async function fetchPoFiles(base = 'http://localhost:3000') {
  const res = await fetch(`${base}/api/po-files`);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}
```

### 3.2 Cập nhật một entry cụ thể
```ts
async function updateEntry(fileId: string, entryId: number, data: any) {
  const res = await fetch(`/api/po-files/${fileId}/entries/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}
```

### 3.3 Gọi dịch hàng loạt cho bảng dịch
```ts
async function translateTable(tableId: string, ids: number[]) {
  const res = await fetch(`/api/translation-tables/${tableId}/entries/batch-translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entryIds: ids, overwrite: false })
  });
  return res.json();
}
```

## 4) Bảo mật & hạn mức

- Không gửi API key từ client: DeepL/Gemini được gọi từ server-side routes/actions.
- Giới hạn ký tự: UI hiển thị số ký tự dự kiến; chịu trách nhiệm cuối cùng là chính sách nội bộ của bạn (ví dụ: không cho phép dịch hàng loạt > X ký tự/ngày).
- Xác nhận thao tác rủi ro: Hãy đảm bảo các client nội bộ cũng thực hiện confirm khi gọi API xoá/ghi đè hàng loạt.

## 5) Quy ước versioning

- Với REST, bạn có thể thêm prefix `/api/v1/...` khi bắt đầu ổn định hoá hợp đồng dữ liệu. Tài liệu này mô tả endpoints hiện hành trong dự án mẫu.
- Khi thay đổi lớn (breaking change), hãy duy trì song song 2 phiên bản trong thời gian chuyển tiếp.

## 6) Gỡ rối nhanh

- 400/422: Payload thiếu hoặc sai kiểu. Kiểm tra schema và ví dụ payload trong tài liệu.
- 401/403: Truy cập trái phép (nếu bạn triển khai bảo vệ). Đảm bảo token/role hợp lệ.
- 404: Sai `id`/`entryId` hoặc tài nguyên đã bị xoá.
- 429: Vượt hạn mức nội bộ. Hãy tách nhỏ batch hoặc điều chỉnh quota.
- 5xx: Lỗi phía server hoặc provider AI. Kiểm tra logs, thử lại theo backoff.

## 7) Kết luận

API của Translation Workspace được thiết kế nhằm hỗ trợ các kịch bản tích hợp phổ biến: đồng bộ dữ liệu, tự động dịch nháp, xuất báo cáo, tạo công cụ nội bộ. Hãy bắt đầu từ những endpoint liệt kê/chi tiết, thử cập nhật từng entry, sau đó mở rộng sang batch translate và các export. Khi đã tự tin, bạn có thể đưa một phần quy trình dịch vào CI/CD để tăng tốc độ phát hành sản phẩm.
