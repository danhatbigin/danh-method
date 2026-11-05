# Nguyên tắc & quyết định gốc (kèm lý do và lời gốc)

Rút từ 379 tin nhắn của Danh trên Claude, Codex, Antigravity, AionUI (08–22/10/2026) và tài liệu quy trình của dự án gốc tới 05/11/2026. Dùng file này khi cần **lý do** cho một luật, hoặc khi hai luật có vẻ mâu thuẫn.

## A. Thị giác & design system

| # | Nguyên tắc | Lý do | Lời gốc |
|---|---|---|---|
| D01 | Không custom style; sửa từ thư viện để đồng bộ. Gradient/màu phải đúng ở cả light và dark. | Đồng bộ, ít bảo trì | "Hãy đảm bảo là không custom style nha, sửa từ thư viện để đồng bộ nha…" |
| D02 | Không tự vẽ chart/SVG khi design system có component (ví dụ ChartContainer/ChartTooltip). | Tránh lệch theme/tooltip | "…bỏ SVG tự vẽ, dùng ChartContainer/ChartTooltip của packages/ui" |
| D03 | UI tiếng Anh, trao đổi tiếng Việt. | Sản phẩm cho khách nói tiếng Anh; nội bộ cần nhanh | "Toàn bộ UI đều phải trình bày English á" |
| D04 | Lớp nổi (topbar floating, gradient mờ 1/3 dưới) để phân biệt lớp khi scroll. | Card chạy qua bar gây loạn thị giác | "…card bên dưới chạy qua khiến loạn thị giác không phân biệt được" |
| D05 | Phân cấp thị giác giữa khung tổng và khung feature (L0/L1/L2). | Thiếu phân cấp làm đứt nhịp navigation — lỗi *cấu trúc*, không phải trang trí | "Master layout… chưa có phân cấp thị giác giữa frame tổng và frame của từng feature" |
| D06 | Dashboard phải trả lời câu hỏi nghiệp vụ của người dùng thật. | Đẹp là điều kiện cần, không đủ | "Trang dashboard thì đẹp đó như vô nghĩa…" |
| D07 | Tách trục trạng thái độc lập (presence ≠ message state); trạng thái không chỉ dựa vào màu. | Gộp trục tạo tín hiệu sai | "…draft với new lại là 2 cái độc lập nhỉ và nó nên là mini badge" |
| D08 | Component dùng chung nằm ở thư viện chung; bề mặt khác không được lệch hình. | Một nguồn | "…admin không được đổi hình so với ảnh after" |
| D09 | Chuyển động có kiểm soát: không animation lặp vô ích, chỉ vẽ lại khi số đổi đáng kể. | Tránh nhiễu, tốn CPU/GPU | "không thêm animation lặp, không thêm bộ đếm…" |

## B. Thiết kế → code

| # | Nguyên tắc | Lý do / lời gốc |
|---|---|---|
| D10 | Tài liệu trước, code sau. | "Anh cần em viết file mô tả chức năng… để anh đọc qua, sửa duyệt rồi mới cho code mode chạy á" |
| D11 | Preview HTML là gate trước khi thi hành. | HTML render được là ngôn ngữ chung, nhanh hơn Figma, chính xác hơn chữ. "…anh cần có 1 preview html để mình sync với nhau…" |
| D12 | Duyệt là duyệt đúng phạm vi. | "Approve. Hãy đảm bảo là chỉ thực thi những mục anh đề cập thôi nha." |
| D13 | Một task một lượt khi được giao vậy; dừng đúng biên. | "Chỉ làm TK02… Đừng làm TK03 hay task khác." |
| D14 | Batch có điều kiện dừng viết trước. | "Chạy liên tục CD02 → CD08… Chỉ dừng khi: việc không thể đảo ngược, ngoài phạm vi PRD, test cũ đỏ mà không sửa được…" |
| D15 | Không phá việc đang dở. | "KHÔNG được git reset / checkout / stash / clean / xoá." |
| D16 | Sai thì revert bằng commit mới. | "git revert … (tạo commit mới, không reset)" |

