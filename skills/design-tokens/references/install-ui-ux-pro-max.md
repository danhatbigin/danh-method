# Cài ui-ux-pro-max — xin phép, lý do, cách cài

Plugin: **ui-ux-pro-max** (nextlevelbuilder/ui-ux-pro-max-skill, MIT). Bản đã dùng ở MiVida: 2.15.0.

## Vì sao Danh Method cần nó (nói với người dùng đúng ý này)

1. **Gợi ý nền thị giác theo loại sản phẩm** (`--design-system`): phong cách, palette, cặp font, pattern layout — dùng làm điểm xuất phát cho Stage 2, không thay quyết định của người phụ trách.
2. **Token 3 lớp → CSS** (`design-system/scripts/generate-tokens.cjs`): primitive → semantic → component, có light/dark.
3. **Soát token viết cứng trong code** (`validate-tokens.cjs`).
4. **Tra cứu UX/stack khi audit và preview** (`--domain ux`, `--stack shadcn|nextjs|…`).

Không bắt buộc: thiếu plugin thì vẫn dựng được trang token và làm thủ công, chỉ mất phần gợi ý và kiểm tự động.

An toàn: chạy local bằng Python/Node, không cần tài khoản, không gửi mã nguồn dự án ra ngoài.

## Câu hỏi xin phép (một lần mỗi phiên)

- Câu hỏi: "Danh Method dùng plugin ui-ux-pro-max để gợi ý màu/font theo loại sản phẩm, sinh token light/dark và soát màu viết cứng. Máy này chưa có. Em cài nhé?"
- Lựa chọn: **Cài ngay (đề xuất)** — "Miễn phí, chạy local, ~1 phút." · **Bỏ qua lần này** — "Làm token thủ công; không có gợi ý và kiểm tự động."

## Cách cài theo môi trường

| Môi trường | Cách cài | Ai làm |
|---|---|---|
| **Cowork** (Claude desktop) | `SearchPlugins` với từ khoá `["ui ux pro max", "design system", "ui ux"]` → nếu có trong catalog thì `SuggestPluginInstall` (trigger `proactive`, contextLabel "Để dựng và kiểm design token") để hiện thẻ cài. Không có trong catalog → hướng dẫn người dùng thêm marketplace `nextlevelbuilder/ui-ux-pro-max-skill` trong phần Plugins của app. | Người dùng bấm cài trên thẻ |
| **Claude Code** | Người dùng gõ: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` rồi `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`; khởi động lại phiên. | Người dùng gõ (lệnh slash agent không tự chạy được) |
| **Codex CLI** | `npm install -g ui-ux-pro-max-cli` rồi `uipro init --ai codex` trong thư mục dự án. | Agent chạy sau khi được đồng ý |
| **Antigravity** | `npm install -g ui-ux-pro-max-cli` rồi `uipro init --ai antigravity`. | Agent chạy sau khi được đồng ý |
| Khác (Cursor, Windsurf, Copilot…) | `uipro init --ai <cursor|windsurf|copilot|kiro|…>` | Agent chạy sau khi được đồng ý |

Sau khi cài: chạy lại `node <danh-method>/hooks/scripts/check-uipro.mjs` và báo kết quả nguyên văn.

Mạng bị chặn / npm lỗi: báo đúng lỗi, chuyển sang làm thủ công, không thử cách lách.

## Nếu người dùng từ chối

- Không hỏi lại trong phiên.
- Nhánh B mục 2 của SKILL: tự viết `tokens.css` theo `shadcn-token-map.md` và luật Stage 2.
- Báo cáo ghi: "Không dùng ui-ux-pro-max (người dùng chọn bỏ qua)".
