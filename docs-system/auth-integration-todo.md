# To-Do: Tích hợp Authentication & Authorization vào các trang hiện có

## Tổng quan
Hiện tại các trang và API routes chưa được bảo vệ bởi authentication. Cần tích hợp authentication và authorization vào:
- Navbar/Layout
- Các trang UI (files, upload, translations)
- Các API routes (po-files, translation-tables)

---

## 1. Navbar & Layout

### ⏳ Task 1.1: Cập nhật Layout với User Info
**File**: `src/app/layout.tsx`
**Yêu cầu**:
- [ ] Thêm component Navbar riêng để hiển thị user info
- [ ] Hiển thị user name/email khi đã đăng nhập
- [ ] Hiển thị nút "Đăng nhập" khi chưa đăng nhập
- [ ] Hiển thị nút "Đăng xuất" khi đã đăng nhập
- [ ] Hiển thị link đến `/projects` khi đã đăng nhập
- [ ] Ẩn/hiện các link navigation dựa trên authentication status

### ⏳ Task 1.2: Tạo Navbar Component
**File**: `src/components/layout/navbar.tsx` (mới)
**Yêu cầu**:
- [ ] Client component để fetch user session
- [ ] Hiển thị user avatar/name
- [ ] Dropdown menu với: Profile, Settings, Logout
- [ ] Responsive design

---

## 2. Trang UI - Authentication Protection

### ⏳ Task 2.1: Bảo vệ trang `/files`
**File**: `src/app/files/page.tsx`
**Yêu cầu**:
- [ ] Thêm `requireAuth()` check ở server component
- [ ] Redirect đến `/login` nếu chưa đăng nhập
- [ ] Filter files theo project membership (nếu có projectId)
- [ ] Chỉ hiển thị files của user hoặc public projects

### ⏳ Task 2.2: Bảo vệ trang `/upload`
**File**: `src/app/upload/page.tsx`
**Yêu cầu**:
- [ ] Thêm `requireAuth()` check ở server component
- [ ] Redirect đến `/login` nếu chưa đăng nhập
- [ ] Kiểm tra quyền EDITOR trở lên (hoặc cho phép tất cả authenticated users)
- [ ] Hiển thị project selector nếu user có nhiều projects

### ⏳ Task 2.3: Bảo vệ trang `/translations`
**File**: `src/app/translations/page.tsx`
**Yêu cầu**:
- [ ] Thêm `requireAuth()` check ở server component
- [ ] Redirect đến `/login` nếu chưa đăng nhập
- [ ] Filter translation tables theo project membership
- [ ] Chỉ hiển thị tables của user hoặc public projects

### ⏳ Task 2.4: Bảo vệ trang `/translations/new`
**File**: `src/app/translations/new/page.tsx`
**Yêu cầu**:
- [ ] Thêm `requireAuth()` check
- [ ] Kiểm tra quyền EDITOR trở lên
- [ ] Hiển thị project selector

### ⏳ Task 2.5: Bảo vệ trang `/files/[fileId]`
**File**: `src/app/files/[fileId]/page.tsx`
**Yêu cầu**:
- [ ] Thêm `requireAuth()` check
- [ ] Kiểm tra quyền truy cập file (user phải có quyền VIEWER trở lên trên project của file)
- [ ] Redirect nếu không có quyền

---

## 3. API Routes - Authentication & Authorization

### ⏳ Task 3.1: Bảo vệ API `/api/po-files`
**File**: `src/app/api/po-files/route.ts`
**Yêu cầu**:
- [ ] GET: Thêm `requireAuth()` check
- [ ] GET: Filter files theo project membership
- [ ] POST: Thêm `requireAuth()` check
- [ ] POST: Kiểm tra quyền EDITOR trở lên
- [ ] POST: Gán projectId nếu có
- [ ] Thêm audit logging cho POST