## C. Điều phối & review

| # | Nguyên tắc | Lý do |
|---|---|---|
| D17 | Chia theo bề mặt (surface); mỗi tác nhân một nhánh/worktree, một vùng sở hữu. | Tránh xung đột file, tránh nghẽn hạn mức |
| D18 | Reviewer không sửa code; review bằng `git diff`, không checkout. | Tách quyền viết và duyệt |
| D19 | Review có mã (lỗi 1…n, đợt, RG0/RG1), "Sẵn sàng để X merge". | Truy vết |
| D20 | TDD cho đường dữ liệu nhạy cảm; test payload theo role. | Test là bằng chứng |
| D21 | Báo cáo dạng bảng: issue → nguyên nhân → kết quả → giải pháp. | Đọc nhanh, ra quyết định nhanh |
| D22 | Báo cáo phải khai "Bỏ qua" và "Rủi ro". | Không giấu nợ |

## D. Nguồn sự thật & quyền

| # | Nguyên tắc |
|---|---|
| D23 | D3 (v0.3): dữ kiện Git/code thật > snapshot prompt > HANDOFF; quyết định/phạm vi người phụ trách > prompt hiện hành > PRD. HEAD lạ dừng và giữ việc dở. |
| D24 | Prompt đổi → bỏ prompt cũ trong phiên, đọc lại từ đầu. |
| D25 | Người phụ trách quyết sản phẩm; owner quyết kỹ thuật/merge. |
| D26 | Các vai cùng nhìn một sự thật nghiệp vụ (không silo dữ liệu giữa các role cùng phối hợp). |
| D27 | "User làm trung tâm" trong công cụ nội bộ = ưu tiên việc người dùng đang xử lý (Mine, việc tới hạn). |
| D28 | Công cụ không hiệu quả thì bỏ khỏi workflow; thuật ngữ không cần thì bỏ. |

## E. Chuỗi truy nguyên theo cơ chế (mẫu hỏi của Danh)

1. "Vậy có thể kết luận là do X?"
2. "X đang được xử lý như thế nào và vì sao gây Z?"
3. "Hệ thống/OS làm X thế nào mà mượt?" (tìm chuẩn tham chiếu)

Không dừng ở triệu chứng; không chấp nhận sửa mù.

## F. Mâu thuẫn thường gặp và cách hiểu đúng

| Có vẻ mâu thuẫn | Cách hiểu đúng |
|---|---|
| "Chỉ làm 1 task" vs "càn quét LM02→LM13" | Phạm vi do người giao khai báo từng lượt. Luật thật là **không tự mở rộng**. |
| "Không custom style" vs dùng ui-ux-pro-max | "Không custom" = không CSS ngoài token/thư viện, không phải "không thiết kế". |
| Agent thi hành commit vs reviewer cấm ghi | Commit là mặc định cho agent thi hành; agent review không ghi gì. |
| Quy trình chuẩn ghi `writing-plans` vs thực tế viết tay | Bám hành vi: plan là `TASKS.md` + prompt hợp đồng trong `prompts/`. |
| Kiểm UI bắt buộc vs "không mở được browser thì ghi lại rồi làm tiếp" | Giai đoạn đầu được nợ có ghi chép ("Chờ kiểm trình duyệt"); trước nghiệm thu thì bắt buộc. |
| Mock vs dữ liệu thật | Mock ở prototype, thật ở môi trường có backend; luôn khai rõ đang ở đâu. Code không chứa dữ liệu mẫu. |
| Ai duyệt cuối | Sản phẩm/UX = người phụ trách sản phẩm; kỹ thuật/merge = owner. |

## Cập nhật sau khảo sát 23–29/10

D14 là trích lịch sử; luật hiện hành A5.1/D6 yêu cầu phân loại FAIL trước khi tính lượt sửa, không dừng chung vì test cũ đỏ. G3 là vòng review owner sau Stage 6 và gate PR/AC/blocker (A1.2). D17 chia theo glob có chồng file hay không (D5), không theo số finding.


## G. Pipeline v0.5: vì sao (rút từ một PR phải qua 23 vòng review)

