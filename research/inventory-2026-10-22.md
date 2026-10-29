# Inventory — Phương pháp làm việc của anh Danh (danh-method)

> Kết quả khảo sát phục vụ đóng gói bộ skill `danh-method`.
> Chỉ đọc. Không sửa repo, không chạy dev server, không commit.
> Thời điểm khảo sát: 2026-10-22. Phạm vi dữ liệu: 2026-10-08 → 2026-10-22.

---

## 0. Nguồn dữ liệu & phương pháp

### 0.1 Nguồn tìm thấy (tất cả đều tồn tại, không đoán)

| Nguồn | Đường dẫn | Định dạng | Quy mô | Session có tin nhắn người | Tin nhắn người |
|---|---|---|---|---|---|
| Claude Code | `~/.claude/projects` | JSONL | 20 file, ~62 MB | 19 | 100 |
| Codex | `~/.codex/thread_history_1.sqlite` (+ `~/.codex/sessions` 34 file `.zst`) | SQLite projection + zstd rollout | 14.875 item | 44 | 196 |
| Antigravity | `~/.gemini/antigravity/conversations/*.db` + `brain/*/transcript.jsonl` | SQLite + protobuf blob | 41 DB, ~576 MB | 13 | 56 |
| AionUI | `%APPDATA%\AionUi\aionui\aionrs-sessions\sessions\*\state.json` | JSON | 20 file | 13 | 27 |
| Tài liệu | `D:\Projects\mivida-spec`, `D:\Projects\mivida-portal`, `D:\Projects\BigIn-Workspace` | Markdown | — | — | — |

**Tổng: 379 tin nhắn do anh Danh tự gõ (171.783 ký tự), 13.332 lời gọi tool, 89 phiên làm việc.**

### 0.2 Phương pháp trích xuất

1. Chuẩn hoá 4 nguồn về một dạng chung `{source, session, timestamp, text}`.
2. Codex: dùng bảng `thread_items` của `thread_history_1.sqlite` (không cần giải nén `.zst`), lọc theo `item_type` = `userMessage` / `agentMessage`.
3. Antigravity: giải protobuf bằng walker đệ quy, lấy text ở `step_type=14` (tin nhắn người) và đối chiếu chéo với `transcript.jsonl` (`USER_INPUT`).
4. AionUI: đọc `state.json` → `messages[]`.
5. **Lọc bỏ nhiễu hệ thống** trước khi phân tích: agent history injection, wake payload, Team Governance, `<task-notification>`, `<environment_context>`, chèn nội dung SKILL.md, ảnh không kèm chữ. Nếu không lọc, Codex sẽ bị thổi phồng 196 → 1.030 "tin nhắn" (747 là history injection).

### 0.3 Độ tin cậy

- **Cao:** Claude Code (JSONL có cấu trúc rõ), Codex (SQLite).
- **Trung bình:** Antigravity — text người dùng nằm trong protobuf, trích theo vị trí field nên có thể thiếu câu rất ngắn; 41 DB nhưng chỉ 13 phiên có tin nhắn người.
- **Không đọc:** 34 rollout `.zst` của Codex (đã có projection đầy đủ hơn trong SQLite), LevelDB/IndexedDB của AionUI.

---

## 1. (a) Bảng giai đoạn → skill → vấn đề

### 1.1 Các giai đoạn (dựng từ mốc thời gian + prompt + CHANGELOG)

| # | Giai đoạn | Thời gian | Bề mặt / mục tiêu | Công cụ chủ đạo | Sản phẩm bàn giao |
|---|---|---|---|---|---|
| P0 | Khai phá & định hình luật | 08–09/10 | Mobile app bệnh nhân, messages/concierge, mock data 2 portal | Codex + Claude | Prompt rời, PRD sơ khai, luật đầu tiên |
| P1 | Nền tảng & đồng bộ quy trình | 12–14/10 | BigIn Workspace (logtime/OP), lead→member, RAM/token monitor | Claude + Codex | `WORKFLOW.md`, `working-rules.md`, task ID (OP-*, LM*, TK*) |
| P2 | Design system v1 + khám phá UI | 14–15/10 | Today, Dashboard, Leads-C, Chat dock, Dev dock | Antigravity + Codex | Design tokens, `prompts/2026-10-15-*` |
| P3 | Design system v2 & bề mặt member | 15–16/10 | DS00–DS29, member portal, chat dock 7 trạng thái | Antigravity (+Codex) | `2026-10-15-design-system-today.md`, `2026-10-16-member-portal.md` |
| P4 | Admin Workspace v1→v2 | 19–20/10 | Spec/PRD/USER_FLOW/GUIDANCE/TASKS, gate thiết kế | Codex + Claude | `2026-10-20-admin-workspace-v2.md` (gate G1–G3) |
| P5 | Admin Revamp đa agent | 21–22/10 | Shell, Dashboard, Members, Schedule, Leads, Login | Claude + Codex + AionUI teams | `SPEC.md`, `PAGES.md`, `TRACK-A..F`, RG0/RG1 |
| P6 | Hậu kiểm & đóng gói tri thức | 22/10 | Review bảo mật/UX, audit skill | Claude + Codex + AionUI | Báo cáo issue/nguyên nhân/kết quả/giải pháp |

### 1.2 Thống kê mọi lần dùng `superpowers:*` và `ui-ux-pro-max:*`

Bộ `superpowers` cài tại `~/.gemini/config/plugins/superpowers/skills/` gồm 15 skill:
`brainstorming, diagnosing-superpowers, dispatching-parallel-agents, executing-plans, finishing-a-development-branch, receiving-code-review, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills`.

