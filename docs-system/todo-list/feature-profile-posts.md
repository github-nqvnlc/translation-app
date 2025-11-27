# Feature: User Profile, Dashboard & Posts

## Tổng quan
Phát triển hệ thống profile cá nhân với dashboard thống kê, chỉnh sửa profile và quản lý posts có comment và đánh giá.

---

## Phase 1: Trang Profile

### Task 1.1: Tạo trang Profile - Route và Layout cơ bản
**File**: `src/app/users/[id]/page.tsx` (new)

**Chức năng**:
- [x] Tạo route `/users/[id]` để hiển thị profile của user
- [x] Layout với header: avatar, name, bio
- [x] Tabs: Overview, Posts, Activity
- [x] Responsive design

### Task 1.2: Tạo API GET /api/users/[id]
**File**: `src/app/api/users/[id]/route.ts` (new)

**Chức năng**:
- [x] Lấy thông tin user: id, email, name, image, bio, createdAt
- [x] Lấy thống kê: số projects, số translation tables, số PO files (theo privacy settings)
- [x] **Permission: Profile là PUBLIC - ai cũng xem được** (sau khi đăng nhập)
- [x] Hiển thị thông tin theo privacy settings của user
- [x] Include project memberships và roles (nếu được phép hiển thị)

### Task 1.3: Hiển thị thông tin cơ bản
**File**: `src/app/users/[id]/page.tsx`

**Chức năng**:
- [x] Avatar (hiển thị từ user.image hoặc fallback)
- [x] Name
- [x] Email (chỉ hiển thị nếu `showEmail = true` trong privacy settings)
- [x] Bio/description (từ UserProfileSettings)
- [x] Join date (từ createdAt)
- [x] Link "Chỉnh sửa hồ sơ" (chỉ hiện với owner, link đến `/settings/profile`)

### Task 1.4: Hiển thị thống kê tổng quan
**File**: `src/app/users/[id]/page.tsx`

**Chức năng**:
- [x] Card: Số projects tham gia (chỉ hiện nếu `showProjects = true`)
- [x] Card: Số translation tables đã tạo (chỉ hiện nếu `showTranslationTables = true`)
- [x] Card: Số PO files đã upload (chỉ hiện nếu `showPoFiles = true`)
- [x] Card: Tổng số entries đã dịch (chỉ hiện nếu `showEntriesCount = true`)
- [x] Ẩn các cards không được phép hiển thị theo privacy settings

### Task 1.5: Thêm link đến profile từ navbar
**File**: `src/components/layout/navbar.tsx`

**Chức năng**:
- [x] Thêm link "Hồ sơ" vào user menu
- [x] Link đến `/users/[userId]` (current user)
- [x] Icon User hoặc UserCircle

---

## Phase 2: Dashboard Thống kê Cá nhân

### Task 2.1: Tạo API /api/users/[id]/stats ✅
**File**: `src/app/api/users/[id]/stats/route.ts` (new)

**Chức năng**:
- [x] Tính toán số translations created theo thời gian (ngày/tuần/tháng)
- [x] Tính toán số files uploaded theo thời gian
- [x] Tính toán số entries translated theo thời gian
- [x] Thống kê theo ngôn ngữ
- [x] Thống kê theo project
- [x] Top activities gần đây
- [x] **Respect privacy settings**: chỉ trả về data được phép hiển thị

### Task 2.2: Tính toán số liệu
**File**: `src/app/api/users/[id]/stats/route.ts`

**Queries**:
```typescript
// Translations created by date
// Files uploaded by date
// Entries translated by date
// Group by language
// Group by project
// Recent activities from audit logs
```

### Task 2.3: Tích hợp thư viện biểu đồ
**Package**: `recharts` hoặc `chart.js`

**Cài đặt**:
```bash
npm install recharts
# hoặc
npm install chart.js react-chartjs-2
```

### Task 2.4: Tạo component ActivityChart ✅
**File**: `src/components/dashboard/activity-chart.tsx` (new)

**Chức năng**:
- [x] Line chart hoặc Bar chart hiển thị hoạt động theo thời gian
- [x] Filter: Ngày/Tuần/Tháng
- [x] Hiển thị: Translations, Files, Entries
- [x] Tooltip với chi tiết
- [x] **Chỉ hiển thị nếu `showActivityChart = true` trong privacy settings**

