---
name: execute-tasks
description: Executes Danh Method tasks safely — one task or a declared batch from TASKS.md, fixed reading order, survey-first, TDD (red → green, role-based payload tests for sensitive data), verification by risk tier with the bundled verify-kit, safe git (no reset/stash/clean, revert by new commit), HANDOFF and daily log updates, and short reports. Use when an agent is told "làm TK02", "chạy liên tục X → Y", "thi hành theo prompt", "tiếp tục theo HANDOFF", or is implementing any task from a danh-method prompt.
---

# Thi hành task

## 1. Khởi động phiên (luôn làm, theo thứ tự)

1. Đọc theo thứ tự prompt quy định (mặc định: operator profile → AGENTS.md/CLAUDE.md + working-rules → HANDOFF → prompt → PRD → TASKS → GUIDANCE). Không đọc ngẫu nhiên.
2. `git status`, `git log -5`, nhánh hiện tại, so với "trạng thái thực tế" trong prompt. Lệch → tin prompt; lệch nghiêm trọng (HEAD lạ, file lạ không phải của mình) → dừng và báo.
3. Đúng nhánh của feature; kéo `origin/main` vào bằng `git merge` khi luật nhánh yêu cầu (không rebase).
4. Có việc dở chưa commit → **giữ nguyên**, coi là việc của phiên trước.

## 2. Phạm vi

- Làm **đúng phạm vi người giao khai báo trong lượt này**: "chỉ TK02" thì dừng sau TK02; "chạy liên tục CD02 → CD08" thì không dừng giữa chừng.
- Không "tiện tay" sửa ngoài phạm vi. Thấy vấn đề ngoài phạm vi → ghi vào HANDOFF mục Rủi ro, báo trong báo cáo.
- Task khảo sát (XX-00): **không sửa code**, chỉ ghi kết quả.

## 3. Mỗi task

1. Đọc mục task trong TASKS/PRD/GUIDANCE; grep mọi caller bị ảnh hưởng (kể cả test, demo loader).
2. `node .verify/verify.mjs --task-start`.
3. **TDD:** test đỏ trước cho mọi thay đổi hành vi (gồm nhánh lỗi, conflict, sai quyền). Dữ liệu nhạy cảm (sức khoẻ, tài chính, auth): bắt buộc test payload theo role chứng minh dữ liệu không xuống client khi không có quyền.
4. Thay đổi nhỏ nhất đủ yêu cầu; tái dùng component/token/thư viện chung; không custom style; không dữ liệu mẫu trong code.
5. `node .verify/verify.mjs` — **kiểm tra duy nhất** được chạy. FAIL → sửa tối đa 1 lần → vẫn FAIL thì dừng và báo. Không tự chạy full suite, e2e, build, Playwright ngoài script; cần thì xin người giao chạy grant. Chi tiết: `assets/verify-kit/POLICY.md`.
6. Tick `[x]` trong TASKS + 1 dòng kết quả có ngày; dòng CHANGELOG repo spec; commit + push repo spec (nếu là người được phép).
7. Cập nhật HANDOFF (mẫu ở skill `prompt-contract`) + log ngày; commit nhỏ, message English (`feat:`, `fix:`, `docs:`); push nhánh feature.
8. Báo 3–5 dòng (mục 6), rồi sang task tiếp nếu đang batch.

Project chưa cài verify-kit: dùng lệnh kiểm tra trong `process/project.md` theo cùng tinh thần tier (UI thuần → typecheck; logic → + test liên quan; rủi ro cao → + kiểm có đích + bảo mật), và ghi rõ trong báo cáo.

## 4. Điều kiện dừng (ngoài các điều này thì không dừng hỏi)

- Việc không đảo ngược được (xoá dữ liệu, migration phá huỷ, gửi thứ ra ngoài).
- Ngoài phạm vi PRD; hoặc ảnh hưởng dữ liệu/quyền mà PRD không trả lời.
- Mở rộng mô hình dữ liệu hay đổi kiến trúc chưa được duyệt.
- Test cũ đỏ không sửa được trong task; verify FAIL lần 2.
- Sắp hết hạn mức / phiên sắp đóng → dừng viết dở, verify xanh, cập nhật HANDOFF + log, commit, rồi mới dừng.
- Không mở được trình duyệt → ghi kịch bản vào HANDOFF "Chờ kiểm trình duyệt", **làm tiếp**.

Quyết định kỹ thuật thuần (tên biến, cấu trúc file, thư viện nội bộ đã có): tự chọn phương án an toàn, ghi "giả định" vào HANDOFF, đi tiếp.

## 5. Git & môi trường

Theo `references/git-safety.md`. Tóm tắt: không `reset --hard` / `stash` / `clean` / `checkout` đè việc dở; sai thì `git revert` (commit mới); không force push, không push `main` repo code, không tự merge/đóng PR; mỗi agent một nhánh/worktree; không đụng cổng/DB demo; khoá test dùng chung thì chờ; UTF-8 + LF. Plugin có hook chặn các lệnh git phá huỷ.

## 6. Báo cáo

Sau mỗi task (3–5 dòng, tiếng Việt, theo màn hình trước, kỹ thuật sau):

```
<Mã task> xong — <người dùng giờ thấy/làm được gì>.
Đổi: <file/vùng chính> · commit <mã>.
verify: <dòng nguyên văn>
Bỏ qua: <…> · Rủi ro: <…>   (ghi "không" nếu không có)
Tiếp: <task tiếp / cần anh quyết gì>
```

Không viết "đã test" khi verify là SKIPPED / NOT_CONFIGURED. Không bịa test để lấp chỗ trống. Không giải thích lại việc đã xong.
