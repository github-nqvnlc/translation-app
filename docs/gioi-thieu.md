# 1. Giới thiệu về Translation Workspace

Translation Workspace là một nền tảng quản lý bản dịch (localization) thực dụng, được thiết kế để giúp các nhóm phát triển phần mềm kiểm soát toàn bộ vòng đời của chuỗi ngôn ngữ trong sản phẩm. Thay vì để bản dịch trôi nổi trong nhiều file, nhiều công cụ hoặc nhiều kênh trao đổi khác nhau, Translation Workspace gom tất cả vào một nơi: tải lên – duyệt – sửa – dịch tự động – xuất dữ liệu – tích hợp với quy trình build và kiểm thử. Nhờ vậy, đội ngũ có thể di chuyển nhanh mà vẫn đảm bảo chất lượng.

## Bối cảnh ra đời

- Nhiều dự án bắt đầu bằng một ngôn ngữ duy nhất. Khi mở rộng, số chuỗi cần dịch tăng nhanh, thường trải khắp nhiều màn hình, nhiều module, nhiều repo. Việc giữ đúng ngữ cảnh và nhất quán thuật ngữ trở thành thách thức lớn.
- Các công cụ TMS (Translation Management System) doanh nghiệp có thể rất mạnh mẽ, nhưng đôi khi phức tạp và nặng nề đối với đội ngũ nhỏ hoặc dự án cần triển khai ngay. Bên cạnh đó, nhu cầu tự quản (self-host) và chủ động chi phí ngày càng phổ biến.
- Dịch máy (Machine Translation) giúp tăng tốc giai đoạn khởi đầu, nhưng nếu thiếu cơ chế kiểm soát (hạn mức, xác nhận ghi đè, cảnh báo) thì dễ phát sinh chi phí và rủi ro chất lượng.

Translation Workspace giải quyết các điểm đau này bằng cách cung cấp một không gian làm việc thống nhất, tập trung vào các tác vụ lặp lại hàng ngày, kết hợp tối ưu giữa AI và thao tác thủ công, đồng thời duy trì tốc độ lẫn tính minh bạch nhờ kiến trúc Next.js (SSR) + Prisma + PostgreSQL.

## Mục tiêu cốt lõi

1. Tập trung – Mọi thứ về bản dịch nằm trong một nơi: tệp .po, bảng dịch nội bộ, công cụ tìm kiếm, phân trang, và export đa định dạng.
2. Tăng tốc – Tích hợp DeepL, Gemini để tạo bản nháp nhanh; biên dịch viên rà soát và tinh chỉnh để đạt chất lượng mong muốn.
3. Minh bạch – Các thao tác rủi ro (xóa hàng loạt, ghi đè) luôn yêu cầu xác nhận; hiển thị tổng ký tự trước khi gọi AI để tránh “đốt quota”; luôn có cảnh báo khi vượt hạn mức.
4. Mở rộng – Kiến trúc modular, REST API, server actions cho phép tích hợp CI/CD, dashboard, hoặc provider AI mới mà không phá vỡ thiết kế.

## Ai nên sử dụng Translation Workspace?

- Developer: cần quản lý dữ liệu dịch, export/import .po một cách có kiểm soát, truy vấn nhanh, có API để tự động hóa.
- Biên dịch viên: cần giao diện trực quan, có ngữ cảnh (description, references), có thể dịch nháp bằng AI rồi chỉnh sửa.
- QA/PM: cần quan sát tiến độ, theo dõi khối lượng chuỗi, đảm bảo chất lượng đầu ra, giảm rủi ro thao tác.

## Giá trị khác biệt

- Thực dụng, không rườm rà – Chỉ tập trung những luồng phổ biến: upload – duyệt – sửa – dịch – export – đồng bộ.
- Bảng dịch nội bộ – Không chỉ phụ thuộc vào file .po; bạn còn có thể xây một “kho thuật ngữ” để tái sử dụng.
- Minh bạch về AI – Luôn biết mình đang dịch bao nhiêu ký tự, với provider nào, có ghi đè hay không.
- Mở rộng tự nhiên – Next.js + Prisma là nền tảng phổ biến, dễ tìm nhân sự, dễ kiểm thử, dễ triển khai.

## Triết lý trải nghiệm

- Ít ma sát: đường đi từ ý định đến hành động phải ngắn. Upload, tìm kiếm, sửa, dịch hàng loạt – chỉ vài cú click.
- Quyền kiểm soát trong tay con người: AI chỉ gợi ý; quyết định cuối cùng do người dùng, với nút xác nhận rõ ràng.
- Nhất quán: một hành vi nếu xuất hiện ở nhiều nơi phải giống nhau (confirm delete, hiển thị ký tự, thông báo trạng thái).

## Lộ trình phát triển (định hướng)

- Giai đoạn 1: Hoàn thiện module .po, bảng dịch, export CSV/Excel/JSON/PO, dịch hàng loạt DeepL/Gemini, tài liệu hoá đầy đủ.
- Giai đoạn 2: Bộ quy tắc QA, thống kê và báo cáo, kiểm tra placeholder/dấu câu/khoảng trắng, phân quyền đơn giản.
- Giai đoạn 3: Hỗ trợ nhiều định dạng (JSON i18n, ICU), đồng bộ 2 chiều với repo, tích hợp CI/CD và webhook.

## Kết luận

Translation Workspace sinh ra từ nhu cầu thực tế của đội ngũ cần một công cụ vừa nhanh, vừa rõ ràng, vừa có khả năng mở rộng. Nếu bạn đang tìm một nền tảng giúp quản lý bản dịch hiệu quả, có hỗ trợ AI nhưng vẫn tôn trọng quy trình con người, đây là điểm khởi đầu vững chắc.

---

Gợi ý: Chuyển sang “2. Tổng quan về Translation Workspace” để nắm hệ sinh thái công nghệ và danh sách tính năng ở mức hệ thống.