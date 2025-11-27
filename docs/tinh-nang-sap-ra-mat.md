# 7. Các tính năng sắp ra mắt

Tài liệu này trình bày lộ trình (roadmap) và tầm nhìn cho các tính năng chuẩn bị triển khai trong Translation Workspace. Mục tiêu là minh bạch định hướng phát triển, giúp đội ngũ và cộng đồng có cái nhìn thống nhất về ưu tiên, cũng như nhận phản hồi sớm để điều chỉnh cho "đúng nỗi đau" người dùng. Roadmap được phân theo nhóm chủ đề lớn, mỗi chủ đề liệt kê các hạng mục cụ thể, tình trạng dự kiến, rủi ro và ghi chú kỹ thuật.

---

## 1) Quản lý quyền truy cập (Authentication & Authorization)

Tính năng này là nền tảng bảo mật cho toàn bộ hệ thống, đảm bảo chỉ những người dùng được phép mới có thể truy cập, chỉnh sửa hoặc quản trị dữ liệu. Mục tiêu là cung cấp cơ chế xác thực mạnh mẽ, linh hoạt và dễ quản lý, phù hợp với cả triển khai tự host (self-hosted) và đa dự án.

### 1.1 Đăng nhập, đăng xuất, phiên làm việc

**Mục tiêu:**
- Xác thực người dùng một cách an toàn thông qua email + password hoặc OAuth.
- Quản lý phiên làm việc với thời gian sống hạn chế, tự động làm mới token.
- Đảm bảo bảo mật phiên trên cả client và server.

**Yêu cầu chức năng:**

1. **Đăng nhập (Login)**
   - Hỗ trợ xác thực email + password với hash bảo mật (bcrypt/argon2).
   - Hỗ trợ OAuth 2.0 (Google, GitHub, tuỳ chọn) để giảm phức tạp quản lý mật khẩu.
   - Xác minh email sau khi đăng ký (email verification link).
   - Ghi lại lần đăng nhập cuối cùng và địa chỉ IP để phát hiện hoạt động bất thường.

2. **Quản lý phiên (Session Management)**
   - Tạo session token (JWT hoặc session ID) sau khi đăng nhập thành công.
   - Lưu trữ session metadata: user ID, vai trò, project/team, thời gian tạo, thời gian hết hạn.
   - Thời gian sống phiên: mặc định 24 giờ (có thể cấu hình).
   - Hỗ trợ "remember me" (kéo dài thời gian phiên lên 30 ngày) với xác thực bổ sung.

3. **Làm mới Token (Token Refresh)**
   - Cấp refresh token riêng biệt, thời gian sống dài hơn (7-30 ngày).
   - Endpoint `/api/auth/refresh` để tự động gia hạn access token mà không cần đăng nhập lại.
   - Xoay refresh token sau mỗi lần sử dụng để tăng bảo mật.

4. **Đăng xuất (Logout)**
   - Xoá session từ server (invalidate token).
   - Xoá cookie/localStorage trên client.
   - Ghi lại sự kiện đăng xuất trong audit log.

5. **Bảo mật phiên**
   - Sử dụng HTTPS bắt buộc cho tất cả các endpoint xác thực.
   - HttpOnly cookies để lưu token (tránh XSS).
   - CSRF protection cho các form đăng nhập.
   - Rate limiting trên endpoint đăng nhập (tối đa 5 lần thất bại/phút).

**Tình trạng:** Dự kiến.

**Ghi chú kỹ thuật:**
- Sử dụng Next.js App Router Route Handlers (`/app/api/auth/[...nextauth]/route.ts`) với NextAuth.js hoặc giải pháp tương tự.
- Lưu trữ session trong database (PostgreSQL) hoặc Redis (cho performance cao).
- Tương thích self-hosted: không phụ thuộc vào dịch vụ xác thực bên thứ ba bắt buộc.

---

#### 1.1.1 Mô tả chi tiết tính năng

**Đăng ký tài khoản (Registration)**
- Người dùng có thể đăng ký bằng email và mật khẩu.
- Mật khẩu phải đáp ứng yêu cầu: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.
- Sau khi đăng ký, hệ thống gửi email xác minh chứa link kích hoạt tài khoản.
- Link xác minh có thời hạn 24 giờ, sau đó cần yêu cầu gửi lại email.
- Tài khoản chưa xác minh chỉ có thể đăng nhập sau khi xác minh email (hoặc Admin kích hoạt thủ công).

**Đăng nhập (Login)**
- Form đăng nhập hỗ trợ 2 phương thức:
  - **Email + Password**: Nhập email và mật khẩu, có checkbox "Remember me".
  - **OAuth**: Nút đăng nhập với Google/GitHub, redirect về callback URL sau khi xác thực.
- Sau khi đăng nhập thành công, hệ thống:
  - Tạo session token và refresh token.
  - Ghi lại thời gian đăng nhập, địa chỉ IP, user agent.
  - Redirect về trang trước đó hoặc dashboard mặc định.
- Nếu đăng nhập thất bại (sai mật khẩu, email chưa tồn tại), hiển thị thông báo lỗi chung (không tiết lộ email có tồn tại hay không).
- Sau 5 lần đăng nhập thất bại liên tiếp, tài khoản bị khóa tạm thời 15 phút (có thể cấu hình).

**Quản lý phiên (Session Management)**
- Mỗi phiên có:
  - Access token (JWT): thời hạn 24 giờ, chứa user ID, roles, permissions.
  - Refresh token: thời hạn 30 ngày, lưu trong database với hash.
  - Session ID: để tracking và invalidate khi cần.
- Khi "Remember me" được chọn:
  - Access token: 7 ngày.
  - Refresh token: 90 ngày.
- Hệ thống tự động refresh token trước khi hết hạn (5 phút trước khi expire).
- Người dùng có thể xem danh sách các phiên đang hoạt động và đăng xuất từ xa.

