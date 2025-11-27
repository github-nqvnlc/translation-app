# Environment Variables - Tính năng Authentication & Authorization

Tài liệu này liệt kê tất cả các biến môi trường cần thiết cho tính năng Quản lý Quyền Truy cập.

## Bắt buộc (Required)

### Database
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```
- **Mô tả**: Connection string cho PostgreSQL database
- **Đã có**: ✅ (từ setup ban đầu)

### JWT Secrets
```env
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
```
- **Mô tả**: Secret keys để sign JWT tokens
- **Cách tạo**: 
  ```bash
  # Sử dụng OpenSSL
  openssl rand -base64 32
  
  # Hoặc sử dụng Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Lưu ý**: 
  - Phải khác nhau giữa JWT_SECRET và JWT_REFRESH_SECRET
  - Nên dùng ít nhất 32 ký tự
  - **KHÔNG** commit vào git, chỉ lưu trong `.env` và secret manager

### Application URL
```env
APP_URL="http://localhost:3000"
# Hoặc production:
# APP_URL="https://yourdomain.com"
```
- **Mô tả**: URL gốc của ứng dụng, dùng để tạo links trong email
- **Cần cho**: Bước 12 (Forgot Password), Bước 36 (Email Service)

## Tùy chọn (Optional) - Cho các tính năng tương lai

### Email Service (Bước 36)

#### Option 1: Resend (Khuyến nghị)
```env
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```
- **Đăng ký**: https://resend.com
- **Free tier**: 3,000 emails/tháng

**Hướng dẫn đăng ký Resend:**

1. **Truy cập Resend**
   - Vào: https://resend.com/
   - Click "Sign Up" hoặc "Get Started"

2. **Đăng ký tài khoản**
   - Đăng nhập bằng email hoặc GitHub
   - Xác minh email nếu cần

