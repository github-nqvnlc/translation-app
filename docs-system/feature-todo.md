# Todo List: Tính năng Quản lý Quyền Truy cập (Authentication & Authorization)

Tài liệu này theo dõi tiến độ thực hiện tính năng Quản lý Quyền Truy cập cho Translation Workspace.

## Tổng quan

Tính năng này là nền tảng bảo mật cho toàn bộ hệ thống, đảm bảo chỉ những người dùng được phép mới có thể truy cập, chỉnh sửa hoặc quản trị dữ liệu. Mục tiêu là cung cấp cơ chế xác thực mạnh mẽ, linh hoạt và dễ quản lý, phù hợp với cả triển khai tự host (self-hosted) và đa dự án.

## Trạng thái tổng quan

- **Tổng số bước**: 37
- **Đã hoàn thành**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">37</span>
- **Đang làm**: <span style="background-color: #FFC107; color: black; padding: 2px 8px; border-radius: 4px; font-weight: bold;">0</span>
- **Chưa bắt đầu**: <span style="background-color: #F44336; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">0</span>

---

## Database & Schema

### ✅ Bước 1: Cập nhật Prisma Schema - Authentication Models
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Mô tả**: Thêm models User, Account, Session, RefreshToken, VerificationToken, LoginAttempt vào Prisma schema  
**📝 Lưu ý**: Không cần cung cấp gì thêm

### ✅ Bước 2: Cập nhật Prisma Schema - RBAC Models
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Mô tả**: Thêm models Project, ProjectMember, SystemRole, Permission, RolePermission, AuditLog cho RBAC  
**📝 Lưu ý**: Không cần cung cấp gì thêm

### ✅ Bước 3: Tạo migration và chạy migrate database
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Mô tả**: Tạo và chạy migration `20251127032823_add_auth_rbac` để áp dụng schema vào database  
**📝 Lưu ý**: 
- Đảm bảo `DATABASE_URL` trong `.env` đã được cấu hình đúng
- Migration đã được chạy thành công

---

## Dependencies & Utilities

### ✅ Bước 4: Cài đặt dependencies
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Mô tả**: Cài đặt bcrypt, jsonwebtoken, cookie và các types tương ứng  
**📝 Lưu ý**: Dependencies đã được cài đặt, không cần cung cấp gì thêm

