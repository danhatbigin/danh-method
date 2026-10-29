---
name: design-tokens
description: Danh Method token step (Stage 2 → Stage 4 step 3) — enforces a hard gate requiring installed UI packages (shadcn/ui or HeroUI), defines or extracts design tokens (color 5-shade primary + 60/30/10, type roles, radius, spacing, elevation, light/dark), uses ui-ux-pro-max to recommend and generate them, and scaffolds an interactive token playground rendered from real installed components (with live controls and token export) as approval gate G0, alongside an optional appendix token lookup table. Use when someone says "design token", "visual token", "trang token", "token playground", "chốt màu font", "brand foundations", "shadcn theme", or before the first prototype.
---

# Design tokens → Token Playground duyệt token (gate G0)

Mục tiêu: người phụ trách sản phẩm **nhìn thấy và tương tác trực tiếp** trên các component thật (shadcn/ui hoặc HeroUI) kết hợp cùng toàn bộ token (màu, chữ, bo góc, khoảng cách, bóng, light/dark) trên trang Token Playground, duyệt một lần, rồi mọi prototype và code dùng đúng bộ đó. Tuyệt đối không duyệt token qua file CSS/JSON thô hoặc trang HTML tự chế không có component thật.

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

## 0b. Kiểm package UI (cổng bắt buộc trước khi sinh token)

Cổng kiểm tra bắt buộc (Hard Gate): Không cho phép tạo token hay dựng trang xem trước nếu dự án chưa cài đặt gói UI thật.

Chạy lệnh kiểm tra:
```bash
node <plugin danh-method>/skills/design-tokens/scripts/check-ui-packages.mjs --root <thư-mục-dự-án> --json
```

- **Kết quả `ready: true`** (đã có shadcn/ui hoàn chỉnh hoặc HeroUI cấu hình đầy đủ) → chuyển tiếp sang mục 1.
- **Kết quả `ready: false`** → **DỪNG LẠI NGAY LẬP TỨC (STOP)**.
  - Tuyệt đối **không sinh token** và **không dựng trang duyệt**.
  - Hỏi người dùng theo quy trình trong `references/install-ui-packages.md` với 4 lựa chọn:
    1. Cài đặt shadcn/ui (đề xuất)
    2. Cài đặt HeroUI
    3. Cài đặt cả hai
    4. Dừng lại (báo cáo blocker)
  - Người dùng đồng ý → cài đặt trên một nhánh git riêng của repo sản phẩm, sau đó chạy lại `check-ui-packages.mjs`.
  - Người dùng từ chối → báo cáo blocker cho chủ dự án: *Gate G0 bị dừng vì dự án thiếu thư viện UI để hiển thị component thật.* **Không tự ý fallback** về trang HTML thủ công.

## 1. Xác định nguồn token

| Tình huống | Nguồn |
|---|---|
| Có codebase (shadcn/ui, Tailwind, HeroUI…) | File CSS token thật: `globals.css`, `*-tokens.css`, `@theme` — ghi đường dẫn trong `process/project.md` |
| Khách có brand guideline | Màu chủ đạo, font, icon style trong guideline (Stage 2 Case 1) |
| Chưa có gì | Loại sản phẩm + tâm lý người dùng muốn tạo ra (Stage 2 Case 2) |

Đọc `danh-method/references/design-workflow.md` Stage 2 trước khi quyết.

## 2. Có bộ token CSS

**A. Đã có codebase** → dùng nguyên các file CSS, không viết lại. Biến chỉ có lúc chạy (ví dụ `next/font` sinh `--font-sans`) thì cung cấp qua cấu hình runtime.

**B. Dự án mới:**
1. Có ui-ux-pro-max: `python "<searchScript>" "<loại sản phẩm> <ngành> <từ khoá>" --design-system -p "<Tên>" -f markdown` để lấy gợi ý phong cách, palette, cặp font. Đây là **gợi ý để tranh luận**; ràng buộc của Stage 2 quyết.
2. Áp luật Stage 2: primary **5 sắc độ** (hover, active, disabled…); tỉ lệ **60 neutral / 30 secondary / 10 accent (primary)**; font map theo vai (display, heading, body, UI label), kiểm ở cỡ display nếu có bề mặt quảng bá; giới hạn weight thật sự dùng; hướng icon (outline/filled, stroke).
3. Viết `design/tokens.json` theo cấu trúc 3 lớp primitive → semantic → component (mẫu: `<designSystemSkill>/templates/design-tokens-starter.json`), có khối `dark`. Với shadcn/ui: semantic phải có đủ cặp `--background/--foreground`, `--primary/--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--card`, `--popover`, `--border`, `--input`, `--ring`, `--radius` — xem `references/shadcn-token-map.md`.
4. Xuất CSS: `node "<designSystemSkill>/scripts/generate-tokens.cjs" --config design/tokens.json -o design/tokens.css`.
   Không có ui-ux-pro-max: tự viết `design/tokens.css` với `:root { … }` và `.dark { … }` theo cùng bảng tên.

## 3. Dựng trang token (Gate G0: Token Playground)

Bằng chứng duyệt Gate G0 chính thức là **Token Playground**, được dựng trực tiếp từ các component thật đã cài đặt trong dự án (shadcn/ui hoặc HeroUI):

