# Checklist quyết định cấu trúc (Stage 3)

Rút gọn từ `design-workflow.md`. Mỗi mục trả lời bằng chữ trong PRD/USER_FLOW; mục không áp dụng ghi "N/A — vì …".

## Đối tượng chính (mỗi đối tượng một bảng nhỏ)

- [ ] Nguồn nội dung: tạo mới / chép độc lập / tham chiếu nguồn / phiên bản giữ lại cập nhật sau
- [ ] Phạm vi sửa: tạo, chọn, sắp xếp, sửa, xoá — ảnh hưởng riêng đối tượng hay cả nguồn
- [ ] Vòng đời: trạng thái, hành động chuyển, khi nào người khác thấy thay đổi; đã publish thì sửa tiếp có cần publish lại
- [ ] Quyền: ai xem / sửa / duyệt / chia sẻ, áp ở đâu (UI **và** server)
- [ ] Lan truyền: cập nhật nguồn tự động hay theo lựa chọn; người dùng biết gì đã đổi bằng cách nào
- [ ] Trục trạng thái độc lập không bị gộp (ví dụ presence vs draft/new)

## Màn hình & shell

- [ ] Danh mục S…/D…/M…, màn nào là destination cấp 1
- [ ] Trạng thái từng màn: Ready / Empty / Loading / No access / Error
- [ ] Vị trí điều hướng (sidebar / topbar / icon rail / bottom bar / split) — có lý do
- [ ] Hành vi điều hướng (persistent / collapsible / hover / drawer) — có lý do
- [ ] Shell: vùng nội dung, global actions, nơi hiện thông báo, phản hồi breakpoint
- [ ] Phân cấp L0 (canvas) / L1 (frame feature) / L2 (khối con) rõ ràng
- [ ] Bề mặt quảng bá (nếu có) inline hay chen task — chen thì cộng 1 bước

## Tiêu chí chọn điều hướng

- > ~7 destination cấp 1 → topbar vỡ
- Bảng dữ liệu, canvas, editor → icon rail / sidebar gập được
- Chuyển destination thường xuyên → điều hướng cố định thay vì overlay
- Thiết bị và breakpoint mục tiêu

## Luật bố cục & tương tác

- [ ] **3 bước — đường vào:** mỗi E… tới feature ≤ 3 bước (nav, submenu, từ feature khác). Một đường đạt không bù đường khác trượt.
- [ ] **3 bước — hoàn thành task:** mỗi T… ≤ 3 bước, đếm riêng. Mở modal là 1 bước nếu thuộc task.
- [ ] **Một hành động chính** mỗi điểm quyết định; hai CTA primary cạnh tranh = trượt.
- [ ] **Nhất quán hành vi:** cùng task nhỏ thì cùng pattern ở mọi feature.
- [ ] **Căn chỉnh & thứ tự:** một trục, một hướng; mục trong nav sắp theo tần suất dùng.
- [ ] **6×6:** ≤ 6 khối/màn, ≤ 6 mục/khối; form ≤ 6 khối × 6 trường; > 6 lựa chọn → dropdown, ≤ 6 → liệt kê đủ (+ select all nếu chọn nhiều).
- [ ] **Thông báo:** quan trọng thì ở lại tới khi người dùng thao tác; không quan trọng tự tắt sau 4 giây.
- [ ] **Không chặn click vì thiếu quyền:** click mở giải thích lý do + cách mở khoá / ai làm được.
- [ ] Chỉ hộp xác nhận là modal; lớp phủ khác là drawer (mobile mở từ đáy, cao ≥ 3/4 màn hình) — nếu project dùng pattern này.

## Quy tắc component (áp từ khi dựng)

- CTA luôn là động từ; không "Ok", "Yes". Trong modal, CTA và tiêu đề đọc thành một câu ("Delete confirmation" → "Delete anyway" / "Keep it").
- Nút mở modal → tiêu đề modal là danh từ của động từ đó ("Invite members" → "Inviting members" → "Send invitations").
- Icon trước: mở modal / sang feature khác. Icon sau: submit / tiến tới. Không thuộc hai loại: không icon.
- Tránh nút disabled; bắt buộc thì kèm "Do X to enable this button".
