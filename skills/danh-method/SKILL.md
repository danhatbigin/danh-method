---
name: danh-method
description: Entry point of the Danh Method, a designer-led way to build a product with AI agents (spec → HTML preview → approve → contract prompt → subagent execution → review → acceptance). Use at the start of any product/feature build, when someone says "làm theo danh-method", "theo cách anh Danh", "bắt đầu feature mới", "build sản phẩm mới", or when unsure which danh-method skill applies next.
---

# Danh Method — cửa vào

Phương pháp của Danh Nguyen (Head of Design, Bigin) để một designer tự dẫn dắt agent build sản phẩm tới mức hoàn thiện, đúc kết từ thực tế xây dựng sản phẩm hoàn chỉnh. Skill này định hướng; việc cụ thể nằm ở các skill con.

## 0. Quy tắc cứng: Tách biệt tuyệt đối Tài liệu (`docs` / `spec`) và Source Code

- **Source repo chỉ chứa mã nguồn chạy sản phẩm và test.** Tuyệt đối không đặt tài liệu nghiên cứu (`research/`), PRD/đặc tả (`specs/`, `features/`), nhật ký (`log/`), prompt bàn giao (`prompts/`), `HANDOFF.md` hay ví dụ khảo sát (`examples/`) vào trong repo source code.
- Toàn bộ tài liệu nghiên cứu, đặc tả, lịch sử quyết định và bàn giao bắt buộc nằm ở thư mục `docs/` ngoài source repo (hoặc repo `<tên>-spec` riêng biệt).
- Trong `.gitignore` của repo source luôn chặn `research/`, `docs/`, `HANDOFF*.md` để tránh commit nhầm tài liệu vào mã nguồn.

## 1. Trước khi làm gì: đọc hồ sơ và kiểm plugin đi kèm

1. Tìm **operator profile** của người đang làm việc: `process/operator-<tên>.md` trong repo spec (hoặc nội dung trong `CLAUDE.local.md` / `AGENTS.override.md`). Không có → chạy skill `project-setup` trước.
2. Tìm **project config**: `process/project.md` (repo, stack, design system, lệnh kiểm tra, cổng, luật nhánh, owner).
3. **Kiểm plugin đi kèm** (chạy khi bắt đầu phiên hoặc setup):
   - `node <plugin>/hooks/scripts/check-uipro.mjs --json` → tra cứu UI/UX, token (`design-tokens/references/install-ui-ux-pro-max.md`).
   - `node <plugin>/hooks/scripts/check-superpowers.mjs --json` → kỷ luật thi hành (`danh-method/references/install-superpowers.md`).
   - Thiếu plugin nào → **hỏi xin phép một lần** (nêu lý do rõ ràng), không tự cài. Bị từ chối thì làm tiếp và ghi nhận "không có plugin", không hỏi lại trong phiên.
4. Áp profile vào cách giao tiếp: designer thì không đưa lệnh terminal, nói theo những gì thấy trên màn hình; dev thì được nói kỹ thuật nhưng vẫn giữ mọi gate.

## 2. Vòng đời một feature (bản đồ skill)

### 2.1 Chọn đường trước (theo diff thật, không theo cảm giác)

| Đường | Khi nào | Quy trình |
|---|---|---|
| **Nhẹ** | Tier skip/0/1 và không thêm/đổi đường ghi dữ liệu | Một agent làm; verifier một lần cuối; người phụ trách xem giao diện. Không cần kịch bản/test khoá/review riêng; ghi đường + dòng verify trong log là đủ |
| **Vừa** | Tier 2, không thêm/đổi đường ghi dữ liệu, không chạm vùng rủi ro | Kịch bản + test khoá; `slice-implementer` + một lượt review độc lập toàn diff; kiểm theo vùng một lần sau freeze |
| **Đủ** | Tier 3, hoặc thêm/đổi đường ghi dữ liệu, migration, quyền, tiền, dữ liệu nhạy cảm | Toàn bộ: bất biến + bản đồ ghi, ba vai trò Test/Fix/Review, review hội tụ (2 lượt sạch cùng commit), PR gate, gói review owner |

