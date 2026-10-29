# Mẫu operator profile — `process/operator-<tên>.md`

> Mẫu gốc: `agent-rules-danh.md` của MiVida. File này **bổ sung** cho quy tắc chung của repo code (`AGENTS.md`, working-rules). Khác nhau thì: quy tắc repo thắng ở phần code, file này thắng ở cách làm việc với người này. **Không bao giờ commit file này vào repo code.**

```markdown
# Cách làm việc với <Tên> · <vai: designer | developer>

Áp dụng cho mọi agent (Claude, Codex, Antigravity, AionUI…) khi làm cho <Tên> trên dự án <Sản phẩm>.

## 1. Người này là ai
- Vai: <Designer phụ trách sản phẩm | Developer | Designer + dev>.
- Quyết: <sản phẩm/UX | kỹ thuật trong phạm vi nhánh được giao>.
- Owner kỹ thuật/merge: <vai trò>.

## 2. Giao tiếp
- Trả lời tiếng <Việt>, ngắn, đơn giản. Chữ trên UI: <English>.
<!-- KHỐI DESIGNER -->
- Không đưa lệnh terminal hay việc thủ công nhỏ. Agent tự chạy, tự xử lý lỗi môi trường.
- Báo theo những gì thấy trên màn hình; nêu bước tiếp theo; không giải thích lại việc đã xong.
<!-- KHỐI DEVELOPER -->
- Được nói kỹ thuật; vẫn tóm tắt hành vi người dùng thấy được trước chi tiết code.
- Được tự chạy lệnh trong phạm vi verify-kit; lệnh nặng vẫn phải xin grant.
<!-- CHUNG -->
- Trước quyết định lớn hoặc yêu cầu mơ hồ: hỏi trước, nêu lựa chọn và hệ quả. Câu hỏi phải nói rõ luồng nào, vấn đề gì.
- Thấy mâu thuẫn, lỗi, rủi ro (kể cả của chính agent) thì nói ngay.
- Tin nhắn soạn giùm gửi owner: ngắn, kiểu dev nói với dev.

## 3. Gate bắt buộc
- Tài liệu (PRD/USER_FLOW/TASKS) được duyệt trước khi code.
- Việc có UI: preview HTML được duyệt trước khi code UI.
- Duyệt xong chỉ làm đúng mục đã duyệt.

## 4. Nhánh & git
- Mỗi feature một nhánh từ `origin/main` mới nhất, chỉ khi `git status` sạch; tên nhánh lấy từ prompt, không có thì lấy tên thư mục feature.
- Cần code của nhánh chưa merge: dừng, báo "chờ owner merge" — trừ khi prompt ghi rõ tách từ nhánh nào; khi đó PR ghi "Depends on #n" và sau khi nhánh kia merge thì `git merge origin/main` (không rebase, không force push).
- PR draft ở lần push đầu; ready khi xong toàn bộ task. Owner review và merge.
- Không commit/push `main` của repo code, không force push, không xoá nhánh, không đóng/merge PR.
- Không reset/stash/clean việc dở. Sai thì `git revert` bằng commit mới.
- Không commit `CLAUDE.local.md`, `AGENTS.override.md`, `.env`, dump, `.verify/` (mode local).

## 5. Công cụ
- Design: ui-ux-pro-max tra cứu local; giữ design system đã chốt; không Superdesign; không ponytail cho design.
- Kiểm tra: theo `.verify/POLICY.md`; báo nguyên văn dòng `verify: …`.

## 6. Tài liệu
- Repo spec: <đường dẫn>. Người này và agent của họ sửa + push thẳng `main` của repo spec, thêm 1 dòng "Chưa release" vào CHANGELOG.
- Prompt lưu ở `prompts/YYYY-MM-DD-<chủ-đề>.md`.
- Không ghi tên người hay luật riêng vào repo code; dùng vai trò.

## 7. Ngoại lệ riêng của người này
- <ví dụ: máy Windows, dùng cmd cho npm; Playwright Chromium đã cài; cổng 3001/3002 là demo đang chạy, không đụng>
```

## Khác biệt khi junior là developer

- Bỏ khối "không đưa lệnh terminal".
- Thêm: "Trước khi code UI, mở preview đã duyệt và đối chiếu; không tự diễn giải thiết kế."
- Thêm: "Không tự đổi token/radius/font; mọi lệch so với preview ghi vào DESIGN-NOTES mục 'Khác preview' và hỏi người phụ trách sản phẩm."
