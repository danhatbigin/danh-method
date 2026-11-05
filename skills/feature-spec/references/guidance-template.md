# Mẫu GUIDANCE — `features/<feature>/GUIDANCE.md`

Viết cho **agent**, không cho người phụ trách sản phẩm. Mục tiêu: agent không phải khám phá lại codebase, không rơi vào bẫy đã biết.

```markdown
# <Feature> · Hướng dẫn kỹ thuật

Đọc cùng PRD.md, USER_FLOW.md; mở `prototype/<feature>.html` để đối chiếu trực quan (khi đã có).

## 1. Đang có, dùng lại
| Thứ | Ở đâu | Dùng thế nào |
|---|---|---|
| <hàm/component/view model> | `<đường dẫn>` | <giữ nguyên / mở rộng nhẹ> |
Nguyên tắc: **tái dùng trước, viết mới sau.** Component UI lấy từ thư viện chung; không custom style.

## 2. Mô hình dữ liệu gợi ý (mới)
- Bảng/field mới, khoá, index; migration nối tiếp, không sửa migration cũ; backfill bảo toàn dữ liệu cũ.

## 3. Quyền mới
- Thêm vào nơi kiểm quyền tập trung (ví dụ `can()`); server luôn kiểm, UI chỉ phản ánh.

## 4. View model
- Tên hàm, đầu vào, đầu ra; đọc trong một lần (không N+1); có test trần truy vấn.

## 5. Bất biến + bản đồ ghi (bắt buộc khi feature ghi dữ liệu; mẫu `data-invariants-template.md`)
| Bảng | Mọi writer (hàm/action/job/helper/đường tạo dữ liệu ban đầu) | Khoá (thứ tự) | Token | Vai trò × trạng thái | INV áp dụng |
|---|---|---|---|---|---|
- Ngân sách quy mô theo màn: trần dòng SQL đọc, dòng hydrate, số bind, bytes payload (tập lớn). Chưa được duyệt → ghi "đề xuất", không bịa số.
- Quan hệ 1→N đổi: liệt kê schema/unique/FK, migration/backfill, repo, service, reader, UI/test phụ thuộc.
- Owner kỹ thuật duyệt mục này; PO duyệt PRD không thay owner duyệt bất biến.

## 6. Bẫy
- <ví dụ: "một trường mảng bị ghi đè cả mảng" — luôn merge, không replace>
- <ví dụ: refresh sau action không cập nhật props RSC nếu không revalidate>
- Dữ liệu demo không nằm trong code; nằm trong file/dump ngoài repo.
- Không đưa dữ liệu nhạy cảm (PHI…) xuống client khi thiếu quyền — có test payload theo role.
```

## Hợp đồng dữ liệu bắt buộc (A2.2)

Chèn vào GUIDANCE trước giao task:

| Màn/caller | Hàm/type | Field ngày lọc | Mốc tham chiếu + múi giờ | Biên đầu/cuối (gồm/không gồm) | Đơn vị đếm | Null/thiếu | Breaking change + migration/caller |
|---|---|---|---|---|---|---|---|

Phân biệt member với order, không có dữ liệu với 0. Liệt kê test biên thời gian/quyền; commit type/interface an toàn trước khi chia lát.