- Đầu task điều phối khai đường vào `.danh/track.json` của repo code (`{"track":"Vừa","task":"…"}`) hoặc dòng `Đường: …` trong TASKS.
- Lúc freeze chạy `node .verify/verify.mjs --classify` trên diff thật. Nặng hơn đường đã khai → **tự nâng** và làm bù bước còn thiếu. Chỉ nâng, không hạ; muốn hạ phải có người phụ trách sản phẩm (nghiệp vụ) hoặc owner (kỹ thuật) ghi lý do.
- "Đường ghi dữ liệu" tính cả server action, domain, repository, job, migration; một file UI gọi action ghi mới cũng tính.
- Lý do: mức nặng của quy trình phải trả đúng cho rủi ro. Việc UI thuần mà chạy pipeline đầy đủ thì tốn vô ích; việc ghi dữ liệu mà chạy đường nhẹ thì lỗi tranh chấp, quy mô, quyền chỉ lộ ra ở review, mỗi trường hợp tốn một vòng.

### 2.2 Các bước

| Bước | Việc | Skill | Gate (ai duyệt) |
|---|---|---|---|
| 0 | Dựng repo spec, hồ sơ người dùng, config dự án (vai PO / owner kỹ thuật, runtime verify) | `project-setup` | — |
| 0.5 | Chốt token, trang token để duyệt | `design-tokens` | G0 token |
| 1 | Stage 1–3: PRD / USER_FLOW / GUIDANCE (**bất biến + bản đồ ghi**) / TASKS | `feature-spec` | Người phụ trách duyệt chữ (D/Q); owner duyệt bất biến |
| 1.5 | **Kịch bản** (SCENARIOS) trình bằng sơ đồ trực quan — đường Vừa/Đủ | `feature-spec` → `scenario-tests` | PO duyệt nghiệp vụ, owner duyệt kỹ thuật |
| 2 | Preview component thật ‖ **test khoá** do `test-translator` dịch từ kịch bản | `design-prototype` ‖ `scenario-tests` | G1 preview; manifest khoá |
| 3 | Prompt hợp đồng / AGENT-RUN (allowlist, freeze, mức cách ly thật) | `prompt-contract` | G2 |
| 4 | Fix: một `slice-implementer` làm trọn lát dọc (Nhẹ: `ui-implementer`/một agent) | `execute-tasks` | Điều kiện dừng viết sẵn |
| 5 | Freeze → điều phối chạy verifier → review toàn PR theo bất biến → ledger theo nhóm nguyên nhân → sửa cả nhóm | `subagent-orchestration`, `review-report` | Đủ: review hội tụ |
| 6 | Nghiệm thu theo AC + kịch bản, rồi **một gói review** cho owner | `design-review`, `review-report` | Người phụ trách chấp nhận; owner G3 |

Lệch chuẩn ở bất kỳ bước nào → **Spec Issue** quay về bước 1.5, không sửa test cho khớp code. Sau 3 vòng review vẫn có major mới → quay về bước 1 (bất biến/bản đồ ghi), không vá vòng 4.

Thứ tự thật: bước 0.5 làm một lần đầu dự án; prototype phải dùng token đã duyệt. Không nhảy bước. Không code trước khi có tài liệu được duyệt. Không thi hành trước khi preview được duyệt. Ngoại lệ chỉ khi người phụ trách sản phẩm nói rõ trong lượt này.

## 3. Triết lý (đọc kỹ `references/principles.md` khi cần lý do)

