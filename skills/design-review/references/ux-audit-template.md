# Mẫu audit UX — `audits/<yyyy-mm-dd>-<chủ-đề>.md`

```markdown
# Audit UX: <bề mặt> — <trọng tâm: đồng bộ dữ liệu, bố cục, UI style>

<dd/mm/yyyy> · Nhánh `<nhánh>`, HEAD `<mã>`.
Phân tích code (chỉ đọc): `<file 1>`, `<file 2>`…
Tham chiếu pattern: ui-ux-pro-max `--design-system "<…>"` → <pattern>.
Phạm vi đã kiểm bằng trình duyệt: <có / không / một phần>.

## Tóm tắt (≤ 6 dòng)
- Vấn đề lớn nhất: …
- Đề xuất: <sửa cục bộ | revamp cấu trúc>

## Phát hiện
| # | Issue (người dùng thấy gì) | Nguyên nhân (cơ chế, file:dòng) | Kết quả / tác động | Giải pháp | Ưu tiên |
|---|---|---|---|---|---|
| 1 | Dashboard đẹp nhưng không trả lời câu hỏi của Manager | KPI chọn theo dữ liệu có sẵn, không theo việc của role | Admin không dùng trang chủ | Chọn 3–6 khối theo câu hỏi nghiệp vụ: conversion, member hài lòng… | P1 |

## Theo lớp
### 1. Câu hỏi nghiệp vụ mỗi màn
### 2. Luồng dữ liệu & đồng bộ sau thao tác
### 3. Phân cấp L0 / L1 / L2 và nhịp điều hướng
### 4. 3 bước & một hành động chính
### 5. Nhất quán token / component / pattern giữa các màn
### 6. Chi tiết thị giác (chỉ sau khi 1–5 ổn)

## Đính chính vòng trước
- <ngày>: khẳng định "<…>" ở §x không đúng với code hiện tại; thay bằng §y.
```