`ui-ux-pro-max` cài tại `~/.gemini/config/plugins/ui-ux-pro-max/skills/ui-ux-pro-max/` (kèm `banner-design, brand, design, design-system, slides, ui-styling`).

#### Các lần gọi tường minh (có bằng chứng cơ học)

| # | Skill | Nguồn / phiên | Thời điểm | Vấn đề cần giải | Kết quả |
|---|---|---|---|---|---|
| 1 | `superpowers:brainstorming` | Antigravity `d936755c` | 15/10 11:11 | Thiết kế **Dev Dock**: 5 trạng thái + 2 case biên, *trước khi* viết code | **Tốt.** Danh chốt xong thì ra lệnh chuyển sang thi hành: *"Subagent nha em"* (11:43) — skill làm đúng vai "làm rõ trước khi build" |
| 2 | `ui-ux-pro-max` | Antigravity `b566d55d` | 15/10 23:05 | **Design System v2 + Today** cho portal, kèm master prompt + trạng thái thực tế | **Tốt một phần.** Dùng đúng lúc (design-heavy). Hệ quả bị chỉnh ở vòng polish 16/10 (radius +8px, floating topbar, gradient) |
| 3 | `ui-ux-pro-max` | Antigravity `227cb80c` | 16/10 08:56 | **Chat dock 7 trạng thái** + thu gọn, badge tin mới | **Bị sửa.** Danh bác mô hình trạng thái: *"status ở đây với draft với new nó đang bị sai trái sao sao á… Còn draft với new lại là 2 cái độc lập nhỉ và nó nên là mini badge"* |
| 4 | `superpowers:executing-plans` | Antigravity `0b7e6ff7` | 20/10 19:28 | Thi hành plan `admin-workspace-v2`, **chỉ TK00** rồi dừng báo cáo | **Tốt.** Đúng giao kèo "thi hành theo plan, dừng ở gate" |
| 5 | `superpowers:subagent-driven-development` (không qua link SKILL, ra lệnh bằng lời) | Antigravity `07fc47bb`, `d936755c` | 19/10 22:14; 15/10 11:43 | Chia phase cho nhiều agent chạy song song để tránh nghẽn/limit | **Tốt.** Để lại artifact thật: `.superpowers/sdd/<plan>/`, thư mục riêng `agent-c/`, `agent-e/` |
| 6 | `superpowers:systematic-debugging` | Claude `6db7fde0` | 22/10 | Truy lỗi bảo mật + UX sau revamp | **Đúng lúc** (đi kèm TDD + security-review trong cùng phiên) |
| 7 | `superpowers:test-driven-development` | Claude `6db7fde0` | 22/10 | Sửa 9 điểm review, auth/password-reset (LG-03) | **Tốt.** Danh yêu cầu rõ RED→GREEN cho mọi nhánh auth |
| 8 | `ui-ux-pro-max` | Claude `fe0e925c` | 20–21/10 | Audit UX **Dashboard + Leads Workspace**, tìm vấn đề trải nghiệm và mất đồng bộ | **Tốt, có hệ quả lớn:** dẫn tới quyết định revamp toàn bộ admin |
| 9 | `ponytail` (không thuộc 2 bộ trên) | Codex `01a13e65`; Claude `346ae9ad` | 15/10 01:09; 15/10 11:06 | Chỉnh shape cho giống ảnh mẫu; polish chat dock | **Tốt** (dùng như "thợ chỉnh hình khối") |

#### Skill **không** được dùng (dù quy trình có quy định)

| Skill | Quy định ở đâu | Thực tế |
|---|---|---|
| `superpowers:writing-plans` | `process/design-workflow.md` Bước 3 — "dùng skill `writing-plans` để viết plan" | **0 lần.** Kế hoạch do Danh + agent viết tay thành `prompts/*.md`, `TASKS.md` |
| `superpowers:verification-before-completion` | — | 0 lần gọi tên; nhưng **hành vi** tương đương được yêu cầu liên tục ("test + typecheck + build rồi hãy báo") |
| `superpowers:requesting-code-review` / `receiving-code-review` | — | 0 lần. Review do **agent khác đóng vai reviewer** + Danh duyệt |
| `superpowers:using-git-worktrees` | — | 0 lần gọi tên; **hành vi** dùng thật (`mivida-portal-pages`, `-login`, `-leads-c`) |
| `superpowers:dispatching-parallel-agents` | — | 0 lần gọi tên; **hành vi** dùng thật qua AionUI teams + "Subagent nha em" |
| `superpowers:finishing-a-development-branch` | — | 0 lần |
| `superpowers:writing-skills` / `diagnosing-superpowers` | — | 0 lần |

> **Kết luận quan trọng cho việc đóng gói:** anh Danh dùng superpowers như **từ vựng hành vi**, không phải như **menu lệnh**. Cái được tái sử dụng là *kỷ luật* (làm rõ trước khi build, thi hành theo plan, TDD, chia subagent), không phải cú pháp gọi skill.

---

## 2. (b) Quyết định thiết kế kèm lý do

Mỗi quyết định ghi kèm **lý do** (nếu nguồn có nêu) và **bằng chứng**.

### Nhóm A — Nguyên tắc thị giác & design system

**D01. Không custom style; chỉnh từ thư viện để đồng bộ.**
> "Hãy đảm bảo là không custom style nha, sửa từ thư viện để đồng bộ nha. Với nhớ để ý mấy chỗ màu gradient khai báo để nó hoạt động đúng trên cả 2 mode giúp anh"
> — Codex, 09/10 11:53
*Lý do:* đồng bộ + gradient phải đúng ở cả light/dark. Đây là luật cứng, lặp lại nhiều lần.

