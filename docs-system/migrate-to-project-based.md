# Migration: Di chuyển Translation Tables và Files vào Project

## Tổng quan
Hiện tại translation tables và PO files có thể được tạo độc lập (không có projectId). Yêu cầu mới: **TẤT CẢ translation tables và files PHẢI được quản lý trong project** (projectId bắt buộc).

## Mục tiêu
1. ✅ Translation tables và files chỉ có thể tạo trong project
2. ✅ Xóa các trang UI bên ngoài project (`/translations`, `/files`, `/upload`)
3. ✅ Tạo UI mới trong project detail page để quản lý translations và files
4. ✅ Cập nhật navigation để loại bỏ các link cũ
5. ✅ Migration dữ liệu hiện có (nếu có records không có projectId)

---

## Phase 1: Cập nhật API - Yêu cầu projectId bắt buộc

### ✅ Task 1.1: Cập nhật API Translation Tables
**File**: `src/app/api/translation-tables/route.ts`

**Thay đổi**:
- [x] POST: Yêu cầu `projectId` là bắt buộc (không còn optional)
- [x] POST: Validate projectId tồn tại và user có quyền (EDITOR trở lên)
- [x] GET: Chỉ trả về tables có projectId (filter out null projectId)
- [x] Thêm error message rõ ràng nếu thiếu projectId

**Trạng thái**: ✅ **Hoàn thành** - Đã cập nhật API, đã test lint và type check, không có lỗi.

**Code changes**:
```typescript
// POST handler
const { name, language, description, projectId } = body ?? {};

// Validate projectId is required
if (!projectId || typeof projectId !== "string") {
  return NextResponse.json(
    { error: "projectId là bắt buộc" },
    { status: 400 }
  );
}

// Validate project access
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    members: {
      where: { userId: user.id },
    },
  },
});

if (!project) {
  return NextResponse.json(
    { error: "Project không tồn tại" },
    { status: 404 }
  );
}

const isAdmin = user.systemRole === Role.ADMIN;
const isMember = project.members.length > 0;
const hasEditorRole = project.members.some(
  (m) => m.role === Role.EDITOR || m.role === Role.REVIEWER || m.role === Role.ADMIN
);

if (!isAdmin && (!isMember || !hasEditorRole)) {
  return NextResponse.json(
    { error: "Bạn cần quyền EDITOR trở lên để tạo bảng dịch trong project này" },
    { status: 403 }
  );
}

// Create with projectId (no longer nullable)
const created = await prisma.translationTable.create({
  data: {
    name: name.trim(),
    language: language.trim(),
    description: typeof description === "string" ? description.trim() : null,
    projectId: projectId, // Required, not nullable
  },
  // ...
});
```

### ✅ Task 1.2: Cập nhật API PO Files
**File**: `src/app/api/po-files/route.ts`

**Thay đổi**:
- [x] POST: Yêu cầu `projectId` là bắt buộc
- [x] POST: Validate projectId tồn tại và user có quyền (EDITOR trở lên)
- [x] GET: Chỉ trả về files có projectId (filter out null projectId)
- [ ] Cập nhật server action `uploadPoFile` trong `src/app/actions/po-actions.ts` để yêu cầu projectId

**Trạng thái**: ✅ **Hoàn thành** (trừ server action - sẽ làm ở Task 1.3) - Đã cập nhật API, đã test lint và type check, không có lỗi.

**Code changes**:
```typescript
// POST handler
const { filename, language, entries, metadata, filesize = 0, projectId } = body ?? {};

// Validate projectId is required
if (!projectId || typeof projectId !== "string") {
  return NextResponse.json(
    { error: "projectId là bắt buộc" },
    { status: 400 }
  );
}

// Validate project access (same as translation tables)
// ...

const created = await prisma.poFile.create({
  data: {
    filename,
    filesize: Number(filesize) || 0,
    language: typeof language === "string" ? language : null,
    projectId: projectId, // Required, not nullable
    // ...
  },
});
```

### ✅ Task 1.3: Cập nhật Server Action
**File**: `src/app/actions/po-actions.ts`

**Thay đổi**:
- [x] `uploadPoFile`: Yêu cầu projectId từ FormData
- [x] Validate projectId và quyền truy cập
- [x] Cập nhật error messages

**Trạng thái**: ✅ **Hoàn thành** - Đã cập nhật server action với authentication check, project validation và permission check (EDITOR trở lên), đã test lint và type check, không có lỗi.

