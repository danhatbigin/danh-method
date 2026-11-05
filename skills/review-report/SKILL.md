---
name: review-report
description: Produces Danh Method reviews, root-cause investigations and reports — read-only full-PR review by data invariant (not per fix diff), findings labelled new / returning / rejected with evidence levels, a cross-round ledger grouped by root cause, convergence review on the Full track (two clean passes on the same commit, brake after three rounds), a 7-point regression checklist, one owner review package with efficiency metrics, and tables in the format issue → cause → result → solution with mandatory "Skipped" and "Risks" sections. Use when someone says "review", "báo cáo", "lập bảng phân tích", "nguyên nhân do đâu", "tại sao chậm", "liệt kê lỗi", "issue nguyên nhân kết quả giải pháp", "review hội tụ", "ledger", "gói review", "review package", or after a subagent/PR finishes.
---

# Review, truy nguyên nhân & báo cáo

## 1. Truy nguyên theo cơ chế

Không dừng ở triệu chứng, không sửa mù. Đi theo chuỗi câu hỏi của Danh:

1. **Có phải do X?** — nêu giả thuyết cụ thể, kèm bằng chứng đo được (log, profile, số truy vấn, thời gian).
2. **X đang được xử lý thế nào và vì sao gây Z?** — chỉ ra cơ chế trong code (file:dòng), không chỉ "có vẻ".
3. **Chuẩn tham chiếu làm X thế nào mà ổn?** (OS, thư viện, feature khác trong sản phẩm) — dùng làm hướng sửa.

Dùng kỷ luật `superpowers:systematic-debugging` khi có. Giả thuyết chưa chứng minh ghi là giả thuyết.

## 2. Review code (chỉ đọc, toàn PR, theo bất biến)

- Đọc toàn diff base → candidate (`git diff <base>..<candidate>`, `git show`) cộng caller ngoài diff khi cần; không checkout, không sửa, không commit. **Không chỉ đọc commit sửa gần nhất**: lỗi ngoài diff sẽ lộ ra ở vòng sau như "lỗi mới".
- Với từng bất biến trong GUIDANCE: lấy toàn bộ đường ghi (helper, action, job, đường tạo dữ liệu ban đầu), kiểm thứ tự khoá/đọc lại, token UI→action→domain, vai trò × trạng thái × dữ liệu nhạy cảm, quan hệ phụ thuộc, ngân sách dòng/bind/bytes. Không chia review theo file.
- Áp `references/regression-checklist.md` (7 điểm) cho mọi finding đang sửa.
- Mỗi finding: mã (theo vòng `R<n>-xx`), mức Critical/Major/Minor **độc lập** với nhãn **mới / quay lại / bị bác**, INV + bảng writer, mức bằng chứng **tái hiện DB / phân tích tĩnh / nghi ngờ chưa xác minh** kèm lệnh, commit, output nguyên văn. Không biến phân tích tĩnh thành đã tái hiện; bằng chứng yếu không đóng được major.
- Phản biện từng finding và tìm chỗ bỏ sót trước khi nộp. Finding từng bị bác mà nêu lại phải dẫn quyết định cũ.
- Đường Đủ: theo `references/review-convergence.md`. Đường Vừa: một lượt toàn diff, độc lập.
- Kết luận một dòng: "Lượt sạch" hoặc "Chưa sạch — cần sửa #…". Merge là quyết định của owner.

## 3. Định dạng báo cáo (mặc định cho mọi phân tích)

Theo `references/report-formats.md`. Lõi:

| # | Issue | Nguyên nhân | Kết quả | Giải pháp |
|---|---|---|---|---|

- **Issue**: người dùng/hệ thống thấy gì.
- **Nguyên nhân**: cơ chế, dẫn file:dòng.
- **Kết quả**: tác động thật (ai bị ảnh hưởng, mức độ, dữ liệu nào lộ/mất).
- **Giải pháp**: việc cụ thể, ước lượng nếu được.

Luôn kết bằng **Bỏ qua** (cố ý chưa làm/chưa kiểm, vì sao) và **Rủi ro**. Trọng tâm khi được yêu cầu: bảo mật và trải nghiệm người dùng đứng đầu.

Bản cho người phụ trách sản phẩm: ngắn, ngôn ngữ nghiệp vụ, tối đa 10 dòng + bảng. Bản cho owner: kiểu dev nói với dev, có commit/file.

## 4. Từ review sang việc sửa: ledger theo nhóm nguyên nhân

1. **Ledger xuyên vòng** (`features/<f>/LEDGER-<ngày>.md`): gộp compiler/lint/test/review/spec; mỗi dòng có loại ENV / FLAKY / PRE-EXISTING (bằng chứng base) / SPEC / TEST / CODE, mức trước/sau, nhãn mới/quay lại/bị bác, trạng thái. Không xoá dòng; finding bị bác ghi người, lý do, bằng chứng.
2. **Nhóm theo nguyên nhân gốc**, không theo finding: mỗi nhóm G01…Gn liệt kê mọi hàm/job/caller cùng nguyên nhân. Đây là chỗ biến "danh sách trường hợp" thành "loại lỗi".
3. Đối chiếu PRD: sai nghiệp vụ → Spec Issue (skill `scenario-tests`); sai code → nhóm sửa; review hiểu sai → bác có bằng chứng.
4. Giao `slice-implementer` bằng prompt biến thể `fix-by-group` (skill `prompt-contract`): mỗi nhóm một commit, test đỏ/xanh/mutation, không chạy tổng giữa các nhóm.
5. Sau các nhóm: điều phối freeze, chạy kiểm theo vùng một lần, rồi review toàn PR lại.

Lý do: gửi agent danh sách finding F1..Fn khiến nó sửa đúng các hàm được nêu; loại lỗi vẫn mở và vòng sau tìm thấy trường hợp khác cùng loại.

## 4.5 Gói review cho owner

Owner nhận **một gói** theo `references/review-package-template.md`: SHA/ref các repo, người dùng thấy gì (≤3), bảng quyết định cần duyệt một lần, bằng chứng (verify nguyên văn, PR gate, CI thật hay chưa, hai lượt review nếu Đủ), thứ tự tích hợp, mục còn mở có người nhận theo vai trò + hạn. Không nhắn từng lỗi lẻ. Gửi gói không có nghĩa PR đủ điều kiện ready.

Đo trên mỗi gói: số vòng owner review (mục tiêu ≤ 2), major mới/quay lại, số lần đổi agent, tổng phút kiểm, test bị bỏ, SI mở. Sau vài gói mới chỉnh ngân sách từ số đo thật; không cam kết "không thể có lỗi mới".

## 5. Báo cáo HTML khi cần chia sẻ

Review dài cho owner có thể xuất HTML (ví dụ `PR<n>-REVIEW-<ngày>.html`) để đọc dễ; nội dung vẫn theo bảng trên. Nếu môi trường có Artifact/Docs thì dùng thay vì file rời.

## 6. FIXES và bằng chứng review (A2.3; B5)

- FIXES có bảng finding ↔ PRD ↔ quyết định giữ/sửa/bác. Finding bị bác ghi lý do và bằng chứng, không xoá dấu vết.
- Test đổi expectation theo PRD phải comment mã quyết định cạnh expectation.
- PR description: **trải nghiệm người dùng → thay đổi chức năng → code**. Bảng Review fixes: finding, PRD, commit, test/ảnh, trạng thái.
- Số đo thật có đơn vị, điều kiện, công cụ, HEAD; chưa đo ghi chưa đo. Bản cho người phụ trách ≤3 đạt / ≤3 cần sửa / 1 quyết định, ưu tiên hình.
