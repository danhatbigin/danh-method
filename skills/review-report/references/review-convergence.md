# Review hội tụ (chỉ đường Đủ)

Áp cho đường **Đủ** (tier 3, thêm/đổi đường ghi dữ liệu, migration, quyền, tiền, dữ liệu nhạy cảm) — nơi chạy full suite ở PR gate. Đường Vừa: một lượt review toàn diff độc lập. Đường Nhẹ: không review riêng.

**Vì sao:** không có điểm dừng đo được thì review và sửa cứ luân phiên; mỗi vòng sửa có thể sinh lỗi mới, và "xong" trở thành cảm giác. Hội tụ cho một tiêu chí khách quan: cùng một bản, cùng một cách soi, hai lần liên tiếp không tìm thêm major.

## 1. Khoá đầu vào và cấu hình
Ghi full SHA head và base, model thực dùng (không đoán), số lượt trong vòng, phạm vi toàn PR, phương pháp đọc/tái hiện, môi trường, phiên bản test/config. Mọi lượt dùng cùng cấu hình. Đổi model/phạm vi/phương pháp/commit → ghi lý do và **reset bộ đếm**; không so hai lượt khác lưới.

## 2. Một lượt review toàn PR
Với từng bất biến: lấy toàn bộ đường ghi và kiểm khoá/đọc lại, token, vai trò × trạng thái, quan hệ phụ thuộc, ngân sách. Rà toàn PR so base, cộng caller ngoài diff. Mỗi major có tái hiện bằng test trên DB thật, hoặc ghi rõ mức bằng chứng. Kiểm tra chỉ chạy theo verify và quyền hiện hành; thiếu quyền/môi trường → ghi bị chặn.

Nhãn: **mới** (chưa có trong ledger) · **quay lại** (ID cũ, phần sửa chưa đủ) · **bị bác** (người có thẩm quyền, lý do, bằng chứng). Mức độc lập với nhãn.

## 3. Vòng sửa theo bất biến
Nộp bảng INV → mọi đường ghi → thiếu sót → test đỏ trước/xanh sau. Đóng major chỉ khi quét đủ writer và test thực sự đỏ khi bỏ bản sửa. Tranh chấp ép xen kẽ có điểm dừng; quy mô đo dòng/bind/bytes. Test khoá/manifest sai → Spec Issue, BLOCKED-SPEC; không sửa thước đo để xanh.
Minor loại "test yếu" hoặc "tài liệu khẳng định sai" sửa ngay trong vòng. Minor khác ghi quyết định và ảnh hưởng. Không đóng bằng câu "đã sửa F…".

## 4. Hội tụ và phanh
- Sau sửa, review **toàn PR** lại, cùng cấu hình.
- Trên **cùng commit**, cần **hai lượt liên tiếp không có major mới** và **không còn major quay lại chưa khép**. Hai lượt trên hai commit khác nhau không cộng dồn. Đối chiếu độc lập trong một lượt không tính là lượt thứ hai.
- Một vòng = review → sửa → review lại. **Sau 3 vòng vẫn còn major mới → dừng vá**, quay về hợp đồng: kiểm kê bất biến/bản đồ ghi, ghi chỗ thiếu, xin duyệt lại. Không bắt đầu vòng 4. Sửa xong hợp đồng → mốc mới, reset đếm.

## 5. Bàn giao
Chỉ đề nghị ready khi: không còn major chưa khép, đủ hai lượt sạch trên cùng commit, các cổng kiểm thực sự đạt (PR gate full suite). CI chưa chạy hoặc bị bỏ qua → giữ draft, không gọi là xanh. Phần chưa kiểm ghi người nhận theo vai trò + hạn (trước ready), không ghi "cho owner chạy …". PO quyết nghiệp vụ; owner quyết bất biến kỹ thuật và merge.

## Mẫu báo cáo một lượt
| Lượt | Commit | Model/phương pháp | Major mới | Quay lại | Bị bác | Bằng chứng | Kết luận |
|---|---|---|---|---|---|---|---|