**D02. Không tự vẽ chart; dùng component sẵn có của `packages/ui`.**
> "Merge admin-workspace về nhánh của bạn trước, bỏ SVG tự vẽ, dùng ChartContainer/ChartTooltip của packages/ui"
> — Codex, 22/10 02:05
*Lý do:* tránh lệch design system và lệch tooltip/theme.

**D03. UI trình bày tiếng Anh, trao đổi tiếng Việt.**
> "Toàn bộ UI đều phải trình bày English á" — Claude, 12/10 05:59
> "English em ơi" — Antigravity, `33e4205a`
*Lý do:* sản phẩm phục vụ client nói tiếng Anh; nhưng giao tiếp nội bộ phải nhanh, ngắn, tiếng Việt.

**D04. Radius, floating, glass: tăng độ "mềm" có chủ đích.**
> "Chat list và chat box là scroll inside nha, còn cái bọc bên ngoài là fill theo screen / … thanh Week floating khi chạm đáy của top bar / … Tổng thể tăng radius thêm 8px"
> — Codex, 16/10 12:40
> "Topbar: Floating khi scroll; Có gradient background làm mờ đoạn 1/3 dưới để tạo cảm giác smooth khi scroll" — Claude, 22/10 02:00
*Lý do:* Danh giải thích rõ vấn đề cảm nhận: topbar dạng bar khi scroll làm card chạy qua gây **loạn thị giác**, không phân biệt được lớp.

**D05. Phân cấp thị giác giữa khung tổng và khung feature.**
> "Master layout hiện tại chưa có phân cấp thị giác giữa frame tổng và frame của từng feature khiến cho chúng hòa vào nhau gây đứt gãy nhịp của navigation system."
> — Claude, 21/10 06:54
*Lý do:* nhịp điệu điều hướng; đây là lỗi *cấu trúc*, không phải lỗi *trang trí*.

**D06. Dashboard phải có nghĩa nghiệp vụ, không chỉ đẹp.**
> "Trang dashboard thì đẹp đó như vô nghĩa. Người dùng là admin thực sự thì sẽ chỉ quan tâm: Leads Conversion Rate, Members có đang hài lòng với dịch vụ…"
> — Claude, 21/10 06:54
*Lý do:* tiêu chí "đẹp" bị hạ cấp sau tiêu chí "trả lời được câu hỏi của người dùng thật".

**D07. Mô hình trạng thái phải tách trục, không trộn.**
> "status ở đây với draft với new nó đang bị sai trái sao sao á. Với anh thì Sage với Xám dim là chỉ trạng thái online hay offline của người đó… Còn draft với new lại là 2 cái độc lập nhỉ và nó nên là mini badge"
> — Antigravity `227cb80c`
*Lý do:* presence (online/away/offline) và message-state (draft/new) là **hai chiều độc lập**; gộp lại tạo tín hiệu sai.

**D08. Ranh giới component dùng chung: member dùng chung, admin không được lệch hình.**
> "DS19: chuyển phần khung dùng chung vào packages/ui, admin không được đổi hình so với ảnh after của DS17"
> — Codex, 16/10 04:41

**D09. Chuyển động có kiểm soát.**
> "không thêm animation lặp, không thêm bộ đếm; chỉ vẽ lại khi số đổi quá 0,5 điểm %"
> — Codex, 14/10 14:53
*Lý do:* tránh CPU/GPU rung, tránh gây nhiễu thị giác.

### Nhóm B — Quy trình thiết kế → code

**D10. Tài liệu trước, code sau. "Viết file mô tả chức năng để anh duyệt rồi mới cho code mode chạy."**
> "Anh cần em viết file mô tả chức năng hoạt động chi tiết như nào, để anh đọc qua, sửa duyệt rồi mới cho code mode chạy á"
> — Codex, 08/10 10:17
*Lý do:* Danh muốn **duyệt ý tưởng ở dạng chữ** trước khi tốn tiền code. Đây là gốc của toàn bộ hệ thống SPEC/PRD/USER_FLOW/GUIDANCE/TASKS.

**D11. Prototype/preview gate trước khi thi hành.**
> "Nhưng để cho chính xác hơn, anh cần có 1 preview html để mình sync với nhau về mặt ý tưởng và thực thi sau đó mới tiến hành tiếp" — Antigravity `227cb80c`
> "Em có thể render ra preview anh xem, duyệt rồi mới tiến hành làm không?" — Codex, 17/10 06:28
> "Render preview anh xem để duyệt và tiến hành sau" — Codex, 16/10 12:40
*Lý do:* HTML preview là **ngôn ngữ chung** giữa Head of Design và agent — nhanh hơn Figma, chính xác hơn mô tả chữ.

**D12. Duyệt là duyệt đúng phạm vi, không mở rộng.**
> "Approve. Hãy đảm bảo là chỉ thực thi những mục anh đề cập thôi nha. Tiến hành luôn đi em"
> — Codex, 16/10 12:48
*Lý do:* agent hay "tiện tay" sửa thêm; Danh chặn ngay tại cửa duyệt.

**D13. Một task một lượt, dừng đúng biên.**
> "Chỉ làm TK02 trong docs/features/resource-token/TASKS.md… Xong thì npm test, cập nhật HANDOFF, commit, rồi dừng và báo cáo. Đừng làm TK03 hay task khác."
> — Codex, 14/10 10:18
> "Chỉ làm TK00 (khảo sát, không sửa code), ghi kết quả vào HANDOFF rồi dừng và báo cáo"
> — Antigravity `0b7e6ff7`
*Lý do:* chia nhỏ để kiểm soát chất lượng và chi phí token; tránh "đi quá đà".

