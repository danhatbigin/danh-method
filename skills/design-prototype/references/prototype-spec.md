# Đặc tả prototype HTML

## File

```
features/<feature>/prototype/
├── <feature>.html     # khung + markup
├── <feature>.css      # chỉ dùng biến token (copy giá trị từ file token thật vào :root, ghi nguồn)
├── <feature>.js       # dữ liệu hư cấu + state + render
└── <feature>.test.mjs # (tuỳ chọn) self-check logic: đếm bước, đổi role, đổi trạng thái
```

- UTF-8, LF. Trên Windows không ghi bằng PowerShell `Set-Content`/`Add-Content`.
- Không framework nặng; vanilla JS hoặc một thư viện CDN cố định phiên bản nếu thật cần.
- Chữ trên UI theo ngôn ngữ UI của project (thường English).

## Dev bar (bắt buộc, gập được, nằm ngoài khung sản phẩm)

| Điều khiển | Giá trị |
|---|---|
| Role | các role trong PRD §3 — đổi role thì Mine, hành động chính, quyền đổi theo |
| Theme | light / dark |
| Trang / bề mặt | ví dụ Admin <Feature> / Member <feature> |
| Viewport | desktop / tablet / mobile (giả lập khung 1440/768/390) |
| State | Ready / Empty / Loading / No access / Error |
| Proposals | mặc định **tắt**; bật mới thấy đề xuất ngoài scope |

Controls của dev bar chỉ phục vụ review, ghi rõ "không đưa vào app".

## Dữ liệu

- Hư cấu hoàn toàn; không tên/thông tin thật của khách hay bệnh nhân.
- Đủ đa dạng để mọi trạng thái USER_FLOW §2 xuất hiện tự nhiên (MiVida: tối thiểu 12 bản ghi có đủ gói, add-on, trạng thái).
- Media nặng (video, 3D) thay bằng ảnh tĩnh / khung giữ chỗ có nhãn.

## Hành vi

- Mọi drawer/modal mở và đóng được; Esc đóng; focus quay lại nút mở.
- Hành động chính đổi trạng thái thấy được (dòng rời khỏi Mine, badge đổi, toast).
- Nút không có quyền: bấm → popover lý do + role làm được.
- Mobile 390: drawer mở từ đáy, cao ≥ 3/4 màn hình (nếu project dùng pattern này); component dày (bảng, lưới) có cách đọc riêng (ví dụ lưới tuần × thứ → danh sách theo ngày) — ghi lựa chọn vào DESIGN-NOTES.

## Link trạng thái

Hỗ trợ query string để mở thẳng một trạng thái, ví dụ `?role=coach&theme=dark&view=library&state=empty&drawer=D2` — giúp review và chụp ảnh lặp lại được. Liệt kê các link trong DESIGN-NOTES.

## Ảnh review

Chạy `node <plugin>/skills/design-prototype/scripts/capture-screens.mjs <html> <out-dir> --states "<query1>,<query2>"`. Script chụp 1440/768/390 × light/dark, báo tràn ngang (`scrollWidth > innerWidth`). Đặt tên `<mã màn>-<viewport>-<theme>.png`.

Không bật dev server của app, không đụng cổng demo.