**Làm mới Token (Token Refresh)**
- Client gọi `/api/auth/refresh` với refresh token trong cookie.
- Server:
  - Xác thực refresh token.
  - Tạo access token mới.
  - Xoay refresh token (tạo mới, vô hiệu hóa token cũ).
  - Trả về access token mới.
- Nếu refresh token hết hạn hoặc không hợp lệ, yêu cầu đăng nhập lại.

**Đăng xuất (Logout)**
- Đăng xuất có thể thực hiện từ:
  - Menu dropdown user profile.
  - Trang quản lý phiên (đăng xuất một phiên cụ thể).
- Khi đăng xuất:
  - Invalidate session trên server.
  - Xóa refresh token khỏi database.
  - Xóa cookies trên client.
  - Ghi audit log.
  - Redirect về trang đăng nhập.

**Quên mật khẩu (Password Reset)**
- Người dùng nhập email, hệ thống gửi link reset mật khẩu.
- Link reset có thời hạn 1 giờ, chỉ sử dụng được 1 lần.
- Sau khi reset, yêu cầu đăng nhập lại.

**Đổi mật khẩu (Change Password)**
- Yêu cầu nhập mật khẩu hiện tại để xác thực.
- Mật khẩu mới phải đáp ứng yêu cầu tương tự đăng ký.
- Sau khi đổi, vô hiệu hóa tất cả refresh token cũ (yêu cầu đăng nhập lại trên các thiết bị khác).

---

#### 1.1.2 Database Schema

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  passwordHash      String?   // null nếu chỉ dùng OAuth
  name              String?
  image             String?   // URL avatar từ OAuth
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?
  lastLoginIp       String?
  
  // OAuth accounts
  accounts          Account[]
  
  // Sessions
  sessions          Session[]
  refreshTokens     RefreshToken[]
  
  // Roles & Permissions
  roles             UserRole[]
  
  // Audit logs
  auditLogs         AuditLog[]
  
  @@index([email])
  @@index([emailVerified])
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              String   // "oauth" | "credentials"
  provider          String   // "google" | "github" | "credentials"
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  expiresAt         Int?
  tokenType         String?
  scope             String?
  idToken           String?
  sessionState      String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id                String   @id @default(cuid())
  sessionToken      String   @unique
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt         DateTime
  ipAddress         String?
  userAgent         String?
  createdAt         DateTime @default(now())
  
  @@index([userId])
  @@index([sessionToken])
  @@index([expiresAt])
}

model RefreshToken {
  id                String   @id @default(cuid())
  token             String   @unique
  tokenHash         String   // Hashed version để lưu trong DB
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt         DateTime
  revokedAt         DateTime?
  replacedByTokenId String?  // Token mới thay thế (token rotation)
  ipAddress         String?
  userAgent         String?
  createdAt         DateTime @default(now())
  
  @@index([userId])
  @@index([tokenHash])
  @@index([expiresAt])
}

model VerificationToken {
  id                String   @id @default(cuid())
  identifier        String   // Email hoặc token identifier
  token             String   @unique
  tokenHash         String
  type              String   // "email_verification" | "password_reset"
  expiresAt         DateTime
  createdAt         DateTime @default(now())
  
  @@index([tokenHash])
  @@index([identifier, type])
}

model LoginAttempt {
  id                String   @id @default(cuid())
  email             String
  ipAddress         String
  userAgent         String?
  success           Boolean
  failureReason     String?  // "invalid_password" | "email_not_verified" | "account_locked"
  createdAt         DateTime @default(now())
  
  @@index([email, createdAt])
  @@index([ipAddress, createdAt])
}
```

**Ghi chú về Database:**
- `User.passwordHash`: Lưu hash mật khẩu bằng bcrypt (cost factor 12) hoặc argon2id.
- `Session.sessionToken`: JWT hoặc random string, lưu trong HttpOnly cookie.
- `RefreshToken.tokenHash`: Hash token trước khi lưu (không lưu plaintext).
- `VerificationToken`: Tự động xóa sau khi sử dụng hoặc hết hạn (cron job).
- `LoginAttempt`: Lưu để tracking và rate limiting, tự động xóa sau 30 ngày.

---

#### 1.1.3 API Endpoints

**POST `/api/auth/register`**
- **Mô tả**: Đăng ký tài khoản mới.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe" // Optional
  }
  ```
- **Response 201**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
    "userId": "clx123..."
  }
  ```
- **Response 400**: Email đã tồn tại, mật khẩu không đáp ứng yêu cầu.
- **Response 429**: Quá nhiều request (rate limit).

**POST `/api/auth/login`**
- **Mô tả**: Đăng nhập bằng email và mật khẩu.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123!",
    "rememberMe": false // Optional, default false
  }
  ```
- **Response 200**:
  ```json
  {
    "success": true,
    "user": {
      "id": "clx123...",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": true
    }
  }
  ```
- **Response 401**: Email hoặc mật khẩu không đúng.
- **Response 403**: Tài khoản chưa xác minh email hoặc bị khóa.
- **Response 429**: Quá nhiều lần đăng nhập thất bại.

**POST `/api/auth/logout`**
- **Mô tả**: Đăng xuất, vô hiệu hóa session hiện tại.
- **Headers**: Cookie chứa session token.
- **Response 200**:
  ```json
  {
    "success": true,
    "message": "Đăng xuất thành công"
  }
  ```