**D14. Batch mode có điều kiện dừng viết trước.**
> "Chạy liên tục CD02 → CD08 theo prompt Chat Dock, không dừng giữa các task để hỏi… Chỉ dừng khi: việc không thể đảo ngược, ngoài phạm vi PRD, test cũ đỏ mà không sửa được trong task…"
> — Codex, 15/10 07:58
*Lý do:* cân bằng giữa "đừng hỏi vặt" và "đừng tự quyết việc lớn". Danh rất dị ứng agent dừng giữa chừng: *"Ủa sao dừng vậy em?"* (15/10 08:06), *"Ủa sao dừng nữa rồi em?"* (Antigravity `34847cca`).

**D15. Không phá việc đang làm dở.**
> "QUAN TRỌNG: working tree đang có code DS23 chưa commit… Đây là việc đã làm, KHÔNG được git reset / checkout / stash / clean / xoá."
> — Antigravity `34847cca`
> "KHÔNG reset/stash/xóa file dở — đó là việc của bạn trước sự cố"
> — AionUI `2dff85ca`
*Lý do:* nhiều agent cùng ghi trên nhiều worktree; reset là mất việc không hồi phục.

**D16. Sai thì revert bằng commit mới, không reset.**
> "lần trước làm sai. Bước 1: git revert ccefb60 (tạo commit mới, không reset)."
> — AionUI `1e93cb69`
*Lý do:* giữ lịch sử, cho phép review chéo.

### Nhóm C — Điều hành nhiều agent

**D17. Chia theo bề mặt (surface), mỗi agent một nhánh/worktree, một quyền sở hữu.**
> "Thực thi theo hướng Subagent-driven, mỗi agent một phase (4 phases) và dùng 4 agent riêng biệt, tránh việc limit"
> — Antigravity `07fc47bb`
> "Không đụng shell (A), Dashboard (C), Leads (E)." — AionUI `d5036c4b`
*Lý do:* tránh xung đột file; tránh nghẽn quota.

**D18. Reviewer không sửa code; review bằng `git diff`, không checkout.**
> "Bạn là Codex, làm reviewer, KHÔNG sửa code… Review diff Đợt 1… — đọc bằng git, không checkout/commit/merge."
> — Codex, 22/10 07:15
*Lý do:* tách quyền "viết" và "duyệt" như review người thật.

**D19. Review chéo có cấu trúc, mã hoá bằng mã lỗi và đợt.**
Bằng chứng: `TRACK-A..F.md`, `SPEC §8/§9/§11`, "Đợt 1 (Members, Schedule, Discussions)", "lỗi 1 → lỗi 9", "Sẵn sàng để A merge", gate `RG0/RG1`.

**D20. TDD cho đường dữ liệu nhạy cảm.**
> "Lỗi 1 làm trước, có test payload theo role chứng minh dữ liệu lâm sàng không xuống client khi không có quyền. TDD từng lỗi, browser 1440/768/390 light/dark"
> — Codex, 22/10 07:22
*Lý do:* bảo vệ dữ liệu y tế; test là **bằng chứng**, không phải lời hứa.

**D21. Báo cáo dạng bảng: issue → nguyên nhân → kết quả → giải pháp.**
> "Em đọc báo cáo lập bảng phân tích tập trung vào bảo mật và trải nghiệm người dùng theo format issue, nguyên nhân, kết quả và giải pháp"
> — Claude, 22/10 04:14
> "Liệt kê ra 6 lỗi đó là gì, nguyên nhân do đâu, và giải pháp là gì em"
> — Codex, 20/10 15:29

**D22. Báo cáo phải khai "Bỏ qua + Rủi ro", không giấu.**
> "Bỏ qua: Chưa chạy lại toàn bộ 476 tests… Rủi ro: …"
> — Claude `0ef13e15`, 22/10 07:37 (agent báo, Danh chấp nhận format này)

### Nhóm D — Nguồn sự thật & phạm vi quyền

**D23. Khi tài liệu và thực tế lệch nhau, tin trạng thái do Danh khai báo.**
> "TRẠNG THÁI THỰC TẾ (HANDOFF đang cũ, tin phần này)"
> — Claude, 15/10 16:31

**D24. Prompt đổi thì bỏ hẳn prompt cũ trong phiên, đọc lại từ đầu.**
> "Prompt Chat Dock đã đổi (commit 61f15bc trong mivida-spec). Bỏ hết nội dung prompt cũ trong phiên này, đọc lại file … từ đầu và làm theo bản mới."
> — Codex, 15/10 07:21

**D25. Quyền quyết định: Danh quyết sản phẩm, owner quyết kỹ thuật/merge.**
> "Owner hiện tại là anh Tùng, có thể sau này sẽ chuyển sang người khác làm owner chắc vì vậy mà ảnh để owner"
> — Codex Q&A, 14/10 04:37
> "Anh toàn quyền quyết định trong nhánh này. Làm xong hết sẽ cần có báo cáo… Owner chỉ cần lý do thích đáng thôi"
> — Claude, 22/10 04:19

**D26. Mọi người phải nhìn cùng một sự thật nghiệp vụ.**
> "…những bộ phận liên quan như coach hay medicine đều phải view the same với consultant để dễ communicate… nghịch lý là MD với Coach chỉ thấy [phần của mình]"
> — Codex, 19/10 12:31
*Lý do:* cùng một góc nhìn chung để tương hỗ; phá silo phê duyệt.

