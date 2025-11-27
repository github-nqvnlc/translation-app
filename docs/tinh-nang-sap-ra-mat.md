# 7. Các tính năng sắp ra mắt

Tài liệu này trình bày lộ trình (roadmap) và tầm nhìn cho các tính năng chuẩn bị triển khai trong Translation Workspace. Mục tiêu là minh bạch định hướng phát triển, giúp đội ngũ và cộng đồng có cái nhìn thống nhất về ưu tiên, cũng như nhận phản hồi sớm để điều chỉnh cho “đúng nỗi đau” người dùng. Roadmap được phân theo nhóm chủ đề lớn, mỗi chủ đề liệt kê các hạng mục cụ thể, tình trạng dự kiến, rủi ro và ghi chú kỹ thuật.

---

## 1) Quản lý quyền truy cập (Authentication & Authorization)

### 1.1 Đăng nhập, đăng xuất, phiên làm việc
- Tính năng: thêm cơ chế xác thực (email+password, OAuth tuỳ chọn) để phân tách người dùng.
- Tình trạng: Dự kiến.
- Chi tiết:
  - Lưu phiên (session) bảo mật; tự động refresh token; giới hạn thời gian sống của phiên.
  - Kết hợp với Next.js App Router (Route Handlers) để bảo vệ các API nhạy cảm.
  - Tương thích triển khai self-host (không phụ thuộc nhà cung cấp).

### 1.2 Phân quyền theo vai trò (RBAC)
- Tính năng: phân biệt vai trò “Viewer”, “Editor”, “Reviewer”, “Admin”.
- Tình trạng: Dự kiến.
- Chi tiết:
  - Quy ước quyền: 
    - Viewer: chỉ đọc dữ liệu, tải file xuất.
    - Editor: chỉnh sửa entries, dịch AI trong hạn mức cho phép.
    - Reviewer: phê duyệt, gắn nhãn chất lượng.
    - Admin: quản trị người dùng, cấu hình hệ thống, quota AI.
  - Thiết kế theo nhóm (team/project) nếu muốn đa dự án trong cùng instance.

---

## 2) Kiểm soát chất lượng (QA Rules) và kiểm thử tự động

### 2.1 Bộ quy tắc QA
- Tính năng: tự động kiểm tra placeholder, biến nội suy, dấu câu, khoảng trắng, độ dài tối đa, ký tự đặc biệt.
- Tình trạng: Thiết kế.
- Chi tiết:
  - Cho phép cấu hình rule theo project hoặc theo ngôn ngữ.
  - Báo cáo kết quả trên UI: đánh dấu entries vi phạm, gợi ý cách sửa.
  - Tùy chọn “nghiêm ngặt” (fail build) hoặc “cảnh báo” (chỉ cảnh báo trên dashboard/CI).

### 2.2 Tích hợp CI/CD
- Tính năng: tạo job “sync translations” tự động cho mỗi release.
- Tình trạng: Dự kiến.
- Chi tiết:
  - Endpoint webhook tiếp nhận sự kiện: push code, mở PR, merge, tạo tag.
  - Tự động export `.po`/JSON và tạo PR cập nhật bản dịch vào repo.
  - Script kiểm tra QA chạy trước khi tạo PR, ghi nhận kết quả vào comment PR.

---

## 3) Nâng cấp AI & gợi ý ngữ cảnh

### 3.1 Hỗ trợ thêm provider AI
- Tính năng: mở rộng sang OpenAI, Azure AI, AWS Translate (tùy nhu cầu).
- Tình trạng: Khảo sát.
- Chi tiết: 
  - Thiết kế interface provider chung, tương thích sẵn với DeepL/Gemini; thêm adapter mới bằng cách implement cùng interface.
  - Hỗ trợ chính sách fallback (nếu provider A lỗi → gọi provider B).

### 3.2 Gợi ý theo ngữ cảnh (Context-aware)
- Tính năng: khi dịch một entry, AI nhận thêm description, references và lịch sử bản dịch tương tự để cải thiện chất lượng.
- Tình trạng: Dự kiến.
- Chi tiết:
  - Chia sẻ metadata có chọn lọc để đảm bảo riêng tư.
  - Cho phép bật/tắt “context mode” cho các nhóm chuỗi đặc thù (pháp lý, tài chính…).

### 3.3 Concordance & Translation Memory (TM)
- Tính năng: hiển thị các bản dịch tương tự đã tồn tại trong hệ thống (gần như “bộ nhớ dịch”).
- Tình trạng: Thiết kế.
- Chi tiết:
  - Tối ưu tìm kiếm xấp xỉ (fuzzy search) bằng trigram hoặc vector search.
  - Liên kết với bảng dịch nội bộ để ưu tiên thuật ngữ chuẩn.

---

## 4) Hỗ trợ đa định dạng & quy trình đồng bộ

### 4.1 Hỗ trợ JSON i18n, ICU MessageFormat, YAML
- Tính năng: đọc/ghi thêm nhiều định dạng ngoài `.po`.
- Tình trạng: Dự kiến.
- Chi tiết:
  - Tạo parser/serializer theo định dạng; map sang mô hình dữ liệu hiện có hoặc mở rộng schema khi cần.
  - UI cần có lựa chọn định dạng khi export/import.

### 4.2 Đồng bộ 2 chiều với repository
- Tính năng: từ UI → repo (PR tự động), từ repo → UI (đọc thay đổi tệp dịch sau merge).
- Tình trạng: Khảo sát.
- Chi tiết:
  - Cần thiết kế “nguồn chân lý” rõ ràng để tránh xung đột.
  - Đánh dấu các entries theo “origin” (UI hay repo) để giải quyết merge conflict.