### ✅ Bước 5: Tạo utility functions
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Mô tả**: Tạo các utility functions trong `src/lib/auth.ts` và `src/lib/permissions.ts`:
- hashPassword, verifyPassword
- generateAccessToken, generateRefreshToken
- verifyAccessToken, verifyRefreshToken
- generateVerificationToken, hashToken, verifyTokenHash
- validatePassword, validateEmail
- getClientIp, getUserAgent
- hasRole, hasPermission, getRolePermissions  
**📝 Lưu ý - CẦN CUNG CẤP**:
- ⚠️ **JWT_SECRET**: Thêm vào `.env` - Secret key để sign JWT access tokens (nên dùng random string dài ít nhất 32 ký tự)
- ⚠️ **JWT_REFRESH_SECRET**: Thêm vào `.env` - Secret key riêng để sign JWT refresh tokens (nên khác với JWT_SECRET, ít nhất 32 ký tự)
- Có thể generate bằng: `openssl rand -base64 32` hoặc `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

## API Endpoints - Authentication

### ✅ Bước 6: API Register
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `POST /api/auth/register`  
**File**: `src/app/api/auth/register/route.ts`  
**Chức năng**: Đăng ký tài khoản mới với email và password, tạo verification token  
**📝 Lưu ý**: 
- Hiện tại chưa gửi email verification (sẽ làm ở bước 36)
- Có thể test bằng cách lấy token từ database để verify thủ công

### ✅ Bước 7: API Login
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `POST /api/auth/login`  
**File**: `src/app/api/auth/login/route.ts`  
**Chức năng**: Đăng nhập với email/password, rate limiting, tạo session và refresh token  
**📝 Lưu ý**: 
- Rate limiting: 5 lần thất bại trong 15 phút sẽ khóa tài khoản 15 phút
- Cookies được set với `secure: true` trong production (cần HTTPS)

### ✅ Bước 8: API Logout
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `POST /api/auth/logout`  
**File**: `src/app/api/auth/logout/route.ts`  
**Chức năng**: Đăng xuất, invalidate session và refresh token, xóa cookies  
**📝 Lưu ý**: Không cần cung cấp gì thêm

### ✅ Bước 9: API Refresh Token
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `POST /api/auth/refresh`  
**File**: `src/app/api/auth/refresh/route.ts`  
**Chức năng**: Làm mới access token bằng refresh token, token rotation  
**📝 Lưu ý**: 
- Token rotation: mỗi lần refresh sẽ tạo token mới và revoke token cũ
- Đảm bảo `JWT_REFRESH_SECRET` đã được set trong `.env`

### ✅ Bước 10: API Get Session
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `GET /api/auth/session`  
**File**: `src/app/api/auth/session/route.ts`  
**Chức năng**: Lấy thông tin session hiện tại của user  
**📝 Lưu ý**: Không cần cung cấp gì thêm

### ✅ Bước 11: API Verify Email
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `POST /api/auth/verify-email`  
**File**: `src/app/api/auth/verify-email/route.ts`  
**Chức năng**: Xác minh email từ verification token  
**📝 Lưu ý**: 
- Token có thời hạn 24 giờ
- Token sẽ bị xóa sau khi verify thành công
- Hiện tại cần test bằng cách lấy token từ database (email service chưa có)

### ✅ Bước 12: API Forgot Password
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `POST /api/auth/forgot-password`  
**File**: `src/app/api/auth/forgot-password/route.ts`  
**Chức năng**: Gửi email reset password  
**📝 Lưu ý - CẦN CUNG CẤP**:
- ⚠️ **Email Service**: Cần chọn và đăng ký một email service provider (sẽ implement ở bước 36):
  - **Resend** (khuyến nghị): https://resend.com - Free tier: 3,000 emails/tháng
  - **SendGrid**: https://sendgrid.com - Free tier: 100 emails/ngày
  - **SMTP**: Có thể dùng Gmail SMTP hoặc custom SMTP server
- ⚠️ **APP_URL** hoặc **BASE_URL**: Thêm vào `.env` - URL gốc của ứng dụng (ví dụ: `http://localhost:3000` hoặc `https://yourdomain.com`) để tạo link reset password
- Email service sẽ được implement ở bước 36, nhưng cần chuẩn bị trước
- **Bảo mật**: API luôn trả về success để tránh email enumeration (không tiết lộ email có tồn tại hay không)

### ✅ Bước 13: API Reset Password
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `POST /api/auth/reset-password`  
**File**: `src/app/api/auth/reset-password/route.ts`  
**Chức năng**: Đặt lại mật khẩu từ reset token  
**📝 Lưu ý**:
- Token có thời hạn 1 giờ
- Sau khi reset thành công, tất cả refresh tokens của user sẽ bị revoke (yêu cầu đăng nhập lại trên tất cả thiết bị)
- Token sẽ bị xóa sau khi sử dụng (one-time use)
- Validate password strength trước khi đặt lại

### ✅ Bước 14: API Change Password
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Endpoint**: `POST /api/auth/change-password`  
**File**: `src/app/api/auth/change-password/route.ts`  
**Chức năng**: Đổi mật khẩu (yêu cầu đăng nhập)  
**📝 Lưu ý**:
- Yêu cầu đăng nhập (có session token)
- Phải nhập mật khẩu hiện tại để xác thực
- Mật khẩu mới phải khác mật khẩu hiện tại
- Sau khi đổi, tất cả refresh tokens sẽ bị revoke (yêu cầu đăng nhập lại trên các thiết bị khác, nhưng session hiện tại vẫn hoạt động)
- Validate password strength

---

## Middleware & Security

### ✅ Bước 15: Middleware Authentication
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**: 
- `src/lib/middleware/auth.ts` - Helper functions cho authentication
- `src/middleware.ts` - Next.js middleware cho route protection  
**Chức năng**: Middleware kiểm tra authentication cho các protected routes  
**📝 Lưu ý**:
- `getAuthenticatedUser()`: Lấy user từ session token
- `requireAuth()`: Yêu cầu đăng nhập, trả về user hoặc error
- `requireEmailVerification()`: Yêu cầu email đã được verify
- `hasSystemRole()`, `hasProjectRole()`, `getProjectRole()`: Helper functions cho RBAC
- `src/middleware.ts`: Next.js edge middleware để filter public routes (chạy ở edge runtime)
- Authentication check thực tế được thực hiện trong route handlers (vì cần access database)