**D27. Ưu tiên công việc đang xử lý của người dùng (user-centered trong admin).**
> "Khi nói user làm trung tâm trong admin portal có nghĩa là ưu tiên công việc họ đang xử lý, tác vụ họ đang làm."
> — Codex, 19/10 12:31

**D28. Công cụ không hiệu quả thì bỏ khỏi workflow** (ví dụ Superdesign bị loại trong CHANGELOG), và **thuật ngữ phải bỏ khi Danh không hiểu**:
> "Anh không hiểu thuật ngữ nhưng cụ thể anh muốn là…" — Codex, 09/10 00:50
> "Ủa em mấy cái đó mock data do anh tự build mà" — Codex, 09/10 03:48

---

## 3. (c) Các luật quy trình

### 3.1 Luật về cách viết prompt (hợp đồng)

- **R01. Prompt là hợp đồng, không phải lời nhắn.** Phải có: bối cảnh → trạng thái thực tế → gate → quyết định đã chốt (Q01…Q10) → thứ tự task → quy trình từng task → luật cứng → mẫu handoff → lệnh resume ngắn.
- **R02. Prompt phải ghi "trạng thái thực tế" đè lên HANDOFF** khi HANDOFF cũ.
- **R03. Prompt phải ghi rõ "chỉ làm X, không làm Y"** và điều kiện dừng.
- **R04. Prompt dài phải có lệnh resume ngắn** để nối phiên (kiểu "Đọc prompt … từ dòng X, làm tiếp TKn").
- **R05. Prompt đổi → đánh commit, phiên cũ phải đọc lại từ đầu.**
- **R06. Quyết định thiết kế phải được chốt trong prompt dưới dạng Q/A trước khi thi hành**, không để agent tự diễn giải.

### 3.2 Luật về thứ tự đọc trước khi làm

- **R07.** `AGENTS.md` / `CLAUDE.md` → `HANDOFF.md` → `working-rules.md` → `prompt` → `PRD` → `TASKS` → `GUIDANCE`.
- **R08.** Đối soát `git status/log` **trước** khi sửa; không reset, không clean.
- **R09.** Đọc tài liệu theo **thứ tự cố định**, không đọc ngẫu nhiên.

### 3.3 Luật về cổng duyệt (gate)

- **R10.** Không code trước khi có tài liệu được duyệt.
- **R11.** Gate chuẩn: ý tưởng → preview → duyệt → thi hành → review → merge. Trong repo dùng `G1/G2/G3`, `RG0/RG1`, "Gate LG1", "owner duyệt".
- **R12.** Preview phải là **HTML render được**, không chỉ mô tả.
- **R13.** Duyệt xong chỉ làm đúng mục đã duyệt.
- **R14.** Việc ngoài phạm vi PRD dừng lại hỏi.

### 3.4 Luật về nhịp làm việc

- **R15.** Một task một lượt; hoàn tất = code + test + typecheck (+build nếu đụng UI) + tick TASKS + cập nhật HANDOFF + commit.
- **R16.** Batch: chạy liền nhiều task, báo 2 dòng/task, chỉ dừng ở 4 lý do đã định nghĩa.
- **R17.** Không dừng giữa chừng để hỏi vặt; không hỏi khi đã có đủ ngữ cảnh.
- **R18.** Không tự quyết việc lớn (mở rộng mô hình dữ liệu, đổi kiến trúc, xoá dữ liệu).

### 3.5 Luật về chất lượng & bằng chứng

- **R19.** TDD: RED → GREEN cho mọi thay đổi hành vi; auth/PHI bắt buộc có test payload theo role.
- **R20.** Kiểm UI trên **1440 / 768 / 390** và **light / dark**.
- **R21.** Không báo "xong" khi chưa chạy kiểm tra; nếu không chạy được phải ghi rõ vào mục "Chờ kiểm".
- **R22.** Báo cáo theo format `issue → nguyên nhân → kết quả → giải pháp`.
- **R23.** Báo cáo phải có mục **"Bỏ qua"** + **"Rủi ro"**.
- **R24.** Reviewer không sửa code; review bằng diff.

### 3.6 Luật về git & môi trường

- **R25.** Không `reset --hard`, `stash`, `clean`, `checkout` khi có việc dở.
- **R26.** Sai thì `revert` bằng commit mới.
- **R27.** Mỗi agent một nhánh/worktree; merge theo thứ tự đã định, có "Sẵn sàng để A merge".
- **R28.** Commit theo **nhóm lỗi**, lỗi nghiêm trọng nhất tách commit riêng.
- **R29.** Khoá test dùng chung (`*.lock`) phải chờ, không chiếm.

### 3.7 Luật về giao tiếp

- **R30.** Trao đổi tiếng Việt, ngắn, đơn giản; UI tiếng Anh.
- **R31.** Không bắt Danh gõ lệnh: agent tự chạy, tự xử lý lỗi môi trường (ví dụ dùng `cmd` vì PowerShell chặn `npm.ps1`).
- **R32.** Không dùng thuật ngữ mà Danh không cần; giải thích bằng ngôn ngữ nghiệp vụ.
- **R33.** Hỏi phải kèm ngữ cảnh để trả lời được — câu hỏi thiếu ngữ cảnh bị trả lại.

### 3.8 Luật về tài liệu & dữ liệu

