# Project Management Feature

## Scope & Objectives
- Cho phép người dùng tạo nhiều workspace (project) để gom bảng dịch, tệp PO và members liên quan (`Project` là parent của `TranslationTable` và `PoFile` trong `prisma/schema.prisma`).
- Cung cấp RBAC theo project (Viewer → Editor → Reviewer → Admin) song song với system role (system `ADMIN`).
- Phủ UI & API đầy đủ cho vòng đời project: liệt kê, tạo, xem chi tiết, cập nhật, xóa, thêm/xóa/chỉnh sửa thành viên.
- Bảo đảm mọi thao tác nhạy cảm đều được audit (`project_created`, `member_added`, …) để truy vết.

## Domain Model Highlights
- `Project`: tên, mô tả, cờ `isPublic`, `createdBy`, timestamp, quan hệ 1-n với `ProjectMember`, `TranslationTable`, `PoFile`.
- `ProjectMember`: map `userId` ↔ `projectId` với trường `role`, `invitedBy`, timestamps, unique `(projectId, userId)` để tránh trùng.
- `SystemRole`: gán system-level `Role.ADMIN` cho một `User` (ngoài project scope).
- `Role` enum dùng chung cho system role & project role, hierarchy được map ở `src/lib/permissions.ts`.

## Authentication & RBAC
- `src/lib/middleware/auth.ts` lấy session từ cookie `session-token`, attach danh sách `projectRoles` của user. Hàm `requireAuth()` dùng ở toàn bộ server components `/projects` và route handlers.
- `src/lib/middleware/rbac.ts` cung cấp helpers:
  - `requireSystemRole`, `requireProjectRole`, `requireAnyProjectRole`, `requirePermission`.
  - Combo helpers `requireAuthAndProjectRole`, `requireAuthAndSystemRole`, `requireAuthAndPermission` để tránh lặp logic.
- `ROLE_PERMISSIONS` định nghĩa quyền granular (`view_entries`, `manage_project_members`, …). `usePermission` + `PermissionGuard` phía client đọc `/api/auth/session` để kiểm soát UI.

## API Surface (Next.js Route Handlers)
| Method | Path | Mô tả & Guard chính |
| --- | --- | --- |
| GET | `/api/projects` | Liệt kê project user xem được; system ADMIN thấy tất cả, user thường thấy project họ là member + public. |
| POST | `/api/projects` | Tạo project mới, yêu cầu user đã verify email; creator tự thành ADMIN member. |
| GET | `/api/projects/:id` | Chi tiết project + counts + danh sách members; cho phép nếu là member, system ADMIN, hoặc project public. |
| PATCH | `/api/projects/:id` | Update `name`/`description`/`isPublic`; guard `requireAuthAndProjectRole(..., Role.ADMIN)`. |
| DELETE | `/api/projects/:id` | Xóa project + cascade dữ liệu con; guard ADMIN và viết audit log `project_deleted`. |
| GET | `/api/projects/:id/members` | Trả về danh sách members với thông tin user; public project cũng xem được. |
| POST | `/api/projects/:id/members` | Thêm thành viên bằng email; guard REVIEWER trở lên; validate email & user tồn tại; ghi `member_added`. |
| PATCH | `/api/projects/:id/members/:memberId` | Đổi role (ADMIN-only); ngăn đổi role của chính mình nếu là ADMIN duy nhất. |
| DELETE | `/api/projects/:id/members/:memberId` | Xóa member (ADMIN-only); không cho tự xóa nếu là ADMIN cuối. |

Tất cả endpoints sử dụng Prisma singleton, validate input (chiều dài tên ≤ 100 ký tự, mô tả ≤ 500, v.v.) và tạo audit log với IP/User-Agent từ `getClientIp()`/`getUserAgent()`.

## UI Delivery
- `/projects` (`src/app/projects/page.tsx` + `projects-list.tsx`): bảo vệ bằng `requireAuth`, render grid các project với badge role, counts, modal tạo nhanh.
- `/projects/[id]` (`project-detail.tsx`): gọi API để tải dữ liệu → 3 tabs (overview stats, member preview, settings). Tab Settings & action buttons (Edit/Delete) chỉ lộ khi user có `Role.ADMIN`.
- `/projects/[id]/members` (`members-management.tsx`): CRUD UI cho members, gồm modals Add/Edit, toast lỗi/thành công, badge email verified. Dùng fetch tới API members và refresh list sau thao tác.
- UI components tận dụng `lucide-react`, Tailwind, state `isLoading/isSubmitting` và hiển thị message rõ ràng khi bị forbid (403/404).

## Cross-Cutting Behaviors
- **Audit logging**: mỗi project/member action ghi log với `action`, `resourceType`, chi tiết trước/sau để phục vụ trang `/admin/audit-logs`.
- **PO Files & Translation Tables**: cả hai model có `projectId` optional, cho phép filter và enforce quyền. Ví dụ `src/app/api/po-files/route.ts` chỉ trả về files thuộc project user có quyền hoặc public; upload kiểm tra membership trước khi gắn `projectId`.
- **Permissions in UI**: `PermissionGuard` + `usePermission` đảm bảo các nút nhạy cảm (xóa project, quản lý thành viên) không lộ với người thiếu quyền. Role hierarchy áp dụng thống nhất giữa client và server thông qua `Role` enum & helper `hasRole`.
- **Email verification**: tạo project và upload file yêu cầu `user.emailVerified`, bảo vệ khỏi spam.

## Operational Notes
- Seed (`prisma/seed.ts`) tạo system admin mặc định và (nếu `CREATE_SAMPLE_PROJECT=true`) sinh sample project, tự gán admin làm member `Role.ADMIN`.
- Biến môi trường quan trọng: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CREATE_SAMPLE_PROJECT`, JWT secrets, `DATABASE_URL`.
- Migrated schema mới nhất nằm trong `prisma/migrations/20251127032823_add_auth_rbac`.

## Outstanding / Next Steps
- `docs-system/auth-integration-todo.md` vẫn liệt kê các trang (upload/files/translations) cần bổ sung guard `requireAuth()` + filter theo project membership. Khi triển khai, tái sử dụng helpers hiện có (`requireAuthAndPermission`, `hasProjectRole`) để thống nhất trải nghiệm.
- Cần bổ sung UI hiển thị selector project ở các luồng upload/tạo translation table khi user thuộc nhiều project (đã được đề cập trong TODO).
- Khi mở rộng vai trò hoặc permission mới, cập nhật `ROLE_PERMISSIONS` và các guard liên quan để tránh drift giữa server và client.