### ✅ Bước 16: Middleware Authorization (RBAC)
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**File**: `src/lib/middleware/rbac.ts`  
**Chức năng**: Middleware kiểm tra authorization (RBAC) cho các API endpoints  
**📝 Lưu ý**:
- `requireSystemRole()`: Yêu cầu system role (e.g., ADMIN)
- `requireProjectRole()`: Yêu cầu role cụ thể trên project
- `requireAnyProjectRole()`: Yêu cầu một trong các roles trên project
- `requirePermission()`: Yêu cầu permission cụ thể (có thể kèm projectId)
- `requireAuthAndProjectRole()`: Combined middleware (auth + project role)
- `requireAuthAndSystemRole()`: Combined middleware (auth + system role)
- `requireAuthAndPermission()`: Combined middleware (auth + permission)
- `createRBACErrorResponse()`: Helper tạo error response từ RBACResult
- Các functions này sẽ được sử dụng trong các route handlers để kiểm tra quyền truy cập

---

## API Endpoints - Projects & RBAC

### ✅ Bước 17: API Projects Management
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**:
- `src/app/api/projects/route.ts` - GET, POST /api/projects
- `src/app/api/projects/[id]/route.ts` - GET, PATCH, DELETE /api/projects/:id  
**Endpoints**: 
- `GET /api/projects` - Lấy danh sách projects (user thấy projects họ là member + public projects, admin thấy tất cả)
- `POST /api/projects` - Tạo project mới (yêu cầu authenticated + email verified, user tạo sẽ tự động là ADMIN)
- `GET /api/projects/:id` - Lấy chi tiết project (yêu cầu member hoặc public)
- `PATCH /api/projects/:id` - Cập nhật project (yêu cầu ADMIN role trên project)
- `DELETE /api/projects/:id` - Xóa project (yêu cầu ADMIN role trên project, cascade delete)  
**📝 Lưu ý**:
- Tất cả endpoints đều có audit logging
- GET endpoints trả về thông tin members, counts (translationTables, poFiles, members)
- POST tự động thêm creator làm ADMIN member
- PATCH và DELETE yêu cầu ADMIN role trên project (hoặc system ADMIN)
- DELETE sẽ cascade xóa tất cả dữ liệu liên quan (members, files, tables)

### ✅ Bước 18: API Members Management
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**:
- `src/app/api/projects/[id]/members/route.ts` - GET, POST /api/projects/:id/members
- `src/app/api/projects/[id]/members/[memberId]/route.ts` - PATCH, DELETE /api/projects/:id/members/:memberId  
**Endpoints**:
- `GET /api/projects/:id/members` - Lấy danh sách thành viên (yêu cầu member hoặc public project)
- `POST /api/projects/:id/members` - Thêm thành viên (yêu cầu REVIEWER hoặc ADMIN role, thêm bằng email)
- `PATCH /api/projects/:id/members/:memberId` - Cập nhật vai trò (yêu cầu ADMIN role, không thể đổi role của chính mình nếu là ADMIN duy nhất)
- `DELETE /api/projects/:id/members/:memberId` - Xóa thành viên (yêu cầu ADMIN role, không thể xóa chính mình nếu là ADMIN duy nhất)  
**📝 Lưu ý**:
- Tất cả endpoints đều có audit logging
- POST validate email và kiểm tra user đã tồn tại trong hệ thống
- PATCH và DELETE có bảo vệ: không thể thay đổi/xóa chính mình nếu là ADMIN duy nhất
- GET trả về đầy đủ thông tin user (email, name, image, emailVerified)