### ⏳ Task 3.2: Bảo vệ API `/api/po-files/[id]`
**File**: `src/app/api/po-files/[id]/route.ts`
**Yêu cầu**:
- [ ] GET: Thêm `requireAuth()` check
- [ ] GET: Kiểm tra quyền VIEWER trở lên
- [ ] PATCH: Thêm `requireAuth()` check
- [ ] PATCH: Kiểm tra quyền EDITOR trở lên
- [ ] DELETE: Thêm `requireAuth()` check
- [ ] DELETE: Kiểm tra quyền ADMIN trên project
- [ ] Thêm audit logging cho PATCH và DELETE

### ⏳ Task 3.3: Bảo vệ API `/api/translation-tables`
**File**: `src/app/api/translation-tables/route.ts`
**Yêu cầu**:
- [ ] GET: Thêm `requireAuth()` check
- [ ] GET: Filter tables theo project membership
- [ ] POST: Thêm `requireAuth()` check
- [ ] POST: Kiểm tra quyền EDITOR trở lên
- [ ] POST: Gán projectId nếu có
- [ ] Thêm audit logging cho POST

### ⏳ Task 3.4: Bảo vệ API `/api/translation-tables/[id]`
**File**: `src/app/api/translation-tables/[id]/route.ts`
**Yêu cầu**:
- [ ] GET: Thêm `requireAuth()` check
- [ ] GET: Kiểm tra quyền VIEWER trở lên
- [ ] PATCH: Thêm `requireAuth()` check
- [ ] PATCH: Kiểm tra quyền EDITOR trở lên
- [ ] DELETE: Thêm `requireAuth()` check
- [ ] DELETE: Kiểm tra quyền ADMIN trên project
- [ ] Thêm audit logging cho PATCH và DELETE

### ⏳ Task 3.5: Bảo vệ API `/api/po-files/[id]/entries`
**File**: `src/app/api/po-files/[id]/entries/route.ts`
**Yêu cầu**:
- [ ] GET: Thêm `requireAuth()` check
- [ ] GET: Kiểm tra quyền VIEWER trở lên
- [ ] POST: Thêm `requireAuth()` check
- [ ] POST: Kiểm tra quyền EDITOR trở lên
- [ ] Thêm audit logging

### ⏳ Task 3.6: Bảo vệ API `/api/translation-tables/[id]/entries`
**File**: `src/app/api/translation-tables/[id]/entries/route.ts`
**Yêu cầu**:
- [ ] GET: Thêm `requireAuth()` check
- [ ] GET: Kiểm tra quyền VIEWER trở lên
- [ ] POST: Thêm `requireAuth()` check
- [ ] POST: Kiểm tra quyền EDITOR trở lên
- [ ] Thêm audit logging

---

## 4. RBAC Integration

### ⏳ Task 4.1: Sử dụng PermissionGuard trong UI
**Yêu cầu**:
- [ ] Wrap các action buttons (Edit, Delete) với PermissionGuard
- [ ] Sử dụng RoleBadge để hiển thị role của user
- [ ] Ẩn các tính năng không có quyền truy cập

### ⏳ Task 4.2: Sử dụng usePermission hook
**Yêu cầu**:
- [ ] Sử dụng hook trong client components để kiểm tra quyền
- [ ] Hiển thị UI dựa trên quyền (ví dụ: chỉ hiện nút Delete cho ADMIN)

---

## 5. Project Integration

### ⏳ Task 5.1: Thêm project selector vào upload form
**Yêu cầu**:
- [ ] Hiển thị dropdown chọn project khi upload file
- [ ] Gán file vào project được chọn
- [ ] Validate project membership

### ⏳ Task 5.2: Thêm project selector vào translation table form
**Yêu cầu**:
- [ ] Hiển thị dropdown chọn project khi tạo translation table
- [ ] Gán table vào project được chọn
- [ ] Validate project membership

---

## Tổng kết

**Tổng số tasks**: 20
**Ưu tiên cao**: 
- Task 1.1, 1.2 (Navbar)
- Task 2.1-2.5 (UI Protection)
- Task 3.1-3.6 (API Protection)

**Lưu ý**:
- Tất cả các trang và API cần được bảo vệ bằng authentication
- Các action quan trọng (DELETE, PATCH) cần kiểm tra quyền cụ thể
- Cần thêm audit logging cho các thao tác quan trọng
- Cần filter data theo project membership