**POST `/api/auth/refresh`**
- **Mô tả**: Làm mới access token bằng refresh token.
- **Headers**: Cookie chứa refresh token.
- **Response 200**:
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGc..." // JWT mới
  }
  ```
- **Response 401**: Refresh token không hợp lệ hoặc hết hạn.

**GET `/api/auth/session`**
- **Mô tả**: Lấy thông tin session hiện tại.
- **Headers**: Cookie chứa session token.
- **Response 200**:
  ```json
  {
    "user": {
      "id": "clx123...",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["editor", "reviewer"]
    },
    "expiresAt": "2024-01-02T12:00:00Z"
  }
  ```
- **Response 401**: Session không hợp lệ.

**GET `/api/auth/sessions`**
- **Mô tả**: Lấy danh sách tất cả phiên đang hoạt động của user.
- **Headers**: Cookie chứa session token.
- **Response 200**:
  ```json
  {
    "sessions": [
      {
        "id": "clx456...",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-01T10:00:00Z",
        "expiresAt": "2024-01-02T10:00:00Z",
        "isCurrent": true
      }
    ]
  }
  ```

**DELETE `/api/auth/sessions/:sessionId`**
- **Mô tả**: Đăng xuất một phiên cụ thể (có thể là phiên khác).
- **Headers**: Cookie chứa session token.
- **Response 200**: Đăng xuất thành công.
- **Response 403**: Không có quyền đăng xuất phiên của user khác.

**POST `/api/auth/verify-email`**
- **Mô tả**: Xác minh email từ link trong email.
- **Request Body**:
  ```json
  {
    "token": "verification_token_from_email"
  }
  ```
- **Response 200**: Xác minh thành công.
- **Response 400**: Token không hợp lệ hoặc hết hạn.

**POST `/api/auth/resend-verification`**
- **Mô tả**: Gửi lại email xác minh.
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response 200**: Email đã được gửi.
- **Response 429**: Quá nhiều request (chỉ cho phép 1 lần/phút).

**POST `/api/auth/forgot-password`**
- **Mô tả**: Yêu cầu reset mật khẩu.
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response 200**: Email reset đã được gửi (luôn trả về 200 để không tiết lộ email có tồn tại).

**POST `/api/auth/reset-password`**
- **Mô tả**: Đặt lại mật khẩu từ link reset.
- **Request Body**:
  ```json
  {
    "token": "reset_token_from_email",
    "newPassword": "NewSecurePass123!"
  }
  ```
- **Response 200**: Reset mật khẩu thành công.
- **Response 400**: Token không hợp lệ hoặc hết hạn.

**POST `/api/auth/change-password`**
- **Mô tả**: Đổi mật khẩu (yêu cầu đăng nhập).
- **Headers**: Cookie chứa session token.
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPass123!",
    "newPassword": "NewSecurePass123!"
  }
  ```
- **Response 200**: Đổi mật khẩu thành công.
- **Response 401**: Mật khẩu hiện tại không đúng.

**GET `/api/auth/oauth/:provider`**
- **Mô tả**: Bắt đầu OAuth flow (redirect đến provider).
- **Response**: Redirect đến OAuth provider.

**GET `/api/auth/oauth/:provider/callback`**
- **Mô tả**: Callback từ OAuth provider sau khi xác thực.
- **Query Params**: `code`, `state` (từ OAuth provider).
- **Response**: Redirect về frontend với session token.

---

#### 1.1.4 Yêu cầu UI

**Trang Đăng ký (`/register`)**
- Form gồm:
  - Input email (type="email", required, validation).
  - Input mật khẩu (type="password", required, hiển thị yêu cầu mật khẩu).
  - Input xác nhận mật khẩu (type="password", required, so khớp với mật khẩu).
  - Input tên (optional, type="text").
  - Checkbox đồng ý điều khoản (required).
  - Button "Đăng ký".
- Hiển thị lỗi validation real-time dưới mỗi input.
- Sau khi đăng ký thành công:
  - Hiển thị thông báo: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản."
  - Link "Gửi lại email xác minh" (nếu cần).
  - Link quay về trang đăng nhập.

**Trang Đăng nhập (`/login`)**
- Form đăng nhập:
  - Input email (type="email", required).
  - Input mật khẩu (type="password", required).
  - Checkbox "Remember me".
  - Link "Quên mật khẩu?".
  - Button "Đăng nhập".
  - Divider "Hoặc".
  - Button "Đăng nhập với Google" (OAuth).
  - Button "Đăng nhập với GitHub" (OAuth).
- Hiển thị lỗi đăng nhập (chung chung, không tiết lộ email có tồn tại).
- Link "Chưa có tài khoản? Đăng ký" ở cuối form.
- Nếu tài khoản chưa xác minh, hiển thị banner: "Vui lòng xác minh email để đăng nhập. [Gửi lại email]".

**Trang Xác minh Email (`/verify-email`)**
- Hiển thị khi user click link từ email.
- Nếu token hợp lệ: "Email đã được xác minh thành công. [Đăng nhập]".
- Nếu token không hợp lệ: "Link xác minh không hợp lệ hoặc đã hết hạn. [Gửi lại email]".

**Trang Quên Mật khẩu (`/forgot-password`)**
- Form:
  - Input email (type="email", required).
  - Button "Gửi link reset mật khẩu".
- Sau khi gửi: "Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu."
- Link "Quay về đăng nhập".

**Trang Reset Mật khẩu (`/reset-password?token=...`)**
- Form:
  - Input mật khẩu mới (type="password", required, hiển thị yêu cầu).
  - Input xác nhận mật khẩu mới (type="password", required).
  - Button "Đặt lại mật khẩu".
- Hiển thị lỗi nếu token không hợp lệ hoặc hết hạn.

**Trang Đổi Mật khẩu (`/settings/change-password`)**
- Form (yêu cầu đăng nhập):
  - Input mật khẩu hiện tại (type="password", required).
  - Input mật khẩu mới (type="password", required).
  - Input xác nhận mật khẩu mới (type="password", required).
  - Button "Đổi mật khẩu".
- Hiển thị thông báo thành công sau khi đổi.

