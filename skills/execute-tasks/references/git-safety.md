# Git & môi trường an toàn

## Cấm (hook của plugin chặn cơ học với Claude Code)

| Lệnh | Vì sao | Làm thay |
|---|---|---|
| `git reset --hard`, `git reset --merge/--keep` | Mất việc dở không hồi phục | `git revert <commit>` |
| `git stash` (mọi dạng trừ `list`/`show`) | Việc dở "biến mất", agent sau không thấy | Commit WIP rõ tên trên nhánh của mình, hoặc để nguyên và ghi HANDOFF |
| `git clean -f/-fd/-x` | Xoá file chưa track (ảnh, prototype, log) | Liệt kê và hỏi |
| `git checkout -- <path>` / `git checkout .` / `git restore .` | Đè thay đổi chưa commit | Hỏi; hoàn tác đúng hunk của mình |
| `git push --force` / `-f` / `--force-with-lease` | Ghi đè lịch sử người khác | Merge, commit mới |
| `git branch -D`, `git push origin --delete` | Xoá nhánh | Owner xử lý |
| Commit/push thẳng `main` của repo code | Bỏ qua review | PR draft từ nhánh feature |
| `git rebase` lên main khi nhánh đã push | Viết lại lịch sử đã chia sẻ | `git merge origin/main` |

## Nhánh & worktree

- Mỗi feature một nhánh; mỗi agent/subagent thi hành một worktree riêng (`<repo>-<feature>`), một vùng sở hữu.
- Tạo nhánh từ `origin/main` mới nhất khi `git status` sạch. Phụ thuộc nhánh chưa merge → chỉ khi prompt chốt; PR ghi "Depends on #n".
- Chép file local không nằm trong git sang worktree (`.verify/`, `CLAUDE.local.md`, `AGENTS.override.md`, `.env`); không commit chúng.
- Merge theo thứ tự đã định; agent chủ nhánh nhận báo "Sẵn sàng để <X> merge".
- Commit theo nhóm lỗi; lỗi nghiêm trọng nhất tách commit riêng.
- PR: draft ở push đầu; ready khi xong toàn bộ task + PR gate (`verify --pr`) do người có quyền chạy.

## Môi trường dùng chung

- Không đụng cổng demo đang chạy; agent bật server thì dùng cổng được cấp, tắt khi xong, báo PID.
- Không ghi vào DB demo; muốn nạp dữ liệu thì hỏi trước; nghiệm thu trên DB bản sao.
- Khoá test dùng chung (`*.lock`): chờ nếu người khác giữ; ghi tên khi giữ; xoá khi xong.
- Windows: npm qua `cmd` nếu PowerShell chặn `npm.ps1`; không ghi file bằng `Set-Content`/`Add-Content` (sai encoding); UTF-8 + LF.
- Không commit: dump, `.env`, secret, file local của người dùng, thư mục `.superpowers/`.

## Bổ sung v0.3 (A5.6, A6.5; ưu tiên thấp §2)

- Stage đúng dòng của mình, xem staged diff; không bulk commit repo spec.
- Nhánh xếp chồng ghi Depends on; khi cha đổi, merge cha vào con và verify lại; không đổi base che FAIL.
- Trước PR kiểm `git merge-tree --write-tree <nhánh mình> <nhánh song song>` với mọi nhánh liên quan.
- D10: ngoại lệ dọn nhánh **local** chỉ khi prompt giao rõ. Lưu tag `archive/<tên>` trỏ đúng tip; xác minh tag, việc chưa push và nhánh không còn dùng trước xoá an toàn. Không force-delete/remote delete; hook vẫn chặn `-D`/remote delete. Prompt cấm xoá thì không dùng ngoại lệ.
- Gom WIP bằng `reset --soft` chỉ cho commit chưa push và prompt cho phép rõ; mặc định giữ commit nhỏ/revert. Không viết lại lịch sử đã chia sẻ.
- Windows: kiểm nháy kép qua Docker/shell; UTF-8 không BOM + LF; tránh `NUL` lẫn log PowerShell, redirection đúng shell; không secret trong lệnh/log.
- Khoá test có chủ/PID/thời điểm; chờ khi chủ còn hoạt động. Khoá bỏ quên phải xác minh chủ đã dừng rồi xử lý trong quyền được giao; không kill PID lạ.
- Dọn server/worktree đã xong theo prompt; xác minh cổng chạy bản latest; DB tạm phải xác minh tên và chủ trước dọn.