- **Cấu trúc trước bề mặt.** Đúng việc → đúng cấu trúc → đẹp. "Đẹp mà vô nghĩa" là trượt.
- **Ràng buộc quyết, gu tranh luận.** Phá ràng buộc thì đổi thiết kế, giữ ràng buộc.
- **Custom phải xứng đáng.** Bắt đầu từ thứ đã có (design system, component, token); không custom style ngoài thư viện.
- **Duyệt quyết định bằng tài liệu; kiểm dữ kiện bằng Git/code thật.** Duyệt ý tưởng bằng chữ và preview trước khi tốn tiền code.
- **Bằng chứng, không phải lời hứa.** Test, verify, ảnh chụp thật; không báo "xong" khi chưa kiểm.
- **Phạm vi do người giao khai báo từng lượt.** Không tự mở rộng, không "tiện tay".

Quy trình thiết kế đầy đủ (Stage 1–6, luật 3 bước, 6×6, quy tắc component): `references/design-workflow.md`.

## 4. Luật giao tiếp (áp mọi skill)

- Trao đổi **tiếng Việt**, ngắn, đơn giản; **chữ trên UI bằng tiếng Anh** (trừ khi project config nói khác).
- Không bắt người phụ trách sản phẩm gõ lệnh; tự chạy, tự xử lý lỗi môi trường (Windows: npm qua `cmd` nếu PowerShell chặn `npm.ps1`).
- Không dùng thuật ngữ khi không cần; giải thích bằng ngôn ngữ nghiệp vụ và những gì thấy trên màn hình.
- **Câu hỏi phải tự đứng được:** nêu luồng nào, đang giải quyết vấn đề gì, các lựa chọn và hệ quả. Câu hỏi thiếu ngữ cảnh sẽ bị trả lại ("Đây là luồng gì? Mình đang giải quyết vấn đề gì?").
- Đủ ngữ cảnh thì làm, không hỏi vặt; không dừng giữa chừng không lý do ("Ủa sao dừng vậy em?").
- Việc lớn thì hỏi trước: mở rộng mô hình dữ liệu, đổi kiến trúc, xoá dữ liệu, việc không đảo ngược được, ngoài phạm vi PRD.
- Thấy mâu thuẫn, lỗi, rủi ro (kể cả lỗi của chính mình) thì nói ngay.
- Báo cáo sau mỗi task: 3–5 dòng, theo những gì thấy được, nêu bước tiếp theo.
- Không ghi tên người hay luật riêng của người phụ trách sản phẩm vào repo code; dùng vai trò (owner, người phụ trách sản phẩm).

## 5. Nguồn sự thật khi lệch nhau

Hai trục riêng (D3):
- **Dữ kiện:** Git/code thật > snapshot prompt > HANDOFF (cache). Kiểm cả lời “xong” của người điều phối/agent. HEAD lạ → dừng, giữ nguyên việc dở và báo bằng chứng; không ép thực tế theo prompt.
- **Quyết định/phạm vi:** người phụ trách > prompt hiện hành tại HEAD > PRD đã duyệt. Prompt đổi → bỏ bản cũ, đọc lại. Quyết định mới cập nhật PRD trước thi hành; suy luận ghi là giả định.

## 6. Quyền quyết định

- **Sản phẩm / UX:** người phụ trách sản phẩm.
- **Kỹ thuật / merge:** owner kỹ thuật (ghi trong project config). Cần "lý do thích đáng" khi đề xuất.
- "Toàn quyền trong nhánh này" chỉ áp cho nhánh đó; báo cáo vẫn bắt buộc.

## 7. Công cụ và plugin đi kèm

- **ui-ux-pro-max** là plugin đi kèm (gợi ý nền thị giác, sinh token, soát màu viết cứng, tra cứu UX). Chưa cài thì **hỏi xin phép, nêu lý do** rồi mới cài — cách làm ở `design-tokens/references/install-ui-ux-pro-max.md`. Bị từ chối thì làm thủ công, không hỏi lại trong phiên.
- **Superpowers** là plugin companion giữ **kỷ luật thi hành** (không phải menu tuỳ chọn). Chưa cài thì hỏi xin phép theo `danh-method/references/install-superpowers.md`. Ánh xạ giai đoạn → Superpowers skills:
  - Trước Stage 1 (Hiểu vấn đề): `brainstorming` (làm rõ trước khi viết spec/PRD).
  - Sau Stage 3 / Kế hoạch: `writing-plans` (lập kế hoạch chi tiết từng task, chữ ký, test).
  - Stage 4 (Thi hành task): `executing-plans`, `using-git-worktrees`, `test-driven-development` (TDD red-green-refactor).
  - Khi gặp lỗi / test hỏng: `systematic-debugging` (điều tra 4 pha tìm nguyên nhân gốc rễ).
  - Stage 4 / Bước 5 (Subagent): `subagent-driven-development` (chia subagent theo bề mặt độc lập).
  - Stage 6 (Review & Nghiệm thu): `requesting-code-review`, `receiving-code-review`, `verification-before-completion` (xác minh bằng chứng trước khi báo xong).
