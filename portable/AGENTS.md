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

Dữ kiện: Git/code thật → snapshot prompt → HANDOFF (cache); HEAD lạ thì dừng, lời “xong” phải tự kiểm. Quyết định/phạm vi: người phụ trách → prompt hiện hành tại HEAD → PRD/TASKS đã duyệt. Prompt đổi thì bỏ bản cũ, đọc lại; cập nhật PRD theo quyết định mới trước thi hành. Suy luận ghi là giả định (D3).

## 4. Thi hành

1. Đọc theo thứ tự prompt quy định; `git status` / `log` trước khi sửa; giữ nguyên việc dở.
2. Làm đúng phạm vi khai báo: "chỉ TK02" thì dừng sau TK02; "chạy liên tục A → B" thì không dừng giữa chừng.
3. Task khảo sát (XX-00): không sửa code.
4. Mỗi task: `node .verify/verify.mjs --task-start` → **test đỏ trước** (sai quyền, conflict; dữ liệu nhạy cảm có test payload theo role) → code nhỏ nhất, tái dùng thư viện/token → `node .verify/verify.mjs` (kiểm tra duy nhất; FAIL → phân loại trước; lỗi code tính lượt theo ngân sách, vẫn FAIL thì dừng) → tick TASKS + 1 dòng có ngày → CHANGELOG repo spec → HANDOFF + log ngày → commit nhỏ English → push nhánh → báo 3–5 dòng.
5. Báo nguyên văn dòng `verify: …`. SKIPPED / NOT_CONFIGURED **không phải** đã test. Không tự chạy full suite / e2e / build / Playwright ngoài script; cần thì xin người giao chạy grant.

**Chỉ dừng khi:** việc không đảo ngược được; ngoài phạm vi PRD hoặc ảnh hưởng dữ liệu/quyền mà PRD không trả lời; mở rộng mô hình dữ liệu / đổi kiến trúc chưa duyệt; PRD chưa trả lời; lỗi code còn FAIL sau ngân sách đã cấp; sắp hết hạn mức (→ verify xanh, HANDOFF, commit rồi mới dừng). Không mở được trình duyệt → ghi "Chờ kiểm trình duyệt" vào HANDOFF và làm tiếp.

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
- Preview: render từ component thật của DS, bundle offline mở double-click; provenance/hash nguồn + CSS đã compile, dev bar, test script, dữ liệu hư cấu. Có controls chỉnh token light/dark + export/import MD/JSON + reset snapshot. Agent design giao renderer/preview/DESIGN-NOTES; điều phối render, chạy test, chụp 1440/768/390 × light/dark và viết REVIEW Rn. SSR đơn thuần chưa chứng minh tương tác; không HTML mô phỏng component.
- Token: **trước tiên** chạy `check-ui-packages.mjs` để quét hiện trạng, **hỏi người dùng chọn bộ UI** (`shadcn/ui` | `HeroUI` | `both`) rồi kiểm `check-ui-packages.mjs --ui <chosen>`; gói đã chọn chưa cài thật trong project → DỪNG, hỏi xin phép cài, không sinh token/trang duyệt. Đã cài → dựng token playground (`scaffold-playground.mjs --ui <chosen>`, kiểu ui.shadcn.com/create: panel chỉnh + color picker bên trái, component thật shadcn / compound HeroUI bên phải, export CSS/JSON/MD) làm bằng chứng G0 và xin duyệt trước prototype đầu tiên. `render-token-page.mjs` chỉ là bảng tra phụ lục. Prototype chỉ dùng token đã duyệt.
- Công cụ: ui-ux-pro-max để gợi ý/sinh/soát token và tra cứu UX. Chưa cài thì **hỏi xin phép, nêu lý do** (gợi ý màu/font theo loại sản phẩm, sinh token light/dark, soát màu viết cứng; MIT, chạy local) rồi mới chạy `npm i -g ui-ux-pro-max-cli` + `uipro init --ai <codex|antigravity>`; bị từ chối thì làm thủ công.
- Superpowers (obra/superpowers): kỷ luật brainstorm → plan → TDD → debug → review → verify. Chưa có thì hỏi xin phép cùng lượt với ui-ux-pro-max (`check-superpowers.mjs`); từ chối thì ghi "không có Superpowers" trong báo cáo.

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

## 9. Bổ sung v0.3 (findings A1–A8/D3/D5–D10)

