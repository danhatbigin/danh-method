# Luật thiết kế bắt buộc

## Chung (mọi project)

- **Không custom style ngoài thư viện/token.** Sửa từ thư viện để đồng bộ. Không tự vẽ chart/SVG khi design system có component.
- Gradient, màu, bóng phải đúng ở **cả light và dark**.
- **Cấu trúc trước bề mặt:** phân cấp L0 canvas / L1 frame feature / L2 khối con phải đọc ra được trước khi trang trí.
- **Một hành động chính** mỗi điểm quyết định; CTA là động từ; tiêu đề drawer/modal là danh từ của động từ trên nút mở nó.
- **6×6.** > 6 lựa chọn → dropdown.
- Nút không có quyền vẫn bấm được → popover lý do.
- Trạng thái không chỉ dựa vào màu (thêm icon/chữ). Trục trạng thái độc lập hiển thị độc lập (ví dụ chấm presence ≠ mini badge draft/new).
- Chữ ≥ 12px; body bề mặt khách hàng 16px; touch target ≥ 24px; tương phản **AA ≥ 4.5:1** ở cả hai theme; không tràn ngang ở 1440 / 1024 / 768 / 390 / 320.
- Chuyển động có chủ đích: không animation lặp vô ích; tôn trọng `prefers-reduced-motion`.
- Lớp nổi khi scroll (topbar, toolbar) phải tách khỏi nội dung chạy bên dưới (floating + gradient mờ), tránh "loạn thị giác".
- Dashboard: mỗi khối trả lời một câu hỏi nghiệp vụ của role đó; bỏ KPI trang trí.
- Bề mặt khách hàng **không bao giờ** thấy: lý do nội bộ, version cũ, dữ liệu nháp, điểm số kiểu chấm điểm.

## Ví dụ luật riêng đã chốt ở MiVida (chép vào `process/project.md` của project mới nếu muốn dùng)

- **No Border:** tách lớp bằng nền, khoảng cách, bóng; không `border`, `divide-*`, `ring-*` trang trí, `Separator`.
- Một màu đỏ thật dùng chung cho red flag, lỗi, hành động dừng/xoá.
- Chỉ hộp xác nhận là modal; mọi lớp phủ khác là drawer bên phải; mobile mở từ đáy ≥ 3/4.
- Layout làm việc: cột danh sách trên canvas (không card) → record ở main body là card nổi có header dính + pill subnav căn giữa → sidebar phải Activities / Discussions.
- Đầu cột danh sách: switch view → search + Filter tròn → ghost dropdown "All n / Mine n" + pill Sort.
- Topbar floating khi scroll, gradient mờ 1/3 dưới; item active fill màu primary.
- Font: Jura heading, Plus Jakarta Sans body; icon Hugeicons Stroke khi nghỉ, Solid khi active.
- Radius tăng có chủ đích (28 / 22); nền ambient nhẹ; kính mờ độ tương phản cao cho pane chính.

## Thứ tự ưu tiên khi xung đột

Đúng việc (câu hỏi nghiệp vụ) → đúng cấu trúc (3 bước, 1 hành động chính, phân cấp) → nhất quán (token, pattern) → đẹp.