- Thiết kế/redesign: `ui-ux-pro-max` để tra cứu; giữ design system đã chốt. Superpowers giữ kỷ luật thi hành.
- Kiểm tra: verify-kit (`execute-tasks/assets/verify-kit`).

## 8. Nhịp điều hành v0.3 (findings §1, A1.2, D5)

- Làm feature lõi trước bề mặt tổng hợp phụ thuộc nó; nghiên cứu thì hỏi hiện trạng chức năng trước khi chọn hướng.
- Giao việc: “Đọc và làm theo <đường dẫn prompt>”. Prompt lưu trong repo spec.
- Model mạnh điều phối; subagent model rẻ làm phạm vi hẹp. **Chỉ dùng mô hình Coordinator + Subagents ngắn hạn (ephemeral), không dùng multi-agents kể cả khi có orchestrator và phân role** (tác giả repo đã trả giá hơn \$40 tiền API token và rất nhiều thời gian: multi-agents làm phình to context theo cấp số nhân, trễ đồng bộ và cháy sạch quota). Chỉ chia khi glob file không chồng nhau; một writer và verifier chỉ đọc khi tiếp quản; một tác vụ nặng tại một thời điểm.
- Báo người phụ trách tối đa **3 điểm đạt / 3 điểm cần sửa / 1 quyết định**, ưu tiên ảnh/graph và số đo thật; đây là sở thích làm việc.
- Stage 6 đạt chưa phải merge-ready: cần `--pr` PASS, Stage 6, bằng chứng từng AC và hết blocker; sau đó còn vòng owner review G3. Không tự merge khi chưa có quyền.

## 9. Tự động nhận diện giai đoạn & trigger

Hook `pipeline-nudge` (SessionStart + mỗi lần người dùng gửi lệnh) tự nhắc khi trạng thái đổi: kịch bản đã duyệt chưa có test khoá, Spec Issue đang mở, diff nặng hơn đường đã khai, task chưa khai đường. Hook `guard-spec-tests` chặn ghi test khoá ngoài cửa sổ Test. Codex/Antigravity/AionUI không có hook: chạy tay `node <plugin>/hooks/scripts/pipeline-nudge.mjs --json`.

Khi người dùng hỏi *"đang ở bước nào"*, *"làm gì tiếp"*:
```bash
node skills/danh-method/scripts/detect-stage.mjs [--spec <docs>] [--code <codeRoot>] [--feature <tên>] [--json]
```
Các giai đoạn: **0** setup · **0.5** token G0 · **1-3** đặc tả · **4A** prototype ‖ test-translator · **4B** điều phối chụp ảnh, duyệt G1 · **3S** chưa có kịch bản được duyệt (chặn implementer, đường Vừa/Đủ) · **3T** test khoá chưa đủ (chặn implementer) · **4C** `slice-implementer` (Nhẹ: `ui-implementer`) · **5** review toàn PR (`code-reviewer`) · **6** nghiệm thu (`acceptance-tester`) · **COMPLETE** chờ owner G3.

Ở giai đoạn cần subagent, coordinator **chủ động đề xuất** subagent kèm model (rẻ cho việc hẹp; giữ model mạnh cho `test-translator` và `slice-implementer` vì chúng quyết định chất lượng mọi vòng sau) và chờ người dùng duyệt trước khi spawn.
