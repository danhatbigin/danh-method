# Luật dịch kịch bản → test khoá

1. **Đầu vào duy nhất là kịch bản đã duyệt** + giao diện công khai (route, action, hàm domain) + bất biến liên quan. Không đọc code đang sai để suy ra expected.
2. **Header bắt buộc** ở dòng 1: `// @spec <ID> v<version>`. Một file một ID.
3. **Đỏ trước, xanh sau.** Tính năng mới: chạy trên code chưa có → đỏ ở đúng assertion hành vi. Hành vi đã có: lập biến thể cô lập bỏ đoạn code bảo đảm hành vi → đỏ; khôi phục → xanh. Ghi lệnh và output nguyên văn.
4. **Mutation phải đổi code thực thi**, không đổi giá trị quan sát trong assertion, không ném lỗi vô điều kiện.
5. **Tranh chấp dữ liệu** phải ép xen kẽ bằng hai giao dịch có điểm dừng xác định (giữ giao dịch A tại một điểm, chờ B thật sự đợi khoá). Chạy song song hoặc ngủ không chứng minh có khoá.
6. **Quy mô** đo số dòng đọc/hydrate, số tham số bind và bytes payload trên tập lớn; số câu truy vấn không đổi không chứng minh chi phí bị chặn.
7. **Quyền** kiểm đủ ma trận vai trò × trạng thái × thao tác, kể cả dữ liệu nhạy cảm lọt qua bộ lọc/trường phụ.
8. **Kết quả công khai**: kiểm kết quả mà màn/endpoint thật trả về, không chỉ helper/SQL riêng. Có fixture dương lẫn biên rỗng.
9. **Không** skip/todo/only, không test rỗng, không assertion luôn đúng. spec-guard sẽ FAIL các trường hợp này.
10. Fixture đổi có thể làm biến mất tình huống lỗi → fixture cũng cần review.
11. Xong: `spec-guard --update <ID>` từng ID, commit, khoá cửa sổ. Báo cáo: ID/version, file, bằng chứng đỏ/xanh, giới hạn độ nhạy.
