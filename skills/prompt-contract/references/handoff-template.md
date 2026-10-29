# Mẫu HANDOFF

Luôn giữ khối này ở **đầu** `docs/log/HANDOFF.md` của repo code (hoặc `features/<f>/HANDOFF.md` nếu project để ở spec); lịch sử giữ nguyên bên dưới. HANDOFF là **cache** cho phiên sau, không phải chân lý — người điều phối có thể ghi đè bằng "trạng thái thực tế" trong prompt.

```markdown
## Trạng thái · <Feature>
- Cập nhật lúc: <dd/mm/yyyy hh:mm (UTC+7)> bởi <tên agent / subagent>
- Prompt đang chạy: <spec>/prompts/<file>.md
- Nhánh / worktree: <nhánh> · <đường dẫn> · HEAD <mã>
- Tiến độ: X-00 [x] X-01 [x] X-02 [ ] …
- Task đang làm: <mã> — <mô tả ngắn>
- Chưa commit: <danh sách file hoặc "không">
- Bước tiếp theo: <1–2 dòng rõ ràng>
- Kiểm tra gần nhất: verify: tier N · STATUS · … · security: STATUS (nguyên văn)
- Chờ kiểm trình duyệt: <kịch bản chưa kiểm hoặc "không">
- Giả định khi làm: <Q… theo prompt, hoặc giả định mới chưa duyệt>
- Bỏ qua: <việc cố ý chưa làm + lý do>
- Rủi ro / lỗi còn lại: <danh sách hoặc "không">
- Đang giữ: <khoá test dùng chung, cổng, tiến trình — hoặc "không">
```

Log ngày: `docs/log/<yyyy-mm-dd>.md` (UTC+7) — mỗi task một mục: mã task, commit, việc đã làm, dòng `verify:`, Đạt / Khác / UNVERIFIED.