Bối cảnh: một feature ghi dữ liệu nhiều bảng (đơn, giá, lịch, job nền) mất 23 vòng review/sửa và 28 prompt trong 4 ngày. Truy nguyên cho thấy lỗi không nằm ở agent viết ẩu mà ở **cảm biến** của quy trình: vòng trong (agent + verify) chỉ thấy lỗi kiểu, lint, test trùng tên file; vòng ngoài (review) thấy tranh chấp, quy mô, vai trò × trạng thái. Review trả về danh sách *trường hợp* thay vì *loại lỗi*, nên mỗi loại tốn một vòng cho mỗi trường hợp (một bất biến cần 4 vòng mới lan hết các hàm ghi).

| # | Nguyên tắc | Lý do |
|---|---|---|
| P01 | Mức nặng quy trình đi theo diff thật (Nhẹ/Vừa/Đủ); chỉ nâng, không hạ. | Trả đúng giá cho rủi ro; không đoán theo cảm giác. |
| P02 | Feature ghi dữ liệu phải viết bất biến + bản đồ bảng → mọi writer/caller/job trước khi code. | Không có bất biến viết ra thì không có gì để quét, không có chuẩn để test; sửa theo điểm là hệ quả tất yếu. |
| P03 | Kịch bản được đúng người duyệt; PO duyệt nghiệp vụ, owner duyệt bất biến; PO duyệt không suy ra owner duyệt. | Hai loại đúng/sai khác nhau, cần hai thẩm quyền. |
| P04 | Agent không bao giờ làm test khớp với code. Lệch → sửa code hoặc Spec Issue. Người dịch test khác người code. | Agent tự nới thước đo của mình (nâng trần, viết lại assertion, assertion luôn đúng) làm test xanh mà vô nghĩa. |
| P05 | Một agent làm trọn một lát dọc. | Bất biến chạy xuyên tầng (token UI → action → domain → khoá → job); chia đôi thì lỗi rơi vào chỗ nối. |
| P06 | Quan sát đủ trước khi vá; phân loại ENV/FLAKY/PRE-EXISTING/SPEC/TEST/CODE; sửa theo nhóm nguyên nhân. | Fail-fast + "sửa 1 lần rồi dừng" + lỗi môi trường làm agent dừng liên tục (8/10 lần dừng không do lỗi logic) → đổi agent → mất bối cảnh. |
| P07 | Review toàn PR theo bất biến, không theo diff commit sửa; mỗi finding có nhãn mới/quay lại/bị bác và mức bằng chứng. | Review từng diff để lỗi ngoài diff lộ ra ở vòng sau như "lỗi mới". |
| P08 | Đường Đủ: hai lượt review sạch liên tiếp trên cùng commit, cùng cấu hình; 3 vòng vẫn còn major mới → quay về hợp đồng. | Có điểm dừng đo được; vòng 4 vá tiếp thường là triệu chứng của hợp đồng thiếu. |
| P09 | Trạng thái verify trung thực: SKIPPED ngoài docs là PARTIAL; ENV, BLOCKED-SPEC không xanh; CI chưa chạy ≠ CI xanh; PASS cũ không thay kết quả HEAD mới. | Công cụ in PASS khi bỏ qua test khiến "xong" vượt phạm vi đã kiểm. |
| P10 | Phần chưa kiểm phải có người nhận theo vai trò và hạn; chưa ai nhận thì ghi "chưa được nhận". | "Cho owner chạy --pr" lặp qua nhiều handoff mà không ai chạy. |
| P11 | Owner nhận một gói review đủ bằng chứng, không nhận từng lỗi lẻ; đo số vòng owner review (mục tiêu ≤ 2). | Mỗi lần nhắn lẻ là một vòng ngữ cảnh của owner. |
| P12 | Khai thật mức cách ly: `policy-only` khi chưa có sandbox/quyền ghi riêng. Hook, manifest, allowlist là rào giảm tốc, không phải khoá tuyệt đối. | Không quảng cáo bảo đảm mà hệ thống không có. |
