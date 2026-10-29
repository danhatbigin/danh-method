# Danh Method · quy tắc cho agent (bản portable)

Bản rút gọn của plugin `danh-method` cho agent không cài được plugin Claude (Codex, Antigravity/Gemini, AionUI/aionrs…). Đặt file này ở `process/` của repo spec và trỏ tới từ `AGENTS.override.md` / `GEMINI.md` / `CLAUDE.local.md` (không commit vào repo code). Chi tiết và mẫu đầy đủ nằm trong thư mục `skills/` của plugin.

Đọc kèm (bắt buộc nếu có): `process/operator-<tên>.md` (cách làm việc với người giao), `process/project.md` (repo, stack, token, lệnh, cổng).

## 1. Vai và giao tiếp

- Người giao việc thường là **người phụ trách sản phẩm (designer), không phải dev**: trả lời tiếng Việt, ngắn, theo những gì thấy trên màn hình; không đưa lệnh terminal; tự chạy và tự xử lý lỗi môi trường (Windows: npm qua `cmd`).
- Chữ trên UI bằng tiếng Anh (trừ khi project config nói khác).
- Câu hỏi phải tự đứng được: luồng nào, vấn đề gì, lựa chọn + hệ quả. Đủ ngữ cảnh thì làm, không hỏi vặt, không dừng giữa chừng không lý do.
- Thấy mâu thuẫn, lỗi, rủi ro (kể cả của mình) thì nói ngay.
- Không ghi tên người hay quy tắc riêng của người giao vào repo code; dùng vai trò.

## 2. Vòng đời & gate

Token được duyệt trên trang HTML token (G0, một lần đầu dự án) → ý tưởng → **tài liệu** (PRD / USER_FLOW / GUIDANCE / TASKS) → duyệt → **preview HTML** → duyệt (G1) → prompt hợp đồng + Q đã chốt (G2) → thi hành theo task → review chỉ đọc → nghiệm thu trên bản chạy thật → merge (owner, G3).

- Không code trước khi tài liệu được duyệt. Không code UI trước khi preview được duyệt.
- Duyệt xong chỉ làm đúng mục đã duyệt; không "tiện tay".
- Quyền: sản phẩm/UX = người phụ trách sản phẩm; kỹ thuật/merge = owner.

## 3. Nguồn sự thật khi lệch

Trạng thái người giao khai báo trong lượt này → prompt trong repo spec tại HEAD (prompt đổi thì bỏ bản cũ, đọc lại từ đầu) → PRD/TASKS đã duyệt → HANDOFF (cache, có thể cũ) → suy luận của agent (ghi là *giả định*).

## 4. Thi hành

1. Đọc theo thứ tự prompt quy định; `git status` / `log` trước khi sửa; giữ nguyên việc dở.
2. Làm đúng phạm vi khai báo: "chỉ TK02" thì dừng sau TK02; "chạy liên tục A → B" thì không dừng giữa chừng.
3. Task khảo sát (XX-00): không sửa code.
4. Mỗi task: `node .verify/verify.mjs --task-start` → **test đỏ trước** (sai quyền, conflict; dữ liệu nhạy cảm có test payload theo role) → code nhỏ nhất, tái dùng thư viện/token → `node .verify/verify.mjs` (kiểm tra duy nhất; FAIL → sửa 1 lần → vẫn FAIL thì dừng) → tick TASKS + 1 dòng có ngày → CHANGELOG repo spec → HANDOFF + log ngày → commit nhỏ English → push nhánh → báo 3–5 dòng.
5. Báo nguyên văn dòng `verify: …`. SKIPPED / NOT_CONFIGURED **không phải** đã test. Không tự chạy full suite / e2e / build / Playwright ngoài script; cần thì xin người giao chạy grant.

**Chỉ dừng khi:** việc không đảo ngược được; ngoài phạm vi PRD hoặc ảnh hưởng dữ liệu/quyền mà PRD không trả lời; mở rộng mô hình dữ liệu / đổi kiến trúc chưa duyệt; test cũ đỏ không sửa được; verify FAIL lần 2; sắp hết hạn mức (→ verify xanh, HANDOFF, commit rồi mới dừng). Không mở được trình duyệt → ghi "Chờ kiểm trình duyệt" vào HANDOFF và làm tiếp.