- Feature lõi trước màn tổng hợp; nghiên cứu hỏi hiện trạng chức năng trước. XX-00 chỉ ghi tên đã mở đọc; điều phối đối chiếu baseline trước task 01.
- Báo ≤3 đạt / ≤3 cần sửa / 1 quyết định, ưu tiên hình/số đo thật; gom câu hỏi từ đầu và làm phần độc lập khi chờ. Giao việc “Đọc và làm theo <prompt>”. Không dừng sau đọc/kế hoạch/merge, không xong khi còn placeholder; blocker mới có bằng chứng.
- FAIL: hỏng thừa kế (chứng minh base, commit riêng `broken since <hash>` nếu được giao), test theo PRD cũ (sửa test + comment mã quyết định), môi trường (sửa trong quyền), fixture lệch hợp đồng (sửa fixture, giữ assertion) không tính lượt code. PRD chưa nói thì chốt/cập nhật PRD/cấp lượt mới. Lỗi code tính ngân sách. Tên test/assertion/message ghi nguyên văn; không đổi task/agent/base/xoá log để lách. Miễn lượt vẫn chặn merge-ready nếu còn FAIL.
- Tiếp quản: một writer/worktree, verifier chỉ đọc; verify `--base <mốc tiếp nhận>` giữ việc dở. Báo cáo `docs/engineering/<feature>-takeover-<ngày>.md`; không kill PID lạ.
- Logic ‖ UI: commit type/interface an toàn trước chia nhánh; glob không chồng mới chia. Logic báo `<TASK> pushed <hash>`, UI sau G1 fetch+merge trước mỗi task; không đợi toàn bộ logic. “UI cần” có bảng C0 (caller/cần/API có/thiếu/cách bổ sung), không tạo API trùng. Agent thi hành không tự mở subagent.
- Stage đúng dòng mình; nhánh xếp chồng merge cha vào con khi cha đổi; trước PR merge-tree với mọi nhánh song song. Không chọn mù ours/theirs. `prTimeoutSec` riêng (900s mặc định), biết timeout thì báo owner, không chạy lại cùng cấu hình.
- Demo: báo trước, backup pg_dump, dry-run DB tạm, assertions sau nạp; dời lịch là seed lại, không sửa lẻ cột ngày. Nghiệm thu ghi giữ/tua đồng hồ và hệ quả. Dọn DB tạm/lock/server phải rõ chủ và quyền.
- W15: record header ghost cho cả đối tượng; việc tới hạn ở banner; ≤1 filled/màn, banner sau tonal, không lặp action. State UI khác persist; đọc không auto-choose. Drawer quyết định đưa dữ liệu trước, Return phụ bấm mới hiện lý do; ngoại lệ 4 bước ghi PRD. Scrollbar OS; status map DS để duyệt; radius theo vai, inner=outer−padding. Prototype giao test script mọi trạng thái/E/T/6×6/CTA.
- ACCEPTANCE: ĐẠT (test) khác ĐẠT (kiểm lại được); MỘT PHẦN / ĐẠT (có lỗi Bn) / CHƯA ĐẠT / KHÔNG KIỂM ĐƯỢC / KHÔNG CẦN SỬA có bằng chứng. Lỗi B# có mức; bảng tổng mỗi lượt; browser/CDP đang có thay Playwright được. Stage 6 + --pr PASS + AC chứng minh + hết blocker rồi owner review G3; không tự merge.
- FIXES đối chiếu finding↔PRD, giữ finding bị bác kèm lý do; comment mã quyết định khi đổi expectation. PR: UX → chức năng → code; bảng Review fixes có commit/bằng chứng.
- Không tự cài công cụ mới. D10 chỉ khi prompt giao dọn nhánh local rõ: tag `archive/<tên>` xác minh tip và việc chưa push trước xoá an toàn; không force-delete/remote delete. Prompt cấm xoá thì giữ nguyên. Không thực hiện ngoại lệ reset --soft nếu chưa được giao rõ.

## 10. Chốt công cụ và token round-trip (D1/D2/D4 · 29/10)

Superpowers cho kỷ luật thi hành; UI UX Pro Max cho tra cứu/kiểm thiết kế. Prototype dùng component thật, thông số chỉ đổi trong preview cho tới khi duyệt. Bản MD/JSON có schemaVersion, source id/hash, token allowlist light/dark; import từ nguồn khác hoặc thiếu token thì từ chối. Điều phối sở hữu ảnh/REVIEW, giao task riêng nạp token được duyệt vào DS, dựng lại trang token và kiểm component/caller dùng chung. Không tự ghi token nguồn từ preview.
