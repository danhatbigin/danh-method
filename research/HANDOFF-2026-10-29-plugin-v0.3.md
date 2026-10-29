# Tiếp quản · Nâng plugin danh-method v0.2.0 → v0.3.0 theo khảo sát 23–29/10 · 29/10/2026

Dán nguyên văn cho agent tiếp quản (Claude Code / Cowork / Codex). Agent trước (Claude Cowork) sắp hết quota.

---

Bạn tiếp quản việc nâng cấp plugin **danh-method** — bộ skill đóng gói cách anh Danh (Head of Design, Bigin, **không phải dev**) dẫn dắt AI agent build sản phẩm, rút từ dự án MiVida. Việc thu thập + phân tích giai đoạn 23–29/10 **đã xong**. Việc còn lại: **sửa plugin theo phát hiện, kiểm, đóng gói, đẩy lên GitHub**.

Người giao việc: anh Danh. Báo tiếng Việt, ngắn, theo những gì anh thấy được; không bắt anh gõ lệnh; tự chạy và tự xử lý lỗi môi trường. Câu hỏi phải tự đứng được (việc gì, vấn đề gì, lựa chọn + hệ quả).

## 1. Đọc trước (theo thứ tự)
1. `D:\Projects\danh-method-harvest\danh-method\research\findings-2026-10-23-29.md` — **nguồn chính**: mọi phát hiện, mức ưu tiên, mẫu cần thêm, 3 điểm cần anh quyết.
2. `D:\Projects\danh-method-harvest\danh-method\README.md` và toàn bộ `skills/*/SKILL.md`, `agents/*.md`, `hooks/`, `portable/` — plugin hiện tại v0.2.0.
3. `D:\Projects\danh-method-harvest\danh-method\research\inventory-2026-10-22.md` — khảo sát gốc 08–22/10 (nền của v0.1).
4. Khi cần bằng chứng / dựng khung mẫu: `D:\Projects\mivida-spec\prompts\2026-10-2[3-9]*.md`, `D:\Projects\mivida-spec\features\{medication,workouts,admin-home,leads-consistency}\*.md`, `D:\Projects\mivida-spec\features\medication\prototype\render-design-system.cjs`; tin nhắn gốc của anh: `D:\Projects\danh-method-harvest\raw-2329\danh-clean.txt`. **Chỉ đọc** mivida-spec, mivida-portal.

## 2. Trạng thái thật (đã kiểm lúc 29/10 ~17:40)
- Repo plugin: `D:\Projects\danh-method-harvest\danh-method`, nhánh `main`, remote `https://github.com/danhatbigin/danh-method` (private). Commit đầu `f1adab9` (v0.2.0) đã push.
- Chưa commit: `research/findings-2026-10-23-29.md`, `research/HANDOFF-2026-10-29-plugin-v0.3.md` (file này). Commit hai file này trước khi sửa gì khác: `docs: research findings 23-29/10 and v0.3 handoff`.
- Ngoài repo (không track, giữ nguyên): `D:\Projects\danh-method-harvest\{raw-2329, scripts, inventory.md, examples, danh-method.plugin}`. `raw-2329/` chứa lịch sử chat thô — **không đưa vào repo**.
- Máy: Windows. git + gh đã đăng nhập tài khoản `danhatbigin` (Git Credential Manager), Node 24, Python 3.12. Agent chạy trong sandbox Linux có thể không có credential → push bằng shell Windows (cmd).
- Plugin v0.2.0 gồm 10 skill (danh-method, project-setup, design-tokens, feature-spec, design-prototype, design-review, prompt-contract, execute-tasks, subagent-orchestration, review-report), 5 agent, hook guard-git + check-uipro, verify-kit v1.1, script render-token-page.mjs và capture-screens.mjs.

## 3. Việc cần làm (thứ tự)
**Bước 0 — hỏi anh Danh MỘT lượt 3 quyết định** (mục 5 của findings), kèm khuyến nghị; trong lúc chờ làm Bước 1 phần không phụ thuộc:
- D2 prototype: HTML tự dựng chỉnh theo DS, render component thật chỉ làm tham chiếu (khuyến nghị) / bắt buộc render thật.
- D1 ảnh preview: người điều phối render + viết REVIEW.md (khuyến nghị) / mở ngoại lệ POLICY cho agent design.
- D4 ponytail/Superdesign: cấm mọi việc (khuyến nghị, theo thực hành 26–27/10) / chỉ design.

