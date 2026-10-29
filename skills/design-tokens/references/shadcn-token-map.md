# Bảng token tối thiểu (shadcn/ui) và cách map từ brand

Tên theo shadcn/ui để component có sẵn dùng được ngay. Project dùng hệ khác (Nuxt UI, MUI…) thì đổi tên nhưng giữ đủ **vai**.

| Token | Vai | Luật Danh Method |
|---|---|---|
| `--background` / `--foreground` | Nền trang / chữ chính | Neutral (phần 60%). AA ≥ 4.5:1 |
| `--card` / `--card-foreground` | Bề mặt nổi L1/L2 | Khác `--background` đủ để thấy lớp mà không cần viền |
| `--popover` / `--popover-foreground` | Menu, popover, drawer | Thường = card, bóng cao hơn |
| `--primary` / `--primary-foreground` | **Một** hành động chính mỗi điểm quyết định | Phần 10%. 5 sắc độ: base, hover, active, subtle (nền nhạt), disabled-tint. AA với chữ trên nó |
| `--secondary` / `--secondary-foreground` | Hành động phụ, nền phụ | Phần 30% |
| `--muted` / `--muted-foreground` | Nền tĩnh, chữ phụ, placeholder | Chữ phụ vẫn ≥ 4.5:1 nếu là nội dung đọc |
| `--accent` / `--accent-foreground` | Hover hàng, mục đang chọn | Có thể trong suốt (ví dụ 12% primary); đo trên nền thật |
| `--destructive` (+ `-foreground`) | Lỗi, xoá, dừng, red flag | Một màu duy nhất cho cả ba nếu project chốt vậy |
| `--border`, `--input` | Viền, viền ô nhập | Project "No Border" vẫn cần `--input` cho ô nhập và focus |
| `--ring` | Focus ring | ≥ 3:1 với nền |
| `--radius` | Bo góc gốc | Các bậc khác tính từ đây (sm/md/lg/xl) |
| `--chart-1…5` | Biểu đồ | Phân biệt bằng độ sáng, không chỉ bằng hue |
| `--sidebar*` | Điều hướng | Theo cùng logic card/primary/accent |

Thêm theo dự án (ví dụ MiVida): `--red-flag`, `--attention`, `--surface-raised/sunken`, `--elevation-1…3`, `--font-sans`, `--font-heading`.

## Map từ Stage 2

- Primary của brand → `--primary`; sinh 5 sắc độ thành primitive (`--brand-500` base, `-600` hover, `-700` active, `-100` subtle, `-300` disabled tint) rồi semantic trỏ tới.
- Neutral (60%) → `--background`, `--card`, `--muted`, `--border`.
- Secondary (30%) → `--secondary`, `--accent`.
- Font vai → `--font-heading`, `--font-sans` (body + UI), `--font-mono` nếu cần.
- Dark: đảo neutral, giữ hue primary; kiểm lại mọi cặp — không mặc định "đảo là đạt".

## Radius theo vai (A3.7)

| Vai | Token semantic cần map tới DS hiện hành |
|---|---|
| Card lớn | `--radius-card` |
| Tile bên trong | `--radius-tile` |
| Popover/drawer | `--radius-popover` |
| Item/hàng | `--radius-item` |

Inner = outer − padding, không âm; dùng token đã duyệt biểu diễn quan hệ. Đây là vai cần map, không tự phát minh biến khi DS có tên tương đương. Ghi map + snapshot commit/hash nguồn và kiểm lồng lớp.