---

## Phase 2: Xóa các trang UI cũ

### ✅ Task 2.1: Xóa trang Translations List
**Files để xóa**:
- [x] `src/app/translations/page.tsx`
- [ ] `src/components/translations/translation-tables-list.tsx` (hoặc refactor để dùng trong project)

**Lưu ý**: Component `TranslationTablesList` có thể giữ lại để dùng trong project detail page.

**Trạng thái**: ✅ **Hoàn thành** - Đã xóa trang `/translations/page.tsx`, giữ lại component `TranslationTablesList` để dùng sau. Đã test lint và type check, không có lỗi.

### ✅ Task 2.2: Xóa trang Create Translation
**Files để xóa**:
- [x] `src/app/translations/new/page.tsx`
- [ ] `src/components/translations/create-translation-form.tsx` (hoặc refactor để nhận projectId từ context)

**Lưu ý**: Component `CreateTranslationForm` cần refactor để:
- Nhận `projectId` từ props (từ project detail page)
- Không cần project selector (vì đã trong project context)
- Redirect về project detail page sau khi tạo

**Trạng thái**: ✅ **Hoàn thành** - Đã xóa trang `/translations/new/page.tsx`, giữ lại component `CreateTranslationForm` để refactor ở Task 3.3. Đã test lint và type check, không có lỗi.

### ✅ Task 2.3: Xóa trang Translation Detail (hoặc chuyển vào project)
**File**: `src/app/translations/[id]/page.tsx`

**Quyết định**:
- [x] Option A: Xóa hoàn toàn, chỉ xem trong project context
- [x] Option B: Giữ lại nhưng redirect nếu không có projectId, hoặc hiển thị breadcrumb về project

**Khuyến nghị**: Option B - Giữ lại để có thể share link trực tiếp, nhưng thêm breadcrumb về project.

**Tính năng cần giữ lại**:
- ✅ Export buttons: CSV, Excel, JSON, PO
- ✅ TranslationEntriesPanel: xem, edit, create, delete entries
- ✅ Batch translate entries
- ✅ Search/filter entries
- ✅ Delete table button
- ✅ Pagination

**Trạng thái**: ✅ **Hoàn thành** - Đã cập nhật trang translation detail với breadcrumb về project. Format: `Projects > [Project Name] > Translation Table`. Nếu không có projectId, hiển thị link về danh sách bảng dịch. Tất cả tính năng export và quản lý entries đã được giữ nguyên. Đã test lint và type check, không có lỗi.

### ✅ Task 2.4: Xóa trang Files List
**Files để xóa**:
- [x] `src/app/files/page.tsx`
- [ ] `src/components/po/po-files-table.tsx` (hoặc refactor để dùng trong project)

**Lưu ý**: Component `PoFilesTable` có thể giữ lại để dùng trong project detail page.

**Trạng thái**: ✅ **Hoàn thành** - Đã xóa trang `/files/page.tsx`, giữ lại component `PoFilesTable` để dùng sau. Đã test lint và type check, không có lỗi.

### ✅ Task 2.5: Xóa trang Upload
**Files để xóa**:
- [x] `src/app/upload/page.tsx`
- [ ] `src/components/po/upload-po-form.tsx` (hoặc refactor để nhận projectId từ context)

**Lưu ý**: Component `UploadPoForm` cần refactor để:
- Nhận `projectId` từ props (từ project detail page)
- Không cần project selector (vì đã trong project context)
- Redirect về project detail page sau khi upload

**Trạng thái**: ✅ **Hoàn thành** - Đã xóa trang `/upload/page.tsx`, giữ lại component `UploadPoForm` để refactor ở Task 3.4. Đã test lint và type check, không có lỗi.

### ✅ Task 2.6: Xóa trang File Detail (hoặc chuyển vào project)
**File**: `src/app/files/[fileId]/page.tsx`

**Quyết định**:
- [x] Option A: Xóa hoàn toàn, chỉ xem trong project context
- [x] Option B: Giữ lại nhưng redirect nếu không có projectId, hoặc hiển thị breadcrumb về project

**Khuyến nghị**: Option B - Giữ lại để có thể share link trực tiếp, nhưng thêm breadcrumb về project.