**Menu User Profile (Dropdown)**
- Hiển thị avatar, tên, email.
- Menu items:
  - "Hồ sơ" (link đến `/settings/profile`).
  - "Đổi mật khẩu" (link đến `/settings/change-password`).
  - "Quản lý phiên" (link đến `/settings/sessions`).
  - Divider.
  - "Đăng xuất" (button, gọi API logout).

**Trang Quản lý Phiên (`/settings/sessions`)**
- Danh sách tất cả phiên đang hoạt động:
  - Hiển thị: IP address, user agent, thời gian tạo, thời gian hết hạn.
  - Đánh dấu "Phiên hiện tại" cho phiên đang dùng.
  - Button "Đăng xuất" cho mỗi phiên (trừ phiên hiện tại có thể đăng xuất từ menu).
- Cảnh báo khi đăng xuất phiên khác: "Bạn sẽ đăng xuất khỏi thiết bị này. Tiếp tục?"

**Component Bảo vệ Route (Protected Route)**
- Component `ProtectedRoute` hoặc middleware:
  - Kiểm tra session khi truy cập route.
  - Nếu chưa đăng nhập: redirect về `/login?redirect=/current-path`.
  - Nếu session hết hạn: tự động refresh hoặc yêu cầu đăng nhập lại.
  - Hiển thị loading spinner trong lúc kiểm tra.

**Toast Notifications**
- Thông báo thành công/lỗi cho các hành động:
  - Đăng ký thành công.
  - Đăng nhập thành công.
  - Đăng xuất thành công.
  - Đổi mật khẩu thành công.
  - Lỗi đăng nhập (chung chung).
  - Session hết hạn, yêu cầu đăng nhập lại.

**Loading States**
- Hiển thị spinner/loading khi:
  - Đang gửi request đăng nhập/đăng ký.
  - Đang xác minh email.
  - Đang refresh token.
  - Đang đăng xuất.

**Responsive Design**
- Tất cả form đăng nhập/đăng ký responsive trên mobile.
- Menu user profile responsive (collapse trên mobile).

---

### 1.2 Phân quyền theo vai trò (RBAC - Role-Based Access Control)

**Mục tiêu:**
- Phân biệt quyền hạn dựa trên vai trò của người dùng.
- Kiểm soát truy cập tài nguyên (entries, files, projects) ở mức chi tiết.
- Hỗ trợ cấp quyền theo project/team để cho phép đa dự án trong cùng instance.

**Yêu cầu chức năng:**

1. **Định nghĩa vai trò (Roles)**
   
   | Vai trò | Mô tả | Quyền chính |
   |--------|-------|-----------|
   | **Viewer** | Người xem, không chỉnh sửa | • Xem danh sách entries, files<br>• Xem báo cáo, thống kê<br>• Tải file xuất (export)<br>• Xem bình luận, nhãn |
   | **Editor** | Người dịch, chỉnh sửa nội dung | • Tất cả quyền của Viewer<br>• Chỉnh sửa entries (source & target)<br>• Sử dụng dịch AI (trong hạn mức)<br>• Tạo bình luận, gắn nhãn<br>• Không thể phê duyệt hoặc xoá |
   | **Reviewer** | Người kiểm duyệt, đảm bảo chất lượng | • Tất cả quyền của Editor<br>• Phê duyệt/từ chối entries<br>• Gắn nhãn chất lượng (QA status)<br>• Xem audit log của entries<br>• Không thể quản trị người dùng |
   | **Admin** | Quản trị viên hệ thống | • Tất cả quyền<br>• Quản lý người dùng (thêm/xoá/sửa)<br>• Cấu hình hệ thống (quota, rules)<br>• Quản lý projects/teams<br>• Xem audit log toàn hệ thống<br>• Cấu hình OAuth, email settings |

2. **Cấp quyền theo Project/Team**
   - Mỗi người dùng có thể có vai trò khác nhau trên các project khác nhau.
   - Ví dụ: User A là "Editor" trên Project X nhưng "Reviewer" trên Project Y.
   - Admin của Project X có thể quản lý thành viên trong project đó (không cần quyền Admin toàn hệ thống).

3. **Kiểm soát truy cập tài nguyên (Resource-level)**
   - Middleware kiểm tra quyền trước khi truy cập API:
     ```
     GET /api/entries/:id → Kiểm tra user có quyền xem project này không?
     PATCH /api/entries/:id → Kiểm tra user có vai trò Editor+ không?
     DELETE /api/entries/:id → Kiểm tra user có vai trò Reviewer+ không?
     ```
   - Trả về 403 Forbidden nếu không có quyền.

4. **Quyền mặc định khi tạo tài khoản**
   - Người dùng mới được gán vai trò "Viewer" mặc định trên tất cả projects.
   - Admin phải tăng quyền thủ công nếu cần.

5. **Quản lý quyền Admin**
   - Chỉ Admin hiện tại mới có thể thêm/xoá Admin khác.
   - Ít nhất 1 Admin phải tồn tại trong hệ thống.
   - Ghi lại tất cả thay đổi quyền trong audit log.

**Tình trạng:** Dự kiến.

**Ghi chú kỹ thuật:**
- Lưu trữ vai trò trong bảng `user_roles` hoặc `team_members`:
  ```sql
  CREATE TABLE user_roles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    role ENUM('viewer', 'editor', 'reviewer', 'admin'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );
  ```
- Sử dụng middleware Next.js để kiểm tra quyền trên mỗi request.
- Cache quyền trong session để tránh query database quá nhiều.
- Hỗ trợ permission inheritance: nếu user là Admin toàn hệ thống, tự động có tất cả quyền trên mọi project.

---

#### 1.2.1 Mô tả chi tiết tính năng