### ✅ Bước 19: API System Roles Management
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**File**: `src/app/api/admin/users/[id]/system-role/route.ts`  
**Endpoints**:
- `POST /api/admin/users/:id/system-role` - Cấp system role (ADMIN) cho user (yêu cầu system ADMIN)
- `DELETE /api/admin/users/:id/system-role` - Thu hồi system role (yêu cầu system ADMIN)  
**📝 Lưu ý**:
- Chỉ system ADMIN mới có quyền cấp/thu hồi system role
- System role chỉ có ADMIN (không có VIEWER, EDITOR, REVIEWER cho system)
- Không thể cấp/thu hồi quyền cho chính mình
- Tất cả actions đều có audit logging với thông tin chi tiết

### ✅ Bước 20: API Audit Logs
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**File**: `src/app/api/audit-logs/route.ts`  
**Endpoint**: `GET /api/audit-logs`  
**Chức năng**: Lấy danh sách audit logs với filtering và pagination  
**📝 Lưu ý**:
- System ADMIN: Thấy tất cả logs, có thể filter theo userId
- User thường: Chỉ thấy logs của chính họ
- Query parameters:
  - `userId`: Filter theo user ID (chỉ system ADMIN)
  - `resourceType`: Filter theo loại resource (user, project, entry, etc.)
  - `action`: Filter theo action (project_created, member_added, etc.)
  - `startDate`: Filter từ ngày (ISO date string)
  - `endDate`: Filter đến ngày (ISO date string)
  - `page`: Số trang (default: 1)
  - `limit`: Số items mỗi trang (default: 50, max: 100)
  - `sortBy`: Field để sort (createdAt, action, resourceType, default: createdAt)
  - `sortOrder`: Thứ tự sort (asc/desc, default: desc)
- Response bao gồm: data (array of logs), pagination metadata, applied filters
- Mỗi log bao gồm: id, userId, user info, action, resourceType, resourceId, details (JSON), ipAddress, userAgent, createdAt  
**Chức năng**: Lấy audit logs với filtering và pagination

---

## UI Components - Authentication Pages

**📁 Lưu ý**: Tất cả các routes authentication đã được tổ chức vào group route `(auth)` để dễ quản lý. Các routes vẫn hoạt động như bình thường (URL không thay đổi):
- `/register` → `src/app/(auth)/register/`
- `/login` → `src/app/(auth)/login/`
- `/verify-email` → `src/app/(auth)/verify-email/`
- `/forgot-password` → `src/app/(auth)/forgot-password/`
- `/reset-password` → `src/app/(auth)/reset-password/`

### ✅ Bước 21: UI Register Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/register`  
**Location**: `src/app/(auth)/register/`  
**Files**: 
- `src/app/register/page.tsx` - Server component container  
- `src/app/register/register-form.tsx` - Client form component  
**Chức năng**: Form đăng ký có validation phía client (email, password, confirm password, đồng ý điều khoản). Hiển thị yêu cầu mật khẩu (chữ hoa/thường, số, ký tự đặc biệt), trạng thái đang gửi, thông báo lỗi/thành công và tự động chuyển hướng về `/login?registered=1` sau khi tạo tài khoản.

### ✅ Bước 22: UI Login Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/login`  
**Location**: `src/app/(auth)/login/`  
**Files**:
- `src/app/(auth)/login/page.tsx` - Server component container  
- `src/app/(auth)/login/login-form.tsx` - Client form component  
**Chức năng**: Trang đăng nhập với trường email, mật khẩu, tuỳ chọn “Ghi nhớ 7 ngày”, liên kết quên mật khẩu và liên kết tạo tài khoản. Thêm lỗi từ API (bao gồm remainingAttempts), hiển thị trạng thái đăng nhập thành công và chuyển hướng về `/projects`. Có hai nút OAuth (Google, GitHub) chuẩn bị cho bước tích hợp sau (chuyển đến `/api/auth/oauth/:provider`).

### ✅ Bước 23: UI Verify Email Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/verify-email`  
**Location**: `src/app/(auth)/verify-email/`  
**Files**:
- `src/app/(auth)/verify-email/page.tsx` - Server component container
- `src/app/(auth)/verify-email/verify-email-form.tsx` - Client form component  
**Chức năng**: Trang xác minh email với form nhập token. Hỗ trợ token từ URL query parameter (`?token=...`), validation token, hiển thị thông báo lỗi/thành công, và tự động chuyển hướng đến `/login?verified=1` sau khi xác minh thành công.

