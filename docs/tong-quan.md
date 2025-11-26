# 2. Tổng quan về Translation Workspace

Tài liệu này cung cấp bức tranh tổng thể về hệ sinh thái kỹ thuật và các tính năng có trong Translation Workspace. Mục tiêu là giúp bạn hiểu “dịch vụ này vận hành như thế nào”, “tại sao chọn công nghệ này” và “những khả năng sẵn có ngay từ ngày đầu”. Khi nắm được tổng quan, bạn sẽ dễ đưa ra quyết định kiến trúc, quy trình triển khai, cũng như kế hoạch mở rộng dài hạn cho đội ngũ.

## Công nghệ sử dụng

### Next.js 16 (App Router)

- Sử dụng Server Components để SSR dữ liệu trực tiếp, giảm chi phí dữ liệu đi vòng qua API khi không cần thiết.
- Hỗ trợ dynamic route và streaming, phù hợp với những trang có dữ liệu lớn (danh sách entries). 
- App Router tách biệt rõ ràng giữa server và client, giúp bảo vệ secrets (API keys) và tối ưu bundle.

### React 19

- Giao diện hiện đại, ổn định; tận dụng các cải tiến về concurrent rendering.
- Tách rõ Client Components (dùng interactivity) và Server Components (SSR dữ liệu, không cần JS trên client).

### Prisma 7 + PostgreSQL

- Prisma cung cấp một ORM kiểu an toàn, schema rõ ràng, migration minh bạch.
- PostgreSQL tin cậy, dễ vận hành, phù hợp phạm vi dữ liệu dạng bảng (files, entries, translation tables).
- Mô hình dữ liệu hiện tại bao gồm: PoFile, PoEntry, PoFileMetadata, TranslationTable, TranslationEntry.

### Tailwind CSS 4

- Tập trung vào tiện ích (utility-first), giúp tạo giao diện đẹp, nhất quán, ít CSS tùy biến.
- Dễ thay đổi theme, gradient nền, viền, bảng, màu chữ, khoảng cách… ở quy mô dự án lớn.

### lucide-react

- Bộ icon SVG nhẹ, dễ tùy biến màu kích thước, cộng đồng lớn.

### AI Providers: DeepL, Gemini (Google AI)

- Mỗi provider được tích hợp độc lập. Có thể bật một hoặc cả hai tùy vào môi trường.
- Trước khi gọi dịch hàng loạt, UI hiển thị tổng ký tự cần dịch và so sánh với hạn mức của provider để tránh vượt quota.

## Các tính năng chính trong dự án

### 1) Quản lý tệp .po

- Upload nhiều tệp, giới hạn dung lượng hợp lý, cảnh báo lỗi parse.
- Danh sách tệp có tìm kiếm theo tên, ngôn ngữ, metadata.
- Trang chi tiết tệp hiển thị entries (msgid/msgstr), mô tả và references; hỗ trợ phân trang, lọc, tìm kiếm theo từ khóa.
- Chỉnh sửa từng entry; hỗ trợ dịch nhanh một dòng bằng AI ngay trong modal; ghi đè có xác nhận.
- Xuất dữ liệu ra .po, CSV, Excel (.xlsx) và JSON.

### 2) Bảng dịch nội bộ (Translation Tables)

- Tạo bảng mới với tên, ngôn ngữ, mô tả.
- Thêm/sửa/xóa các dòng (sourceText/translatedText, description, references) tương tự như entries trong .po nhưng độc lập.
- Dịch hàng loạt với DeepL/Gemini; hiển thị tổng ký tự và lựa chọn ghi đè/không ghi đè.
- Xuất CSV/Excel/JSON/PO từ bảng dịch.

### 3) AI dịch tự động có kiểm soát

- Hai đường gọi độc lập cho DeepL và Gemini; có thể chọn provider trong UI.
- Khi dịch hàng loạt, hiển thị tổng ký tự dự kiến; cảnh báo nếu vượt hạn mức gói đang dùng.
- Cho phép chỉ dịch những dòng trống hoặc ghi đè có kiểm soát.

