---
name: prompt-contract
description: Writes Danh Method execution prompts as contracts, not messages — context, real current state, locked decisions (Q/A), gates, task order, per-task procedure, hard rules, stop conditions, HANDOFF template and a short resume command; split into design / logic / UI / acceptance / fix prompts that can run in parallel. Use when someone says "soạn prompt", "viết prompt cho code mode", "prompt cho agent", "resume prompt", "bàn giao cho agent khác", or after a PRD/preview is approved and work must be handed to an executing agent or subagent.
---

# Prompt hợp đồng

Prompt là **hợp đồng**: agent nhận nó (subagent, Codex, Antigravity, Claude Code) phải làm đúng mà không cần hỏi lại, và dừng đúng chỗ. Lưu ở repo spec: `prompts/YYYY-MM-DD-<chủ-đề>.md`, thêm dòng CHANGELOG + mục lục.

## 1. Chọn loại prompt

| Loại | Khi nào | Mẫu |
|---|---|---|
| **Design** | PRD duyệt, cần preview HTML | `references/prompt-variants.md#design` |
| **Logic** | PRD duyệt (chạy song song với design) | `#logic` |
| **UI** | Preview duyệt (G1) + logic có view model | `#ui` |
| **Master** | Feature nhỏ, một agent làm trọn | `references/master-prompt-template.md` |
| **Acceptance** | Code xong, cần Stage 6 | `#acceptance` |
| **Fix theo review** | Có review PR / audit | `#fix` |
| **Resume / takeover** | Agent hết hạn mức, đổi agent | `#resume` |

Tách design / logic / UI để chạy song song và để mỗi agent có vùng sở hữu riêng.

## 2. Thành phần bắt buộc (theo thứ tự)

1. **Vai + người giao việc**: "Bạn là agent <design|code|review>…"; người giao là ai (designer, không phải dev → báo tiếng Việt, ngắn, theo màn hình, không đưa lệnh).
2. **Đọc trước (theo thứ tự cố định)**: operator profile → quy tắc repo (AGENTS.md, working-rules) → HANDOFF → PRD (nguồn chính) → USER_FLOW → GUIDANCE → TASKS → REVIEW/DESIGN-NOTES → prototype. Đường dẫn tuyệt đối.
3. **Trạng thái thực tế**: HEAD, nhánh, cái gì đã xong, cái gì đang dở chưa commit (liệt kê file). Ghi snapshot này mới hơn HANDOFF khi đã kiểm; dữ kiện Git/code thật vẫn thắng snapshot. **Tự kiểm git trước khi viết dòng này.**
4. **Gate & quyết định đã chốt**: G1/G2/G3 mở chưa; Q01…Qn dưới dạng quyết định cụ thể (giá trị, công thức, hành vi biên). Không để agent tự diễn giải.
5. **Nhánh & nơi làm**: nhánh, worktree, cắt từ đâu, PR draft, "Depends on #n", file local cần chép vào worktree (không commit).
6. **Phạm vi**: Làm / Không làm (dẫn mục "Ngoài phạm vi" của PRD) / Chỉ sửa tối thiểu.
7. **Thứ tự task**: "không nhảy cóc"; batch hay một task.
8. **Cách làm mỗi task**: đọc → grep callers → test đỏ trước → code nhỏ nhất → verify theo tier → tick TASKS (+1 dòng kết quả có ngày) → CHANGELOG → HANDOFF + log ngày → commit → báo 3–5 dòng → sang task tiếp.
9. **Quy tắc cứng**: git an toàn, không dữ liệu mẫu trong code, không tên người trong repo code, không đụng cổng/DB demo, UTF-8 LF, công cụ: Superpowers và UI UX Pro Max.
10. **Điều kiện dừng** (viết sẵn, ngoài các điều này thì **không dừng hỏi**): việc không đảo ngược được; ngoài phạm vi PRD; ảnh hưởng dữ liệu/quyền mà PRD không trả lời; FAIL phân loại theo `execute-tasks/references/failure-taxonomy.md`; lỗi code còn FAIL sau ngân sách đã cấp; sắp hết hạn mức (→ typecheck xanh, cập nhật HANDOFF, commit rồi mới dừng).
11. **Bàn giao**: file log/HANDOFF cập nhật gì; PR draft; báo cáo mấy dòng gồm những gì; dòng `verify:` nguyên văn; mục Bỏ qua + Rủi ro.
12. **Mẫu HANDOFF** (`references/handoff-template.md`) và **lệnh resume ngắn** ở cuối.

## 3. Viết sao cho đúng

- Câu mệnh lệnh, ngắn; mỗi quy tắc một dòng; in đậm chỗ hay sai.
- Đường dẫn tuyệt đối; lệnh đầy đủ (kể cả biến môi trường test).
- Không mô tả lại PRD — trỏ tới mục (`PRD §4.3`, `AC07`).
- Prompt sửa đổi: commit trong repo spec rồi bảo phiên đang chạy "Prompt đã đổi (commit <mã>). Bỏ hết nội dung prompt cũ trong phiên, đọc lại file từ đầu."
- Prompt cũ đã xong: thêm ghi chú đầu file "File này giữ quyết định Q…, không phải lệnh chạy lại".

## 4. Trước khi giao

Tự kiểm: một agent mới, không có ngữ cảnh, đọc prompt này có biết (a) làm gì, (b) không làm gì, (c) khi nào dừng, (d) báo gì không? Thiếu → sửa. Rồi gửi người phụ trách sản phẩm duyệt Q/gate nếu chưa duyệt.

## 5. Hợp đồng tiếp tục đến kết quả (A4.1–A4.3, A4.5; B1/B2)

- Delta: dẫn prompt gốc + commit; bảng Giữ / Thay / Bỏ; chốt bộ mã task nếu lệch; AC lấy PRD hiện hành. Mẫu: `references/continuation-templates.md`.
- Gom câu hỏi có ngữ cảnh + lựa chọn + hệ quả một lượt từ đầu, làm phần độc lập trong lúc chờ. Khi cần chốt, kết thúc bằng đúng một câu hỏi tổng hợp; không lặp câu đã trả lời.
- Không dừng sau đọc/lập kế hoạch/merge; không gọi xong khi còn placeholder. Blocker phải mới, có bằng chứng. Thiếu một field không ngăn phần độc lập. Kết thúc khi đầu ra, AC, kiểm, bàn giao và đóng gói/push được giao đều có bằng chứng.
- Agent thi hành không tự mở subagent; cần chia việc trả điều phối. Báo cáo tổng: `docs/engineering/<feature>-takeover-<ngày>.md` trong repo code.
- Audit→sửa, vá thư viện, tích hợp & dọn: `references/prompt-variants.md`. Không đổi triết lý/phạm vi bằng delta.