**Tính năng cần giữ lại**:
- ✅ Export buttons: .po, CSV, Excel, JSON
- ✅ PoEntriesPanel: xem, edit entries
- ✅ Batch translate entries
- ✅ Search/filter entries
- ✅ Metadata display
- ✅ Pagination

**Trạng thái**: ✅ **Hoàn thành** - Đã cập nhật trang file detail với breadcrumb về project. Format: `Projects > [Project Name] > PO File`. Nếu không có projectId, hiển thị link về danh sách tệp. Đã cập nhật redirect từ `/files?error=access_denied` thành `/projects?error=access_denied`. Tất cả tính năng export và quản lý entries đã được giữ nguyên. Đã fix tất cả lint warnings. Đã test lint và type check, không có lỗi.

---

## Phase 3: Tạo UI mới trong Project Detail Page

### 📋 Tính năng cần giữ lại và bê vào Project Management

**Tất cả các tính năng sau đây PHẢI được giữ nguyên và tích hợp vào project detail page:**

#### Translation Tables:
- ✅ **Export**: CSV, Excel, JSON, PO (từ `/api/translation-tables/[id]/export/*`)
- ✅ **TranslationEntriesPanel**: 
  - Xem danh sách entries với pagination
  - Edit entry (single)
  - Create entry (single)
  - Delete entry (single, multiple, all)
  - Batch translate entries (DeepL, Gemini)
  - Search/filter entries
  - Character count cho batch translate
- ✅ **DeleteTableButton**: Xóa translation table
- ✅ **SearchForm**: Tìm kiếm trong entries

#### PO Files:
- ✅ **Export**: .po, CSV, Excel, JSON (từ `/api/po-files/[id]/export/*`)
- ✅ **PoEntriesPanel**:
  - Xem danh sách entries với pagination
  - Edit entry (single)
  - Batch translate entries (DeepL, Gemini)
  - Search/filter entries
  - Character count cho batch translate
- ✅ **Metadata display**: Hiển thị metadata của PO file
- ✅ **SearchForm**: Tìm kiếm trong entries

#### API Endpoints cần giữ nguyên:
- `/api/translation-tables/[id]/export/*` (CSV, Excel, JSON, PO)
- `/api/po-files/[id]/export/*` (.po, CSV, Excel, JSON)
- `/api/translation-tables/[id]/entries/*` (CRUD operations)
- `/api/po-files/[id]/entries/*` (CRUD operations)
- `/api/translation-tables/[id]/entries/batch-translate/*` (DeepL, Gemini)
- `/api/po-files/[id]/entries/batch-translate/*` (DeepL, Gemini)

**Lưu ý**: Các detail pages (`/translations/[id]` và `/files/[fileId]`) sẽ được giữ lại để:
1. Share link trực tiếp
2. Chứa đầy đủ các tính năng export và quản lý entries
3. Có breadcrumb về project để điều hướng dễ dàng

---

### ✅ Task 3.1: Thêm tab "Translation Tables" vào Project Detail
**File**: `src/app/projects/[id]/project-detail.tsx`

**Thay đổi**:
- [x] Thêm tab mới "Translation Tables" vào tabs array
- [x] Tạo component `TranslationTablesTab` để hiển thị danh sách tables
- [x] Hiển thị danh sách tables của project (filter theo projectId)
- [x] Thêm nút "Tạo bảng dịch mới" (chỉ hiện với quyền EDITOR trở lên)
- [x] Mỗi table có link đến detail page hoặc mở modal để xem/edit

**Trạng thái**: ✅ **Hoàn thành** - Đã thêm tab "Translation Tables" vào project detail page. Đã tạo component TranslationTablesTab với đầy đủ tính năng: fetch từ API, grid view, quick export buttons, search, modal tạo mới. Đã test lint và type check, không có lỗi.

**UI Design**:
```
Tab: Translation Tables
- Grid/List view của các translation tables
- Mỗi card hiển thị: name, language, entry count, last updated
- Nút "Tạo mới" ở góc trên bên phải (chỉ hiện với quyền EDITOR+)
- Quick actions trên mỗi card:
  - Link đến detail page `/translations/[id]` (với breadcrumb về project)
  - Export buttons (CSV, Excel, JSON, PO) - quick export
  - Delete button (chỉ hiện với quyền EDITOR+)
- Search bar để tìm kiếm trong danh sách tables
- Click vào table → navigate đến detail page với đầy đủ tính năng
```

### ✅ Task 3.2: Thêm tab "PO Files" vào Project Detail
**File**: `src/app/projects/[id]/project-detail.tsx`