### ✅ Bước 24: UI Forgot Password Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/forgot-password`  
**Location**: `src/app/(auth)/forgot-password/`  
**Files**:
- `src/app/(auth)/forgot-password/page.tsx` - Server component container
- `src/app/(auth)/forgot-password/forgot-password-form.tsx` - Client form component  
**Chức năng**: Trang quên mật khẩu với form nhập email. Validation email, hiển thị thông báo thành công (API luôn trả về success để tránh email enumeration), có nút "Gửi lại" sau khi submit, và link quay lại đăng nhập.

### ✅ Bước 25: UI Reset Password Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/reset-password`  
**Location**: `src/app/(auth)/reset-password/`  
**Files**:
- `src/app/(auth)/reset-password/page.tsx` - Server component container
- `src/app/(auth)/reset-password/reset-password-form.tsx` - Client form component  
**Chức năng**: Trang reset mật khẩu với form nhập token (từ URL query hoặc manual), mật khẩu mới và xác nhận mật khẩu. Hiển thị yêu cầu mật khẩu real-time, toggle show/hide password, validation password strength, và tự động chuyển hướng đến `/login?reset=1` sau khi reset thành công.

### ✅ Bước 26: UI Sessions Management Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/settings/sessions`  
**Files**:
- `src/app/settings/sessions/page.tsx` - Server component container với auth check
- `src/app/settings/sessions/sessions-list.tsx` - Client component hiển thị danh sách sessions
- `src/app/api/auth/sessions/route.ts` - GET /api/auth/sessions (lấy danh sách sessions)
- `src/app/api/auth/sessions/[sessionId]/route.ts` - DELETE /api/auth/sessions/:sessionId (xóa session)  
**Chức năng**: Trang quản lý phiên đăng nhập với danh sách tất cả sessions đang hoạt động, hiển thị thông tin thiết bị (browser, OS, IP), đánh dấu session hiện tại, và cho phép đăng xuất từ các thiết bị khác. Có audit logging khi xóa session.

---

## UI Components - Projects & RBAC Pages

### ✅ Bước 27: UI Projects List Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/projects`  
**Files**:
- `src/app/projects/page.tsx` - Server component container với auth check
- `src/app/projects/projects-list.tsx` - Client component hiển thị danh sách projects  
**Chức năng**: Trang danh sách projects với grid layout, hiển thị thông tin project (name, description, isPublic, memberCount, fileCount), role badge của user, nút tạo project mới với modal, và link đến chi tiết project. Admin thấy tất cả projects, user thấy projects họ là member + public projects.

### ✅ Bước 28: UI Project Detail Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/projects/:id`  
**Files**:
- `src/app/projects/[id]/page.tsx` - Server component container với auth check
- `src/app/projects/[id]/project-detail.tsx` - Client component với tabs  
**Chức năng**: Trang chi tiết project với 3 tabs:
- **Tổng quan**: Hiển thị stats (memberCount, translationTableCount, poFileCount)
- **Thành viên**: Hiển thị danh sách members với link đến trang quản lý thành viên
- **Cài đặt**: Form chỉnh sửa project (chỉ ADMIN), nút xóa project với confirm modal
- Có nút Edit và Delete (chỉ hiện với ADMIN role), modal chỉnh sửa project, và confirm modal xóa project.

### ✅ Bước 29: UI Members Management Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/projects/:id/members`  
**Files**:
- `src/app/projects/[id]/members/page.tsx` - Server component container với auth check
- `src/app/projects/[id]/members/members-management.tsx` - Client component quản lý members  
**Chức năng**: Trang quản lý thành viên với danh sách members, hiển thị thông tin user (name, email, emailVerified badge), role badge, nút thêm thành viên với modal (email + role selection), nút chỉnh sửa role với modal, và nút xóa member với confirm. Có validation và error handling đầy đủ. project