**Bước 1 — sửa plugin theo findings, ưu tiên CAO trước, rồi VỪA; THẤP gom vào reference** (gợi ý vị trí đã ghi trong findings từng mục):
- `danh-method/SKILL.md`: nguồn sự thật 2 trục (D3); G3 = vòng review owner sau Stage 6 (A1.2); feature lõi trước bề mặt tổng hợp; giao việc bằng "Đọc và làm theo <prompt>"; mô hình chỉ huy + sub-agent model rẻ; báo cáo ≤3 đạt / ≤3 cần sửa / 1 quyết định, ưu tiên hình; ponytail theo D4.
- `prompt-contract`: biến thể delta (A4.1), điều kiện kết thúc (A4.2), hỏi gom một lượt (A4.3), audit→sửa, vá thư viện, tích hợp & dọn; mẫu B1 tiếp quản, B2 hai lượt A/B; agent thi hành không tự mở subagent; báo cáo tiếp quản lưu `docs/engineering/<feature>-takeover-<ngày>.md`.
- `execute-tasks` + `references/git-safety.md` + `assets/verify-kit/POLICY.md`: bảng phân loại FAIL thay luật "test đỏ → dừng" (A5.1/D6); chống lách giới hạn FAIL, ghi lỗi nguyên văn (A5.2); `--base <mốc tiếp nhận>` khi tiếp quản (A5.3); gate PR timeout (A5.4/D8 — thêm `prTimeoutSec` vào verify.mjs nếu sửa an toàn, kèm test thủ công `--classify`/`--dry`); stage đúng dòng; nhánh xếp chồng; merge-tree trước PR; ngoại lệ dọn nhánh có tag archive (D10); bẫy Windows; khoá test; reference mới `demo-data.md` (A5.7).
- `subagent-orchestration` + `brief-template.md`: sơ đồ mới logic ‖ UI bắt tay qua "<TASK> pushed <hash>" (A6.1/D7); C0 "UI cần" (A6.2, mẫu B3); B4 bắt tay; commit hợp đồng kiểu dữ liệu trước khi chia nhánh (A6.4); một writer khi tiếp quản (A6.3); tiêu chí chia sub-agent = có chồng file không (D5); người điều phối render prototype + REVIEW theo vòng (A1.1, theo D1); TEAM-BOARD (B8) khi nhiều agent độc lập.
- `design-prototype` + references + `agents/design-prototyper.md`: theo D1/D2; luật nút theo đối tượng W15 (A3.1); state UI vs lưu (A3.2); drawer quyết định + ngoại lệ 4 bước (A3.3); ghim thông tin an toàn; test script prototype bắt buộc (A3.5); scrollbar để OS; status map theo DS + STATUS-REVIEW (B7); mẫu REVIEW design theo vòng (B6).
- `design-tokens` + `shadcn-token-map.md`: token theo vai (radius-card/tile/popover/item, inner = outer − padding) (A3.7); tuỳ chọn script render component thật làm tham chiếu (mục 4 findings) — chỉ làm nếu kịp, đặt sau cùng.
- `feature-spec`: XX-00 chỉ ghi tên đã mở file đọc (A2.1); hợp đồng dữ liệu trong guidance-template (A2.2); "Cowork chốt theo mặc định" vs người phụ trách chốt; đề xuất dữ liệu mẫu (B11); research mode (hỏi hiện trạng chức năng trước).
- `design-review` + `acceptance-template.md` + `agents/acceptance-tester.md`: trạng thái mới, lỗi B#, bảng tổng sau lượt, đồng hồ demo, công cụ không phụ thuộc Playwright (A8.1/B10/D9); Stage 6 ≠ merge-ready; HANDOFF nghiệm thu cấp feature (B9).
- `review-report` + `report-formats.md`: FIXES có đối chiếu PRD, finding bị bác, comment mã quyết định (A2.3/B5); PR description theo UX → chức năng → code; bảng Review fixes; ghi số đo thật.
- `portable/AGENTS.md` + `GEMINI.md`: đồng bộ các luật mới ở mức rút gọn.
- `README.md`: cập nhật bảng skill, ghi chú v0.3.0; `plugin.json` + `marketplace.json`: version 0.3.0.
- **Không ghi chẩn đoán sức khoẻ hay thông tin riêng của anh Danh vào plugin.** Định dạng báo cáo ngắn/ưu tiên hình ghi là sở thích làm việc, không nêu lý do y tế. Không chép dữ liệu bệnh nhân/khách; ví dụ MiVida chỉ ở mức vai trò/cấu trúc.

**Bước 2 — kiểm**
- Mỗi `skills/*/SKILL.md` và `agents/*.md` có frontmatter hợp lệ (agents dùng `description: |`), tên trùng thư mục; mọi đường dẫn `references/…`, `scripts/…`, `assets/…` được nhắc tới đều tồn tại.
- `claude plugin validate .claude-plugin/plugin.json` nếu có; không có thì tự kiểm như trên.
- Script đã sửa phải chạy thử: `node hooks/scripts/guard-git.mjs` (bộ ca reset/stash/clean/push -f… vẫn chặn, ca thường vẫn qua), `check-uipro.mjs --json`, `render-token-page.mjs` trên `D:\Projects\mivida-portal\packages\ui\src\styles\{mivida-website,globals,portal-tokens}.css` (chỉ đọc, ghi ra thư mục tạm), verify-kit `--help/--classify` nếu có sửa.
- Đọc lại SKILL.md dài nhất: giữ < ~3.000 từ, chi tiết đẩy xuống references.

