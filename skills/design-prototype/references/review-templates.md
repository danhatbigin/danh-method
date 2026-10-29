# B6 — REVIEW design theo vòng (A1.1)

```markdown
# <Feature> · REVIEW · R<n> · <ngày>
Prototype @ <commit/hash>; PRD @ <commit>; người render: <vai>; công cụ: <…>.
| Vùng/màn/state | Viewport/theme | Ảnh thật | Số đo/overflow | Chưa kiểm |
|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> |
## P1 / P2
| Mã | Vùng | Vấn đề thấy được | Tham chiếu DS/PRD | Cần sửa | Bằng chứng kiểm lại |
|---|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> | <…> |
## Câu hỏi
| Q | Luồng/vấn đề | Lựa chọn + hệ quả | Đề xuất |
|---|---|---|---|
| <…> | <…> | <…> | <…> |
## Đề xuất chốt
<còn mục nào / Design được chấp nhận để làm UI sau khi người phụ trách đã duyệt>.
## Ghi chú cho UI
Quyết định mới, chỗ khác prototype, hợp đồng dữ liệu, giới hạn và bước cần kiểm lại.
## Vòng tiếp
Chỉ sửa mục còn mở; giữ kết quả vòng trước và mã ổn định.
```

# B7 — STATUS-REVIEW (A3.1; findings §1)

```markdown
# <Feature> · STATUS-REVIEW · <ngày> · CHỜ DUYỆT
DS/component nguồn @ <commit/hash>; đã mở đọc <file>.
| Trục trạng thái | Giá trị từ hợp đồng | Ý nghĩa nghiệp vụ | Component/variant DS | Token màu | Chữ/icon | Light/dark | Đã duyệt? |
|---|---|---|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> | <…> | <…> | <…> |
Trục presence độc lập draft/new; không chỉ dựa vào màu.
Thiếu trong DS: <component cần đề xuất, không custom token>.
Quyết định người phụ trách: <mã, ngày, nội dung>.
```