```bash
node <plugin danh-method>/skills/design-tokens/scripts/scaffold-playground.mjs \
  --root <thư mục dự án> \
  --tokens <đường dẫn file tokens.css>
```
Chi tiết cấu trúc và cách vận hành xem tại `references/token-playground.md`.

### Cấu tạo Token Playground (theo phong cách shadcn/create):
- **Bảng điều khiển bên trái (Controls panel)**: Chỉnh tương tác trực tiếp:
  - Base color / Theme color (palette chủ đạo).
  - Radius (bo góc: 0, 0.3rem, 0.5rem, 0.75rem, 1rem).
  - Font family (chọn cặp font chính).
  - Chế độ hiển thị: Light / Dark.
  - Mật độ hiển thị & khoảng cách (density / spacing).
  - Bóng đổ (shadow levels).
- **Vùng xem trước bên phải (Live component preview)**:
  - Hiển thị trực tiếp các component thật được import từ package cài đặt: Button (các variants), Card, Input, Select, Switch, Checkbox, Badge, Tabs, Dialog, Dropdown Menu, Slider, Label, Separator, Tooltip, Avatar, Table...
  - Nhận ngay các biến CSS khi kéo thanh trượt hoặc chọn trên controls panel (live CSS-variable edits).
- **Xuất token (Export)**:
  - Cho phép xuất bộ token đã tinh chỉnh ra CSS, JSON và Markdown theo đúng schema `token-parameters` được định nghĩa trong `skills/design-prototype/references/component-rendering.md`.

---

### Phụ lục tuỳ chọn: Bảng tra cứu token (`render-token-page.mjs`)

Khi cần một tài liệu tĩnh rà soát tất cả token kèm kiểm tra tương phản màu AA theo chuẩn WCAG, sử dụng script phụ trợ:
```bash
node <plugin danh-method>/skills/design-tokens/scripts/render-token-page.mjs \
  --css <file1.css> [--css <file2.css> …] \
  --out <repo spec>/design-system/tokens.html \
  --title "<Sản phẩm> · Design tokens" --note "<nguồn, phiên bản>" \
  [--set "--font-sans=Plus Jakarta Sans, sans-serif"]
```
Chi tiết tại `references/token-page-spec.md`.

> [!WARNING]
> Bảng tra token này là tài liệu phụ lục (appendix), **tuyệt đối KHÔNG PHẢI là bằng chứng duyệt Gate G0** và không được dùng để thay thế Token Playground khi thiếu package UI.

Sau khi dựng:
1. Người điều phối chụp ảnh bằng `design-prototype/scripts/capture-screens.mjs <tokens.html> <repo spec>/design-system/review-screens --states "tokens:"` nếu Playwright đã có, hoặc browser/CDP được giao (1440/768/390 × light/dark).
2. Đọc mục Checks. Cặp dưới AA → **không tự sửa token**; ghi vào `design-system/TOKENS-NOTES.md` kèm đề xuất (ví dụ "primary-foreground đổi sang #FAFAF8 → 6.1:1").
3. Có ui-ux-pro-max và có code: `node "<designSystemSkill>/scripts/validate-tokens.cjs" --dir <src>` để liệt kê màu/khoảng cách viết cứng; đưa kết quả vào TOKENS-NOTES.

## 4. Gate G0 — duyệt token

Gửi người phụ trách sản phẩm (3–5 dòng): mở file nào; bao nhiêu cặp đạt AA ở cả hai theme; điểm cần quyết (cặp trượt, màu thiếu dark, font chưa có file); đã dùng hay không dùng ui-ux-pro-max; xác nhận component thật được render trong Token Playground.

Khi duyệt:
- Ghi vào `design-system/TOKENS-NOTES.md`: phiên bản, ngày, ai duyệt, file nguồn + commit.
- Thêm dòng CHANGELOG và mục lục README của repo spec.
- `process/project.md` mục Design system trỏ tới trang token đã duyệt.
- Từ đây `design-prototype` chỉ dùng token trong trang này; muốn token mới → quay lại skill này, không thêm token lẻ trong prototype.

Token đổi về sau: dựng lại trang, ghi "Thay đổi so với v<n>" trong TOKENS-NOTES, duyệt lại; mọi prototype và màn đã code dùng token đổi phải kiểm lại (skill `design-review`).

## 5. Tuỳ chọn: bản chia sẻ

Cần chia sẻ cho khách/team mà không gửi file: publish trang (Artifact nếu môi trường có) hoặc tạo artifact Design System từ cùng nguồn token. Bản trong repo spec vẫn là bản gốc.

## 6. Token theo vai và snapshot (A3.7; findings §4)

Map radius theo vai card/tile/popover/item, không rải số đo theo màn; xem `references/shadcn-token-map.md`. Snapshot nguồn token (đường dẫn, commit/hash, ngày) lưu cùng TOKENS-NOTES.

D2 chốt 29/10: prototype **bắt buộc render component thật**, có controls chỉnh thông số, xuất MD/JSON để nạp lại token. Ghi source hash, component/slot/biến thể, CSS input; nguồn đổi render lại. Trang token kiểu cũ chỉ là bảng token phụ lục, không phải bằng chứng render TSX thật. Quy trình và helper ở `design-prototype/references/component-rendering.md`. Export từ preview là đề xuất; duyệt xong mới giao task cập nhật token nguồn, dựng lại G0/prototype và kiểm caller dùng chung.