- **R34.** Docs là nguồn sự thật, có version (`mivida-spec v1.1`); code đứng sau docs.
- **R35.** Mỗi feature có bộ `SPEC / PRD / USER_FLOW / GUIDANCE / TASKS (+ TRACK)`.
- **R36.** Mock data phải được khai báo là mock; demo không có backend phải nói rõ.
- **R37.** Không lộ PHI/dữ liệu lâm sàng xuống client khi thiếu quyền.

---

## 4. (d) Mâu thuẫn giữa các nguồn

| # | Mâu thuẫn | Nguồn A | Nguồn B | Cách hiểu / xử lý |
|---|---|---|---|---|
| C01 | **Ai duyệt cuối?** | `working-rules.md` + nhánh `main`: "owner duyệt cuối" | Danh: "anh Tùng duyệt code, Danh duyệt sản phẩm"; 22/10: "Anh toàn quyền quyết định trong nhánh này… Owner chỉ cần lý do thích đáng" | Quyền **tách theo loại quyết định**: kỹ thuật/merge = owner; sản phẩm/UX = Danh. Khi Danh nói "toàn quyền" là trong phạm vi nhánh thử nghiệm |
| C02 | **Ngôn ngữ** | `working-rules.md`, `AGENTS.md`: trả lời tiếng Việt | "Toàn bộ UI đều phải trình bày English á"; "English em ơi" | Không mâu thuẫn thật: **UI = English**, **chat = tiếng Việt**. Nhưng dễ bị hiểu sai — cần ghi rõ trong skill |
| C03 | **HANDOFF là nguồn sự thật?** | `docs/log/HANDOFF.md` được quy trình chỉ định đọc đầu tiên | "HANDOFF đang cũ, tin phần này" (15/10) | HANDOFF là **cache**, không phải chân lý. Prompt/trạng thái do Danh khai báo thắng |
| C04 | **Prompt nào đúng?** | Prompt cũ còn trong phiên | "Prompt Chat Dock đã đổi (commit 61f15bc)… Bỏ hết nội dung prompt cũ trong phiên này" | Prompt trong **repo tại HEAD** thắng prompt đã nạp vào phiên |
| C05 | **Quy trình chuẩn vs thực tế** | `design-workflow.md` Bước 3: brainstorming → **`writing-plans`** → executing-plans | Thực tế: `writing-plans` **0 lần**; `executing-plans` 1 lần; SDD dùng bằng lời | Quy trình **chuẩn hoá** không phản ánh cách chạy thật. Skill mới nên bám *hành vi* (viết plan tay trong `prompts/` + `TASKS.md`) hơn là bám tên skill |
| C06 | **"Không custom style" vs ui-ux-pro-max** | "không custom style nha, sửa từ thư viện" | `ui-ux-pro-max` sinh design riêng, nhiều style/palette | "Không custom" = **không custom CSS ngoài token/thư viện**, không phải "không thiết kế". Diễn giải này khớp với việc Danh vẫn duyệt design mới |
| C07 | **Commit hay không commit** | `working-rules.md`: commit/push theo quy trình | Nhiều lệnh review: "KHÔNG sửa code", "chỉ đọc", "không checkout/commit/merge" | Commit là mặc định **cho agent thi hành**; agent **review** bị cấm ghi |
| C08 | **"Chỉ làm 1 task" vs "càn quét"** | "Chỉ làm TK02… Đừng làm TK03" | "Càn quét từ LM02 đến LM13 luôn"; "Chạy liên tục CD02 → CD08" | Phạm vi do Danh **khai báo từng lượt**; luật thật là "không tự mở rộng", không phải "luôn làm 1 task" |
| C09 | **Kiểm UI** | Prompt: "nếu không mở được trình duyệt thì ghi vào HANDOFF rồi làm tiếp, không dừng" | Luật chất lượng: phải kiểm 1440/768/390 | Kiểm UI là **bắt buộc về sau** (khi có browser/Playwright); giai đoạn đầu cho phép nợ có ghi chép |
| C10 | **Dữ liệu thật vs mock** | Yêu cầu demo với client, "phải có dữ liệu thật" | Giai đoạn design: "chỉ có front-end và mock data chưa có backend" | Theo **môi trường**: mock ở prototype, thật ở môi trường có backend/DB; phải khai báo rõ đang ở đâu |
| C11 | **Độ đầy đủ dữ liệu Antigravity** | 41 file `.db` tồn tại | Chỉ 13 phiên có tin nhắn người trích được | Không kết luận "Danh ít dùng Antigravity"; DB có thể chứa phiên không có prompt người hoặc text bị mất khi giải protobuf |
| C12 | **"Đẹp" có phải tiêu chí?** | Nhiều prompt nhấn thẩm mỹ (glass, gradient, radius) | "Trang dashboard thì đẹp đó như vô nghĩa" | Thẩm mỹ là **điều kiện cần**, không phải điều kiện đủ. Ưu tiên: đúng việc → đúng cấu trúc → đẹp |

---

## 5. Phụ lục A — Kho trích lời gốc (dữ liệu quan trọng nhất)

Phân loại theo **loại can thiệp**. Trích nguyên văn, giữ cả lỗi chính tả/viết tắt.

### A1. Chỉnh vai & kỳ vọng

| Ngày | Nguồn | Trích |
|---|---|---|
| 09/10 01:50 | Codex | "Em làm luôn đi em, anh đâu phải dev" |
| 12/10 05:45 | Claude | "Trả lời tôi bằng tiếng Việt, ngắn gọn, đơn giản. Tôi là Head of Design, không phải dev: đừng bảo tôi gõ lệnh, tự chạy và tự xử lý lỗi môi trường (trên máy này dùng cmd để chạy npm vì PowerShell chặn npm.ps1; Playwright Chromium đã cài)." |
| 09/10 00:50 | Codex | "Anh không hiểu thuật ngữ nhưng cụ thể anh muốn là chỉ app của người dùng và app của đội ngũ y tế mới giải mã được data…" |
| 14/10 04:31 | Codex | "…Cần gì hỏi thêm đừng tự quyết nha" |