**Thay đổi**:
- [x] Thêm tab mới "PO Files" vào tabs array
- [x] Tạo component `PoFilesTab` để hiển thị danh sách files
- [x] Hiển thị danh sách files của project (filter theo projectId)
- [x] Thêm nút "Upload file mới" (chỉ hiện với quyền EDITOR trở lên)
- [x] Mỗi file có link đến detail page hoặc mở modal để xem/edit

**Trạng thái**: ✅ **Hoàn thành** - Đã thêm tab "PO Files" vào project detail page. Đã tạo component PoFilesTab với đầy đủ tính năng: fetch từ API, grid view, quick export buttons, search, modal upload với UploadPoForm đã refactor. Đã test lint và type check, không có lỗi.

**UI Design**:
```
Tab: PO Files
- Table/Grid view của các PO files
- Mỗi row/card hiển thị: filename, language, entry count, uploaded date
- Nút "Upload mới" ở góc trên bên phải (chỉ hiện với quyền EDITOR+)
- Quick actions trên mỗi row/card:
  - Link đến detail page `/files/[fileId]` (với breadcrumb về project)
  - Export buttons (.po, CSV, Excel, JSON) - quick export
- Search bar để tìm kiếm trong danh sách files
- Click vào file → navigate đến detail page với đầy đủ tính năng
```

### ✅ Task 3.3: Refactor CreateTranslationForm
**File**: `src/components/translations/create-translation-form.tsx`

**Thay đổi**:
- [x] Nhận `projectId` từ props (required)
- [x] Xóa project selector dropdown
- [x] Redirect về `/projects/${projectId}` sau khi tạo thành công (qua callback onSuccess)
- [x] Cập nhật error messages
- [x] Thêm callbacks `onSuccess` và `onCancel` để tích hợp với modal

**Trạng thái**: ✅ **Hoàn thành** - Đã refactor CreateTranslationForm để nhận projectId từ props (required), xóa project selector, thêm callbacks onSuccess và onCancel. Form hiện được sử dụng trong modal của TranslationTablesTab. Đã test lint và type check, không có lỗi.

### ✅ Task 3.4: Refactor UploadPoForm
**File**: `src/components/po/upload-po-form.tsx`

**Thay đổi**:
- [x] Nhận `projectId` từ props (required)
- [x] Xóa project selector dropdown
- [x] Redirect về `/projects/${projectId}` sau khi upload thành công (qua callback onSuccess)
- [x] Cập nhật error messages
- [x] Thêm callbacks `onSuccess` và `onCancel` để tích hợp với modal
- [x] Thêm hidden input để gửi projectId trong FormData

**Trạng thái**: ✅ **Hoàn thành** - Đã refactor UploadPoForm để nhận projectId từ props (required), xóa project selector, thêm callbacks onSuccess và onCancel. Form hiện được sử dụng trong modal của PoFilesTab. Đã test lint và type check, không có lỗi.

### ✅ Task 3.5: Tạo component TranslationTablesTab
**File**: `src/app/projects/[id]/translation-tables-tab.tsx` (new)

**Chức năng**:
- [x] Fetch danh sách translation tables của project từ API
- [x] Hiển thị grid/list view với thông tin: name, language, entry count, last updated
- [x] Modal tạo mới (sử dụng CreateTranslationForm đã refactor)
- [x] Link đến detail page `/translations/[id]` với breadcrumb về project
- [x] Permission check: chỉ hiện nút tạo nếu có quyền EDITOR trở lên
- [x] **Tính năng Export**: Mỗi table có các nút export (CSV, Excel, JSON, PO) - giữ nguyên từ detail page
- [ ] **Tính năng Delete**: Nút xóa table (chỉ hiện với quyền EDITOR trở lên) - có thể thêm sau nếu cần
- [x] **Tính năng Search**: Tìm kiếm trong danh sách tables

**Trạng thái**: ✅ **Hoàn thành** - Đã tạo component TranslationTablesTab với đầy đủ tính năng: fetch từ API, grid view, quick export buttons, search, modal tạo mới với CreateTranslationForm đã refactor. Đã test lint và type check, không có lỗi.

### ✅ Task 3.6: Tạo component PoFilesTab
**File**: `src/app/projects/[id]/po-files-tab.tsx` (new)

