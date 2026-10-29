---
name: feature-spec
description: Writes the feature documents of the Danh Method (Stage 1–3) — intake, structural decisions, then PRD, USER_FLOW, GUIDANCE and TASKS with locked decisions (Dnn/Wnn), open questions (Q1..Qn with proposed defaults), acceptance criteria (ACnn), entry routes and tasks checked against the 3-step rule and 6×6 rule. Use when starting a new feature, when someone says "viết PRD", "viết spec", "mô tả chức năng để anh duyệt", "user flow", "chia task", or before any code is written for a feature.
---

# Feature spec (Stage 1–3)

Mục tiêu: người phụ trách sản phẩm **duyệt ý tưởng bằng chữ** trước khi tốn tiền design/code. Không vẽ, không code ở bước này.

Đọc trước: `process/project.md`, operator profile, `danh-method/references/design-workflow.md` (Stage 1–3), và feature mẫu đã duyệt gần nhất trong repo spec (pattern phải giống "cùng một sản phẩm").

## 1. Làm rõ vấn đề trước (brainstorming)

- Viết 1 câu: **người dùng nào, đang làm việc gì, đang kẹt ở đâu**. Không viết được câu này thì hỏi lại, đừng đoán.
- Đọc nguồn (`sources/`, PRD feature liên quan, code hiện tại ở chế độ chỉ đọc) trước khi hỏi. Chỉ hỏi chỗ thiếu mà ảnh hưởng cấu trúc hoặc hành vi.
- Câu hỏi gom thành bảng Q kèm **mặc định đề xuất** để người phụ trách duyệt nhanh, không hỏi rời từng câu.
- "Dashboard đẹp mà vô nghĩa" là trượt: với mỗi màn, nêu câu hỏi nghiệp vụ nó trả lời.

## 2. Quyết định cấu trúc (Stage 3) — dùng `references/structural-checklist.md`

1. Với mỗi **đối tượng chính**: nguồn nội dung, phạm vi sửa, vòng đời (trạng thái + hành động chuyển), ai xem/sửa/duyệt, lan truyền thay đổi khi tái dùng.
2. **Danh mục màn hình** (S…), drawer (D…), mobile (M…), trạng thái mỗi màn (Ready / Empty / Loading / No access / Error).
3. **Điều hướng**: vị trí và hành vi là hai trục riêng; biện luận theo số destination, độ sâu, nhu cầu ngang, tần suất chuyển, thiết bị.
4. **Đường vào E…** và **task T…**: ghi điểm bắt đầu, chuỗi bước, kết quả. Đường vào ≤ 3 bước; task ≤ 3 bước, đếm riêng. Vượt → sửa điều hướng/luồng, không giấu bước. Ngoại lệ phải được người phụ trách duyệt và ghi rõ.
5. **Một hành động chính** mỗi điểm quyết định; **6×6**; quyền: nút không có quyền vẫn bấm được và giải thích lý do + ai làm được.
6. **Mine / hàng việc**: "user làm trung tâm" = ưu tiên việc người dùng đang xử lý; định nghĩa thứ tự.

## 3. Viết bộ tài liệu

Tạo `features/<feature>/` theo mẫu:

| File | Mẫu | Ghi chú |
|---|---|---|
| `PRD.md` | `references/prd-template.md` | Nguồn chính. Quyết định đã chốt + Q chờ duyệt + AC + ngoài phạm vi |
| `USER_FLOW.md` | `references/user-flow-template.md` | Shell, danh mục màn/trạng thái, E/T có đếm bước, mermaid luồng chính |
| `GUIDANCE.md` | `references/guidance-template.md` | Cho agent: dùng lại gì, mô hình dữ liệu gợi ý, quyền, view model, **bẫy** |
| `TASKS.md` | `references/tasks-template.md` | Tách Logic / UI / Việc kéo theo; mỗi task có "xong khi" gắn AC |
| `README.md` | 5 dòng | Là gì, trạng thái, đọc file nào trước |

Quy tắc viết:
- Mỗi quyết định có ID ổn định; không đổi số khi sửa, chỉ thêm. Quyết định đổi thì ghi ngày và lý do.
- Tách rõ **đã chốt** và **giả định** (in nghiêng hoặc cột "mặc định đề xuất").
- AC viết được thành test hoặc thành bước trình duyệt; có AC design (3 bước, 1 hành động chính, breakpoint, theme, AA).
- Ghi "Không làm" (ngoài phạm vi) cụ thể như phạm vi.
- Không chép dữ liệu thật của khách/bệnh nhân vào tài liệu; dùng dữ liệu hư cấu.
- Thêm dòng CHANGELOG + dòng mục lục README.

## 4. Gate

Dừng và gửi người phụ trách sản phẩm: link PRD, số Q cần duyệt (kèm mặc định), E/T nào sát 3 bước, ngoài phạm vi. Chưa duyệt thì không sang `design-prototype` hay `prompt-contract` — trừ khi họ nói "dùng mặc định, chạy luôn"; khi đó ghi "Q1–Qn: dùng mặc định đề xuất, chờ phản hồi sau demo" vào PRD.

Duyệt xong: cập nhật trạng thái PRD (phiên bản, ngày, ai duyệt), đóng Q thành quyết định, commit + push repo spec.

## 5. Khảo sát và hợp đồng (A2.1, A2.2; B11)

- Research mode: hỏi hiện trạng chức năng trước, đọc code chỉ đọc rồi trình bày lựa chọn. Feature lõi trước màn tổng hợp.
- XX-00 chỉ ghi tên file/hàm/component đã mở đọc; kèm đường dẫn + commit. Điều phối đối chiếu baseline trước task 01.
- GUIDANCE có hợp đồng dữ liệu: field ngày, mốc/múi giờ, hai biên, đơn vị đếm, thiếu dữ liệu và breaking change; mẫu `references/guidance-template.md`.
- “Cowork chốt theo mặc định” là đề xuất có nhãn, chưa phải người phụ trách duyệt. Thi hành mặc định chỉ khi đã được uỷ quyền rõ.
- Dữ liệu mẫu cần duyệt: `references/demo-proposal-template.md`, không tự nạp DB demo.