---

## 5) Báo cáo & trực quan hoá

### 5.1 Dashboard tiến độ
- Tính năng: biểu đồ tỷ lệ đã dịch/đang chờ/cần review theo dự án, theo ngôn ngữ.
- Tình trạng: Dự kiến.
- Chi tiết:
  - Nhập dữ liệu từ các bảng hiện có; lưu snapshot theo ngày để vẽ xu hướng.
  - Export báo cáo (CSV/Excel/PDF) để gửi stakeholder.

### 5.2 Báo cáo chất lượng
- Tính năng: thống kê lỗi QA theo rule, theo tệp, theo người dùng.
- Tình trạng: Thiết kế.
- Chi tiết:
  - Gợi ý “điểm nóng” (hotspot) – nơi lỗi lặp lại nhiều.
  - Đề xuất hành động (ví dụ: tách thuật ngữ thành bảng riêng, cập nhật style guide).

---

## 6) Quản trị hệ thống

### 6.1 Audit log
- Tính năng: ghi lại ai đã làm gì, lúc nào, trước – sau thay đổi ra sao.
- Tình trạng: Dự kiến.
- Chi tiết:
  - Model hóa ở mức entry, bảng, tệp; cho phép lọc theo user và khoảng thời gian.
  - Tôn trọng quyền riêng tư: log không lưu nội dung nhạy cảm không cần thiết.

### 6.2 Quota & Billing nội bộ
- Tính năng: theo dõi hạn mức AI, chia hạn mức theo nhóm, cảnh báo khi vượt ngưỡng.
- Tình trạng: Khảo sát.
- Chi tiết:
  - Đồng bộ số liệu với provider khi có thể; hoặc dựa trên thống kê ký tự từ hệ thống.
  - Gửi cảnh báo email/Slack khi chạm ngưỡng.

### 6.3 Cấu hình bảo mật
- Tính năng: hardening header, CSP, bảo vệ API khỏi lạm dụng.
- Tình trạng: Dự kiến.
- Chi tiết:
  - Áp dụng best practices của Next.js và OWASP.
  - Rate limiting cơ bản cho các route nhạy cảm.

---

## 7) Trải nghiệm người dùng nâng cao

### 7.1 Bản đồ ngữ cảnh (Context Map)
- Tính năng: hiển thị vị trí xuất hiện của chuỗi trong cây giao diện (component/file), giúp translator hiểu bối cảnh.
- Tình trạng: Ý tưởng.
- Chi tiết:
  - Tích hợp với hệ thống build hoặc đọc metadata từ repo.
  - Cho phép click để xem nhanh preview nếu có.

### 7.2 Collaborative Editing (Realtime)
- Tính năng: nhiều người có thể cùng mở một tệp/bảng và thấy con trỏ nhau (presence), khoá dòng khi đang chỉnh.
- Tình trạng: Khảo sát.
- Chi tiết:
  - Yêu cầu hạ tầng realtime (WebSocket/WebRTC), conflict resolution (CRDT).

### 7.3 Nhãn & Bình luận (Comments)
- Tính năng: gắn nhãn (label) và bình luận theo dòng để thảo luận, ghi chú ngữ cảnh và quyết định.
- Tình trạng: Thiết kế.
- Chi tiết:
  - Lưu trạng thái “đã chốt”/“cần xem lại” để hỗ trợ review theo đợt.

---

## 8) Lập kế hoạch & ưu tiên

### 8.1 Nguyên tắc ưu tiên
- Tập trung vào “đường đi chính”: upload – duyệt – sửa – dịch – export – sync.
- Chỉ thêm tính năng khi có case thực tiễn và khả năng bảo trì về lâu dài.
- Đo lường tác động (tốc độ, chi phí, chất lượng) trước – sau khi phát hành.

### 8.2 Quy trình phát hành
- Thiết lập milestone theo quý.
- Mỗi tính năng qua các pha: thiết kế → thử nghiệm trong nhánh riêng → đánh giá QA → triển khai dần (canary) → phát hành.
- Ghi rõ thay đổi trong CHANGELOG; cập nhật tài liệu /docs tương ứng.

---

## 9) Rủi ro & biện pháp giảm thiểu

- Phụ thuộc provider AI: Xây cơ chế fallback và hạn chế vendor lock-in bằng interface chung.
- Quy mô dữ liệu lớn: Tối ưu index, cân nhắc full-text search, phân mảnh dữ liệu theo project.
- Bảo mật: Áp dụng best practices OWASP, kiểm tra định kỳ, dùng secret manager.
- UX phức tạp dần: Giữ triết lý “ít ma sát”, loại bỏ tính năng không được dùng để tránh nặng nề.

---

## 10) Kết luận

Roadmap trên phản ánh cam kết của Translation Workspace: đi sâu vào quy trình thật, tăng tốc bằng AI nhưng tôn trọng quyết định con người, và mở rộng theo nhu cầu thực tế của đội ngũ. Chúng tôi khuyến khích bạn góp ý, đề xuất hoặc đóng góp mã nguồn. Mọi ý kiến sẽ được cân nhắc theo các nguyên tắc ưu tiên đã nêu, nhằm giữ cho dự án vừa mạnh mẽ vừa tinh gọn – đúng tinh thần “làm ít, hiệu quả cao”.