**Hệ thống vai trò phân cấp**
- Các vai trò được sắp xếp theo thứ tự quyền hạn: `Viewer < Editor < Reviewer < Admin`.
- Mỗi vai trò kế thừa tất cả quyền của vai trò thấp hơn.
- Quyền được kiểm tra theo nguyên tắc "ít nhất một trong các điều kiện":
  - User có vai trò Admin toàn hệ thống → có tất cả quyền.
  - User có vai trò trên project cụ thể → có quyền tương ứng trên project đó.
  - User không có vai trò nào → không có quyền truy cập.

**Quyền theo Project/Team**
- Mỗi project có thể có nhiều thành viên với vai trò khác nhau.
- Project Admin có thể:
  - Thêm/xóa/sửa vai trò của thành viên trong project.
  - Không thể thay đổi vai trò của Admin toàn hệ thống.
  - Không thể tự xóa vai trò Admin của chính mình (cần Admin khác).
- Khi tạo project mới:
  - Người tạo tự động trở thành Admin của project.
  - Có thể mời thành viên khác ngay khi tạo.

**Quyền mặc định**
- User mới đăng ký:
  - Không có vai trò trên bất kỳ project nào (trừ khi được mời).
  - Có thể xem các project công khai (nếu có tính năng public projects).
- Admin toàn hệ thống có thể:
  - Gán vai trò mặc định cho user mới (ví dụ: Viewer trên tất cả projects).
  - Cấu hình quyền mặc định trong settings.

**Kiểm soát truy cập tài nguyên**
- Mỗi tài nguyên (entry, file, project) thuộc về một project.
- Kiểm tra quyền theo flow:
  1. Lấy project ID từ tài nguyên.
  2. Kiểm tra user có vai trò trên project đó không.
  3. Kiểm tra vai trò có đủ quyền thực hiện hành động không.
  4. Nếu không đủ quyền → trả về 403 Forbidden.

**Quản lý quyền Admin**
- Admin toàn hệ thống:
  - Có thể thêm/xóa Admin khác.
  - Không thể tự xóa vai trò Admin của chính mình.
  - Phải có ít nhất 1 Admin trong hệ thống.
- Khi thay đổi quyền Admin:
  - Ghi audit log chi tiết.
  - Gửi email thông báo cho user bị thay đổi quyền.
  - Yêu cầu xác nhận 2 bước nếu xóa Admin (tránh nhầm lẫn).

**Cache quyền**
- Quyền được cache trong session để tăng performance.
- Cache được invalidate khi:
  - User thay đổi vai trò.
  - Project bị xóa hoặc thay đổi cấu hình.
  - Admin thay đổi quyền của user khác.
- Cache TTL: 5 phút (có thể cấu hình).

---

#### 1.2.2 Database Schema

```prisma
model Project {
  id                String    @id @default(cuid())
  name              String
  description       String?
  isPublic          Boolean   @default(false) // Project công khai cho Viewer
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdBy         String    // User ID tạo project
  
  // Relations
  members           ProjectMember[]
  translationTables TranslationTable[]
  poFiles           PoFile[]
  
  @@index([createdBy])
}

model ProjectMember {
  id                String   @id @default(cuid())
  projectId         String
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role              Role     @default(VIEWER)
  invitedBy         String?  // User ID mời
  joinedAt          DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([projectId, userId])
  @@index([userId])
  @@index([projectId])
}

enum Role {
  VIEWER
  EDITOR
  REVIEWER
  ADMIN
}

// Mở rộng model User từ phần 1.1.2
// Thêm vào model User:
model User {
  // ... các field từ phần 1.1.2
  
  // Thêm relations cho RBAC
  projectMemberships ProjectMember[]
  systemRole         SystemRole? // Admin toàn hệ thống
  auditLogs          AuditLog[]
}

model SystemRole {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role              Role     @default(ADMIN) // Chỉ có ADMIN cho system role
  grantedBy         String   // User ID cấp quyền
  grantedAt         DateTime @default(now())
  
  @@index([userId])
}

model Permission {
  id                String   @id @default(cuid())
  name              String   @unique // "view_entries", "edit_entries", "delete_entries", etc.
  description       String?
  resourceType      String   // "entry", "file", "project", "user", etc.
  action            String   // "view", "create", "update", "delete", "approve", etc.
  
  @@index([resourceType, action])
}

model RolePermission {
  id                String   @id @default(cuid())
  role              Role
  permissionId      String
  permission        Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([role, permissionId])
  @@index([role])
}

model AuditLog {
  id                String   @id @default(cuid())
  userId            String?
  user              User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action            String   // "role_changed", "permission_granted", "project_created", etc.
  resourceType      String   // "user", "project", "entry", etc.
  resourceId        String?
  details           Json?    // Chi tiết thay đổi (before/after)
  ipAddress         String?
  userAgent         String?
  createdAt         DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([resourceType, resourceId])
  @@index([action, createdAt])
}
```

**Ghi chú về Database:**
- `ProjectMember.role`: Vai trò của user trên project cụ thể.
- `SystemRole`: Chỉ dành cho Admin toàn hệ thống (không gắn với project).
- `Permission` và `RolePermission`: Định nghĩa quyền chi tiết, có thể mở rộng sau.
- `AuditLog`: Ghi lại mọi thay đổi quyền và hành động quan trọng.
- Index được tối ưu cho các query thường dùng: lấy quyền của user, kiểm tra quyền trên project.

**Mapping quyền chi tiết:**