3. **Tạo API Key**
   - Vào Dashboard → "API Keys" (hoặc https://resend.com/api-keys)
   - Click "Create API Key"
   - Đặt tên (ví dụ: "Translation Workspace")
   - Chọn quyền: "Sending access" (đủ cho gửi email)
   - Click "Add"
   - Copy API Key → đặt vào `RESEND_API_KEY`
   - ⚠️ **Lưu ý**: API Key chỉ hiển thị 1 lần, hãy copy ngay!

4. **Thêm Domain (Production)**
   - Vào "Domains" → "Add Domain"
   - Nhập domain của bạn (ví dụ: `yourdomain.com`)
   - Thêm DNS records theo hướng dẫn:
     - SPF record
     - DKIM records
     - DMARC record (tùy chọn)
   - Sau khi verify, bạn có thể dùng `noreply@yourdomain.com`

5. **Development (không cần domain)**
   - Resend cung cấp domain test: `onboarding@resend.dev`
   - Có thể dùng domain này cho development/testing

6. **Cấu hình .env**
   ```env
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_1234567890abcdefghijklmnop"
   EMAIL_FROM="noreply@yourdomain.com"  # hoặc "onboarding@resend.dev" cho dev
   APP_URL="http://localhost:3000"
   ```

**Lưu ý:**
- ⚠️ **Không commit** API Key vào Git
- ⚠️ Domain test `onboarding@resend.dev` chỉ dùng được cho development
- ⚠️ Production cần verify domain riêng

#### Option 2: SendGrid
```env
SENDGRID_API_KEY="SG.xxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```
- **Đăng ký**: https://sendgrid.com
- **Free tier**: 100 emails/ngày

**Hướng dẫn đăng ký SendGrid:**

1. **Truy cập SendGrid**
   - Vào: https://signup.sendgrid.com/
   - Click "Start for free"

2. **Đăng ký tài khoản**
   - Điền thông tin: Email, Password, Company Name
   - Xác minh email
   - Hoàn tất onboarding

3. **Tạo API Key**
   - Vào Dashboard → "Settings" → "API Keys"
   - Click "Create API Key"
   - Đặt tên (ví dụ: "Translation Workspace")
   - Chọn quyền: "Full Access" hoặc "Restricted Access" (chọn "Mail Send")
   - Click "Create & View"
   - Copy API Key → đặt vào `SENDGRID_API_KEY`
   - ⚠️ **Lưu ý**: API Key chỉ hiển thị 1 lần, hãy copy ngay!

4. **Verify Sender Identity (Production)**
   - Vào "Settings" → "Sender Authentication"
   - Chọn "Verify a Single Sender" (cho testing) hoặc "Authenticate Your Domain" (cho production)
   - **Single Sender**: Nhập email, verify qua email
   - **Domain**: Thêm DNS records (SPF, DKIM, DMARC)

5. **Cấu hình .env**
   ```env
   EMAIL_PROVIDER="sendgrid"
   SENDGRID_API_KEY="SG.1234567890abcdefghijklmnopqrstuvwxyz"
   EMAIL_FROM="noreply@yourdomain.com"  # hoặc verified sender email
   APP_URL="http://localhost:3000"
   ```

**Lưu ý:**
- ⚠️ **Không commit** API Key vào Git
- ⚠️ Single Sender chỉ dùng được cho development/testing
- ⚠️ Production cần verify domain
- ⚠️ Free plan giới hạn 100 emails/ngày

#### Option 3: SMTP (Custom)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```
- **Lưu ý**: Với Gmail, cần tạo App Password thay vì mật khẩu thường

### OAuth Providers (Bước 33, 34)

#### Google OAuth
```env
GOOGLE_CLIENT_ID="xxxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxxxxxxxxx"
```
- **Đăng ký**: https://console.cloud.google.com/apis/credentials
- **Redirect URI**: `{APP_URL}/api/auth/oauth/google/callback`

**Hướng dẫn đăng ký Google OAuth:**

1. **Truy cập Google Cloud Console**
   - Vào: https://console.cloud.google.com/
   - Đăng nhập bằng tài khoản Google của bạn

2. **Tạo hoặc chọn Project**
   - Nếu chưa có project, click "Select a project" → "New Project"
   - Đặt tên project (ví dụ: "Translation Workspace")
   - Click "Create"

3. **Bật Google+ API (nếu cần)**
   - Vào "APIs & Services" → "Library"
   - Tìm "Google+ API" hoặc "People API"
   - Click "Enable" (thường không cần thiết cho OAuth cơ bản)

4. **Tạo OAuth 2.0 Credentials**
   - Vào "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Nếu chưa có OAuth consent screen, bạn sẽ được yêu cầu cấu hình:
     - **User Type**: Chọn "External" (cho public apps) hoặc "Internal" (cho G Suite)
     - **App name**: Nhập tên app (ví dụ: "Translation Workspace")
     - **User support email**: Email của bạn
     - **Developer contact information**: Email của bạn
     - Click "Save and Continue"
     - **Scopes**: Có thể bỏ qua hoặc thêm `email`, `profile`, `openid`
     - Click "Save and Continue"
     - **Test users**: Có thể bỏ qua nếu chọn "External" và chưa publish
     - Click "Back to Dashboard"

5. **Tạo OAuth Client ID**
   - **Application type**: Chọn "Web application"
   - **Name**: Đặt tên (ví dụ: "Translation Workspace Web Client")
   - **Authorized JavaScript origins**: 
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com` (thay bằng domain thực tế)
   - **Authorized redirect URIs**:
     - Development: `http://localhost:3000/api/auth/oauth/google/callback`
     - Production: `https://yourdomain.com/api/auth/oauth/google/callback`
   - Click "Create"

6. **Lấy Credentials**
   - Sau khi tạo, bạn sẽ thấy popup với:
     - **Your Client ID**: Copy giá trị này → đặt vào `GOOGLE_CLIENT_ID`
     - **Your Client Secret**: Copy giá trị này → đặt vào `GOOGLE_CLIENT_SECRET`
   - ⚠️ **Lưu ý**: Client Secret chỉ hiển thị 1 lần, hãy copy ngay!

7. **Cấu hình .env**
   ```env
   GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
   APP_URL="http://localhost:3000"  # hoặc production URL
   ```

8. **Kiểm tra**
   - Đảm bảo Redirect URI trong Google Console khớp với `{APP_URL}/api/auth/oauth/google/callback`
   - Nếu dùng localhost: `http://localhost:3000/api/auth/oauth/google/callback`
   - Nếu dùng production: `https://yourdomain.com/api/auth/oauth/google/callback`

**Lưu ý quan trọng:**
- ⚠️ **Không commit** Client Secret vào Git
- ⚠️ **Redirect URI phải khớp chính xác** (bao gồm http/https, port, path)
- ⚠️ Nếu thay đổi `APP_URL`, nhớ cập nhật lại Redirect URI trong Google Console
- ⚠️ OAuth consent screen ở chế độ "Testing" chỉ cho phép test users đăng nhập

#### GitHub OAuth
```env
GITHUB_CLIENT_ID="xxxxxxxxxxxxx"
GITHUB_CLIENT_SECRET="xxxxxxxxxxxxx"
```
- **Đăng ký**: https://github.com/settings/developers
- **Redirect URI**: `{APP_URL}/api/auth/oauth/github/callback`

**Hướng dẫn đăng ký GitHub OAuth:**

1. **Truy cập GitHub Developer Settings**
   - Vào: https://github.com/settings/developers
   - Hoặc: GitHub Profile → Settings → Developer settings → OAuth Apps

2. **Tạo OAuth App mới**
   - Click "New OAuth App" (hoặc "Register a new application")
   - Điền thông tin:
     - **Application name**: Tên app (ví dụ: "Translation Workspace")
     - **Homepage URL**: 
       - Development: `http://localhost:3000`
       - Production: `https://yourdomain.com`
     - **Application description**: Mô tả ngắn (tùy chọn)
     - **Authorization callback URL**: 
       - Development: `http://localhost:3000/api/auth/oauth/github/callback`
       - Production: `https://yourdomain.com/api/auth/oauth/github/callback`
   - Click "Register application"

3. **Lấy Credentials**
   - Sau khi tạo, bạn sẽ thấy trang với:
     - **Client ID**: Copy giá trị này → đặt vào `GITHUB_CLIENT_ID`
     - **Client secrets**: Click "Generate a new client secret"
     - **Client Secret**: Copy giá trị này → đặt vào `GITHUB_CLIENT_SECRET`
     - ⚠️ **Lưu ý**: Client Secret chỉ hiển thị 1 lần, hãy copy ngay!

4. **Cấu hình .env**
   ```env
   GITHUB_CLIENT_ID="Iv1.1234567890abcdef"
   GITHUB_CLIENT_SECRET="abcdef1234567890abcdef1234567890abcdef12"
   APP_URL="http://localhost:3000"  # hoặc production URL
   ```

5. **Kiểm tra**
   - Đảm bảo Authorization callback URL khớp chính xác với `{APP_URL}/api/auth/oauth/github/callback`
   - Nếu dùng localhost: `http://localhost:3000/api/auth/oauth/github/callback`
   - Nếu dùng production: `https://yourdomain.com/api/auth/oauth/github/callback`

**Lưu ý quan trọng:**
- ⚠️ **Không commit** Client Secret vào Git
- ⚠️ **Callback URL phải khớp chính xác** (bao gồm http/https, port, path)
- ⚠️ Nếu thay đổi `APP_URL`, nhớ cập nhật lại Callback URL trong GitHub
- ⚠️ GitHub OAuth không yêu cầu email scope, nhưng có thể cần request `user:email` scope nếu muốn lấy email

## File .env.example

Mẫu file `.env` hoàn chỉnh cho dự án (bao gồm cả các tính năng hiện có và tính năng Authentication):

```env
# ============================================
# Database Configuration
# ============================================
# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://user:password@host:port/database"
POSTGRES_URL="postgresql://user:password@host:port/database"
PRISMA_DATABASE_URL="postgresql://user:password@host:port/database"

# For SQLite (development only):
# DATABASE_URL="file:./prisma/dev.db"

# ============================================
# Translation Services
# ============================================

# DeepL API
DEEPL_API_KEY=""
DEEPL_API_URL="https://api-free.deepl.com"

# Google Gemini API
GEMINI_API_KEY=""
GEMINI_TRANSLATION_MODEL="gemini-1.5-flash-latest"

# ============================================
# Authentication & Authorization (BẮT BUỘC)
# ============================================

# JWT Secrets - Tạo bằng lệnh: openssl rand -base64 32
JWT_SECRET=""
JWT_REFRESH_SECRET=""

# Application URL - URL gốc của ứng dụng
APP_URL="http://localhost:3000"
# Production: APP_URL="https://yourdomain.com"

# ============================================
# Email Service (Tùy chọn - Bước 36)
# ============================================

# Option 1: Resend (Khuyến nghị)
# Đăng ký tại: https://resend.com
# Free tier: 3,000 emails/tháng
RESEND_API_KEY=""
FROM_EMAIL="noreply@yourdomain.com"

# Option 2: SendGrid
# Đăng ký tại: https://sendgrid.com
# Free tier: 100 emails/ngày
# SENDGRID_API_KEY=""
# FROM_EMAIL="noreply@yourdomain.com"

# Option 3: SMTP (Custom)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASSWORD="your-app-password"
# SMTP_FROM="noreply@yourdomain.com"
# Lưu ý: Với Gmail, cần tạo App Password thay vì mật khẩu thường

# ============================================
# OAuth Providers (Tùy chọn - Bước 33, 34)
# ============================================

# Google OAuth
# Đăng ký tại: https://console.cloud.google.com/apis/credentials
# Redirect URI: {APP_URL}/api/auth/oauth/google/callback
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub OAuth
# Đăng ký tại: https://github.com/settings/developers
# Redirect URI: {APP_URL}/api/auth/oauth/github/callback
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ============================================
# Node Environment
# ============================================
NODE_ENV="development"
# Production: NODE_ENV="production"
```

## Lưu ý quan trọng

1. **Prisma Config**: Environment variables trong `.env` KHÔNG tự động được load bởi Prisma.
   - Cần thêm `import "dotenv/config";` vào `prisma.config.ts`, hoặc
   - Sử dụng Prisma CLI với Bun để load environment variables
   - Xem thêm: https://pris.ly/prisma-config-env-vars

2. **Bảo mật**: 
   - **KHÔNG** commit file `.env` vào git
   - Chỉ commit file `.env.example` (không có giá trị thực)
   - Sử dụng secret manager cho production (Vercel, AWS Secrets Manager, etc.)

3. **JWT Secrets**:
   - Phải tạo ngay lập tức cho production
   - Không được để giá trị mặc định trong production
   - Mỗi môi trường (dev, staging, production) nên có secrets khác nhau

## Checklist

- [ ] `DATABASE_URL` đã được cấu hình
- [ ] `JWT_SECRET` đã được tạo và thêm vào `.env`
- [ ] `JWT_REFRESH_SECRET` đã được tạo và thêm vào `.env`
- [ ] `APP_URL` đã được cấu hình
- [ ] (Tùy chọn) Email service đã được đăng ký và API key đã được thêm
- [ ] (Tùy chọn) OAuth providers đã được đăng ký và credentials đã được thêm

