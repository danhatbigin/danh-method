# Checklist review hồi quy (7 điểm)

Dùng khi sửa một finding và khi review bản sửa. Ghi câu trả lời + bằng chứng vào ledger trước khi đóng. Không thêm lệnh test ngoài policy, không nới assertion hay ngân sách.

1. **Truy toàn bộ hiệu ứng quan sát được.** Theo điểm vào thật qua service, event, repository, reader. Liệt kê mỗi người nhận sẽ thấy gì: trạng thái, đơn, việc cần làm, thông báo, bài đăng, người thực hiện. Kiểm cả hiệu ứng thiếu lẫn thừa/trùng. Assertion trên một loại event không chứng minh không có thông báo khác cho cùng hành động.
2. **Kiểm kết quả công khai.** Lỗi ở màn/view → kiểm kết quả mà view thật trả về, không chỉ SQL/helper riêng. Có fixture dương lẫn biên rỗng. Giữ các đường anh em trong phạm vi hồi quy. Thêm event/trạng thái mới → cập nhật fixture liệt kê đầy đủ và giữ assertion so khớp tập hợp.
3. **Phản ví dụ phải đổi code thực thi.** Mutation là code thay thế thật chạy với cùng input và assertion. Xác nhận bản thay đúng ý, bản gốc qua, bản đột biến trượt ở đúng assertion hành vi. Không ép trượt bằng cách đổi giá trị quan sát trong assertion, đổi expected, hay ném lỗi vô điều kiện.
4. **Kiểm cả giao dịch và lần chạy lại.** Mọi người nhận, định danh bản ghi liên quan, tác giả/nội dung bài đăng, độ ưu tiên, tham chiếu hành động. Thử giao nhận lặp lại và lỗi bất ngờ trên trạng thái trước thật (không giả định fixture trống). Sau khi tạo bản ghi, reader kế tiếp phải thấy định danh thật thay vì snapshot đọc từ đầu giao dịch. Giữ bất biến thanh toán, nghiệp vụ nhạy cảm, phân quyền.
5. **Tra thẩm quyền trước khi xin chính sách mới.** Tìm PRD, tài liệu nguồn liên quan và feature lân cận trước. Tách quyết định trực tiếp khỏi giả định và phát biểu lịch sử. Nêu rõ ai phải quyết và phạm vi. Báo cáo review không xoá được quyết định sản phẩm trực tiếp chỉ vì người viết không thấy cuộc trao đổi. Không suy ra thay đổi tiền/quyền từ một phê duyệt phát hành.
6. **Một handoff hiện hành.** Điểm vào hiện hành trỏ tới ledger và quyết định mới nhất. Gỡ chỉ dẫn mệnh lệnh đã lỗi thời khỏi bản tóm tắt; đánh dấu gói cũ là snapshot lịch sử. Giữ lỗi gốc, fingerprint nguồn, quan sát có ngày làm bằng chứng.
7. **Đóng trên đúng source đã test.** Ghi trạng thái verify nguyên văn và test đã chạy; giữ hiển thị lỗi và lần sửa. Freeze source/test khi chạy và so fingerprint sau. Reviewer độc lập soi assertion và side effect, không chỉ đếm PASS. Tách kiểm cục bộ, owner ký duyệt và vận hành production.

PASS nghĩa là các kiểm tra đã ghi đã đạt; không phải bằng chứng mọi lỗi có thể đã bị loại trừ.
