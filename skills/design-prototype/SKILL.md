---
name: design-prototype
description: Builds the Danh Method HTML preview gate (Stage 4) — a real-component-rendered, double-click-to-open prototype with editable token parameters and MD/JSON round-trip with a dev bar (role, theme, page, state, proposals toggle), all screens/drawers/states from USER_FLOW, fictional data, review screenshots at 1440/768/390 in light and dark, and DESIGN-NOTES with the Stage 5 checklist. Use when someone says "render preview anh xem", "dựng prototype", "preview html để duyệt", "redesign màn", or before any UI code is written.
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

1. Render cấu trúc + luồng từ **component thật** của design system bằng runtime/compiler của project, **chưa style thêm**. Không dựng HTML mô phỏng component. Cách làm: `references/component-rendering.md` (D2 chốt 29/10).
2. Tự kiểm: mỗi E/T đếm bước thật; mỗi điểm quyết định một hành động chính; 6×6. Trượt → sửa cấu trúc trước.
3. Nạp CSS đã biên dịch và token thật; có bảng chỉnh thông số light/dark + export/import MD/JSON. Bản xuất là đề xuất, chưa tự ghi lại DS. Theo `references/component-rendering.md` và `references/design-rules.md`.
4. Tra cứu pattern bằng `ui-ux-pro-max` nếu cần (ví dụ `--design-system "<loại sản phẩm>"`).

## 3. Sản phẩm phải giao

Tất cả trong `features/<feature>/` — chi tiết ở `references/prototype-spec.md`:

1. `prototype/<feature>.html` + CSS/JS đã bundle từ component thật + provenance + token parameters: mở double-click là chạy, không server, không gọi mạng ngoài trừ Google Fonts; có **dev bar** gập được; dữ liệu hư cấu đủ để mọi trạng thái xuất hiện tự nhiên; mọi drawer mở/đóng được; hành động chính đổi trạng thái thấy được.
2. Đủ màn + trạng thái theo USER_FLOW §2 (S…, D…, M…).
3. Người điều phối render preview, chụp `review-screens/` PNG **1440 / 768 / 390 × light / dark**, kiểm overflow và viết REVIEW.md R1…Rn. Có thể dùng `scripts/capture-screens.mjs` nếu Playwright đã có hoặc browser/CDP được giao; agent design không chụp ảnh (D1).
4. `DESIGN-NOTES.md` theo `references/design-notes-template.md`: bảng kiểm Stage 5 (E, T, số bước thực tế, đạt/không), component dùng lại vs mới (kèm lý do), giả định, **câu hỏi cho người phụ trách sản phẩm**, **Đề xuất ngoài scope** (chỉ hiện sau công tắc Proposals).

Gặp chỗ phải quyết về sản phẩm: ghi vào DESIGN-NOTES rồi hỏi, **không tự chọn**. Cần chọn để prototype hoàn chỉnh thì chọn phương án an toàn nhất và ghi "Giả định đã chọn".

## 4. Bàn giao (3–5 dòng)

Agent design giao file preview, renderer/provenance, token parameters + đường xuất/nạp MD/JSON, test script, E/T và DESIGN-NOTES. Ghi “Ảnh: 0 — người điều phối chụp”; không ghi như đã kiểm ảnh. Điều phối tự render, kiểm và viết REVIEW trước gửi duyệt.

## 5. Vòng sửa

Người phụ trách sửa theo từng phần ("Anh sẽ duyệt và sửa qua từng phần"). Mỗi vòng:
- Chỉ sửa đúng mục được nêu. Ghi "Vòng n · đã sửa gì" vào DESIGN-NOTES; quyết định mới ghi ngày.
- Người điều phối chụp lại màn bị ảnh hưởng, cập nhật REVIEW theo vòng và ghi số đo thật; agent design chỉ sửa sản phẩm được giao.
- Khi duyệt: ghi vào PRD trạng thái "Preview v<x> đã duyệt <ngày>", mở gate G1 trong TASKS.

## 6. Hành vi và bằng chứng v0.3 (A3.1–A3.7; B6/B7)

- Tuân thủ W15 nút theo đối tượng, ≤1 filled/màn, state UI khác persist, drawer quyết định và scrollbar OS ở `references/design-rules.md`.
- Bắt buộc giao test script prototype cho mọi trạng thái: ≤1 filled, không lặp hành động, 6×6 và số bước E/T; ngoại lệ 4 bước phải có quyết định PRD.
- REVIEW theo vòng R1…Rn và STATUS-REVIEW có mẫu `references/review-templates.md`. Màu status theo DS, kiểm đủ giá trị và xin duyệt map, không custom token.
- Thay đổi rộng dùng một nguồn + opt-in prop + test quét caller, không rải class.

## 7. Token round-trip và phân vai (D1/D2 chốt 29/10)

Agent design chuẩn bị renderer gọi component thật, CSS bundle, source hashes và bộ tham số token có allowlist. Điều phối chạy renderer, kiểm provenance, gắn editor bằng `scripts/attach-token-editor.mjs`, chạy test và chụp ảnh, rồi viết REVIEW.md. Chỉ sau người phụ trách duyệt bản MD/JSON, điều phối giao task nạp lại đúng token trong DS, dựng lại token page/prototype và kiểm mọi caller bị ảnh hưởng. Không tự cập nhật repo code từ preview.
