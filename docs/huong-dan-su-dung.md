# 6. Hướng dẫn sử dụng Translation Workspace

Tài liệu này hướng dẫn bạn sử dụng Translation Workspace theo từng vai trò và từng tính năng, từ những thao tác cơ bản (upload tệp .po, duyệt danh sách, tìm kiếm) đến các nghiệp vụ chuyên sâu (dịch hàng loạt bằng AI, xuất dữ liệu đa định dạng, xây dựng bảng dịch nội bộ). Mục tiêu là giúp cả người mới lẫn người đã quen hệ thống đều có thể làm chủ quy trình dịch nhanh chóng, an toàn và có thể lặp lại.

---

## 1) Làm quen với giao diện

- Header: Thanh điều hướng chung của ứng dụng, bao gồm các liên kết đến Trang chủ, Danh sách tệp, Upload tệp, Bảng dịch và Tài liệu.
- Sidebar tài liệu (/docs): Ở trang tài liệu, bạn sẽ thấy một sidebar cố định bên trái, liệt kê các mục nội dung. Đây là nơi bạn tra cứu kiến thức nền, chuẩn quy trình, cũng như các thực hành tốt (best practices).
- Nền tối (dark): Giao diện thống nhất với theme tối để giảm mỏi mắt khi làm việc lâu, đặc biệt phù hợp với các phiên dịch viên và dev thường xuyên đọc – so sánh – chỉnh sửa chuỗi.

### Mẹo điều hướng nhanh
- Phím tắt trình duyệt: Sử dụng Ctrl/Cmd + L để nhảy nhanh vào thanh địa chỉ và gõ “/files”, “/upload”, “/translations” để chuyển trang nhanh.
- Bookmark các đường dẫn quan trọng của nhóm (ví dụ một file cụ thể đang hotfix) để mở lại ngay khi cần.

---

## 2) Quản lý tệp .po

Tệp `.po` là định dạng phổ biến trong cộng đồng GNU gettext. Hệ thống này coi `PoFile` là “đầu mối” để quản lý toàn bộ entries (msgid – msgstr), mô tả và references.

### 2.1 Upload tệp
1. Truy cập trang `/upload`.
2. Kéo & thả tệp `.po` vào vùng tải lên hoặc chọn file từ thiết bị.
3. Xác nhận thông tin: kích thước, tên file; sau đó bấm Upload.
4. Sau khi xử lý, hệ thống sẽ parse header → lưu metadata, parse entries → lưu `PoEntry`. Nếu có lỗi định dạng, UI sẽ hiển thị thông báo cụ thể.

Mẹo: Hãy chuẩn hoá tên file và ngôn ngữ ngay từ đầu. Nếu tệp có header `Language: vi\n`, hệ thống sẽ lưu ngôn ngữ để bạn lọc dễ hơn tại `/files`.

### 2.2 Danh sách tệp (/files)
- Tìm kiếm: Gõ từ khoá để lọc theo tên file, ngôn ngữ hoặc một phần metadata. Từ khoá không phân biệt hoa thường (insensitive).
- Sắp xếp: Thường mặc định theo thời gian tải lên (mới nhất trên cùng) để phục vụ kiểm thử nhanh.
- Hành động hàng loạt: Chọn nhiều tệp để xoá (có confirm) khi cần dọn dẹp môi trường.

### 2.3 Chi tiết tệp (/files/[fileId])
- Viewer entries: Bảng liệt kê tất cả msgid/msgstr kèm mô tả (nếu có) và references. Có phân trang để tối ưu tốc độ và khả năng đọc.
- Tìm kiếm trong entries: Nhập từ khoá để lọc theo msgid, msgstr, mô tả hoặc vị trí. Lọc nhanh giúp thu hẹp phạm vi cần xem xét.
- Chỉnh sửa: Nhấn vào một dòng để mở modal chỉnh sửa. Bạn có thể cập nhật msgstr, thay đổi mô tả, điều chỉnh references. Sau khi lưu, UI cập nhật tức thì.
- Dịch AI cho một dòng: Trong modal, chọn provider (DeepL/Gemini) và bấm “Dịch”. Kiểm tra kết quả và quyết định có chấp nhận hay không. Nguyên tắc: AI chỉ là gợi ý – bạn mới là người quyết định.

### 2.4 Dịch hàng loạt
- Tại trang chi tiết tệp, chọn nhiều entries (checkbox) hoặc dùng “Chọn tất cả” ở trang hiện tại.
- Bấm “Dịch hàng loạt”. Hệ thống sẽ hiển thị tổng ký tự dự kiến cần dịch; so sánh với hạn mức của provider.
- Tuỳ chọn “Chỉ dịch dòng trống” (khuyến nghị khi quota hạn chế) hoặc “Ghi đè tất cả”.
- Xác nhận hành động. Kết quả sẽ bao gồm số đã dịch, số bỏ qua, và tổng ký tự.

Mẹo: Khi gần chạm hạn mức hằng tháng, ưu tiên dịch các dòng trống trước để đạt hiệu quả cao nhất. Những dòng đã có bản dịch, hãy để biên dịch viên chỉnh bằng tay khi cần.

### 2.5 Export dữ liệu
- Chọn định dạng phù hợp với pipeline của bạn: `.po`, CSV, Excel (.xlsx), JSON.
- Xuất `.po`: phù hợp khi bạn cần dùng lại trực tiếp trong ứng dụng gettext.
- CSV/Excel: phù hợp khi cần bàn giao cho biên dịch viên ngoài hệ thống hoặc kiểm tra hàng loạt bằng bảng tính.
- JSON: phù hợp khi bạn cần chuyển dữ liệu sang định dạng i18n khác hoặc tích hợp API.

---

## 3) Bảng dịch nội bộ (Translation Tables)

