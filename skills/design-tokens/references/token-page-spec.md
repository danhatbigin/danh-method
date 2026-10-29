# Bảng tra token (Phụ lục) — `render-token-page.mjs`

> [!IMPORTANT]
> **Đây là tài liệu đặc tả cho bảng tra cứu token phụ lục (appendix), KHÔNG PHẢI bằng chứng duyệt Gate G0.**
> Theo quy định Danh Method (chốt 29/10/2026), bằng chứng duyệt Gate G0 bắt buộc phải là **Token Playground** dựng từ các component thật đã cài đặt trong dự án (shadcn/ui hoặc HeroUI), xem chi tiết tại [token-playground.md](token-playground.md).
> Script `render-token-page.mjs` chỉ dùng làm bảng tra cứu phụ trợ khi cần rà soát toàn bộ bảng giá trị CSS và tương phản màu tĩnh, và tuyệt đối không được dùng khi dự án chưa cài đặt gói UI.

## Đầu vào

- Một hoặc nhiều file CSS. Đọc biến `--*` trong `:root`, `html`, `@theme`, `@theme inline` (light) và `.dark`, `[data-theme="dark"]`, `@media (prefers-color-scheme: dark) :root` (dark). Selector `:root, .dark` áp cho cả hai.
- Bỏ qua: biến trong selector component, `:root` nằm trong `@media` breakpoint/reduced-motion, khai báo tự trỏ (`--x: var(--x)` của Tailwind), `@import`/`@apply`/`@tailwind`.
- File sau ghi đè file trước — truyền theo thứ tự import thật của app (ví dụ MiVida: `mivida-website.css` → `globals.css` → `portal-tokens.css`).
- `--set "--name=value"`: giá trị chỉ có lúc chạy (font từ `next/font`).

## Đầu ra (một file HTML tự chứa)

| Mục | Nội dung |
|---|---|
| Color pairs | Mọi cặp `X` + `X-foreground` (và background/foreground); tương phản đo bằng trình duyệt, màu trong suốt trộn lên `--background` thật; bỏ cặp alias trùng (`--color-primary` của Tailwind) |
| Colors | Màu còn lại, giá trị light + dark |
| Typefaces / Type scale | Mẫu chữ theo `--font-*`, `--text-*`/`font-size` |
| Radius / Spacing / Shadows | Mẫu trực quan từng token |
| In context | Button (primary, secondary, outline, destructive), card, input + focus, badge — chỉ khi có token shadcn |
| Checks | Cặp dưới AA theo theme đang xem; màu cứng thiếu bản dark (bỏ qua thang primitive) |
| All tokens | Bảng tên, loại, light, dark, file |

Điều khiển: Light / Dark / Side by side (nhớ lựa chọn theo trình duyệt), tìm kiếm, `?theme=dark` trên URL, bấm tên để copy `var(--x)`. Không tràn ngang ở 390.

Khung trang dùng biến riêng `--tk-*` nên không lẫn với token dự án. Google Fonts là lời gọi mạng duy nhất (chỉ khi token có font không phải font hệ thống).

## Đã thử

MiVida Portal (`packages/ui/src/styles`, 29/10/2026): 307 token, 11 cặp, tất cả đạt AA ở cả light và dark (primary 6.08:1, red-flag 5.62:1 light / 4.66:1 dark); không tràn ngang ở 1440/390.