### Task 2.5: Tạo component TranslationStats ✅
**File**: `src/components/dashboard/translation-stats.tsx` (new)

**Chức năng**:
- [x] Pie chart hoặc Bar chart theo ngôn ngữ (chỉ hiện nếu `showLanguageStats = true`)
- [x] Pie chart hoặc Bar chart theo project (chỉ hiện nếu `showProjectStats = true`)
- [x] Hiển thị số lượng và phần trăm

### Task 2.6: Tạo component RecentActivity ✅
**File**: `src/components/dashboard/recent-activity.tsx` (new)

**Chức năng**:
- [x] Danh sách hoạt động gần đây từ audit logs
- [x] Hiển thị: action, resource, timestamp
- [x] Link đến resource (nếu có)
- [x] Pagination hoặc "Load more"
- [x] **Chỉ hiển thị nếu `showRecentActivity = true` trong privacy settings**

---

## Phase 3: Settings Profile (Chỉnh sửa Profile và Privacy Settings)

### Task 3.1: Tạo Prisma schema cho UserProfileSettings ✅
**File**: `prisma/schema.prisma`

**Model**:
```prisma
model UserProfileSettings {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Profile info
  bio                   String?  @db.Text
  
  // Privacy settings - hiển thị gì trên profile
  showEmail             Boolean  @default(false)
  showProjects          Boolean  @default(true)
  showTranslationTables Boolean  @default(true)
  showPoFiles           Boolean  @default(true)
  showEntriesCount      Boolean  @default(true)
  showActivityChart     Boolean  @default(true)
  showLanguageStats     Boolean  @default(true)
  showProjectStats      Boolean  @default(true)
  showRecentActivity    Boolean  @default(true)
  showPosts             Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

**Update User model**:
```prisma
model User {
  // ... existing fields
  profileSettings UserProfileSettings?
}
```

### Task 3.2: Tạo API GET /api/settings/profile ✅
**File**: `src/app/api/settings/profile/route.ts` (new)

**Chức năng**:
- [x] Lấy thông tin profile settings của current user
- [x] Permission: chỉ owner mới xem được
- [x] Return: name, bio, image, và tất cả privacy settings

### Task 3.3: Tạo API PATCH /api/settings/profile ✅
**File**: `src/app/api/settings/profile/route.ts`

**Chức năng**:
- [x] Cập nhật name, bio
- [x] Cập nhật tất cả privacy settings
- [x] Permission: chỉ owner mới được update
- [x] Validation: name max length, bio max length
- [x] Tạo UserProfileSettings nếu chưa có
- [x] Audit log

### Task 3.4: Tạo trang Settings Profile ✅
**File**: `src/app/settings/profile/page.tsx` (new)

**Chức năng**:
- [x] Route `/settings/profile`
- [x] Tabs hoặc sections: "Thông tin cá nhân", "Quyền riêng tư"
- [x] Link từ user menu trong navbar
- [x] Breadcrumb: Settings > Profile

### Task 3.5: Tạo component EditProfileForm ✅
**File**: `src/components/settings/edit-profile-form.tsx` (new)

**Chức năng**:
- [x] Section "Thông tin cá nhân":
  - [x] Form với fields: name, bio
  - [x] Preview avatar
  - [x] Button "Chọn ảnh" để upload avatar
- [x] Section "Quyền riêng tư":
  - [x] Toggle switches cho từng privacy setting
  - [x] Mô tả rõ ràng cho mỗi setting
- [x] Button "Lưu" và "Hủy"
- [x] Loading state và error handling

### Task 3.6: Tích hợp upload avatar
**File**: `src/components/settings/edit-profile-form.tsx`

**Chức năng**:
- [ ] File input cho image upload
- [ ] Preview image trước khi upload
- [ ] Validate: file type (jpg, png, webp), file size (max 2MB)
- [ ] Crop/resize image (optional)

### Task 3.7: Tạo API /api/settings/profile/avatar ✅
**File**: `src/app/api/settings/profile/avatar/route.ts` (new)

**Chức năng**:
- [x] POST: Upload avatar image
- [x] Lưu file vào storage (local hoặc cloud)
- [x] Update user.image trong database
- [x] Xóa avatar cũ nếu có
- [x] Return URL của avatar mới

### Task 3.8: Validation và error handling
**File**: `src/components/settings/edit-profile-form.tsx`

**Chức năng**:
- [ ] Validate name: required, max 100 chars
- [ ] Validate bio: max 500 chars
- [ ] Validate image: type, size
- [ ] Error messages rõ ràng
- [ ] Success toast notification

### Task 3.9: Cập nhật API GET /api/users/[id] để respect privacy settings ✅
**File**: `src/app/api/users/[id]/route.ts`

**Chức năng**:
- [x] Lấy UserProfileSettings của user
- [x] Chỉ trả về thông tin được phép hiển thị:
  - [x] Email: chỉ trả về nếu `showEmail = true`
  - [x] Projects count: chỉ trả về nếu `showProjects = true`
  - [x] Translation tables count: chỉ trả về nếu `showTranslationTables = true`
  - [x] PO files count: chỉ trả về nếu `showPoFiles = true`
  - [x] Entries count: chỉ trả về nếu `showEntriesCount = true`
- [x] Default: tất cả đều `true` nếu chưa có settings

---

## Phase 4: CRUD Posts với Comments và Ratings

### Task 4.1: Tạo Prisma schema cho Post
**File**: `prisma/schema.prisma`

**Model**:
```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  isPublic  Boolean  @default(true)
  authorId  String
  author    User     @relation("PostAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]
  ratings   Rating[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([isPublic, createdAt])
}
```

### Task 4.2: Tạo Prisma schema cho Comment
**File**: `prisma/schema.prisma`

**Model**:
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  authorId  String
  author    User     @relation("CommentAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId])
  @@index([authorId])
}
```

### Task 4.3: Tạo Prisma schema cho Rating
**File**: `prisma/schema.prisma`

**Model**:
```prisma
model Rating {
  id        String   @id @default(cuid())
  value     Int      // 1-5
  authorId  String
  author    User     @relation("RatingAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([authorId, postId]) // Mỗi user chỉ rate 1 lần
  @@index([postId])
}
```

### Task 4.4: Tạo API GET /api/users/[id]/posts
**File**: `src/app/api/users/[id]/posts/route.ts` (new)

**Chức năng**:
- [ ] Lấy danh sách posts của user
- [ ] Filter: chỉ trả về public posts nếu không phải owner
- [ ] Include: author, comments count, ratings average
- [ ] Pagination: page, limit
- [ ] Sort: createdAt desc

### Task 4.5: Tạo API POST /api/users/[id]/posts
**File**: `src/app/api/users/[id]/posts/route.ts`

**Chức năng**:
- [ ] Tạo post mới
- [ ] Permission: chỉ owner mới được tạo post
- [ ] Validation: title required, content required
- [ ] isPublic: default true
- [ ] Audit log

### Task 4.6: Tạo API PATCH /api/users/[id]/posts/[postId]
**File**: `src/app/api/users/[id]/posts/[postId]/route.ts` (new)

**Chức năng**:
- [ ] Cập nhật post
- [ ] Permission: chỉ author mới được update
- [ ] Validation: title, content
- [ ] Có thể update isPublic
- [ ] Audit log

### Task 4.7: Tạo API DELETE /api/users/[id]/posts/[postId]
**File**: `src/app/api/users/[id]/posts/[postId]/route.ts`

**Chức năng**:
- [ ] Xóa post
- [ ] Permission: chỉ author mới được xóa
- [ ] Cascade delete: comments và ratings
- [ ] Audit log

### Task 4.8: Tạo component PostCard
**File**: `src/components/posts/post-card.tsx` (new)

**Chức năng**:
- [ ] Hiển thị: title, content preview (truncate), author, date
- [ ] Badge: Public/Private
- [ ] Stats: số comments, rating average
- [ ] Link đến post detail
- [ ] Actions: Edit, Delete (chỉ hiện với author)

### Task 4.9: Tạo component CreatePostForm
**File**: `src/components/posts/create-post-form.tsx` (new)

**Chức năng**:
- [ ] Form: title, content (textarea), isPublic (checkbox)
- [ ] Rich text editor (optional - markdown hoặc WYSIWYG)
- [ ] Preview mode
- [ ] Validation và error handling
- [ ] Loading state

### Task 4.10: Tạo component PostDetail
**File**: `src/app/posts/[postId]/page.tsx` (new)

**Chức năng**:
- [ ] Hiển thị full content của post
- [ ] Author info và date
- [ ] Rating stars (average và allow rate)
- [ ] Comments section
- [ ] Permission check: private posts chỉ author xem được

### Task 4.11: Tạo API POST /api/posts/[postId]/comments
**File**: `src/app/api/posts/[postId]/comments/route.ts` (new)

**Chức năng**:
- [ ] Thêm comment vào post
- [ ] Permission: phải đăng nhập, post phải public hoặc user là author
- [ ] Validation: content required
- [ ] Return comment với author info

### Task 4.12: Tạo API DELETE /api/comments/[commentId]
**File**: `src/app/api/comments/[commentId]/route.ts` (new)

**Chức năng**:
- [ ] Xóa comment
- [ ] Permission: chỉ comment author hoặc post owner mới được xóa
- [ ] Audit log

### Task 4.13: Tạo component CommentList
**File**: `src/components/posts/comment-list.tsx` (new)

**Chức năng**:
- [ ] Hiển thị danh sách comments
- [ ] Mỗi comment: author avatar, name, content, date
- [ ] Delete button (chỉ hiện với author hoặc post owner)
- [ ] Pagination hoặc "Load more"

### Task 4.14: Tạo component CommentForm
**File**: `src/components/posts/comment-form.tsx` (new)

**Chức năng**:
- [ ] Textarea để nhập comment
- [ ] Button "Gửi"
- [ ] Validation: content required
- [ ] Loading state
- [ ] Success: clear form và refresh comments

### Task 4.15: Tạo API POST /api/posts/[postId]/ratings
**File**: `src/app/api/posts/[postId]/ratings/route.ts` (new)

**Chức năng**:
- [ ] Thêm hoặc update rating (1-5 sao)
- [ ] Permission: phải đăng nhập, post phải public hoặc user là author
- [ ] Unique constraint: mỗi user chỉ rate 1 lần (update nếu đã rate)
- [ ] Return average rating

### Task 4.16: Tạo component RatingStars
**File**: `src/components/posts/rating-stars.tsx` (new)

**Chức năng**:
- [ ] Hiển thị stars (1-5)
- [ ] Hover để preview rating
- [ ] Click để submit rating
- [ ] Hiển thị average rating (read-only mode)
- [ ] Disabled state nếu đã rate

### Task 4.17: Permission check
**Files**: Tất cả API routes và components

**Chức năng**:
- [ ] Chỉ author mới được edit/delete post của mình
- [ ] Private posts chỉ author xem được
- [ ] Public posts ai cũng xem được (sau khi đăng nhập)
- [ ] Comments: chỉ author hoặc post owner xóa được

### Task 4.18: Filter posts theo isPublic
**File**: `src/app/api/users/[id]/posts/route.ts`

**Chức năng**:
- [ ] Nếu là owner: trả về tất cả posts (public + private)
- [ ] Nếu không phải owner: chỉ trả về public posts
- [ ] Query param: `?includePrivate=true` (chỉ owner mới dùng được)

### Task 4.19: Tích hợp posts vào profile page
**File**: `src/app/users/[id]/page.tsx`

**Chức năng**:
- [ ] Tab "Posts" trong profile page
- [ ] Hiển thị danh sách posts (PostCard)
- [ ] Button "Tạo post mới" (chỉ hiện với owner)
- [ ] Link đến post detail
- [ ] **Chỉ hiển thị tab Posts nếu `showPosts = true` trong privacy settings**

### Task 4.20: Pagination cho danh sách posts
**File**: `src/app/api/users/[id]/posts/route.ts` và components

**Chức năng**:
- [ ] Query params: `?page=1&limit=10`
- [ ] Return: data, total, page, limit, totalPages
- [ ] Component Pagination với page numbers
- [ ] "Load more" button (optional)

---

## Database Migration

### Migration 1: Add UserProfileSettings model ✅
**File**: `prisma/migrations/20251127190421_add_user_profile_settings/migration.sql`

**Steps**:
- [x] Tạo migration file
- [x] Chạy `npx prisma migrate dev --name add_user_profile_settings`
- [x] Update Prisma Client: `npx prisma generate`

### Migration 2: Add Post, Comment, Rating models
**File**: `prisma/migrations/[timestamp]_add_posts_comments_ratings/migration.sql`

**Steps**:
1. Tạo migration file
2. Chạy `npx prisma migrate dev --name add_posts_comments_ratings`
3. Update Prisma Client: `npx prisma generate`

---

## UI/UX Design

### Profile Page Layout:
```
┌─────────────────────────────────┐
│  [Avatar]  Name                 │
│           Email (nếu showEmail) │
│           Bio                   │
│  [Settings] (chỉ owner)        │
├─────────────────────────────────┤
│  Stats (theo privacy settings): │
│  [Projects] [Tables] [Files]    │
├─────────────────────────────────┤
│  Tabs: [Overview] [Posts] [Activity] │
│  ┌─────────────────────────────┐ │
│  │  Tab Content                │ │
│  │  (ẩn nếu không được phép)   │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Settings Profile Page Layout:
```
┌─────────────────────────────────┐
│  Settings > Profile             │
├─────────────────────────────────┤
│  Thông tin cá nhân:             │
│  - Name                         │
│  - Bio                          │
│  - Avatar (upload)               │
├─────────────────────────────────┤
│  Quyền riêng tư:                │
│  ☑ Hiển thị email               │
│  ☑ Hiển thị số projects         │
│  ☑ Hiển thị translation tables  │
│  ☑ Hiển thị PO files            │
│  ☑ Hiển thị số entries          │
│  ☑ Hiển thị biểu đồ hoạt động   │
│  ☑ Hiển thị thống kê ngôn ngữ   │
│  ☑ Hiển thị thống kê project    │
│  ☑ Hiển thị hoạt động gần đây   │
│  ☑ Hiển thị posts               │
├─────────────────────────────────┤
│  [Lưu] [Hủy]                    │
└─────────────────────────────────┘
```

### Post Card Design:
```
┌─────────────────────────────────┐
│  Title                          │
│  Content preview...             │
│  [Public/Private] [5⭐] [3💬]   │
│  By Author · 2 days ago         │
│  [Edit] [Delete]                │
└─────────────────────────────────┘
```

---

## Checklist tổng hợp

### Phase 1: Profile
- [ ] Route và layout
- [ ] API GET user profile
- [ ] Hiển thị thông tin cơ bản
- [ ] Thống kê tổng quan
- [ ] Link từ navbar

### Phase 2: Dashboard
- [ ] API stats
- [ ] Tính toán số liệu
- [ ] Tích hợp biểu đồ
- [ ] ActivityChart component
- [ ] TranslationStats component
- [ ] RecentActivity component

### Phase 3: Settings Profile
- [ ] Prisma schema UserProfileSettings
- [ ] API GET/PATCH /api/settings/profile
- [ ] Trang Settings Profile
- [ ] EditProfileForm component với privacy settings
- [ ] Upload avatar
- [ ] API upload avatar
- [ ] Validation
- [ ] Cập nhật API GET /api/users/[id] để respect privacy settings

### Phase 4: Posts
- [ ] Prisma schema (Post, Comment, Rating)
- [ ] API CRUD posts
- [ ] API comments
- [ ] API ratings
- [ ] PostCard component
- [ ] CreatePostForm component
- [ ] PostDetail page
- [ ] CommentList component
- [ ] CommentForm component
- [ ] RatingStars component
- [ ] Permission checks
- [ ] Filter public/private
- [ ] Tích hợp vào profile
- [ ] Pagination

---

## Timeline ước tính

- **Phase 1 (Profile)**: 4-6 giờ
- **Phase 2 (Dashboard)**: 6-8 giờ
- **Phase 3 (Settings Profile)**: 6-8 giờ (thêm privacy settings)
- **Phase 4 (Posts)**: 12-16 giờ

**Tổng**: ~28-38 giờ

---

## Lưu ý quan trọng

1. **Security & Privacy**:
   - Profile là PUBLIC - ai cũng xem được (sau khi đăng nhập)
   - Privacy settings cho phép user kiểm soát hiển thị gì
   - Chỉ owner mới được chỉnh sửa profile và settings
   - Private posts chỉ author xem được
   - Chỉ author mới được edit/delete posts

2. **Performance**:
   - Pagination cho posts và comments
   - Lazy load cho biểu đồ
   - Cache stats nếu cần

3. **User Experience**:
   - Loading states
   - Error handling
   - Success notifications
   - Optimistic updates cho comments/ratings