### ✅ Bước 30: UI Admin Users Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/admin/users`  
**Files**:
- `src/app/admin/users/page.tsx` - Server component container với system admin check
- `src/app/admin/users/users-list.tsx` - Client component hiển thị danh sách users
- `src/app/api/admin/users/route.ts` - GET /api/admin/users (lấy danh sách users với pagination, filtering, sorting)  
**Chức năng**: Trang quản lý users (chỉ system ADMIN) với:
- Table hiển thị danh sách users (email, name, emailVerified, systemRole, projectCount, activeSessionCount, lastLoginAt)
- Search filter (email, name)
- Email verified filter
- Pagination
- Nút cấp/thu hồi system role (ADMIN) với confirm modal
- Hiển thị badges cho emailVerified và systemRole

### ✅ Bước 31: UI Audit Logs Page
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Route**: `/admin/audit-logs`  
**Files**:
- `src/app/admin/audit-logs/page.tsx` - Server component container với system admin check
- `src/app/admin/audit-logs/audit-logs-list.tsx` - Client component hiển thị audit logs
- `src/app/api/audit-logs/route.ts` - GET /api/audit-logs (đã có từ bước 20)  
**Chức năng**: Trang xem audit logs với:
- Table hiển thị logs (thời gian, user, action, resource, IP address)
- Advanced filters: userId, resourceType, action, startDate, endDate
- Collapsible filter panel
- Pagination (50 logs/page)
- Hiển thị action labels tiếng Việt và resource type labels
- System ADMIN thấy tất cả logs, user thường chỉ thấy logs của mình

---

## UI Components - Reusable Components

### ✅ Bước 32: Permission Components & Hooks
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**:
- `src/components/auth/permission-guard.tsx` - Component bảo vệ route theo quyền với loading state, error fallback
- `src/components/ui/role-badge.tsx` - Component hiển thị badge vai trò với màu sắc phân biệt (ADMIN, REVIEWER, EDITOR, VIEWER)
- `src/hooks/use-permission.ts` - Hook kiểm tra quyền truy cập với support cho system role, project role, và permissions
- `src/lib/utils.ts` - Utility function `cn()` cho className merging (clsx + tailwind-merge)  
**Chức năng**:
- **PermissionGuard**: Component wrapper để bảo vệ nội dung theo quyền, hỗ trợ requiredRole, requiredRoles, requiredPermission, projectId, fallback UI, và error messages
- **RoleBadge**: Component hiển thị role badge với màu sắc và size tùy chỉnh
- **usePermission**: Hook trả về user session, isLoading, hasAccess, isAuthenticated, isAdmin, và refresh function

---

## OAuth Integration

### ✅ Bước 33: Google OAuth Provider
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**:
- `src/app/api/auth/oauth/[provider]/route.ts` - GET /api/auth/oauth/:provider (initiate OAuth flow)
- `src/app/api/auth/oauth/[provider]/callback/route.ts` - GET /api/auth/oauth/:provider/callback (handle OAuth callback)
- `src/app/(auth)/login/login-form.tsx` - Đã có OAuth buttons (đã tích hợp từ bước 22)  
**Chức năng**: Tích hợp Google OAuth 2.0 với:
- OAuth authorization flow với state verification
- Exchange code for access token
- Get user info từ Google API (email, name, picture)
- Auto-create user nếu chưa tồn tại, auto-verify email
- Create Account record, Session, và RefreshToken
- Redirect về `/projects` sau khi đăng nhập thành công
- Error handling và redirect về `/login?error=...` nếu có lỗi

### ✅ Bước 34: GitHub OAuth Provider
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**:
- `src/app/api/auth/oauth/[provider]/route.ts` - GET /api/auth/oauth/:provider (initiate OAuth flow)
- `src/app/api/auth/oauth/[provider]/callback/route.ts` - GET /api/auth/oauth/:provider/callback (handle OAuth callback)
- `src/app/(auth)/login/login-form.tsx` - Đã có OAuth buttons (đã tích hợp từ bước 22)  
**Chức năng**: Tích hợp GitHub OAuth 2.0 với:
- OAuth authorization flow với state verification
- Exchange code for access token
- Get user info từ GitHub API (email từ user/emails endpoint nếu cần, name, avatar_url)
- Auto-create user nếu chưa tồn tại, auto-verify email
- Create Account record, Session, và RefreshToken
- Redirect về `/projects` sau khi đăng nhập thành công
- Error handling và redirect về `/login?error=...` nếu có lỗi

---

## Additional Features

