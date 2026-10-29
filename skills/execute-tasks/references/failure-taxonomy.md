# Phân loại FAIL trước khi sửa (A5.1/D6, A5.2)

Ghi nguyên văn **tên test + assertion + message**, commit/base, lệnh, log và ngân sách còn lại trong HANDOFF. Không đổi tên task, đổi agent/phiên/base, xoá log để làm lại ngân sách.

| Loại | Bằng chứng cần | Hành động | Tính lượt code? |
|---|---|---|---|
| Hỏng thừa kế | Tái hiện ở base, hash đầu hỏng | Commit riêng `broken since <hash>` nếu được giao sửa; ngoài phạm vi ghi blocker để điều phối giao sửa | Không |
| Test theo luật trước PRD đổi | Mã quyết định + PRD hiện hành | Sửa test; comment mã quyết định cạnh expectation | Không |
| PRD chưa nói | Hành vi dữ liệu/quyền cần quyết | Dừng phần phụ thuộc → hỏi → cập nhật PRD → cấp lượt mới | Chờ chốt |
| Môi trường/cấu hình | Lỗi môi trường nguyên văn | Sửa trong quyền đã có; không tự cài công cụ mới | Không |
| Fixture lệch hợp đồng | Field sai so hợp đồng hiện hành | Sửa fixture, **không đổi assertion** để xanh | Không |
| Code trong phạm vi | Tái hiện do thay đổi đang làm | Sửa tối đa 1 lần hoặc số lượt được cấp; còn FAIL thì dừng | Có |

Chưa đủ bằng chứng thì chưa phân loại. Không xoá/skip test hay hạ tier. Miễn lượt không biến FAIL thành PASS: mọi lỗi còn lại vẫn ghi trong gate và chặn merge-ready. Tiếp tục phần độc lập trong phạm vi khi đang chờ một quyết định.
