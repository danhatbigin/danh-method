# Cài Superpowers — xin phép, lý do, cách cài

Plugin companion: **Superpowers** (`obra/superpowers`, MIT). Kho lưu trữ: https://github.com/obra/superpowers.

Superpowers là bộ kỹ năng và phương pháp phát triển phần mềm có kỷ luật cho coding agent, giúp ngăn agent nhảy ngay vào viết code khi chưa rõ spec và duy trì các chuẩn kỹ thuật nghiêm ngặt trong suốt quá trình thi hành.

## Vì sao Danh Method cần nó (nói với người dùng đúng ý này)

Danh Method dùng Superpowers như **bộ kỷ luật thi hành**, không phải menu tính năng tuỳ chọn:

1. **`brainstorming`** (trước Stage 1 / `feature-spec`): Làm rõ bài toán, bóc tách nhu cầu thật sự và ranh giới tính năng trước khi viết PRD/spec; không để agent đoán mò hay tự tiện code trước khi hiểu vấn đề.
2. **`writing-plans`** (sau Stage 3 / duyệt spec): Lập kế hoạch kỹ thuật chi tiết từng task với chữ ký hàm, test assertion, tiêu chí hoàn thành cụ thể.
3. **`executing-plans`** (Stage 4 thi hành): Chạy từng task tuần tự có kiểm soát, đối chiếu chặt chẽ với kế hoạch đã duyệt.
4. **`using-git-worktrees`** (Stage 4 cô lập): Tạo workspace cô lập qua git worktree cho từng nhánh tính năng, bảo vệ thư mục làm việc chính.
5. **`test-driven-development`** (Stage 4 thi hành task): Chu trình TDD nghiêm ngặt (RED → GREEN → REFACTOR), viết test kiểm chứng fail trước khi viết code logic.
6. **`systematic-debugging`** (Stage 4 / 6 khi gặp lỗi): Quy trình debug 4 pha có hệ thống, truy tìm nguyên nhân gốc rễ trước khi sửa, loại bỏ việc đoán mò và sửa lan man.
7. **`subagent-driven-development`** (Stage 4 / `subagent-orchestration`): Điều phối subagent chuyên biệt theo từng bề mặt độc lập không chồng lấn; reviewer chỉ đọc diff.
8. **`requesting-code-review` & `receiving-code-review`** (Stage 6): Chuẩn bị bằng chứng review độc lập, tiếp nhận phản hồi nghiêm túc trước khi chuyển sang gate G3.
9. **`verification-before-completion`** (Stage 6 / nghiệm thu): Bắt buộc kiểm tra thực tế bằng lệnh test/verify và bằng chứng cụ thể trước khi tuyên bố hoàn thành.

Không bắt buộc: Nếu thiếu Superpowers, Danh Method vẫn vận hành được nhờ quy trình lõi và bộ verify-kit có sẵn, nhưng agent phải tự duy trì kỷ luật thủ công mà không có các skill tự động kích hoạt.

An toàn: Hoạt động hoàn toàn cục bộ (local) qua các tệp Markdown (`SKILL.md`) và hook, không yêu cầu tài khoản riêng, không gửi mã nguồn ra ngoài.

## Câu hỏi xin phép (một lần mỗi phiên)

- Câu hỏi: "Danh Method dùng companion plugin Superpowers (obra/superpowers) để giữ kỷ luật thi hành (brainstorming trước spec, TDD, systematic-debugging, review và verify có bằng chứng). Máy này chưa có. Em cài nhé?"
- Lựa chọn:
  - **Cài ngay (đề xuất)** — "Miễn phí (MIT), chạy local, giữ đúng chuẩn thi hành."
  - **Bỏ qua lần này** — "Làm theo quy trình cơ bản; agent tự giữ kỷ luật thủ công."

## Cách cài theo môi trường

| Môi trường | Cách cài | Ai làm |
|---|---|---|
| **Claude Code** | Cách 1 (Superpowers Marketplace - cập nhật sớm nhất):<br>`/plugin marketplace add obra/superpowers-marketplace`<br>`/plugin install superpowers@superpowers-marketplace`<br><br>Cách 2 (Anthropic Official Marketplace):<br>`/plugin install superpowers@claude-plugins-official`<br><br>(Khởi động lại phiên làm việc sau khi cài) | Người dùng gõ lệnh slash |
| **Cowork** (Claude Desktop) | Mở danh mục plugin, tìm kiếm `superpowers` → bấm cài đặt trên thẻ plugin (hoặc thêm marketplace `obra/superpowers-marketplace` trong Settings > Plugins). | Người dùng thao tác |
| **Codex CLI / App** | **CLI:** Gõ `/plugins` → tìm `superpowers` → chọn `Install Plugin`.<br>**App:** Chọn Plugins trên thanh bên → mục Coding → bấm dấu `+` cạnh Superpowers. | Người dùng thao tác |
| **Antigravity** | Chạy lệnh:<br>`agy plugin install https://github.com/obra/superpowers` | Agent chạy sau khi được đồng ý (hoặc người dùng chạy) |
| Khác (Cursor, Copilot CLI, Droid...) | **Cursor:** gõ `/add-plugin superpowers`<br>**Copilot CLI:** `copilot plugin marketplace add obra/superpowers-marketplace` rồi `copilot plugin install superpowers@superpowers-marketplace`<br>**Droid:** `droid plugin marketplace add https://github.com/obra/superpowers` rồi `droid plugin install superpowers@superpowers` | Người dùng gõ |

Sau khi cài: Chạy lại `node <danh-method>/hooks/scripts/check-superpowers.mjs --json` và báo kết quả nguyên văn.

Mạng bị chặn / lỗi cài đặt: Báo đúng lỗi, chuyển sang làm theo quy trình cơ bản, không thử cách lách.

## Nếu người dùng từ chối

- Không hỏi lại trong cùng một phiên làm việc.
- Tiếp tục quy trình Danh Method tiêu chuẩn, dùng `execute-tasks` và `verify-kit` sẵn có.
- Báo cáo ghi: "Không dùng Superpowers (người dùng chọn bỏ qua; kỷ luật duy trì thủ công)".