### 4) API REST mở rộng

- Đầy đủ endpoints để liệt kê, tạo, sửa, xóa tệp .po và các entries; xuất dữ liệu theo nhiều định dạng.
- Endpoints quản lý bảng dịch và entries tương ứng; xuất dữ liệu; dịch hàng loạt với AI qua POST body.
- Các API được tổ chức nhất quán theo chuẩn REST, dễ tích hợp CI/CD, bots, hoặc công cụ kiểm thử riêng.

### 5) UI/UX tối ưu cho thao tác hằng ngày

- Sidebar tài liệu ở trang /docs, bảng điều khiển rõ ràng ở trang chính, danh sách và chi tiết được chia thành các vùng chức năng rõ ràng.
- Modal chỉnh sửa giàu ngữ cảnh, có mô tả, references.
- Các thao tác rủi ro (xóa hàng loạt, ghi đè bằng AI) đều yêu cầu confirm; thông báo trạng thái rõ ràng.

## Lý do chọn bộ công nghệ này

- Tính phổ biến: Next.js + Prisma + PostgreSQL là bộ stack có cộng đồng lớn, tài liệu tốt, nguồn nhân lực dồi dào.
- Tính ổn định: App Router và Prisma 7 đủ trưởng thành cho sản phẩm thật.
- Tính mở rộng: Dễ thêm provider AI, mở rộng API, chuyển sang kiến trúc microservices nếu cần, hoặc tích hợp message queue.
- Tính chi phí: Có thể tự host hoặc deploy cloud (Vercel/Render/Fly), chi phí bắt đầu thấp, dễ tối ưu dần.

## Hạn chế hiện tại và đánh đổi

- Chưa có phân quyền chi tiết theo vai trò (editor/reviewer/admin). Điều này nằm trong lộ trình sắp tới.
- Chưa có pipeline CI/CD tích hợp sẵn cho việc sync 2 chiều với repo mã nguồn; cần bổ sung theo nhu cầu đội ngũ.
- Việc dùng DeepL/Gemini phụ thuộc hạn mức của tài khoản bạn; UI chỉ hỗ trợ cảnh báo và hiển thị ký tự – vẫn cần chính sách nội bộ để kiểm soát.

## Một số nguyên tắc thiết kế quan trọng

1. SSR trước tiên: Trang chính và trang danh sách dùng server components để giảm JS trên client, tăng tốc độ và bảo mật.
2. Rõ ràng về dữ liệu: Prisma schema nghiêm túc, migration commit vào Git để mọi người theo dõi thay đổi.
3. UX hữu dụng: Mọi nút quan trọng phải dễ nhìn, mọi hành động nguy hiểm phải có confirm, mọi thông báo phải rõ ràng.
4. Kiểm thử thủ công trọng tâm: Quy trình thử nghiệm có checklist (sẽ bổ sung trong docs) để đảm bảo những đường đi chính luôn hoạt động tốt.

## Checklist “sẵn sàng sử dụng”

- Có thể chạy local trong vài phút với Node 20+ và PostgreSQL (hoặc dùng Neon/Supabase).
- Upload – duyệt – sửa – xuất file .po hoạt động mượt.
- Tạo bảng dịch và thao tác CRUD ổn định.
- Dịch hàng loạt với DeepL/Gemini kèm hiển thị ký tự và confirm.
- API REST đủ để tích hợp với quy trình tự động hóa cơ bản.

## Kết luận

Tổng quan ở trên cho thấy Translation Workspace mang tính “đủ dùng – dễ mở rộng” ngay từ cốt lõi. Bộ công nghệ được chọn nhằm tối ưu tốc độ phát triển, hiệu năng và khả năng bảo trì, trong khi các tính năng lại bám sát quy trình thực tế của đội ngũ biên dịch/phát triển. Sau khi nắm tổng quan, bạn có thể đi tiếp đến phần “3. Hướng dẫn setup & clone” để khởi động dự án và bắt đầu sử dụng trong môi trường của bạn.

