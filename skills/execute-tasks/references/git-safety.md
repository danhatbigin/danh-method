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
