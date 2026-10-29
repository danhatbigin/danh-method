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

| Bước | Việc | Skill | Gate (ai duyệt) |
|---|---|---|---|
| 0 | Dựng repo spec, hồ sơ người dùng, config dự án | `project-setup` | — |
| 0.5 | Stage 2: chốt token (màu, font, bo góc, khoảng cách, light/dark), dựng **trang HTML token** để duyệt | `design-tokens` | Duyệt token (G0) |
| 1 | Stage 1–3: hiểu vấn đề, quyết định cấu trúc, viết PRD / USER_FLOW / GUIDANCE / TASKS | `feature-spec` | Người phụ trách sản phẩm duyệt chữ (D/Q) |
| 2 | Stage 4: preview component thật + token controls MD/JSON; điều phối chụp ảnh/REVIEW | `design-prototype` | Duyệt preview (G1) |
| 3 | Viết **prompt hợp đồng** cho phần thi hành (design / logic / UI tách riêng) | `prompt-contract` | Duyệt Q/A đã chốt (G2) |
| 4 | Thi hành: một task hoặc một batch, TDD, verify theo tier, git an toàn | `execute-tasks` | Điều kiện dừng viết sẵn |
| 5 | Điều phối subagent theo bề mặt, reviewer chỉ đọc diff | `subagent-orchestration` | Kiểm bằng chứng; G3 sau Stage 6 |
| 6 | Review, truy nguyên nhân, báo cáo issue → nguyên nhân → kết quả → giải pháp | `review-report` | — |
| 7 | Stage 5–6: audit UX, nghiệm thu trên bản chạy thật, ghi ACCEPTANCE trung thực | `design-review` | Người phụ trách sản phẩm chấp nhận; sau đó owner review G3 |

Thứ tự thật: bước 0.5 làm một lần đầu dự án (và khi token đổi lớn), có thể chạy song song với bước 1 của feature đầu tiên; nhưng prototype (bước 2) phải dùng token đã duyệt.

Không nhảy bước. Không code trước khi có tài liệu được duyệt. Không thi hành trước khi preview được duyệt. Ngoại lệ chỉ khi người phụ trách sản phẩm nói rõ trong lượt này.

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
- Model mạnh điều phối; subagent model rẻ làm phạm vi hẹp. Chỉ chia khi glob file không chồng nhau; một writer và verifier chỉ đọc khi tiếp quản; một tác vụ nặng tại một thời điểm.
- Báo người phụ trách tối đa **3 điểm đạt / 3 điểm cần sửa / 1 quyết định**, ưu tiên ảnh/graph và số đo thật; đây là sở thích làm việc.
- Stage 6 đạt chưa phải merge-ready: cần `--pr` PASS, Stage 6, bằng chứng từng AC và hết blocker; sau đó còn vòng owner review G3. Không tự merge khi chưa có quyền.
