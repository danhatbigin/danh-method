---
name: design-tokens
description: Danh Method token step (Stage 2 → Stage 4 step 3) — defines or extracts the product's design tokens (color 5-shade primary + 60/30/10, type roles, radius, spacing, elevation, light/dark), uses the ui-ux-pro-max plugin to recommend and generate them, then renders a self-contained HTML token page (color pairs with live AA contrast, light/dark/side-by-side, type, radius, spacing, shadows, components in context) as the token approval gate G0. Use when someone says "design token", "visual token", "trang token", "render token ra html", "chốt màu font", "brand foundations", "shadcn theme", or before the first prototype of a new product.
---

# Design tokens → trang HTML duyệt token (gate G0)

Mục tiêu: người phụ trách sản phẩm **nhìn thấy** toàn bộ token (màu, chữ, bo góc, khoảng cách, bóng, light/dark) trên một trang, duyệt một lần, rồi mọi preview và code dùng đúng bộ đó. Không duyệt token qua file CSS hay JSON.

Vị trí trong vòng đời: sau Stage 2 (brand) và trước prototype đầu tiên. Dự án đang chạy: làm lại mỗi khi token đổi lớn (ví dụ Design System v1 → v2).

`<plugin danh-method>` = thư mục gốc plugin, tức hai cấp trên thư mục chứa SKILL.md này (`${CLAUDE_PLUGIN_ROOT}` trong Claude Code).

## 0. Kiểm tra plugin ui-ux-pro-max (xin phép trước khi cài)

Chạy `node <plugin danh-method>/hooks/scripts/check-uipro.mjs --json`.

- **Đã có** → ghi lại `searchScript` và `designSystemSkill` để dùng ở mục 2.
- **Chưa có** → **không tự cài.** Hỏi người dùng bằng công cụ hỏi lựa chọn (AskUserQuestion nếu có), nêu lý do theo `references/install-ui-ux-pro-max.md`:
  > Danh Method dùng ui-ux-pro-max để (1) gợi ý hệ màu, font, phong cách hợp loại sản phẩm, (2) sinh token 3 lớp và xuất CSS, (3) soát chỗ viết cứng màu/khoảng cách trong code, (4) tra cứu UX khi audit. Plugin miễn phí (MIT), chạy local, không gửi dữ liệu dự án ra ngoài. Cài không?
  Lựa chọn: **Cài ngay (đề xuất)** · **Bỏ qua, làm thủ công lần này**.
- Đồng ý → cài theo môi trường trong `references/install-ui-ux-pro-max.md` (Cowork: thẻ cài plugin; Claude Code: 2 lệnh `/plugin`; Codex/Antigravity: `uipro init`). Lệnh cần người dùng gõ thì đưa đúng lệnh và giải thích một dòng; còn lại agent tự chạy sau khi được đồng ý. Cài xong chạy lại `check-uipro.mjs`.
- Từ chối → làm tiếp bằng cách thủ công (mục 2, nhánh B); ghi vào báo cáo "không có tra cứu ui-ux-pro-max". **Không hỏi lại** trong cùng phiên.

Trang HTML (mục 3) dùng script riêng của plugin này nên **luôn chạy được**, có hay không có ui-ux-pro-max.

## 1. Xác định nguồn token

| Tình huống | Nguồn |
|---|---|
| Có codebase (shadcn/ui, Tailwind, Nuxt UI…) | File CSS token thật: `globals.css`, `*-tokens.css`, `@theme` — ghi đường dẫn trong `process/project.md` |
| Khách có brand guideline | Màu chủ đạo, font, icon style trong guideline (Stage 2 Case 1) |
| Chưa có gì | Loại sản phẩm + tâm lý người dùng muốn tạo ra (Stage 2 Case 2) |

Đọc `danh-method/references/design-workflow.md` Stage 2 trước khi quyết.

## 2. Có bộ token CSS

**A. Đã có codebase** → dùng nguyên các file CSS, không viết lại. Biến chỉ có lúc chạy (ví dụ `next/font` sinh `--font-sans`) thì cung cấp qua `--set` ở mục 3.

