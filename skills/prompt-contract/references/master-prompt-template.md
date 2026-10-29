# Mẫu master prompt (một agent làm trọn feature)

Mẫu gốc: `prompts/2026-10-20-admin-workspace-v2.md` (MiVida). Dán nguyên khối trong code fence vào agent.

````markdown
# Master prompt: <Feature vX> — <tóm tắt> (<MÃ>-00 → <MÃ>-nn)

Dùng cho <Claude Code / Codex / Antigravity>. Dán nguyên khối dưới đây vào agent đang mở tại `<repo code>`.
Agent không có file quy tắc cục bộ thì mọi quy tắc cần thiết đã ghi trong prompt này.

```
Bạn là agent thực hiện tính năng "<Feature>" cho <Sản phẩm>.
Repo code: <đường dẫn> (nhánh `<nhánh>`). Repo tài liệu: <đường dẫn> (nhánh `main`).
Người dùng: <vai>, đọc báo cáo bằng tiếng Việt, ngắn (3–5 dòng sau mỗi task), mô tả hành vi trên màn hình lẫn thay đổi kỹ thuật. Không đưa lệnh terminal cho họ chạy.

ĐỌC TRƯỚC (theo thứ tự):
1. <spec>/process/operator-<tên>.md và process/project.md
2. <code>/AGENTS.md và docs/<working-rules>
3. <code>/docs/log/HANDOFF.md
4. <spec>/features/<f>/PRD.md (quyết định, AC)
5. USER_FLOW.md · 6. GUIDANCE.md · 7. TASKS.md · 8. REVIEW.md / DESIGN-NOTES.md
9. Prototype đã duyệt: <spec>/features/<f>/prototype/<f>.html

TRẠNG THÁI THỰC TẾ (tin phần này hơn HANDOFF nếu lệch):
- <task nào xong, commit nào; file nào đang dở CHƯA COMMIT — liệt kê>

GATE & QUYẾT ĐỊNH ĐÃ CHỐT:
- G1 (Design): <mở — preview v… duyệt ngày …>
- G2 (Q01–Qn):
  - Q01 (<chủ đề>): <quyết định cụ thể, giá trị, hành vi biên>
  - …
- G3 (Engineering & nhánh): <nhánh, migration nối tiếp, bảo toàn dữ liệu>

VIỆC 0 — CHỐT VIỆC DỞ (1 lần trước khi code):
1. `git status` ở cả hai repo. Không xoá / stash / reset việc phiên trước đã làm.
2. <commit tài liệu/ảnh của task trước với message …>

THỨ TỰ TRIỂN KHAI (không nhảy cóc):
- <MÃ>-01: …
- …
- <MÃ>-nn: Kiểm thử hồi quy + kịch bản trình duyệt E…/T… ở 1440/768/390 light/dark; cập nhật REVIEW, TASKS, CHANGELOG, HANDOFF.

CÁCH LÀM MỖI TASK:
1. Đọc mục task trong TASKS, PRD, GUIDANCE; grep toàn bộ callers bị ảnh hưởng (cả test, demo loader).
2. Viết test trước cho logic/domain/security mới (RED → GREEN), gồm nhánh lỗi, conflict, sai quyền.
3. Thay đổi nhỏ nhất đủ yêu cầu; tái dùng component/token của thư viện UI chung.
4. Kiểm tra: `node .verify/verify.mjs --task-start` đầu task; `node .verify/verify.mjs` cuối task. Báo nguyên văn dòng `verify: …`.
5. Tick `[x]` trong TASKS.md kèm 1 dòng kết quả có ngày; thêm dòng CHANGELOG; commit + push repo spec.
6. Cập nhật HANDOFF + log ngày trong repo code; commit (English `feat:`/`fix:`), push nhánh.
7. Báo 3–5 dòng tiếng Việt và chuyển ngay sang task tiếp theo.

CHẠY LIÊN TỤC tới hết <MÃ>-nn. CHỈ DỪNG KHI:
- việc không thể đảo ngược; ngoài phạm vi PRD; ảnh hưởng dữ liệu/quyền mà PRD không trả lời;
- test cũ đỏ không sửa được trong task; verify FAIL sau 1 lần sửa;
- sắp hết hạn mức: dừng viết dở, verify xanh, cập nhật HANDOFF + log, commit rồi mới dừng.
Không mở được trình duyệt: ghi kịch bản chưa kiểm vào HANDOFF mục "Chờ kiểm trình duyệt" rồi làm tiếp.

QUY TẮC CỨNG:
- Chỉ làm trên nhánh `<nhánh>`. Không commit/push `main` repo code, không force push, không xoá nhánh, không tự merge PR.
- Không reset --hard / stash / clean / checkout đè việc dở. Sai thì `git revert` bằng commit mới.
- Không đưa dữ liệu mẫu của prototype vào code hay migration.
- Không commit dump, `.env`, `CLAUDE.local.md`, `AGENTS.override.md`, `.verify/` (local).
- Không ghi tên riêng người dùng vào code/commit/log; dùng vai trò.
- Không đụng cổng/DB demo <…>. Ghi file UTF-8, LF.

MẪU HANDOFF (luôn giữ ở đầu docs/log/HANDOFF.md, giữ lịch sử bên dưới):
<chép references/handoff-template.md>
```

## Lệnh resume ngắn (dán khi đổi agent / mở phiên mới)

```
Tiếp tục prompt <spec>/prompts/<file>.md. Đọc <code>/docs/log/HANDOFF.md trước, kiểm tra git status ở cả hai repo, rồi làm tiếp đúng "Task đang làm" và "Bước tiếp theo" tới hết <MÃ>-nn. Giữ mọi quy tắc cứng; không reset hay stash thay đổi chưa commit.
```
````