Bảng dịch là kho thuật ngữ riêng của tổ chức. Khác với `.po`, bảng dịch không bị ràng buộc vào file cụ thể. Bạn có thể xây một bảng “Thuật ngữ chung” và áp dụng cho nhiều dự án để giữ phong cách nhất quán.

### 3.1 Tạo bảng
1. Truy cập `/translations`.
2. Bấm “Tạo bảng mới”.
3. Nhập tên, ngôn ngữ và mô tả (tuỳ chọn). Xác nhận tạo.

### 3.2 Quản lý entries
- Thêm dòng: Nhập sourceText/translatedText. Có thể bổ sung description (ngữ cảnh) và references (vị trí áp dụng) để rõ ràng.
- Sửa/xoá: Thực hiện trên từng dòng. Hành động xoá yêu cầu confirm để tránh nhầm lẫn.
- Tìm kiếm & phân trang: Tương tự `.po`, bạn có thể lọc theo từ khoá và di chuyển giữa các trang.

### 3.3 Dịch hàng loạt
- Chọn nhiều entries và bấm “Dịch hàng loạt” → chọn provider → kiểm tra tổng ký tự → quyết định ghi đè hay chỉ dịch chỗ trống → xác nhận.

### 3.4 Export bảng dịch
- CSV/Excel/JSON/PO: Xuất sang định dạng phù hợp. PO hữu ích nếu bạn muốn dùng bảng dịch làm nền để tạo tệp `.po`.

---

## 4) Thực hành tốt (Best Practices)

- Chuẩn hoá thuật ngữ: Trước khi dịch rộng, xây bảng dịch “Thuật ngữ chung” và thống nhất trong nhóm. Điều này giảm việc sửa đi sửa lại sau này.
- Không lạm dụng AI: Hãy dùng AI để tạo nháp nhanh, sau đó người thật luôn phải rà soát, đặc biệt với chuỗi có ngữ cảnh tinh tế (pháp lý, tài chính, y tế…).
- Review theo đợt: Gom các thay đổi nhỏ rồi review một lần để tiết kiệm thời gian chuyển ngữ.
- Ghi references đầy đủ: Khi có thể, hãy ghi lại vị trí áp dụng (module, file, dòng). Điều này rất hữu ích khi QA cần đối chiếu.
- Export có kiểm soát: Lưu lại bản xuất (CSV/Excel/PO) vào một kho chứa chung để có lịch sử và đảm bảo khả năng rollback nếu cần.

---

## 5) Vai trò & quy trình gợi ý

- Developer:
  - Thiết lập môi trường, tạo database, cấu hình API keys cho AI.
  - Upload tệp `.po`, kiểm tra parse, đảm bảo dữ liệu hiển thị đúng.
  - Làm việc với QA/Translator để tinh chỉnh UI (tốc độ, thứ tự cột, thông báo…).
- Translator:
  - Dùng bảng dịch để thống nhất thuật ngữ.
  - Dịch nháp bằng AI cho các phần đơn giản → review thủ công → ghi nhận thuật ngữ mới.
  - Tìm kiếm theo ngữ cảnh, chỉnh sửa các chuỗi phức tạp, kiểm tra references.
- QA/PM:
  - Theo dõi tiến độ qua số lượng entries, tỷ lệ đã dịch.
  - Thực hiện kiểm thử giao diện thực tế, đảm bảo bản dịch không vỡ layout, không sai ngữ cảnh.
  - Chốt bản phát hành bằng export dữ liệu cho dev.

Quy trình ví dụ:
1. Dev up môi trường → Upload `.po` → Báo cho Translator.
2. Translator dùng AI cho phần đơn giản → review thủ công các chuỗi quan trọng.
3. QA chạy kiểm thử giao diện → phản hồi các lỗi ngữ cảnh/độ dài.
4. Translator/Dev cập nhật lần cuối → QA xác nhận → Dev export dữ liệu đưa vào build.

---

## 6) Gỡ rối thường gặp

- Không thấy dữ liệu sau upload: Kiểm tra log server, xác nhận tệp `.po` đúng chuẩn; thử seed dữ liệu mẫu để đối chiếu.
- Dịch hàng loạt báo vượt hạn mức: Chia nhỏ batch, chọn “chỉ dịch dòng trống”, hoặc tạm thời chuyển sang provider khác.
- Xuất `.po` bị lỗi encoding: Đảm bảo tệp gốc UTF-8 và không có BOM; hệ thống xuất UTF-8 chuẩn.
- Tìm kiếm chậm với dữ liệu rất lớn: Giới hạn phạm vi tìm kiếm theo file/bảng, tăng pageSize hợp lý; cân nhắc giải pháp full-text search.

---

## 7) Mở rộng nâng cao

- CI/CD: Dùng API để tự động export dữ liệu khi build. Có thể thiết lập job “sync translations” để tạo PR định kỳ vào repo.
- Kiểm tra chất lượng tự động: Viết script rà soát placeholder, biến nội suy, độ dài tối đa. Kết nối với hệ thống cảnh báo nội bộ.
- Quyền truy cập: Nếu triển khai cho tổ chức lớn, thêm lớp xác thực/ủy quyền và audit log.

---

## 8) Kết luận

Với các hướng dẫn trên, bạn đã có thể sử dụng Translation Workspace cho hầu hết nhu cầu hằng ngày: quản lý `.po`, bảng dịch, dịch AI có kiểm soát, export đa định dạng và phối hợp giữa Dev – Translator – QA – PM. Hãy bắt đầu với một tệp mẫu, xây bảng thuật ngữ chung, sau đó mở rộng dần quy mô dự án. Khi gặp vấn đề, quay lại mục Gỡ rối hoặc mở ticket để nhận hỗ trợ.