**B. Dự án mới:**
1. Có ui-ux-pro-max: `python "<searchScript>" "<loại sản phẩm> <ngành> <từ khoá>" --design-system -p "<Tên>" -f markdown` để lấy gợi ý phong cách, palette, cặp font. Đây là **gợi ý để tranh luận**; ràng buộc của Stage 2 quyết.
2. Áp luật Stage 2: primary **5 sắc độ** (hover, active, disabled…); tỉ lệ **60 neutral / 30 secondary / 10 accent (primary)**; font map theo vai (display, heading, body, UI label), kiểm ở cỡ display nếu có bề mặt quảng bá; giới hạn weight thật sự dùng; hướng icon (outline/filled, stroke).
3. Viết `design/tokens.json` theo cấu trúc 3 lớp primitive → semantic → component (mẫu: `<designSystemSkill>/templates/design-tokens-starter.json`), có khối `dark`. Với shadcn/ui: semantic phải có đủ cặp `--background/--foreground`, `--primary/--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--card`, `--popover`, `--border`, `--input`, `--ring`, `--radius` — xem `references/shadcn-token-map.md`.
4. Xuất CSS: `node "<designSystemSkill>/scripts/generate-tokens.cjs" --config design/tokens.json -o design/tokens.css`.
   Không có ui-ux-pro-max: tự viết `design/tokens.css` với `:root { … }` và `.dark { … }` theo cùng bảng tên.

## 3. Dựng trang token

```
node <plugin danh-method>/skills/design-tokens/scripts/render-token-page.mjs \
  --css <file1.css> [--css <file2.css> …] \
  --out <repo spec>/design-system/tokens.html \
  --title "<Sản phẩm> · Design tokens" --note "<nguồn, phiên bản>" \
  [--set "--font-sans=Plus Jakarta Sans, sans-serif"]
```

Trang tự chứa, mở double-click: cặp nền/chữ kèm **tương phản AA đo thật** (kể cả màu trong suốt), Light / Dark / Side by side, màu còn lại, font, thang chữ, bo góc, khoảng cách, bóng, component mẫu kiểu shadcn, mục **Checks** (cặp dưới AA, màu cứng thiếu bản dark), bảng tất cả token, tìm kiếm, bấm tên để copy `var(--x)`. Chi tiết: `references/token-page-spec.md`.

Sau khi dựng:
1. Chụp ảnh bằng `design-prototype/scripts/capture-screens.mjs <tokens.html> <repo spec>/design-system/review-screens --states "tokens:"` (1440/768/390 × light/dark).
2. Đọc mục Checks. Cặp dưới AA → **không tự sửa token**; ghi vào `design-system/TOKENS-NOTES.md` kèm đề xuất (ví dụ "primary-foreground đổi sang #FAFAF8 → 6.1:1").
3. Có ui-ux-pro-max và có code: `node "<designSystemSkill>/scripts/validate-tokens.cjs" --dir <src>` để liệt kê màu/khoảng cách viết cứng; đưa kết quả vào TOKENS-NOTES.

## 4. Gate G0 — duyệt token

Gửi người phụ trách sản phẩm (3–5 dòng): mở file nào; bao nhiêu cặp đạt AA ở cả hai theme; điểm cần quyết (cặp trượt, màu thiếu dark, font chưa có file); đã dùng hay không dùng ui-ux-pro-max.

Khi duyệt:
- Ghi vào `design-system/TOKENS-NOTES.md`: phiên bản, ngày, ai duyệt, file nguồn + commit.
- Thêm dòng CHANGELOG và mục lục README của repo spec.
- `process/project.md` mục Design system trỏ tới trang token đã duyệt.
- Từ đây `design-prototype` chỉ dùng token trong trang này; muốn token mới → quay lại skill này, không thêm token lẻ trong prototype.

Token đổi về sau: dựng lại trang, ghi "Thay đổi so với v<n>" trong TOKENS-NOTES, duyệt lại; mọi prototype và màn đã code dùng token đổi phải kiểm lại (skill `design-review`).

## 5. Tuỳ chọn: bản chia sẻ

Cần chia sẻ cho khách/team mà không gửi file: publish trang (Artifact nếu môi trường có) hoặc tạo artifact Design System từ cùng nguồn token. Bản trong repo spec vẫn là bản gốc.