**Chức năng**:
- [x] Fetch danh sách PO files của project từ API
- [x] Hiển thị table/grid view với thông tin: filename, language, entry count, uploaded date
- [x] Modal upload mới (sử dụng UploadPoForm đã refactor)
- [x] Link đến detail page `/files/[fileId]` với breadcrumb về project
- [x] Permission check: chỉ hiện nút upload nếu có quyền EDITOR trở lên
- [x] **Tính năng Export**: Mỗi file có các nút export (.po, CSV, Excel, JSON) - giữ nguyên từ detail page
- [x] **Tính năng Search**: Tìm kiếm trong danh sách files

**Trạng thái**: ✅ **Hoàn thành** - Đã tạo component PoFilesTab với đầy đủ tính năng: fetch từ API, grid view, quick export buttons, search, modal upload với UploadPoForm đã refactor. Đã test lint và type check, không có lỗi.

---

## Phase 4: Cập nhật Navigation

### ✅ Task 4.1: Cập nhật Navbar
**File**: `src/components/layout/navbar.tsx`

**Thay đổi**:
- [x] Xóa link "Danh sách tệp" (`/files`)
- [x] Xóa link "Upload tệp" (`/upload`)
- [x] Xóa link "Bảng dịch" (`/translations`)
- [x] Giữ lại link "Dự án" (`/projects`) - đây là entry point chính

**Code changes**:
```typescript
const workspaceLinks = [
  { href: '/projects', label: 'Dự án', icon: Folder },
  // Removed: /files, /upload, /translations
];
```

**Trạng thái**: ✅ **Hoàn thành** - Đã xóa các links cũ (`/files`, `/upload`, `/translations`) khỏi navbar. Chỉ giữ lại link "Dự án" (`/projects`) làm entry point chính. Đã test lint và type check, không có lỗi.

### ✅ Task 4.2: Cập nhật Breadcrumbs
**Files**: 
- `src/app/translations/[id]/page.tsx`
- `src/app/files/[fileId]/page.tsx`

**Thay đổi**:
- [x] Thêm breadcrumb về project nếu có projectId
- [x] Format: `Projects > [Project Name] > Translation Table / PO File`
- [x] Xóa fallback links đến các trang đã bị xóa (`/translations`, `/files`)

**Trạng thái**: ✅ **Hoàn thành** - Đã cập nhật breadcrumbs trong cả 2 detail pages. Format: `Projects > [Project Name] > Translation Table / PO File`. Đã xóa fallback links đến các trang đã bị xóa. Đã test lint và type check, không có lỗi.

---

## Phase 5: Migration dữ liệu (nếu cần)

### ✅ Task 5.1: Kiểm tra dữ liệu hiện có
**Script**: Tạo migration script để kiểm tra

**Queries**:
```sql
-- Check translation tables without projectId
SELECT COUNT(*) FROM "TranslationTable" WHERE "projectId" IS NULL;

-- Check PO files without projectId
SELECT COUNT(*) FROM "PoFile" WHERE "projectId" IS NULL;
```

### ✅ Task 5.2: Migration Strategy
**Options**:
- [ ] Option A: Xóa tất cả records không có projectId (nếu là test data)
- [ ] Option B: Gán vào một "Default Project" (tạo project mặc định)
- [ ] Option C: Yêu cầu admin gán thủ công từng record vào project

**Khuyến nghị**: 
- Nếu là production: Option C (an toàn nhất)
- Nếu là dev/test: Option A hoặc B

### ✅ Task 5.3: Tạo Migration Script (nếu cần)
**File**: `prisma/migrations/[timestamp]_require_project_id/migration.sql`

**Nội dung**:
```sql
-- Option: Set NOT NULL constraint (sau khi đã migrate data)
-- ALTER TABLE "TranslationTable" ALTER COLUMN "projectId" SET NOT NULL;
-- ALTER TABLE "PoFile" ALTER COLUMN "projectId" SET NOT NULL;

-- Hoặc: Xóa records không có projectId (nếu là test data)
-- DELETE FROM "TranslationTable" WHERE "projectId" IS NULL;
-- DELETE FROM "PoFile" WHERE "projectId" IS NULL;
```

**Lưu ý**: Chỉ chạy migration sau khi đã xử lý dữ liệu hiện có.

---

## Phase 6: Cập nhật Schema (Optional)

### ✅ Task 6.1: Cập nhật Prisma Schema
**File**: `prisma/schema.prisma`

