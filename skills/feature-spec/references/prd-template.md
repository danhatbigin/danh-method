# Mẫu PRD — `features/<feature>/PRD.md`

```markdown
# <Feature> · PRD

Phiên bản <0.9> · <dd/mm/yyyy> · Người viết: <agent/vai>, theo các quyết định người phụ trách sản phẩm chốt ngày <…>.
Trạng thái: **<nháp | phạm vi chốt | design vòng n đã review | đã duyệt>**. <Q nào còn mở>.
Design theo `prompts/<…>-design.md`, logic theo `prompts/<…>-logic.md` (khi đã có).

Nguồn (chỉ đọc):
- `sources/<…>`: <phần nào liên quan>
- `features/<feature-mẫu>/PRD.md`: **pattern mẫu** về layout, Mine, quy tắc UI. Feature này phải trông và hành xử như cùng một sản phẩm.

---

## 1. Mục tiêu
<Người dùng nào> ở đây <làm được gì> — 3–6 gạch đầu dòng, mỗi dòng một việc thật. Ghi rõ cái **hiện chưa làm được**.

## 2. Quyết định đã chốt
| ID | Quyết định |
| --- | --- |
| X01 | <điều hướng, route, vị trí> |
| X02 | <layout theo pattern nào> |
| … | |

## 3. Role và quyền
| Hành động | Role A | Role B | Role C |
| --- | --- | --- | --- |
| <xem> | ✓ | ✓ | chỉ xem |
Không có quyền: nút vẫn hiện và bấm được → popover lý do + role làm được; server luôn từ chối.

## 4. Đối tượng và vòng đời
### 4.1 <Đối tượng> (<có sẵn | mới>)
- Nguồn / sửa / trạng thái / ai thấy / lan truyền.

## 5. Hàng việc (Mine) và thứ tự
| Thứ tự | Loại việc | Khi nào vào | Khi nào ra |
|---|---|---|---|

## 6. Thao tác tiết kiệm thời gian
## 7. <Bề mặt thứ hai, ví dụ member/khách> — họ thấy gì, **không bao giờ** thấy gì
## 8. Thông báo — ai nhận, khi nào, quan trọng hay tự tắt
## 9. Ngoài phạm vi — liệt kê cụ thể

## 10. Tiêu chí chấp nhận
| ID | Tiêu chí |
| --- | --- |
| AC01 | <hành vi kiểm được, có kết quả cụ thể> |
| ACnn | Design: mọi đường vào ≤ 3 bước; mọi task ≤ 3 bước; mỗi điểm quyết định một hành động chính; 1440/768/390, light/dark, không tràn ngang, đạt AA. |

## 11. Câu hỏi Q1–Qn · mặc định đề xuất, chờ duyệt
Người phụ trách sản phẩm duyệt hoặc sửa. Đổi mặc định thì sửa ở đây và ghi CHANGELOG.
| ID | Câu hỏi | Mặc định đề xuất |
| --- | --- | --- |
| Q1 | <ngưỡng / quy tắc> | <giá trị; là cấu hình để đổi sau> |
```

Mẹo từ MiVida:
- Ngưỡng nghiệp vụ (ngày, %, số buổi) luôn để **là cấu hình** để đổi không cần migration.
- Công thức số liệu ghi rõ, kể cả khi thiếu dữ liệu: trả `null` / "Not enough data", không bịa `0`.
- Thao tác đồng thời / trùng lặp (thanh toán 2 lần, webhook lặp) phải có quyết định riêng.