### A2. Bác bỏ vì thiếu ngữ cảnh / hỏi vô nghĩa

| Ngày | Nguồn | Trích |
|---|---|---|
| 08/10 11:30 | Codex (Q&A) | Q(agent): "…Anh đồng ý cách này, hay giữ hộp 'Keep draft / Replace draft' dù thành 4 bước?" → **A(Danh): "Đây là luồng gì? Mình đang giải quyết vấn đề gì vậy em? Đọc vậy ko hiểu ngữ cảnh không trả lời được"** |
| 14/10 05:11 | Codex | "Ok. Câu hỏi cuối cùng. Chúng ta đang giải quyết vấn đề gì?" |
| 20/10 09:49 | Codex (Q&A) | Q: xin email người nhận → **A: "Anh chỉ cần body content để xem qua, duyệt và tự copy"** |

### A3. Chỉnh hướng kỹ thuật / thẩm mỹ

| Ngày | Nguồn | Trích |
|---|---|---|
| 09/10 11:53 | Codex | "Hãy đảm bảo là không custom style nha, sửa từ thư viện để đồng bộ nha. Với nhớ để ý mấy chỗ màu gradient khai báo để nó hoạt động đúng trên cả 2 mode giúp anh" |
| 12/10 05:59 | Claude | "Toàn bộ UI đều phải trình bày English á" |
| 16/10 12:40 | Codex | "…Top bar: dạng bar như vậy khi scroll nó floating và những card bên dưới chạy qua khiến loạn thị giác không phân biệt được… Background nay sẽ thành dạng linear gradient blur…"; "Tổng thể tăng radius thêm 8px"; "Render preview anh xem để duyệt và tiến hành sau" |
| 22/10 02:00 | Claude | "Anh sẽ duyệt và sửa qua từng phần. Bắt đầu với những việc sau: Navigation bar: - Tắt debug và cho nó vô sub navbar bên dưới - Sub navbar phải floating… Activated item phải fill màu primary" |
| 22/10 02:05 | Codex | "…bỏ SVG tự vẽ, dùng ChartContainer/ChartTooltip của packages/ui." |
| 22/10 04:14 | Claude | "…theo format issue, nguyên nhân, kết quả và giải pháp" |

### A4. Chặn phạm vi / chống "tiện tay"

| Ngày | Nguồn | Trích |
|---|---|---|
| 14/10 10:18 | Codex | "Chỉ làm TK02 trong docs/features/resource-token/TASKS.md… Đừng làm TK03 hay task khác." |
| 16/10 12:48 | Codex | "Approve. Hãy đảm bảo là chỉ thực thi những mục anh đề cập thôi nha. Tiến hành luôn đi em" |
| 15/10 15:28 | Codex | "This is wrong task. Erase this" |
| 15/10 15:29 | Codex | "Xóa hết mọi việc đã làm ở đây" |
| 19/10 22:14 | Antigravity | "Thực thi theo hướng Subagent-driven, mỗi agent một phase (4 phases) và dùng 4 agent riêng biệt, tránh việc limit" |
| 22/10 06:27 | AionUI | "…lần trước làm sai. Bước 1: git revert ccefb60 (tạo commit mới, không reset)." |

### A5. Sửa vì agent dừng sai nhịp

| Ngày | Nguồn | Trích |
|---|---|---|
| 15/10 08:06 | Codex | "Ủa sao dừng vậy em?" |
| — | Antigravity `34847cca` | "Ủa sao dừng nữa rồi em?" |
| 15/10 07:58 | Codex | "Chạy liên tục CD02 → CD08 theo prompt Chat Dock, không dừng giữa các task để hỏi… Chỉ dừng khi: việc không thể đảo ngược, ngoài phạm vi PRD, test cũ đỏ mà không sửa được trong task…" |
| — | Antigravity `34847cca` | "Đây là việc đã làm, KHÔNG được git reset / checkout / stash / clean / xoá." |

### A6. Truy nguyên nhân (không chấp nhận sửa mù)

| Ngày | Nguồn | Trích |
|---|---|---|
| 14/10 05:00 | Codex | "Vậy có thể kết luận là do blur?" |
| 14/10 05:01 | Codex | "Hiện tại blur đang được handle như nào và vì sao nó gây giật giật ~300 ms như vậy?" |
| 14/10 05:02 | Codex | "Blur của system os đang hoạt động như nào mà mượt vậy em?" |
| 20/10 15:29 | Codex | "Liệt kê ra 6 lỗi đó là gì, nguyên nhân do đâu, và giải pháp là gì em" |
| — | Antigravity `2bd8f5ae` | "Dùng skills liên quan để điều tra giúp anh tại sao admin portal … lại rất chậm, vào dashboard chậm nhất. Rồi báo cáo lại cho anh biết nguyên nhân, kết quả, giải pháp" |

> **Mẫu hành vi đáng đóng gói:** chuỗi hỏi 3 bước — *"có phải do X?"* → *"X đang được xử lý thế nào và vì sao gây Z?"* → *"hệ điều hành làm X thế nào mà mượt?"*. Đây là **truy nguyên theo cơ chế**, không dừng ở triệu chứng.

### A7. Chỉnh nghiệp vụ / mô hình dữ liệu

