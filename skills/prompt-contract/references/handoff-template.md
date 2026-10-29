# Mẫu HANDOFF

Luôn giữ khối này ở **đầu** `docs/log/HANDOFF.md` của repo code (hoặc `features/<f>/HANDOFF.md` nếu project để ở spec); lịch sử giữ nguyên bên dưới. HANDOFF là **cache** cho phiên sau, không phải chân lý — dữ kiện Git/code thật thắng snapshot trong prompt và HANDOFF; quyết định/phạm vi theo người phụ trách → prompt hiện hành → PRD (D3).

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

## Trường v0.3 cần bổ sung

- Mốc tiếp nhận để verify `--base`: <hash>; không đổi để bỏ việc dở.
- FAIL: <tên test + assertion + message nguyên văn>; loại, bằng chứng và lượt còn lại.
- Bắt tay: `<TASK> pushed <hash>`; UI đã fetch+merge nhánh logic @ <hash> trước task nào.
- UI cần: <mã C0, caller, đã kiểm API nào, thiếu thật gì>.
- Merge-ready: --pr / Stage 6 / AC / blocker; vòng owner G3 đang ở đâu.