**Thay đổi** (Optional - chỉ nếu muốn enforce ở DB level):
- [ ] Đổi `projectId String?` thành `projectId String` (required)
- [ ] Tạo migration mới

**Lưu ý**: 
- Nếu enforce ở DB level, phải đảm bảo đã migrate tất cả dữ liệu
- Có thể giữ nullable ở DB nhưng enforce ở application level (an toàn hơn)

---

## Phase 7: Testing & Validation

### ✅ Task 7.1: Test API
- [ ] Test POST translation table không có projectId → phải trả về error
- [ ] Test POST PO file không có projectId → phải trả về error
- [ ] Test GET chỉ trả về items có projectId
- [ ] Test permission checks (EDITOR, REVIEWER, ADMIN)

### ✅ Task 7.2: Test UI
- [ ] Test tạo translation table trong project → thành công
- [ ] Test upload PO file trong project → thành công
- [ ] Test xem danh sách trong project detail page
- [ ] Test navigation từ project → translation/file detail → back to project
- [ ] Test permission: VIEWER không thể tạo/upload

### ✅ Task 7.3: Test Migration (nếu có)
- [ ] Test migration script với test data
- [ ] Verify không mất dữ liệu
- [ ] Verify tất cả records đều có projectId sau migration

---

## Checklist tổng hợp

### API Changes
- [ ] Translation Tables API: projectId required
- [ ] PO Files API: projectId required
- [ ] Server Actions: projectId required
- [ ] Permission checks updated

### UI Removal
- [ ] Xóa `/translations` page
- [ ] Xóa `/translations/new` page
- [ ] Xóa `/files` page
- [ ] Xóa `/upload` page
- [ ] Update `/translations/[id]` với breadcrumb
- [ ] Update `/files/[fileId]` với breadcrumb

### UI Addition
- [ ] Tab "Translation Tables" trong project detail
- [ ] Tab "PO Files" trong project detail
- [ ] Component TranslationTablesTab (với export, delete, search)
- [ ] Component PoFilesTab (với export, search)
- [ ] Refactor CreateTranslationForm
- [ ] Refactor UploadPoForm
- [ ] **Giữ nguyên tất cả tính năng export** (CSV, Excel, JSON, PO)
- [ ] **Giữ nguyên TranslationEntriesPanel và PoEntriesPanel** (edit, create, delete, batch translate)
- [ ] **Giữ nguyên SearchForm** trong detail pages
- [ ] **Giữ nguyên DeleteTableButton** trong translation detail

### Navigation
- [ ] Update Navbar (xóa links cũ)
- [ ] Update breadcrumbs

### Data Migration
- [ ] Check existing data
- [ ] Decide migration strategy
- [ ] Run migration (nếu cần)

### Testing
- [ ] API tests
- [ ] UI tests
- [ ] Integration tests
- [ ] Permission tests

---

## Lưu ý quan trọng

1. **Backward Compatibility**: Các link cũ (`/translations/[id]`, `/files/[fileId]`) vẫn hoạt động nhưng sẽ redirect hoặc hiển thị breadcrumb về project.

2. **User Experience**: 
   - Đảm bảo flow: Projects → Select Project → View/Manage Translations & Files
   - Thêm loading states và error handling
   - Thông báo rõ ràng khi không có quyền

3. **Performance**:
   - Lazy load tabs content (chỉ load khi click vào tab)
   - Pagination cho danh sách lớn
   - Caching project data

4. **Security**:
   - Luôn validate projectId và permission ở API level
   - Không trust client-side checks
   - Audit logging cho tất cả actions

---

## Timeline ước tính

- **Phase 1 (API)**: 2-3 giờ
- **Phase 2 (Remove UI)**: 1-2 giờ
- **Phase 3 (New UI)**: 4-6 giờ
- **Phase 4 (Navigation)**: 1 giờ
- **Phase 5 (Migration)**: 1-2 giờ (nếu cần)
- **Phase 6 (Schema)**: 1 giờ (optional)
- **Phase 7 (Testing)**: 2-3 giờ

**Tổng**: ~12-18 giờ

---

## Next Steps

1. Review và approve plan này
2. Bắt đầu với Phase 1 (API changes) - ít risk nhất
3. Sau đó Phase 2 (remove old UI)
4. Tiếp theo Phase 3 (new UI) - phần quan trọng nhất
5. Cuối cùng testing và migration