### ✅ Bước 35: Rate Limiting
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**:
- `src/lib/rate-limit.ts` - Rate limiting utility với database-based và in-memory options
- `src/app/api/auth/login/route.ts` - Đã có rate limiting (giữ nguyên logic cũ)
- `src/app/api/auth/register/route.ts` - Thêm rate limiting (3 requests/hour)
- `src/app/api/auth/forgot-password/route.ts` - Thêm rate limiting (3 requests/hour)
- `src/app/api/auth/verify-email/route.ts` - Thêm rate limiting (10 attempts/15min)
- `src/app/api/auth/reset-password/route.ts` - Thêm rate limiting (5 attempts/15min)  
**Chức năng**: 
- Database-based rate limiting sử dụng LoginAttempt table
- In-memory rate limiting cho non-critical endpoints
- Rate limit configs: login (5/15min), register (3/hour), forgot-password (3/hour), verify-email (10/15min), reset-password (5/15min)
- Trả về proper HTTP headers (Retry-After, X-RateLimit-*)

### ✅ Bước 36: Email Service
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**:
- `src/lib/email.ts` - Email service utility với support cho Resend, SendGrid, SMTP
- `src/app/api/auth/register/route.ts` - Tích hợp sendVerificationEmail
- `src/app/api/auth/forgot-password/route.ts` - Tích hợp sendResetPasswordEmail  
**Chức năng**: 
- Email service với multiple provider support (Resend, SendGrid, SMTP)
- `sendVerificationEmail()` - Gửi email xác minh với HTML template đẹp
- `sendResetPasswordEmail()` - Gửi email reset password với HTML template
- HTML email templates với styling đẹp
- Plain text fallback cho email clients không support HTML
- Environment variable configuration cho từng provider
- **📝 Lưu ý - CẦN CUNG CẤP**:
  - ⚠️ **Email Service API Key**: Tùy theo provider đã chọn:
    - **Resend**: `RESEND_API_KEY` - Lấy từ https://resend.com/api-keys
    - **SendGrid**: `SENDGRID_API_KEY` - Lấy từ https://app.sendgrid.com/settings/api_keys
    - **SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
  - ⚠️ **EMAIL_FROM**: Email gửi đi (ví dụ: `noreply@yourdomain.com`)
  - ⚠️ **EMAIL_PROVIDER**: `resend`, `sendgrid`, hoặc `smtp` (default: `resend`)
  - ⚠️ **APP_URL**: URL gốc của ứng dụng (đã cần ở bước 12)

### ✅ Bước 37: Seed Data
**Trạng thái**: <span style="background-color: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Hoàn thành</span>  
**Files**:
- `prisma/seed.ts` - Seed script tạo admin user mặc định  
**Chức năng**: 
- Tạo admin user mặc định với system ADMIN role
- Auto-verify email cho seed admin
- Kiểm tra và không tạo duplicate nếu admin đã tồn tại
- Tự động grant system role nếu user tồn tại nhưng chưa có role
- Optional: Tạo sample project nếu `CREATE_SAMPLE_PROJECT=true`
- **📝 Lưu ý - CẦN CUNG CẤP**:
  - ⚠️ **ADMIN_EMAIL**: Email cho admin user (default: `admin@example.com`)
  - ⚠️ **ADMIN_PASSWORD**: Password cho admin user (default: `Admin123!@#`)
  - ⚠️ **CREATE_SAMPLE_PROJECT**: `true` để tạo sample project (optional)
  - Chạy seed: `npm run db:seed` hoặc `npx prisma db seed`

---

## Ghi chú

- Tất cả các API endpoints cần có error handling đầy đủ
- Tất cả các API endpoints cần có validation input
- Tất cả các API endpoints cần có rate limiting (bước 35)
- Tất cả các UI pages cần responsive và accessible
- Cần test tất cả các tính năng trước khi deploy

## Tài liệu tham khảo

- [Tài liệu chi tiết tính năng](../docs/tinh-nang-sap-ra-mat.md)
- [Database Schema](../prisma/schema.prisma)
- [Architecture](./architecture.md)
- [Environment Variables](./env-variables.md) - Danh sách đầy đủ các biến môi trường cần thiết