| Ngày | Nguồn | Trích |
|---|---|---|
| — | Antigravity `227cb80c` | "Ồ tức là backend chưa xử lý vụ status này sao? Anh nghĩ status ở đây với draft với new nó đang bị sai trái sao sao á. Với anh thì Sage với Xám dim là chỉ trạng thái online hay offline của người đó… Còn draft với new lại là 2 cái độc lập nhỉ và nó nên là mini badge" |
| 19/10 12:31 | Codex | "Khi nói user làm trung tâm trong admin portal có nghĩa là ưu tiên công việc họ đang xử lý… Hiện tại Coach hay MD đều phải vô approvals để approve thì consultant mới go ahead được, nhưng nghịch lý là MD với Coach chỉ thấy…" |
| 14/10 04:37 | Codex (Q&A) | Q: chốt quy trình duyệt → **A: "Owner hiện tại là anh Tùng, có thể sau này sẽ chuyển sang người khác làm owner chắc vì vậy mà ảnh để owner"** |
| 14/10 08:39 | Codex (Q&A) | Q: có mở rộng mô hình dữ liệu không → **A: "Bổ sung bảng member và nối các màn hiện có; cần owner duyệt kỹ thuật"** |

### A8. Uỷ quyền có kiểm soát

| Ngày | Nguồn | Trích |
|---|---|---|
| 22/10 04:19 | Claude | "U3: có thể tìm được members. Anh toàn quyền quyết định trong nhánh này. Làm xong hết sẽ cần có báo cáo những việc này để Owner duyệt, hiện tại owner đang là người support anh hoàn thiện sản phẩm. Owner chỉ cần lý do thích đáng thôi" |
| 15/10 07:58 | Codex | "…Nếu không mở được trình duyệt để kiểm tra UI: ghi các kịch bản C chưa kiểm vào HANDOFF mục 'Chờ kiểm trình duyệt' rồi làm tiếp, không dừng." |
| 22/10 07:22 | AionUI | "Owner đã duyệt LG-02… Bắt đầu LG-03 ngay theo kế hoạch đã chốt… TDD cho mọi nhánh auth, security-review nếu cần" |

---

## 6. Phụ lục B — Khoảng trống & đề xuất kiểm chứng

| # | Khoảng trống | Ảnh hưởng | Cách bù |
|---|---|---|---|
| G01 | `writing-plans` không được dùng lần nào | Không có mẫu plan "chuẩn skill" để học | Lấy `features/*/TASKS.md` + `prompts/2026-10-20-admin-workspace-v2.md` làm mẫu plan thay thế |
| G02 | Antigravity giải protobuf theo vị trí field | Có thể sót câu ngắn | Đối chiếu `brain/*/transcript.jsonl` (đã làm, khớp 56/56) |
| G03 | 34 rollout Codex `.zst` chưa giải nén | Có thể thiếu phiên rất sớm | Đã có `thread_history_1.sqlite`; chỉ cần nếu muốn đối chiếu tool-call chi tiết |
| G04 | Không có skill nào cho "design → spec" | Quy trình đặc thù nhất của Danh chưa được đóng gói | Đây chính là giá trị lõi của `danh-method` |
| G05 | Chưa rõ tỷ lệ "Danh sửa" theo từng skill | Không định lượng được hiệu quả skill | Cần gán nhãn thủ công nếu muốn số liệu chính xác |

---

## 7. Ghi chú loại bỏ dữ liệu nhạy cảm

Đã chủ động **không đưa** vào tài liệu này:

- **Khoá/credential:** một chuỗi API key lộ trong log phiên (đã phát hiện và loại, không chép lại giá trị, không chép vị trí).
- **ID hạ tầng:** đường dẫn DB nội bộ, tên container, cổng dịch vụ, chuỗi kết nối — đã lược thành mô tả chung.
- **Dữ liệu bệnh nhân/client:** không trích bất kỳ tên, email, tình trạng sức khỏe, đơn thuốc hay nội dung hồ sơ nào. Các tham chiếu nghiệp vụ chỉ ở mức "dữ liệu lâm sàng", "PHI".
- **Thông tin cá nhân:** không đưa địa chỉ email, số điện thoại, hay tên client cụ thể ngoài tên vai trò nội bộ.

---

## 8. Tóm tắt một trang cho `danh-method`

1. **Vai:** Head of Design, không phải dev → agent phải tự chạy, tự sửa môi trường, không bắt gõ lệnh.
2. **Nhịp:** ý tưởng → **tài liệu** → **preview HTML** → **duyệt** → code theo task → review chéo → merge.
3. **Biên:** mỗi lượt một phạm vi do Danh khai báo; không tự mở rộng; không reset việc dở; dừng chỉ ở 4 lý do đã định.
4. **Bằng chứng:** test/typecheck/build thật, TDD cho đường nhạy cảm, kiểm 3 breakpoint × 2 theme, báo cáo `issue → nguyên nhân → kết quả → giải pháp` + mục "Bỏ qua/Rủi ro".
5. **Chất lượng thị giác:** token/thư viện là luật; gradient/theme phải đúng 2 mode; phân cấp thị giác trước, trang trí sau; dashboard phải có nghĩa nghiệp vụ.
6. **Điều hành:** chia theo surface, mỗi agent một nhánh/worktree, reviewer không sửa code, "Sẵn sàng để A merge".
7. **Chống ảo giác:** hỏi phải kèm ngữ cảnh; truy nguyên theo cơ chế; tài liệu cũ (HANDOFF, prompt cũ) không được tin hơn trạng thái Danh khai báo.