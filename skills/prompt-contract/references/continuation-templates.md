# B1 — bàn giao tổng / tiếp quản (A4.5)

```markdown
# <Feature> takeover · <ngày>
Lưu: docs/engineering/<feature>-takeover-<ngày>.md
Đọc và làm theo <prompt tuyệt đối>.
## Dữ kiện đã tự kiểm
Nhánh/worktree; HEAD nhận; origin; PR; status; việc dở theo file và chủ.
## Quyết định/phạm vi
Prompt @ commit; PRD @ commit; Q đã chốt; quyền thiếu; cấm sửa gì.
## Đã làm / còn làm
| Task | AC hiện hành | Commit | Bằng chứng | Bước tiếp |
|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> |
## Kiểm và ngân sách
verify --base <mốc tiếp nhận>; tên test/assertion/message nguyên văn; loại FAIL; lượt còn lại.
## Tài nguyên
Một writer; verifier chỉ đọc; PID/cổng/lock/DB tạm và ai dọn.
## Điều kiện kết thúc
Đầu ra cụ thể; không placeholder; gate; commit/push; bàn giao; Bỏ qua/Rủi ro.
## Resume
Đọc file này, kiểm Git thật, tiếp tục phần còn lại, giữ base và ngân sách.
```

# B2 — hai lượt A/B và delta (A4.1)

```markdown
Prompt gốc: <đường dẫn> @ <commit>; PRD hiện hành: <đường dẫn> @ <commit>.
| Mục gốc | Giữ / Thay / Bỏ | Nội dung và lý do |
|---|---|---|
| <…> | <…> | <…> |
Bộ mã task duy nhất: <A-00…>; ánh xạ mã cũ→mới, không reset lượt FAIL.
Lượt A: khảo sát/audit chỉ đọc → baseline + bằng chứng + Q gom một lượt.
Gate A→B: <người phụ trách cần chốt gì / đã cho dùng mặc định nào>.
Lượt B: chỉ sửa mục đã duyệt; test đỏ→xanh; AC từ PRD hiện hành.
Đầu ra/kết thúc: <file, kiểm, commit, push, bàn giao>; không dừng sau lập kế hoạch.
```
