# B8 — TEAM-BOARD cho nhiều agent độc lập

```markdown
# <Feature> · TEAM-BOARD · <ngày>
Nguồn dữ kiện: Git/code thật; quyết định: người phụ trách → prompt hiện hành → PRD.
Điều phối: <vai/model>; một tác vụ nặng đang chạy: <tác vụ/chủ>.
| Agent / vai | Nhánh/worktree | Task | Glob sở hữu | Base/HEAD đã kiểm | Chờ ai | Bằng chứng pushed | Trạng thái |
|---|---|---|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> | <…> | <…> | <…> |
## Hợp đồng chung
Type/interface @ <commit>; C0; nhịp fetch+merge; file chung giao một writer.
## Tích hợp
Thứ tự merge; kết quả merge-tree với mỗi nhánh song song; verify sau merge.
## Tài nguyên
| Cổng/PID/lock/DB tạm | Chủ | Phạm vi | Khi nào dọn |
|---|---|---|---|
| <…> | <…> | <…> | <…> |
## Bàn giao điều phối
Prompt/base/ngân sách; đã làm/còn làm; blocker có bằng chứng; bước kế tiếp.
```
