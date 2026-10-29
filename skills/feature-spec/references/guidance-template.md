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

## 5. Bẫy
- <ví dụ MiVida: "activities bị ghi đè cả mảng" — luôn merge, không replace>
- <ví dụ: refresh sau action không cập nhật props RSC nếu không revalidate>
- Dữ liệu demo không nằm trong code; nằm trong file/dump ngoài repo.
- Không đưa dữ liệu nhạy cảm (PHI…) xuống client khi thiếu quyền — có test payload theo role.
```