| Vai trò | Quyền trên Entry | Quyền trên File | Quyền trên Project |
|---------|------------------|----------------|-------------------|
| **Viewer** | • Xem entry<br>• Xem bình luận | • Xem file<br>• Export file | • Xem project<br>• Xem thành viên |
| **Editor** | • Tất cả Viewer<br>• Tạo entry<br>• Sửa entry (source & target)<br>• Dịch AI<br>• Tạo bình luận | • Tất cả Viewer<br>• Upload file<br>• Import file | • Tất cả Viewer<br>• Tạo translation table |
| **Reviewer** | • Tất cả Editor<br>• Phê duyệt/từ chối entry<br>• Xóa entry<br>• Xem audit log | • Tất cả Editor<br>• Xóa file | • Tất cả Editor<br>• Quản lý thành viên (thêm/xóa/sửa role)<br>• Xem audit log project |
| **Admin** | • Tất cả quyền | • Tất cả quyền | • Tất cả quyền<br>• Xóa project<br>• Cấu hình project |

---

#### 1.2.3 API Endpoints

**GET `/api/projects`**
- **Mô tả**: Lấy danh sách projects mà user có quyền truy cập.
- **Headers**: Cookie chứa session token.
- **Query Params**:
  - `role`: Lọc theo vai trò (viewer, editor, reviewer, admin).
  - `page`: Số trang (default: 1).
  - `limit`: Số items mỗi trang (default: 20).
- **Response 200**:
  ```json
  {
    "projects": [
      {
        "id": "clx123...",
        "name": "Project A",
        "description": "...",
        "role": "editor",
        "memberCount": 5,
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
  ```

**GET `/api/projects/:id`**
- **Mô tả**: Lấy thông tin chi tiết project.
- **Headers**: Cookie chứa session token.
- **Response 200**:
  ```json
  {
    "id": "clx123...",
    "name": "Project A",
    "description": "...",
    "isPublic": false,
    "role": "editor",
    "createdAt": "2024-01-01T10:00:00Z",
    "members": [
      {
        "userId": "clx456...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "reviewer",
        "joinedAt": "2024-01-02T10:00:00Z"
      }
    ]
  }
  ```
- **Response 403**: Không có quyền xem project.

**POST `/api/projects`**
- **Mô tả**: Tạo project mới (yêu cầu đăng nhập).
- **Headers**: Cookie chứa session token.
- **Request Body**:
  ```json
  {
    "name": "New Project",
    "description": "Project description",
    "isPublic": false
  }
  ```
- **Response 201**:
  ```json
  {
    "id": "clx123...",
    "name": "New Project",
    "role": "admin",
    "createdAt": "2024-01-01T10:00:00Z"
  }
  ```

