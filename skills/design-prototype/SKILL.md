---
name: design-prototype
description: Builds the Danh Method HTML preview gate (Stage 4) — a static, double-click-to-open prototype with a dev bar (role, theme, page, state, proposals toggle), all screens/drawers/states from USER_FLOW, fictional data, review screenshots at 1440/768/390 in light and dark, and DESIGN-NOTES with the Stage 5 checklist. Use when someone says "render preview anh xem", "dựng prototype", "preview html để duyệt", "redesign màn", or before any UI code is written.
---

# Design prototype (Stage 4 — preview gate)

HTML render được là **ngôn ngữ chung** giữa người phụ trách sản phẩm và agent: nhanh hơn Figma, chính xác hơn chữ. Không có preview được duyệt thì không code UI.

Vai: agent **design**. **Không** viết code app, **không** sửa repo code, **không** commit/push (để nguyên cho người điều phối review).

## 1. Đọc trước (theo thứ tự)

1. `features/<feature>/PRD.md`, `USER_FLOW.md` — **nguồn chính**: phạm vi, màn, trạng thái, E/T, số bước.
2. `danh-method/references/design-workflow.md` Stage 3–5.
3. **Feature mẫu đã duyệt và đã code** (prototype + DESIGN-NOTES + ảnh code thật). Feature mới phải trông và hành xử như cùng một sản phẩm.
4. **Token thật, chỉ đọc**: trang token đã duyệt (`design-system/tokens.html`, gate G0 của skill `design-tokens`) và file CSS nguồn ghi trong `process/project.md`. Không phát minh token; thiếu token thì dừng, đề xuất qua `design-tokens`.
5. Màn hiện tại (ảnh/route) để biết đang có gì.

## 2. Cách làm — cấu trúc trước, bề mặt sau

1. Dựng cấu trúc + luồng bằng component/pattern có sẵn, **chưa style**.
2. Tự kiểm: mỗi E/T đếm bước thật; mỗi điểm quyết định một hành động chính; 6×6. Trượt → sửa cấu trúc trước.
3. Rồi mới hoàn thiện style bằng token thật, theo `references/design-rules.md`.
4. Tra cứu pattern bằng `ui-ux-pro-max` nếu cần (ví dụ `--design-system "<loại sản phẩm>"`). Không Superdesign. Không ponytail.

## 3. Sản phẩm phải giao

Tất cả trong `features/<feature>/` — chi tiết ở `references/prototype-spec.md`:

1. `prototype/<feature>.html` + `.css` + `.js`: mở double-click là chạy, không server, không gọi mạng ngoài trừ Google Fonts; có **dev bar** gập được; dữ liệu hư cấu đủ để mọi trạng thái xuất hiện tự nhiên; mọi drawer mở/đóng được; hành động chính đổi trạng thái thấy được.
2. Đủ màn + trạng thái theo USER_FLOW §2 (S…, D…, M…).
3. `review-screens/` PNG ở **1440 / 768 / 390 × light / dark** cho các màn quan trọng — chụp bằng `scripts/capture-screens.mjs` (Playwright). Kiểm luôn không tràn ngang.
4. `DESIGN-NOTES.md` theo `references/design-notes-template.md`: bảng kiểm Stage 5 (E, T, số bước thực tế, đạt/không), component dùng lại vs mới (kèm lý do), giả định, **câu hỏi cho người phụ trách sản phẩm**, **Đề xuất ngoài scope** (chỉ hiện sau công tắc Proposals).

Gặp chỗ phải quyết về sản phẩm: ghi vào DESIGN-NOTES rồi hỏi, **không tự chọn**. Cần chọn để prototype hoàn chỉnh thì chọn phương án an toàn nhất và ghi "Giả định đã chọn".

## 4. Bàn giao (3–5 dòng)

Mở file nào để xem; ảnh nằm đâu; bao nhiêu E và T đạt 3 bước; câu hỏi cần quyết; có đề xuất ngoài scope nào.

## 5. Vòng sửa

Người phụ trách sửa theo từng phần ("Anh sẽ duyệt và sửa qua từng phần"). Mỗi vòng:
- Chỉ sửa đúng mục được nêu. Ghi "Vòng n · đã sửa gì" vào DESIGN-NOTES; quyết định mới ghi ngày.
- Chụp lại đúng các màn bị ảnh hưởng.
- Khi duyệt: ghi vào PRD trạng thái "Preview v<x> đã duyệt <ngày>", mở gate G1 trong TASKS.
