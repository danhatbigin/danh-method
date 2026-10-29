---
name: subagent-orchestration
description: Orchestrates a Danh Method feature from one main agent that dispatches subagents per surface (design-prototyper, logic-implementer, ui-implementer, code-reviewer, acceptance-tester) instead of running separate agent teams — writes each brief as a contract, assigns one branch/worktree and ownership per subagent, runs design and logic in parallel, keeps reviewers read-only, verifies results itself before reporting, and merges in a declared order. Use when someone says "subagent nha em", "chia agent", "chạy song song", "điều phối", "làm trọn feature", or when a feature has independent design/logic/UI work.
---

# Điều phối bằng subagent

Agent chính (phiên đang nói chuyện với người phụ trách sản phẩm) là **người điều phối** — vai "Cowork" ở MiVida: viết tài liệu, viết brief, giao việc, kiểm kết quả, báo cáo. Subagent làm việc tay chân trong phạm vi hẹp và trả kết quả về. Thay cho mô hình nhiều agent độc lập (AionUI teams) vốn tốn công đồng bộ.

## 1. Khi nào chia, khi nào không

Chia khi các phần **độc lập** (khác file, khác vùng sở hữu): design prototype ‖ logic; nhiều bề mặt UI không chung file; review song song với việc khác.

Không chia khi: các mục chạm cùng vùng code (sửa theo review → một agent tuần tự); việc chỉ vài lệnh; cần ngữ cảnh hội thoại liên tục. Không mở subagent chỉ để verify.

## 2. Vai subagent (định nghĩa trong `agents/` của plugin)

| Subagent | Làm | Không làm | Ghi được |
|---|---|---|---|
| `design-prototyper` | Prototype HTML + ảnh + DESIGN-NOTES | Code app, commit | `features/<f>/prototype`, `review-screens`, `DESIGN-NOTES.md` |
| `logic-implementer` | Schema, quyền, service, view model, test | UI mới | Worktree logic |
| `ui-implementer` | Giao diện theo preview đã duyệt | Đổi logic/quyền, đổi token | Worktree UI (hoặc cùng worktree sau khi logic xong) |
| `code-reviewer` | Đọc diff, tìm lỗi, báo cáo có mã | **Sửa code, checkout, commit, merge** | Chỉ file báo cáo review |
| `acceptance-tester` | Nghiệm thu trình duyệt trên DB bản sao | Sửa mã sản phẩm | `ACCEPTANCE-<ngày>.md`, ảnh bằng chứng |

## 3. Nhịp chuẩn một feature

```
PRD duyệt ──┬─> design-prototyper ──> (người phụ trách duyệt preview, G1)
            └─> logic-implementer ──> code-reviewer ──> sửa
                                   └─> ui-implementer (sau G1) ──> code-reviewer ──> sửa
                                                                └─> acceptance-tester ──> ACCEPTANCE
```

- Design và logic chạy **song song** ngay khi PRD duyệt.
- UI chỉ chạy sau G1 và khi logic đã có view model.
- Mỗi subagent làm xong → người điều phối **tự kiểm** trước khi báo: git log/diff thật, dòng `verify:` thật, ảnh có thật. Không chuyển lời subagent thành lời mình khi chưa kiểm.

## 4. Viết brief

Brief = prompt hợp đồng thu gọn (skill `prompt-contract`), theo `references/brief-template.md`. Subagent không có ngữ cảnh hội thoại: brief phải đủ đường dẫn, trạng thái thật, phạm vi, vùng sở hữu, điều kiện dừng, định dạng trả về. Lưu brief dài vào `prompts/` để agent khác (Codex, Antigravity) dùng lại được.

## 5. Ranh giới sở hữu & xung đột

- Mỗi subagent thi hành một nhánh/worktree; ghi rõ "Không đụng <vùng của subagent khác>".
- Hai subagent cần cùng file → không chạy song song; xếp tuần tự.
- Reviewer đọc bằng `git diff <base>..<head>` / `git show`, không checkout.
- Merge theo thứ tự đã định; subagent báo "Sẵn sàng để <nhánh đích> merge"; người điều phối merge (hoặc owner, theo luật nhánh) và chạy verify sau merge.
- Hạn mức: mỗi subagent một phạm vi vừa phải để tránh chạm limit giữa chừng; brief có lệnh "sắp hết hạn mức → HANDOFF + commit rồi dừng".

## 6. Khi subagent sai

- Làm sai task → `git revert` các commit đó (commit mới), viết lại brief chỉ rõ chỗ sai, giao lại. Không reset.
- Trả kết quả mâu thuẫn với PRD → không merge; ghi vào REVIEW và hỏi người phụ trách nếu là nghiệp vụ.
- Kết quả "PASS" không có bằng chứng → coi là chưa kiểm.

## 7. Báo người phụ trách sản phẩm

Sau mỗi mốc (không phải mỗi lần subagent trả về): 3–5 dòng — mốc nào xong, cần anh duyệt gì (preview link, Q), rủi ro. Định dạng bảng chi tiết dùng skill `review-report`.