## 5. Git & môi trường

- Cấm: `git reset --hard`, `git stash`, `git clean -f`, `git checkout -- / .`, `git restore .`, force push, xoá nhánh, push `main` repo code, tự merge/đóng PR, rebase nhánh đã push.
- Sai thì `git revert` (commit mới). Kéo main bằng `git merge origin/main`.
- Mỗi agent một nhánh/worktree, một vùng sở hữu. PR draft ở push đầu; ghi "Depends on #n" và "Theo tài liệu: <spec>/features/<f>/PRD.md".
- Không đụng cổng/DB demo; server tự bật thì cổng được cấp, tắt khi xong, báo PID. Nghiệm thu trên DB bản sao.
- Code không chứa dữ liệu mẫu. Không commit dump, `.env`, file local của người dùng.
- File UTF-8, LF; không dùng PowerShell `Set-Content` / `Add-Content`.

## 6. Thiết kế

- Cấu trúc trước bề mặt: đúng việc → đúng cấu trúc → nhất quán → đẹp. Dashboard phải trả lời câu hỏi nghiệp vụ.
- Không custom style ngoài thư viện/token; không tự vẽ chart khi thư viện có; gradient/màu đúng cả light và dark.
- Đường vào ≤ 3 bước; task ≤ 3 bước (đếm riêng); một hành động chính mỗi điểm quyết định; 6×6; CTA là động từ; nút không có quyền vẫn bấm được và giải thích lý do.
- Trạng thái không chỉ dựa vào màu; trục trạng thái độc lập hiển thị độc lập; AA ≥ 4.5:1; không tràn ngang ở 1440 / 768 / 390, light + dark.
- Preview: HTML tĩnh mở double-click, dev bar (role, theme, trang, state, Proposals), dữ liệu hư cấu, ảnh 1440/768/390 × light/dark, DESIGN-NOTES có bảng E/T và câu hỏi.
- Token: dựng trang `design-system/tokens.html` bằng `render-token-page.mjs` của plugin danh-method (CSS token → HTML có kiểm AA light/dark) và xin duyệt trước prototype đầu tiên. Prototype chỉ dùng token đã duyệt.
- Công cụ: ui-ux-pro-max để gợi ý/sinh/soát token và tra cứu UX. Chưa cài thì **hỏi xin phép, nêu lý do** (gợi ý màu/font theo loại sản phẩm, sinh token light/dark, soát màu viết cứng; MIT, chạy local) rồi mới chạy `npm i -g ui-ux-pro-max-cli` + `uipro init --ai <codex|antigravity>`; bị từ chối thì làm thủ công. **Không Superdesign; không ponytail cho design.**

## 7. Review & báo cáo

- Reviewer **không sửa code**, không checkout/commit/merge; đọc bằng `git diff`/`git show`.
- Truy nguyên theo cơ chế: "có phải do X?" → "X xử lý thế nào, vì sao gây Z?" → "chuẩn tham chiếu làm X thế nào?".
- Báo cáo dạng bảng **issue → nguyên nhân → kết quả → giải pháp**; luôn có mục **Bỏ qua** và **Rủi ro**.
- Nghiệm thu: Đạt / Chưa đạt / Không kiểm được (vì sao). Không bịa PASS.

## 8. Mẫu HANDOFF (đầu `docs/log/HANDOFF.md`)

```
## Trạng thái · <Feature>
- Cập nhật lúc: <dd/mm/yyyy hh:mm UTC+7> bởi <agent>
- Prompt đang chạy: <spec>/prompts/<file>.md
- Nhánh / worktree: <…> · HEAD <…>
- Tiến độ: X-00 [x] X-01 [ ] …
- Task đang làm: <mã> — <mô tả>
- Chưa commit: <file | không>
- Bước tiếp theo: <1–2 dòng>
- Kiểm tra gần nhất: verify: <nguyên văn>
- Chờ kiểm trình duyệt: <… | không>
- Giả định khi làm: <…>
- Bỏ qua: <…> · Rủi ro / lỗi còn lại: <…>
- Đang giữ: <khoá, cổng, tiến trình | không>
```
