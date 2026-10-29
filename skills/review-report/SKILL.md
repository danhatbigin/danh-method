---
name: review-report
description: Produces Danh Method reviews, root-cause investigations and reports — read-only code review by diff, mechanism-level root cause (not symptom fixes), and tables in the format issue → cause → result → solution with mandatory "Skipped" and "Risks" sections; turns review findings into a numbered fix spec (S1..Sn). Use when someone says "review", "báo cáo", "lập bảng phân tích", "nguyên nhân do đâu", "tại sao chậm", "liệt kê lỗi", "issue nguyên nhân kết quả giải pháp", or after a subagent/PR finishes.
---

# Review, truy nguyên nhân & báo cáo

## 1. Truy nguyên theo cơ chế

Không dừng ở triệu chứng, không sửa mù. Đi theo chuỗi câu hỏi của Danh:

1. **Có phải do X?** — nêu giả thuyết cụ thể, kèm bằng chứng đo được (log, profile, số truy vấn, thời gian).
2. **X đang được xử lý thế nào và vì sao gây Z?** — chỉ ra cơ chế trong code (file:dòng), không chỉ "có vẻ".
3. **Chuẩn tham chiếu làm X thế nào mà ổn?** (OS, thư viện, feature khác trong sản phẩm) — dùng làm hướng sửa.

Dùng kỷ luật `superpowers:systematic-debugging` khi có. Giả thuyết chưa chứng minh ghi là giả thuyết.

## 2. Review code (chỉ đọc)

- Đọc bằng `git diff` / `git show`; không checkout, không sửa, không commit.
- Soi: AC và quyền trong PRD; bẫy trong GUIDANCE; review focus trong TASKS; bảo mật (dữ liệu nhạy cảm xuống client khi thiếu quyền, server có kiểm quyền); test có chứng minh hành vi; N+1; UI lệch preview/token; dữ liệu mẫu lọt vào code.
- Mỗi lỗi có mã (`lỗi 1…n` hoặc theo vòng `R2-xx`), mức Critical / Major / Minor, file:dòng, cách tái hiện.
- Kết luận một dòng: "Sẵn sàng để <X> merge" hoặc "Chưa sẵn sàng — cần sửa #…".

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

## 4. Từ review sang việc sửa

1. Đối chiếu PRD: lỗi nào là sai nghiệp vụ, lỗi nào là sai code, lỗi nào review hiểu sai.
2. Viết `features/<f>/FIXES-<ngày>.md`: S1…Sn theo thứ tự nghiêm trọng, mỗi mục có "xong khi" và "không làm"; nhóm Major / Minor; điểm dừng bắt buộc.
3. Giao bằng prompt biến thể `fix` (skill `prompt-contract`): một agent, tuần tự, test chứng minh lỗi trước.
4. Commit theo nhóm lỗi; lỗi nghiêm trọng nhất commit riêng.

## 5. Báo cáo HTML khi cần chia sẻ

Review dài cho owner có thể xuất HTML (ví dụ `PR22-REVIEW-<ngày>.html`) để đọc dễ; nội dung vẫn theo bảng trên. Nếu môi trường có Artifact/Docs thì dùng thay vì file rời.
