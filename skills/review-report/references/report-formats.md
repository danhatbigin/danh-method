# Định dạng báo cáo

## 1. Báo cáo task (3–5 dòng)

```
<Mã> xong — <người dùng giờ thấy/làm được gì>.
Đổi: <vùng chính> · commit <mã>.
verify: <nguyên văn>
Bỏ qua: <…> · Rủi ro: <…>
Tiếp: <…>
```

## 2. Báo cáo phân tích / điều tra

```markdown
# <Chủ đề> · <ngày> · nhánh <…> HEAD <…>

## Kết luận (≤ 3 dòng)

## Phân tích
| # | Issue | Nguyên nhân | Kết quả | Giải pháp | Ưu tiên |
|---|---|---|---|---|---|

## Bằng chứng
- <số đo, log, ảnh, lệnh đã chạy và kết quả nguyên văn>

## Bỏ qua
- <chưa chạy full test vì …; chưa kiểm browser vì …>

## Rủi ro
- <…>

## Cần quyết
- <câu hỏi tự đứng được: luồng nào, vấn đề gì, lựa chọn + hệ quả>
```

## 3. Review PR / diff

```markdown
# Review <PR/nhánh> · vòng <n> · <ngày>
Phạm vi: `git diff <base>..<head>` (<số> file). Reviewer không sửa code.

| # | Mức | Issue | Nguyên nhân (file:dòng) | Tái hiện / kết quả | Giải pháp |
|---|---|---|---|---|---|

Kết luận: Sẵn sàng để <X> merge | Chưa sẵn sàng — cần sửa #…
```

## 4. Spec sửa — `FIXES-<ngày>.md`

```markdown
# <Feature> · Spec sửa theo review <…> · <ngày>
Nguồn: <file review>. Đối chiếu PRD: <nghiệp vụ nào đúng / sai>.

## Major
### S1 · <tên ngắn> (<mã review>)
- Lỗi: … (file:dòng)
- Tái hiện: …
- Xong khi: <test tên …> đỏ trước, xanh sau; <hành vi>
- Không làm: …

## Minor
### S6 · …

## Điểm dừng bắt buộc
- S6: nếu …
## Giả định chờ duyệt
- S7: …
```

## 5. Tin nhắn cho owner (dev nói với dev)

```
PR #<n> (<nhánh>) sẵn sàng review. Theo tài liệu: <spec>/features/<f>/PRD.md @ <commit>.
Thay đổi: <3 dòng>. verify --pr: <kết quả hoặc "cần anh chạy grant">.
Depends on #<m>. Migration: <có/không, bảo toàn dữ liệu cũ>.
Lý do chọn <phương án>: <1 dòng>.
```

## 6. B5 — đối chiếu FIXES và Review fixes

```markdown
## Đối chiếu review ↔ PRD
| Finding | PRD / mã quyết định | Giữ / sửa / bác | Lý do + bằng chứng |
|---|---|---|---|
| <…> | <…> | <…> | <…> |
## Finding bị bác
| Finding | Vì sao review hiểu sai | PRD/code đã đọc | Ai chốt |
|---|---|---|---|
| <…> | <…> | <…> | <…> |
## Review fixes
| Finding | Mục S# | Commit | Test/ảnh kiểm lại | Kết quả / còn thiếu |
|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> |
Test đổi expectation comment mã quyết định; không nới assertion che fixture sai.
```

## 7. PR description

```markdown
Người dùng giờ <thấy/làm được gì và vì sao>.
Chức năng: <trước/sau, biên và quyền>.
Code: <vùng đổi, migration/dependency>.
Validation: <lệnh/kết quả thật, HEAD, số đo + đơn vị + điều kiện>.
Review fixes: <bảng trên>. Bỏ qua: <…>. Rủi ro: <…>.
```
