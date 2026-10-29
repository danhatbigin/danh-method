---
name: design-review
description: Runs Danh Method design review and acceptance (Stage 5–6) — UX audits of existing screens (structure, data sync, consistency), scenario-based acceptance of a running feature against PRD ACs, entry routes and tasks with real step counts, 1440/768/390 light/dark, no horizontal overflow, AA contrast, and writes an honest ACCEPTANCE record (Pass / Fail / Not verified). Use when someone says "audit UX", "review giao diện", "nghiệm thu", "stage 5", "stage 6", "kiểm trên trình duyệt", or before a feature is accepted or a PR is marked ready.
---

# Design review & acceptance (Stage 5–6)

Hai chế độ. Chọn theo yêu cầu; không rõ thì hỏi.

## A. Audit UX (màn đang có, trước khi redesign)

Mục tiêu: tìm vấn đề **cấu trúc** và **đồng bộ**, không chỉ trang trí. Kết quả là `audits/<ngày>-<chủ-đề>.md` theo `references/ux-audit-template.md`.

1. Đọc code thật ở chế độ chỉ đọc (page, component, state, view model) và chạy thử nếu được phép. Ghi HEAD/nhánh đã audit.
2. Tra pattern bằng `ui-ux-pro-max` (ví dụ `--design-system "dashboard admin panel <ngành>"`) làm thước đo.
3. Soi theo thứ tự: câu hỏi nghiệp vụ mỗi màn trả lời → luồng dữ liệu và đồng bộ (sau action có cập nhật không) → phân cấp L0/L1/L2 → 3 bước / 1 hành động chính → nhất quán token và pattern → chi tiết thị giác.
4. Mỗi phát hiện: **issue → nguyên nhân (cơ chế, dẫn file:dòng) → kết quả người dùng thấy → giải pháp**, kèm mức ưu tiên.
5. Khẳng định chưa kiểm bằng trình duyệt thì ghi rõ "chưa nghiệm thu bằng trình duyệt". Khẳng định sai ở vòng trước thì ghi đè có ngày, không xoá im lặng.

## B. Nghiệm thu (feature đã code)

Mục tiêu: chứng minh bản chạy thật đạt PRD + USER_FLOW + DESIGN-NOTES. Kết quả là `features/<feature>/ACCEPTANCE-<ngày>.md` theo `references/acceptance-template.md`.

### Ranh giới (ghi vào đầu báo cáo, xin duyệt nếu chưa có)
- Chạy trên **DB bản sao** có ngày trong tên; không đụng DB demo / production.
- Cổng riêng được cấp; không đụng cổng demo. Xong thì **tắt** tiến trình và báo PID.
- Được tạo/sửa dữ liệu **chỉ trong bản sao**; không liên hệ ai thật.
- Không đổi mã sản phẩm. Lỗi chặn nghiệm thu → dừng, ghi rõ, báo người điều phối trước khi sửa.

### Kiểm
1. Từng **AC** trong PRD: làm thật trên trình duyệt (Playwright), chụp bằng chứng đặt tên theo AC vào `review-screens/acceptance-<ngày>/`.
2. Từng **E** và **T**: đếm bước thực tế, so với USER_FLOW; ghi hành động chính ở mỗi điểm quyết định.
3. Đổi role: Mine, thứ tự, quyền, popover lý do; server từ chối thao tác trái quyền.
4. Responsive: 1440 / 768 / 390 (+1024/320 nếu PRD yêu cầu), light/dark; `scrollWidth === innerWidth`.
5. Tương phản AA ≥ 4.5:1 trên badge, pill, nút chính (đo, không ước).
6. Bề mặt khách hàng không lộ dữ liệu nội bộ.

### Trung thực
- Ba trạng thái: **Đạt / Chưa đạt / Không kiểm được (vì sao)**. Không bịa PASS. Không kiểm được ≠ đạt.
- Một AC chưa đạt hoặc chưa kiểm → feature **chưa được nghiệm thu**.
- Sửa lỗi xong thì thêm mục "Lượt n · sửa và kiểm lại", chạy lại đúng các mục bị ảnh hưởng và các nơi dùng chung component/token vừa đổi.

### Báo cáo (≤ 10 dòng)
AC / E / T đạt bao nhiêu trên tổng; lỗi tìm thấy (mức nghiêm trọng); ảnh ở đâu; đã tắt server chưa; cần người phụ trách quyết gì.
