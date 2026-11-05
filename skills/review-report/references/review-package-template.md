# Gói review · <ngày> · <phạm vi>

Trạng thái: đang chuẩn bị / chờ owner quyết / đủ điều kiện review. Không đồng nghĩa đủ điều kiện merge.

| Repo/PR | HEAD/base (full SHA) | Spec ref | Kit/config | Trạng thái |
|---|---|---|---|---|
| <repo> | … | … | <version/hash> | Draft |

## Người dùng thấy gì
<Tối đa ba thay đổi cụ thể.>

## Quyết định owner cần duyệt một lần
| ID | Đề xuất cụ thể | Lý do/bằng chứng | Đổi ý thì ảnh hưởng gì | Trạng thái |
|---|---|---|---|---|

## Bằng chứng
AGENT-RUN: …; session Test/Fix/Review: …; quyền ghi thực tế: policy-only/enforced. Ledger + bảng mức trước/sau: …; fingerprint trước/sau verify: …; runtime/profile: …

| Nhóm | Nguyên nhân | Commit sửa | Đỏ/xanh/mutation | Giới hạn |
|---|---|---|---|---|

Dòng verify nguyên văn, PR gate, link CI run, (Đủ) hai lượt review cùng HEAD. Không có thì ghi "chưa có"; không thay bằng PASS lịch sử.

## Thứ tự tích hợp và quyền
<Repo phụ thuộc, owner merge, bước kích hoạt, kiểm sau kích hoạt, điều kiện rollback.>

## Còn mở
| Mục | Người nhận theo vai trò | Đã nhận? | Hạn | Chặn ready? |
|---|---|---|---|---|

## Số đo
Vòng owner review: … (mục tiêu ≤ 2) · major mới/quay lại: … · đổi agent: … · phút kiểm: … · test bị bỏ: … · SI mở: …
