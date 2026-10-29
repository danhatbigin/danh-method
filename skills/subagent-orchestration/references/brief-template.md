# Mẫu brief cho subagent

```
Vai: <design-prototyper | logic-implementer | ui-implementer | code-reviewer | acceptance-tester> cho feature <F> của <Sản phẩm>.
Người giao: agent điều phối. Báo cáo trả về cho agent điều phối (không phải người dùng cuối) — ngắn, có bằng chứng.

ĐỌC TRƯỚC (theo thứ tự, đường dẫn tuyệt đối):
1. <spec>/process/project.md (+ operator profile nếu cần cách báo)
2. <PRD / USER_FLOW / GUIDANCE / TASKS mục …>
3. <prompt hợp đồng đầy đủ nếu có: <spec>/prompts/<file>.md>

TRẠNG THÁI THẬT: nhánh <…>, HEAD <…>, đã xong <…>, đang dở <…>.

PHẠM VI: chỉ <task/mục>. Không làm: <…>.
VÙNG SỞ HỮU: chỉ ghi trong <worktree / thư mục>. Không đụng: <vùng subagent khác>, <repo chính>, <cổng/DB demo>.

QUY TẮC CỨNG: <dẫn từ prompt hợp đồng: TDD, verify tier, git an toàn, không dữ liệu mẫu trong code, UTF-8 LF…>

DỪNG KHI: <điều kiện dừng>. Ngoài các điều này thì làm tiếp, không hỏi.

TRẢ VỀ (đúng định dạng):
- Kết quả: <xong / dừng ở …, vì …>
- Commit: <mã — mô tả> (hoặc "không commit" với design/reviewer)
- verify: <dòng nguyên văn> (nếu có)
- File chính đã đổi / tạo
- Bỏ qua: … · Rủi ro: … · Giả định: …
- Cần quyết: … (nêu luồng + vấn đề + lựa chọn)
```

## Brief reviewer (bổ sung)

```
Bạn là reviewer, KHÔNG sửa code, KHÔNG checkout/commit/merge. Đọc bằng git: `git diff <base>..<head>`, `git show <commit>`.
Soi theo: PRD (AC, quyền), GUIDANCE (bẫy), review focus trong TASKS, bảo mật (dữ liệu nhạy cảm xuống client, kiểm quyền phía server), test có chứng minh hành vi không, UI có lệch preview/token không.
Trả về bảng: # | Mức (Critical/Major/Minor) | Issue | Nguyên nhân (file:dòng) | Kết quả / tái hiện | Giải pháp. Cuối cùng: "Sẵn sàng để <X> merge" hoặc "Chưa sẵn sàng — cần sửa #…".
```

## B3/B4 — hợp đồng logic → UI và bắt tay

```markdown
Hợp đồng type/interface: <file, commit đã có trước chia nhánh>.
Glob logic sở hữu: <…>; glob UI sở hữu: <…>; file chung giao ai, tuần tự khi chồng.
Mốc nhận/base: <hash>; verify --base <hash> khi tiếp quản.
Logic báo HANDOFF: <TASK> pushed <hash>.
UI trước mỗi task: fetch+merge <nhánh logic>, ghi hash đã nhận; không đợi toàn bộ logic.
| C0 | Màn/caller đã đọc | Dữ liệu cần | API/type đã có | Thiếu thật | Cách bổ sung + chủ |
|---|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> | <…> |
UI cần: <C0 + bằng chứng>; không tự tạo API trùng.
Tích hợp: logic chịu db/mock-data, UI chịu apps/ui theo glob; kiểm hunk, không chọn mù ours/theirs.
Một writer/worktree khi tiếp quản; không tự mở subagent; không kill PID lạ.
```