**Bước 3 — đóng gói & đẩy**
- Commit theo nhóm (docs/skills/scripts), message English, ví dụ `feat(skills): v0.3 lessons from 23-29/10 (FAIL taxonomy, delta prompts, logic-UI handshake)`.
- Push `main` bằng shell Windows: `cd /d D:\Projects\danh-method-harvest\danh-method && git push origin main` (không force).
- Đóng gói `.plugin`: zip toàn bộ thư mục plugin (trừ `.git`, `research/`, `examples/`, `*.plugin`) thành `D:\Projects\danh-method-harvest\danh-method.plugin` (ghi đè bản cũ). Nếu đang ở Cowork thì gửi file cho anh để cài.

## 4. Quy tắc cứng
- Chỉ ghi trong `D:\Projects\danh-method-harvest\`. Không sửa `mivida-spec`, `mivida-portal`, lịch sử chat của các tool.
- Git: không reset --hard / stash / clean / force push / xoá nhánh. Sai thì `git revert`.
- Không xoá file ngoài repo (`raw-2329`, `scripts`, `inventory.md`…).
- Không dùng ponytail/Superdesign. Không tự cài plugin/CLI mới khi chưa hỏi anh.
- Ghi file UTF-8, LF. Trên Windows không dùng PowerShell `Set-Content`/`Add-Content`.
- Không bịa: thay đổi nào trong plugin cũng phải truy được về một mục trong findings (hoặc quyết định anh vừa chốt).

## 5. Điều kiện dừng / kết thúc
- Chỉ dừng hỏi ở Bước 0 (3 quyết định) và khi một sửa đổi buộc phải đổi triết lý cốt lõi của plugin mà findings không nói.
- Không dừng sau khi đọc / lập kế hoạch. Không báo "xong" khi chưa push và chưa đóng gói. Sắp hết quota: commit + push phần đã xong, cập nhật mục "Trạng thái" cuối file này (đã làm mục nào, còn mục nào) rồi mới dừng.

## 6. Báo cuối (≤ 8 dòng)
Đã sửa skill nào (1 dòng mỗi nhóm) · 3 quyết định đã áp dụng thế nào · commit cuối + đã push · file .plugin ở đâu · mục findings nào cố ý chưa làm và vì sao.

---

## Lệnh resume ngắn (dán khi mở phiên mới giữa chừng)
```
Tiếp tục D:\Projects\danh-method-harvest\danh-method\research\HANDOFF-2026-10-29-plugin-v0.3.md. Đọc mục "Trạng thái" cuối file và git log của repo danh-method trước, rồi làm tiếp đúng mục còn dở. Giữ mọi quy tắc cứng.
```

## Trạng thái (agent cập nhật khi dừng)
- 29/10 ~17:40 (Claude Cowork): thu thập + phân tích xong; findings và handoff đã ghi; chưa sửa plugin.
- 29/10 (Codex): đã sửa phần độc lập D3/FAIL/delta/tiếp quản/logic–UI/C0/nghiệm thu/demo/portable; chi tiết và bằng chứng kiểm ở `research/v0.3-progress.md`. D1/D2/D4 đã hỏi chung một lượt, chưa có câu trả lời; không tự áp dụng khuyến nghị. Còn phần phụ thuộc 3 quyết định, README/version 0.3.0, kiểm cuối, đóng gói và push bản phát hành. Commit khảo sát `e848bbb` đã tồn tại trước phiên, không tạo lại.
- 29/10 (Codex, sau kiểm): commit phần độc lập `0166580`, script + test `0528b52` (4/4 PASS). Push chưa thành công: mạng hạn chế không phân giải GitHub; yêu cầu push ngoài giới hạn bị bộ duyệt tự động từ chối vì cần người dùng chấp thuận rõ việc đẩy lên main. Không thử đường vòng. Cần anh trả lời D1/D2/D4 và đồng ý push main; bản .plugin cũ và version 0.2.0 được giữ tới khi hoàn tất lựa chọn.
- 29/10 (Codex, đã nhận quyết định): D2 = render component thật bắt buộc + chỉnh thông số + export/import MD/JSON nạp lại token; D1 = điều phối chụp ảnh/REVIEW; D4 = bỏ hai công cụ cũ khỏi nội dung phát hành, giữ Superpowers + UI UX Pro Max. Đã đồng bộ docs/version 0.3.0 và thêm helper editor (gắn vào output renderer thật, không phải compiler component). 11/11 test Node + smoke trình duyệt component thật/MD/JSON/light-dark/6 kích thước-theme qua. Chi tiết `research/v0.3-progress.md`. Chưa được chấp thuận rõ push main sau auto-review rejection; không retry khi chưa có chấp thuận.
- 29/10 (Codex, sẵn sàng tại máy): đã sửa hết finding review, 12/12 test + browser smoke editor/6 viewport-theme PASS; manifest PASS (cảnh báo thiếu icon), 23 guard cases/15 frontmatter/53 refs PASS. Commit nội dung `e4a6980`, code `c94f5eb`; đã thay `D:\Projects\danh-method-harvest\danh-method.plugin` bằng v0.3.0 (73 file, SHA-256 trong progress). Chỉ còn xin anh chấp thuận rõ push main theo yêu cầu của bộ duyệt, rồi push thường và xác minh remote. Không cần làm lại D1/D2/D4, không cần đóng gói lại nếu chỉ cập nhật research.
