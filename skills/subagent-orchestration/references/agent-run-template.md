# Run <feature> · <ngày>

Trạng thái: G0 / Test / Fix / Freeze / Review / PR gate / Handoff / BLOCKED.
Điều phối: <agent/session>. Quyền ghi: policy-only / enforced (kèm bằng chứng cấu hình).
Đường: khai <Nhẹ/Vừa/Đủ> · theo `--classify` lúc freeze <tier · đường> · nâng đường: <không / lý do>.
Mẫu đầy đủ bắt buộc cho đường Đủ; đường Vừa điền Đầu vào + Review; đường Nhẹ chỉ ghi đường và dòng verify trong log.

## Đầu vào đã khoá

- Code base/candidate full SHA: … / …; Spec full SHA: …
- Working tree + untracked: …; kit/config hash: …; manifest hash: …
- Kịch bản ID/version, nguồn, người duyệt theo vai trò: …
- Thiết kế/flow được duyệt: …; INV và mọi writer/caller/job: …
- Runtime (verify-runtime: mode/reset/fingerprint): …; không chứa credentials hoặc dữ liệu nhạy cảm.
- Tồn đọng phải mang sang ledger: …

## Giao việc (điền đường dẫn cụ thể trước khi dispatch)

| Vai trò | Agent/session độc lập | Checkout/snapshot | File được đổi | File cấm đổi | Output |
|---|---|---|---|---|---|
| Test | … | … | tests/spec/**, manifest | Mã sản phẩm, chuẩn chưa duyệt | Kịch bản→test; manifest; giới hạn độ nhạy |
| Fix | … | … | … | Test khoá/manifest/budget/verify config | Patch theo nhóm; caller; chưa kiểm |
| Review | … | … | Không (báo cáo về điều phối) | Toàn source/test/config | Review toàn PR; finding + phản biện + bỏ sót |

Không để placeholder khi giao. Agent không chạy full gate riêng. Điều phối chạy verifier trên candidate freeze, không có writer đang hoạt động. Mutation: biến thể cô lập theo policy, giữ input/assertion, đổi code thực thi, lưu lý do RED.

## Trình tự

- [ ] G0: nhánh mới từ main; spec/thiết kế/bất biến được duyệt đúng vai.
- [ ] Hệ thống có sẵn: freeze → quan sát → ledger → nhóm nguyên nhân trước khi sửa.
- [ ] Test độc lập xong; manifest khoá; spec-lock đã đóng; Fix chỉ đọc chuẩn.
- [ ] Nhận patch Fix: diff đúng allowlist, không thay chuẩn; sai thì trả lại.
- [ ] Freeze: dừng writer, ghi fingerprint trước/sau, kiểm theo vùng một lần qua verifier.
- [ ] Review toàn PR từ ngữ cảnh độc lập: phản biện finding, tìm bỏ sót, ghi mức trước/sau/lý do.
- [ ] (Đủ) Hai lượt review sạch liên tiếp cùng commit/config; đối chiếu trong một lượt không tính lượt thứ hai.
- [ ] (Đủ) Sau 3 vòng còn major mới: quay G0, không vá vòng 4.
- [ ] PR gate trên candidate cuối; đổi candidate thì reset hội tụ; không dùng PASS cũ.
- [ ] Gói review: nghiệm thu, ledger, Spec ref, trạng thái CI thật, giới hạn/người nhận/hạn.

## Kết quả và tiếp quản

Verifier nguyên văn: …; profile: …; lần đầu FAIL/ENV và cách xử lý: …
Review lượt 1 / lượt 2: …; major mở: …; SI: …
Thời gian tổng/check/restore: …; chưa kiểm: …
Số đo: số vòng owner review, major mới/quay lại, số lần đổi agent, phút kiểm, test bị bỏ, SI mở.
Bước tiếp: …; người nhận đã xác nhận/hạn: …