**PATCH `/api/projects/:id`**
- **Mô tả**: Cập nhật thông tin project (yêu cầu role: Reviewer+).
- **Headers**: Cookie chứa session token.
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "isPublic": true
  }
  ```
- **Response 200**: Project đã được cập nhật.
- **Response 403**: Không có quyền.

**DELETE `/api/projects/:id`**
- **Mô tả**: Xóa project (yêu cầu role: Admin của project).
- **Headers**: Cookie chứa session token.
- **Response 200**: Project đã được xóa.
- **Response 403**: Không có quyền.

**GET `/api/projects/:id/members`**
- **Mô tả**: Lấy danh sách thành viên project.
- **Headers**: Cookie chứa session token.
- **Response 200**:
  ```json
  {
    "members": [
      {
        "id": "clx789...",
        "userId": "clx456...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "reviewer",
        "joinedAt": "2024-01-02T10:00:00Z",
        "invitedBy": "clx123..."
      }
    ]
  }
  ```
- **Response 403**: Không có quyền xem thành viên.

**POST `/api/projects/:id/members`**
- **Mô tả**: Thêm thành viên vào project (yêu cầu role: Reviewer+).
- **Headers**: Cookie chứa session token.
- **Request Body**:
  ```json
  {
    "email": "newuser@example.com",
    "role": "editor"
  }
  ```
- **Response 201**:
  ```json
  {
    "id": "clx789...",
    "userId": "clx456...",
    "email": "newuser@example.com",
    "role": "editor",
    "joinedAt": "2024-01-02T10:00:00Z"
  }
  ```
- **Response 400**: Email không tồn tại hoặc đã là thành viên.
- **Response 403**: Không có quyền thêm thành viên.

**PATCH `/api/projects/:id/members/:memberId`**
- **Mô tả**: Cập nhật vai trò thành viên (yêu cầu role: Reviewer+).
- **Headers**: Cookie chứa session token.
- **Request Body**:
  ```json
  {
    "role": "reviewer"
  }
  ```
- **Response 200**: Vai trò đã được cập nhật.
- **Response 403**: Không có quyền hoặc không thể thay đổi role của Admin.
- **Response 400**: Không thể tự hạ quyền của chính mình (nếu là Admin duy nhất).

**DELETE `/api/projects/:id/members/:memberId`**
- **Mô tả**: Xóa thành viên khỏi project (yêu cầu role: Reviewer+).
- **Headers**: Cookie chứa session token.
- **Response 200**: Thành viên đã được xóa.
- **Response 403**: Không có quyền hoặc không thể xóa Admin.

**GET `/api/users/:id/permissions`**
- **Mô tả**: Lấy danh sách quyền của user (yêu cầu: chính user đó hoặc Admin).
- **Headers**: Cookie chứa session token.
- **Query Params**:
  - `projectId`: Lọc quyền theo project (optional).
- **Response 200**:
  ```json
  {
    "userId": "clx456...",
    "systemRole": "admin", // null nếu không phải Admin toàn hệ thống
    "projectRoles": [
      {
        "projectId": "clx123...",
        "projectName": "Project A",
        "role": "editor",
        "permissions": ["view_entries", "edit_entries", "create_entries"]
      }
    ]
  }
  ```

**GET `/api/users/:id/roles`**
- **Mô tả**: Lấy danh sách vai trò của user trên tất cả projects (yêu cầu: chính user đó hoặc Admin).
- **Headers**: Cookie chứa session token.
- **Response 200**:
  ```json
  {
    "userId": "clx456...",
    "systemRole": "admin",
    "projectRoles": [
      {
        "projectId": "clx123...",
        "projectName": "Project A",
        "role": "editor"
      }
    ]
  }
  ```

**POST `/api/admin/users/:id/system-role`**
- **Mô tả**: Gán/quyền Admin toàn hệ thống (yêu cầu: Admin toàn hệ thống).
- **Headers**: Cookie chứa session token.
- **Request Body**:
  ```json
  {
    "role": "admin" // Chỉ có "admin" cho system role
  }
  ```
- **Response 200**: Quyền đã được gán.
- **Response 403**: Không có quyền Admin.
- **Response 400**: Không thể tự xóa quyền Admin của chính mình.

**DELETE `/api/admin/users/:id/system-role`**
- **Mô tả**: Xóa quyền Admin toàn hệ thống (yêu cầu: Admin toàn hệ thống, không thể tự xóa).
- **Headers**: Cookie chứa session token.
- **Response 200**: Quyền đã được xóa.
- **Response 400**: Không thể tự xóa hoặc phải có ít nhất 1 Admin.

**GET `/api/audit-logs`**
- **Mô tả**: Lấy audit logs (yêu cầu: Reviewer+ hoặc Admin).
- **Headers**: Cookie chứa session token.
- **Query Params**:
  - `userId`: Lọc theo user ID.
  - `resourceType`: Lọc theo loại tài nguyên.
  - `resourceId`: Lọc theo ID tài nguyên.
  - `action`: Lọc theo hành động.
  - `startDate`: Ngày bắt đầu.
  - `endDate`: Ngày kết thúc.
  - `page`: Số trang.
  - `limit`: Số items mỗi trang.
- **Response 200**:
  ```json
  {
    "logs": [
      {
        "id": "clx999...",
        "userId": "clx456...",
        "userName": "John Doe",
        "action": "role_changed",
        "resourceType": "project_member",
        "resourceId": "clx789...",
        "details": {
          "before": { "role": "editor" },
          "after": { "role": "reviewer" }
        },
        "ipAddress": "192.168.1.1",
        "createdAt": "2024-01-02T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
  ```

**Middleware kiểm tra quyền:**
- Tất cả API endpoints (trừ auth) đều đi qua middleware kiểm tra quyền.
- Middleware:
  1. Xác thực session token.
  2. Lấy user ID từ session.
  3. Kiểm tra quyền dựa trên:
     - System role (nếu là Admin toàn hệ thống → có tất cả quyền).
     - Project role (nếu có vai trò trên project).
  4. Trả về 401 nếu chưa đăng nhập, 403 nếu không có quyền.

---

#### 1.2.4 Yêu cầu UI

**Trang Danh sách Projects (`/projects`)**
- Hiển thị danh sách projects mà user có quyền truy cập.
- Mỗi project card hiển thị:
  - Tên project, mô tả (nếu có).
  - Vai trò của user trên project (badge: Viewer/Editor/Reviewer/Admin).
  - Số thành viên, số translation tables/files.
  - Ngày tạo.
  - Button "Xem chi tiết" hoặc click vào card.
- Filter/Search:
  - Tìm kiếm theo tên project.
  - Lọc theo vai trò (dropdown).
  - Sắp xếp theo: tên, ngày tạo, số thành viên.
- Button "Tạo project mới" (nếu user đã đăng nhập).

**Trang Chi tiết Project (`/projects/:id`)**
- Tab "Tổng quan":
  - Thông tin project: tên, mô tả, ngày tạo, người tạo.
  - Thống kê: số translation tables, số files, số entries.
  - Button "Chỉnh sửa" (nếu có quyền Reviewer+).
  - Button "Xóa project" (nếu có quyền Admin, với confirmation).
- Tab "Thành viên":
  - Bảng danh sách thành viên:
    - Cột: Tên, Email, Vai trò, Ngày tham gia, Hành động.
    - Dropdown "Vai trò" để thay đổi (nếu có quyền Reviewer+).
    - Button "Xóa" cho mỗi thành viên (nếu có quyền Reviewer+).
  - Button "Mời thành viên" (nếu có quyền Reviewer+):
    - Modal form: nhập email, chọn vai trò.
    - Gửi email mời (nếu user chưa có tài khoản, tạo tài khoản và gửi link kích hoạt).
- Tab "Cài đặt":
  - Cấu hình project: công khai/riêng tư, quota AI, v.v. (nếu có quyền Reviewer+).
- Hiển thị badge vai trò của user hiện tại ở header.

**Trang Quản lý Thành viên (`/projects/:id/members`)**
- Bảng danh sách thành viên với các cột:
  - Avatar, Tên, Email.
  - Vai trò (dropdown để thay đổi, nếu có quyền).
  - Ngày tham gia.
  - Hành động: "Xóa" (nếu có quyền).
- Button "Mời thành viên" ở trên cùng.
- Pagination nếu có nhiều thành viên.
- Hiển thị cảnh báo khi thay đổi/xóa vai trò:
  - "Bạn có chắc muốn thay đổi vai trò của [User]?"
  - "Bạn không thể tự xóa vai trò Admin của chính mình."

**Modal Mời Thành viên**
- Form:
  - Input email (type="email", required, validation).
  - Select vai trò (Viewer/Editor/Reviewer, không cho chọn Admin trực tiếp).
  - Textarea ghi chú (optional).
  - Button "Gửi lời mời".
- Sau khi gửi:
  - Hiển thị thông báo: "Đã gửi lời mời đến [email]."
  - Đóng modal, refresh danh sách thành viên.

**Trang Quản lý Người dùng (Admin) (`/admin/users`)**
- Chỉ Admin toàn hệ thống mới truy cập được.
- Bảng danh sách tất cả users:
  - Cột: Avatar, Tên, Email, Vai trò hệ thống, Số projects, Trạng thái, Hành động.
  - Filter: theo vai trò, theo email.
  - Search: tìm theo tên/email.
- Hành động cho mỗi user:
  - "Xem chi tiết": xem projects, roles, audit logs.
  - "Gán Admin": gán quyền Admin toàn hệ thống (nếu chưa có).
  - "Xóa Admin": xóa quyền Admin (nếu có, không thể tự xóa).
  - "Xóa user": xóa tài khoản (với confirmation).
- Hiển thị cảnh báo khi thay đổi quyền Admin:
  - "Bạn có chắc muốn gán quyền Admin cho [User]?"
  - "Bạn không thể tự xóa quyền Admin của chính mình."
  - "Phải có ít nhất 1 Admin trong hệ thống."

**Trang Audit Logs (`/admin/audit-logs` hoặc `/projects/:id/audit-logs`)**
- Bảng danh sách audit logs:
  - Cột: Thời gian, User, Hành động, Tài nguyên, Chi tiết, IP.
  - Filter:
    - Theo user (dropdown).
    - Theo loại tài nguyên (dropdown).
    - Theo hành động (dropdown).
    - Theo khoảng thời gian (date picker).
  - Search: tìm theo user name, resource ID.
- Chi tiết log (expandable row hoặc modal):
  - Hiển thị JSON `details` (before/after) dạng formatted.
  - Link đến tài nguyên liên quan (nếu có).
- Export: Button "Xuất CSV/Excel" để tải báo cáo.

**Component Kiểm tra Quyền (Permission Guard)**
- Component `PermissionGuard`:
  ```tsx
  <PermissionGuard 
    requiredRole="editor" 
    projectId="clx123..."
    fallback={<div>Bạn không có quyền truy cập</div>}
  >
    {/* Nội dung chỉ hiển thị nếu có quyền */}
  </PermissionGuard>
  ```
- Component `RoleBadge`:
  - Hiển thị badge vai trò với màu sắc:
    - Viewer: gray
    - Editor: blue
    - Reviewer: orange
    - Admin: red
- Hook `usePermission`:
  ```tsx
  const { hasRole, hasPermission, isLoading } = usePermission(projectId);
  ```

**Hiển thị Quyền trong UI**
- Ẩn/hiện button/action dựa trên quyền:
  - Button "Chỉnh sửa" chỉ hiển thị nếu có quyền Editor+.
  - Button "Xóa" chỉ hiển thị nếu có quyền Reviewer+.
  - Button "Quản lý thành viên" chỉ hiển thị nếu có quyền Reviewer+.
- Disable input/select nếu không có quyền chỉnh sửa.
- Hiển thị tooltip khi hover vào disabled element: "Bạn cần quyền [Role] để thực hiện hành động này."

**Toast Notifications**
- Thông báo khi:
  - Thêm/xóa/sửa vai trò thành công.
  - Mời thành viên thành công.
  - Lỗi: không có quyền, không thể tự xóa quyền, v.v.

**Loading States**
- Hiển thị skeleton/loading khi:
  - Đang tải danh sách projects/members.
  - Đang kiểm tra quyền.
  - Đang thay đổi vai trò.

**Responsive Design**
- Bảng thành viên responsive: scroll ngang trên mobile hoặc chuyển sang card view.
- Modal mời thành viên responsive.
- Menu admin responsive.

---

## 2) Kiểm soát chất lượng (QA Rules) và kiểm thử tự động

### 2.1 Bộ quy tắc QA
- Tính năng: tự động kiểm tra placeholder, biến nội suy, dấu câu, khoảng trắng, độ dài tối đa, ký tự đặc biệt.
- Tình trạng: Thiết kế.
- Chi tiết:
  - Cho phép cấu hình rule theo project hoặc theo ngôn ngữ.
  - Báo cáo kết quả trên UI: đánh dấu entries vi phạm, gợi ý cách sửa.
  - Tùy chọn "nghiêm ngặt" (fail build) hoặc "cảnh báo" (chỉ cảnh báo trên dashboard/CI).

### 2.2 Tích hợp CI/CD
- Tính năng: tạo job "sync translations" tự động cho mỗi release.
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
  - Cho phép bật/tắt "context mode" cho các nhóm chuỗi đặc thù (pháp lý, tài chính…).

### 3.3 Concordance & Translation Memory (TM)
- Tính năng: hiển thị các bản dịch tương tự đã tồn tại trong hệ thống (gần như "bộ nhớ dịch").
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
  - Cần thiết kế "nguồn chân lý" rõ ràng để tránh xung đột.
  - Đánh dấu các entries theo "origin" (UI hay repo) để giải quyết merge conflict.

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
  - Gợi ý "điểm nóng" (hotspot) – nơi lỗi lặp lại nhiều.
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
  - Lưu trạng thái "đã chốt"/"cần xem lại" để hỗ trợ review theo đợt.

---

## 8) Lập kế hoạch & ưu tiên

### 8.1 Nguyên tắc ưu tiên
- Tập trung vào "đường đi chính": upload – duyệt – sửa – dịch – export – sync.
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
- UX phức tạp dần: Giữ triết lý "ít ma sát", loại bỏ tính năng không được dùng để tránh nặng nề.

---

## 10) Kết luận

Roadmap trên phản ánh cam kết của Translation Workspace: đi sâu vào quy trình thật, tăng tốc bằng AI nhưng tôn trọng quyết định con người, và mở rộng theo nhu cầu thực tế của đội ngũ. Chúng tôi khuyến khích bạn góp ý, đề xuất hoặc đóng góp mã nguồn. Mọi ý kiến sẽ được cân nhắc theo các nguyên tắc ưu tiên đã nêu, nhằm giữ cho dự án vừa mạnh mẽ vừa tinh gọn – đúng tinh thần "làm ít, hiệu quả cao".
