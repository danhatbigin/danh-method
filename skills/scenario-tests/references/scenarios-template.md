# <FEATURE> · Kịch bản

| ID | Loại | Duyệt | v | Tiêu đề |
|---|---|---|---|---|
| <FEATURE>-<nguồn>-<nn> | Nghiệp vụ / Kỹ thuật | PO ✅ <ngày> / Owner ✅ <ngày> / chờ duyệt | 1 | <tiêu đề> |

Bảng trên là hợp đồng máy đọc: cột Duyệt còn chữ "chờ" nghĩa là chưa duyệt; cột v là số nguyên.

**<FEATURE>-<nguồn>-<nn>** (nguồn: AC / D-xx / INV / finding)
- Loại: Nghiệp vụ / Kỹ thuật
- Người duyệt: PO (nghiệp vụ) / owner kỹ thuật (bất biến); trạng thái và ngày.
- Version: 1 (tăng khi quyết định đổi; ghi link quyết định).
- Bắt đầu: <vai trò, trạng thái, dữ liệu>
- Các bước: <vai trò → hành động>, đánh số.
- Kết quả: <quan sát được; cả trường hợp bị từ chối>.
- Nguồn: <PRD §/AC, D-xx, INV-xx>.

Chỉ dịch sau khi đúng người duyệt. Agent dịch test khác agent code; chứng minh đỏ trước, khoá manifest sau duyệt.
