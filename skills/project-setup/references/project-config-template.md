# Mẫu project config — `process/project.md`

Một file, mọi prompt và subagent trỏ về đây thay vì chép lại. Cập nhật khi stack/cổng/lệnh đổi; thêm dòng CHANGELOG.

```markdown
# <Sản phẩm> · Project config
Cập nhật: <ngày> · bởi <vai>

## Repo
| Repo | Đường dẫn | Nhánh chính | Ai push |
|---|---|---|---|
| Spec | D:\Projects\<tên>-spec | main | người phụ trách sản phẩm + agent của họ, push thẳng |
| Code | D:\Projects\<tên>-portal | main | chỉ qua PR, owner merge |
| Worktree | D:\Projects\<tên>-portal-<feature> | <feature> | agent thi hành của feature đó |

## Stack
- App: <Next.js App Router / Nuxt / …> · Monorepo: <pnpm workspaces / …>
- DB: <Postgres + Drizzle / …> · Migration: <lệnh generate>, không sửa migration cũ
- Test: <node:test / vitest / …> · Browser: Playwright (đã cài)
- OS máy làm: <Windows: chạy npm qua cmd> · Ghi file UTF-8, LF; không dùng PowerShell Set-Content/Add-Content

## Design system
- Nền: <BigIn DS / NuxtUI / shadcn + token riêng>
- Token (chỉ đọc khi design): <đường dẫn portal-tokens.css, globals.css> — theo thứ tự import
- Trang token đã duyệt (G0): `design-system/tokens.html` · v<n> · <ngày> · dựng lại: `node <danh-method>/skills/design-tokens/scripts/render-token-page.mjs --css … --out design-system/tokens.html`
- ui-ux-pro-max: <có / không — người dùng chọn bỏ qua ngày …>
- Font: heading <…>, body <…> · Icon: <bộ icon, stroke khi nghỉ / solid khi active>
- Luật riêng đã chốt: <ví dụ MiVida: No Border — tách lớp bằng nền/khoảng cách/bóng; radius 28/22; một màu đỏ cho red flag/lỗi/xoá>
- Pattern mẫu đã duyệt (feature tham chiếu): <features/medication/prototype/…>

## Kiểm tra
- Verify-kit: `node .verify/verify.mjs --task-start` → `node .verify/verify.mjs`; PR gate `--pr`.
- Breakpoint kiểm UI: 1440 / 768 / 390 (+1024/320 khi nghiệm thu) · Theme: light + dark
- Khoá test dùng chung: <đường dẫn .lock> (chờ nếu người khác giữ)

## Môi trường
- Cổng demo đang chạy, KHÔNG đụng: <3001, 3002>
- Cổng được cấp cho agent: <3061, 3062> (bật khi cần, tắt khi xong, báo PID)
- DB: không ghi vào DB demo; nghiệm thu trên DB bản sao `<tên>_accept_<ngày>`
- Dữ liệu ngoài repo: <D:\Projects\_<tên>-data> (dump có ngày trong tên, không commit)

## Quyền
- Người phụ trách sản phẩm: <vai>, quyết sản phẩm/UX.
- Owner kỹ thuật: <vai>, review + merge PR.
- Roles trong sản phẩm (để test quyền): <Manager, Consultant, MD, Coach…>

## Ngôn ngữ
- UI: English · Trao đổi: tiếng Việt · Commit: English (`feat:`, `fix:`, `docs:`)
```
