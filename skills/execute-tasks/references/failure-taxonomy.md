# Phân loại FAIL trước khi sửa (A5.1/D6, A5.2)

Ghi nguyên văn **tên test + assertion + message**, commit/base, lệnh, log và ngân sách còn lại trong HANDOFF. Không đổi tên task, đổi agent/phiên/base, xoá log để làm lại ngân sách.

| Loại | Bằng chứng cần | Hành động | Tính lượt code? |
|---|---|---|---|
| Hỏng thừa kế | Tái hiện ở base, hash đầu hỏng | Commit riêng `broken since <hash>` nếu được giao sửa; ngoài phạm vi ghi blocker để điều phối giao sửa | Không |
| Test theo luật trước PRD đổi | Mã quyết định + PRD hiện hành | Sửa test; comment mã quyết định cạnh expectation | Không |
| PRD chưa nói | Hành vi dữ liệu/quyền cần quyết | Dừng phần phụ thuộc → hỏi → cập nhật PRD → cấp lượt mới | Chờ chốt |
| Môi trường/cấu hình | Lỗi môi trường nguyên văn | Sửa trong quyền đã có; không tự cài công cụ mới | Không |
| Fixture lệch hợp đồng | Field sai so hợp đồng hiện hành | Sửa fixture, **không đổi assertion** để xanh | Không |
| FLAKY | Cùng commit chạy lại cho kết quả khác; ghi số lần | Ghi vào ledger, cách ly nếu được giao; không tính là PASS | Không |
| SPEC (test khoá lệch) | Test `@spec` + kịch bản + PRD hiện hành | **Không sửa test**: mở Spec Issue, BLOCKED-SPEC, làm mục khác | Không |
| Code trong phạm vi | Tái hiện do thay đổi đang làm | Nhóm theo nguyên nhân gốc + mọi caller; sửa cả nhóm trong ngân sách đã cấp; còn FAIL thì dừng | Có |

Chưa đủ bằng chứng thì chưa phân loại. Không xoá/skip test hay hạ tier. Miễn lượt không biến FAIL thành PASS: mọi lỗi còn lại vẫn ghi trong gate và chặn merge-ready. Tiếp tục phần độc lập trong phạm vi khi đang chờ một quyết định.

## Tên nhóm trong ledger (v0.5)

ENV · FLAKY · PRE-EXISTING (hỏng thừa kế, có bằng chứng base) · SPEC · TEST (test kỹ thuật sai/yếu, fixture lệch) · CODE. Gom lỗi từ compiler/lint/test/review/spec vào **một** ledger trước khi sửa; không vá trong lúc thu bằng chứng.

Lý do: khi một lỗi môi trường hay test hỏng sẵn tiêu mất lượt sửa duy nhất, agent dừng, đổi agent và mất bối cảnh; phần lớn lần dừng khi đó không do lỗi logic của việc đang làm.
