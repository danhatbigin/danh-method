# B10 — mẫu nghiệm thu (A8.1/D9)

Lưu `features/<feature>/ACCEPTANCE-<yyyy-mm-dd>.md`. Không suy diễn đã kiểm browser từ unit test.

```markdown
# <Feature> · Nghiệm thu Stage 6 · <ngày>
Nhánh/worktree <…>, HEAD/base <…>, PR <…>.
PRD/USER_FLOW/DESIGN-NOTES @ <commit>.
DB bản sao <…>; cổng/PID được cấp <…>; công cụ <browser/CDP/Playwright đang có>.
Đồng hồ: giữ/tua; mốc/múi giờ <…>; hệ quả <…>; quyết định cho phép <…>.
Kết luận: <đầy đủ / một phần / chưa nghiệm thu>, lý do <…>.

## 1. Tiêu chí chấp nhận
| AC | Trạng thái | Loại bằng chứng / link | B# / lý do |
|---|---|---|---|
| AC01 | ĐẠT (test) | tên unit test + kết quả thật | chưa chứng minh browser |
| AC02 | ĐẠT (kiểm lại được) | bước tái hiện + ảnh/log @ HEAD | |
| AC03 | MỘT PHẦN | phần đạt / còn thiếu | B1 |
| AC04 | ĐẠT (có lỗi B2) | bằng chứng + ai chấp nhận lỗi tồn | B2 còn mở |
| AC05 | CHƯA ĐẠT | tái hiện | B3 |
| AC06 | KHÔNG KIỂM ĐƯỢC | thiếu gì + vì sao | |
| AC07 | KHÔNG CẦN SỬA | PRD/quyết định + bằng chứng | không đồng nghĩa đã kiểm browser |

## 2. Đường vào
| E | Bước thực tế | Số bước | Kết quả |
|---|---|---|---|
| <…> | <…> | <…> | <…> |
## 3. Task
| T | Bước thực tế | Số bước | Hành động chính | Kết quả / ngoại lệ PRD |
|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> |
## 4. Responsive
| Màn/state | 1440 L/D | 768 L/D | 390 L/D | scrollWidth/innerWidth đo thật |
|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> |
## 5. Tương phản AA ≥4.5:1
| Phần tử | Light đo thật | Dark đo thật | Công cụ/điều kiện |
|---|---|---|---|
| <…> | <…> | <…> | <…> |

## 6. Lỗi và nhận xét
| B# | Mức Blocker/Major/Minor | AC | Tái hiện/bằng chứng | Nguyên nhân nếu biết | Commit sửa | Kiểm lại | Người chấp nhận lỗi tồn |
|---|---|---|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> | <…> | <…> | <…> |
## 7. Chưa kiểm / để lại
<Mục nào, vì sao; không bịa PASS>.
## 8. Dọn dẹp
PID tự bật đã tắt <…>; DB tạm giữ/xoá theo quyền <…>; chủ và tài nguyên còn lại <…>.

## 9. Lượt n · sửa và kiểm lại
| B# | Commit sửa | Kịch bản bị ảnh hưởng + nơi dùng chung | Kết quả/bằng chứng |
|---|---|---|---|
| <…> | <…> | <…> | <…> |
## Tổng sau từng lượt
| Lượt | HEAD | AC đạt/tổng | Một phần/chưa kiểm | B# mở theo mức | Bước tiếp |
|---|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> | <…> |

## Gate
--pr <PASS/chưa>; Stage 6 <…>; AC có bằng chứng <…>; blocker <…>; owner G3 <…>.
Stage 6 không tự mở merge-ready. AC chưa đạt/chưa kiểm/một phần còn chặn nghiệm thu đầy đủ; B# blocker chặn merge.
```
