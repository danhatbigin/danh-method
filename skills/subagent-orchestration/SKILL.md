---
name: subagent-orchestration
description: Orchestrates a Danh Method feature from one main agent that dispatches short-lived subagents (design-prototyper, test-translator, slice-implementer, ui-implementer, code-reviewer, acceptance-tester) instead of agent teams — picks the Light/Medium/Full track from the real diff, writes an AGENT-RUN contract with file allowlists, keeps Test / Fix / Review in independent contexts, freezes the candidate and runs the verifier as the single verify point, runs observe → diagnose → fix by root-cause group, and drives full-PR convergence review on the Full track before one owner review package. Use when someone says "subagent nha em", "chia agent", "chạy song song", "điều phối", "làm trọn feature", "chọn đường", "freeze", "agent run", or when a feature has independent design/logic/UI work.
---

# Điều phối bằng subagent

Agent chính (phiên đang nói chuyện với người phụ trách sản phẩm) là **người điều phối** — vai điều phối sản phẩm (Lead Coordinator): viết tài liệu, viết brief, giao việc, kiểm kết quả, báo cáo. Subagent làm việc tay chân trong phạm vi hẹp và trả kết quả về. Thay cho mô hình nhiều agent độc lập vốn tốn công đồng bộ.

> [!WARNING]
> **Khuyến cáo sống còn: Chỉ phát triển sản phẩm với Coordinator + Subagents ngắn hạn (ephemeral), KHÔNG dùng Multi-Agents.**  
> Kể cả khi chạy hệ thống multi-agents có orchestrator điều phối và phân chia role rõ ràng, thực tế vẫn **cực kỳ tốn kém và mất thời gian**. Người viết ra repo này đã phải trả giá hơn \$40 tiền API token và vô số giờ debug để nhận ra bài học: các agent duy trì session độc lập tự động chat/sync trạng thái sẽ làm phình to context theo cấp số nhân, trễ điều phối và cháy sạch quota. Mô hình tinh gọn duy nhất hiệu quả: 1 Coordinator điều phối các Subagent ngắn hạn (ephemeral), phạm vi hẹp cô lập theo glob, chạy model tiết kiệm (`flash` / `haiku` / `mini`), nộp bằng chứng xong là kết thúc ngay.

## 1. Khi nào chia, khi nào không

Chia khi các phần **độc lập** (khác file, khác vùng sở hữu): design prototype ‖ logic; nhiều bề mặt UI không chung file; review song song với việc khác.

Không chia khi: các mục chạm cùng vùng code (sửa theo review → một agent tuần tự); việc chỉ vài lệnh; cần ngữ cảnh hội thoại liên tục. Không mở subagent chỉ để verify.

## 2. Vai subagent (định nghĩa trong `agents/` của plugin)

| Subagent | Vai | Làm | Không làm | Ghi được |
|---|---|---|---|---|
| `design-prototyper` | Design | Renderer component thật + token controls + DESIGN-NOTES | Code app, chụp ảnh | `features/<f>/prototype`, `DESIGN-NOTES.md` |
| `test-translator` | **Test** | Dịch kịch bản đã duyệt → test khoá đỏ-trước + manifest | Mã sản phẩm | `tests/spec/**`, manifest (trong cửa sổ spec-lock) |
| `slice-implementer` | **Fix** | Trọn lát dọc DB → domain → action → UI (Vừa/Đủ) | Test khoá, manifest, budget, `.verify/` | Allowlist trong AGENT-RUN |
| `ui-implementer` | Fix (Nhẹ) | UI thuần theo preview G1 | Thêm/đổi đường ghi dữ liệu | Worktree UI |
| `code-reviewer` | **Review** | Review toàn PR theo bất biến, phản biện finding, tìm bỏ sót | **Sửa, checkout, commit, merge** | Chỉ báo cáo |
| `acceptance-tester` | Nghiệm thu | AC + kịch bản trên DB bản sao | Mã sản phẩm | `ACCEPTANCE-<ngày>.md`, ảnh |

**Điều phối** (agent chính): freeze, chạy verifier, giữ ledger, lập gói review; không tự quyết nghiệp vụ. Test / Fix / Review là **ba ngữ cảnh độc lập** (subagent context mới, chỉ cấp spec, quyết định, source và bằng chứng cần thiết; không kế thừa suy luận của Fix). Không tạo được ngữ cảnh độc lập → ghi BLOCKED ở bước review, không tự công nhận độc lập.

## 3. Nhịp chuẩn một feature

### 3.1 Chọn đường

Đọc `danh-method` §2.1. Khai đường đầu task vào `.danh/track.json` (`{"track":"Nhẹ|Vừa|Đủ","task":"…","declaredAt":"…"}`); lúc freeze chạy `node .verify/verify.mjs --classify`, nặng hơn thì nâng và làm bù. Hook `pipeline-nudge` nhắc khi chưa khai hoặc khai thấp.

| Bước | Nhẹ | Vừa | Đủ |
|---|---|---|---|
| Bất biến + bản đồ ghi | — | Nếu có ghi dữ liệu thì đã là Đủ | Bắt buộc, owner duyệt |
| Kịch bản + test khoá | — | Bắt buộc | Bắt buộc |
| AGENT-RUN | Ghi đường + dòng verify trong log | Phần Đầu vào + Review | Đầy đủ |
| Review | Không riêng | Một lượt toàn diff, độc lập | **Review hội tụ** (`review-report/references/review-convergence.md`) |
| Verify | Một lần cuối | Theo vùng một lần sau freeze | Theo vùng sau freeze + PR gate (full suite) |

### 3.2 Luồng (Vừa/Đủ)

```
PRD + GUIDANCE (bất biến) → SCENARIOS duyệt (PO / owner)
  ├─ design-prototyper → preview → G1
  └─ spec-lock --unlock → test-translator → manifest khoá → spec-lock --lock
→ AGENT-RUN → slice-implementer (Fix) → bàn giao full SHA
→ FREEZE (dừng writer) → điều phối chạy verifier → code-reviewer toàn PR
   ├─ lỗi code → ledger theo nhóm nguyên nhân → Fix cả nhóm → freeze lại
   ├─ chuẩn sai → Spec Issue → PO/owner quyết → test-translator dịch lại
   └─ (Đủ) 2 lượt sạch cùng commit → PR gate → nghiệm thu → gói review owner
```

- Không hai agent ghi cùng checkout. Agent không chạy full gate riêng; chỉ điều phối chạy verifier trên candidate đã freeze.
- **Nhận patch Fix:** đối chiếu diff với allowlist. Patch chạm test khoá/manifest/budget/verify config bị giữ lại để Test/owner quyết; không nhận nguyên patch rồi hợp thức hoá hash.
- Review chạy trên snapshot đã freeze; bất kỳ thay đổi đầu vào nào huỷ bằng chứng phụ thuộc và reset bộ đếm hội tụ.
- Mỗi subagent làm xong → điều phối **tự kiểm** (git log/diff, dòng `verify:` thật, ảnh thật) trước khi báo. Không chuyển lời subagent thành lời mình.

### 3.3 Quan sát → chẩn đoán → sửa (hệ thống có sẵn, hoặc sau review FAIL)

1. **Quan sát:** chốt HEAD/base, working tree, Spec SHA, kit/config. Một lượt kiểm theo vùng toàn diff + review toàn PR. **Không vá trong lúc thu bằng chứng.** ENV thì khắc phục rồi chạy lại, không gọi lỗi môi trường là lỗi sản phẩm.
2. **Chẩn đoán:** sổ lỗi (ledger) gộp compiler/lint/test/review/spec; phân ENV, FLAKY, PRE-EXISTING (có bằng chứng ở base), SPEC, TEST, CODE; nhóm theo nguyên nhân gốc, liệt kê mọi hàm/job/caller liên quan. Người chẩn đoán tách khỏi người sửa khi có thể; cùng người thì nói rõ giới hạn.
3. **Sửa:** mỗi nhóm một commit — nguyên nhân → mọi đường liên quan → test đỏ/xanh/mutation → bằng chứng. Không chạy tổng giữa từng nhóm. SPEC mở SI; mục độc lập tiếp tục.
4. **Xác nhận:** kiểm tổng theo vùng một lần sau các nhóm; PR gate trước ready.

Lý do: sửa từng finding rồi dừng sau một lần FAIL khiến agent dừng vì môi trường/lỗi vặt, đổi agent liên tục và mất bối cảnh bất biến; gom đủ rồi sửa theo nhóm thì một vòng đóng được cả loại lỗi.

Mẫu hợp đồng: `references/agent-run-template.md`.

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

## 8. Tích hợp, tiếp quản, hạn mức

- Một `slice-implementer` một lát: không còn bắt tay logic ‖ UI theo hash (v0.4). Lát lớn thì chia **theo lát dọc** (mỗi lát một nhóm kịch bản, glob không chồng), không chia theo tầng.
- Commit hợp đồng kiểu dữ liệu trước khi chia lát; không dùng stub trả dữ liệu giả trong production.
- Tiếp quản: một writer/worktree; bàn giao full SHA, diff/untracked, file đã đổi, phần chưa làm; tiếp quản dùng `--base <mốc tiếp nhận>`.
- Điều phối dùng model mạnh; `test-translator` và `slice-implementer` giữ model đủ mạnh; việc hẹp (prototype, nghiệm thu theo checklist) dùng model rẻ. Một tác vụ nặng tại một thời điểm.
- Hết quota: bàn giao vai điều phối bằng B1 (`references/coordination-templates.md`), giữ base/ledger, liệt kê bước tiếp.
- **Giới hạn thật:** allowlist và đối chiếu diff là kiểm soát tiếp nhận patch, không phải quyền hệ điều hành; sub-agent chung filesystem vẫn ghi được file ngoài nhiệm vụ. Ghi `policy-only` trong mỗi run. Nếu nhiệm vụ đòi cách ly cưỡng chế → BLOCKED ở gate đó tới khi có runner quyền riêng được owner duyệt.

## 9. Điều phối preview và vòng duyệt token (D1/D2 chốt 29/10)

Người điều phối chạy renderer component thật, kiểm hash nguồn/CSS/token; gắn bảng thông số nếu cần, chạy test prototype rồi chụp ảnh 1440/768/390 × light/dark và viết REVIEW R1…Rn. Agent design không chụp ảnh, không viết REVIEW thay điều phối. Đưa bản token MD/JSON xuất từ preview để người phụ trách duyệt; giao task cập nhật DS riêng sau duyệt, dựng lại token page/component preview và kiểm nơi dùng chung. Không dùng HTML dựng tay giả component thật.

## 10. Tự động nhận diện giai đoạn & Đề xuất Subagent kèm Model tiết kiệm

### Tự động nhận diện (detect-stage)
Trước khi quyết định hành động tiếp theo hoặc mở subagent, người điều phối chạy script kiểm tra trạng thái thực tế:
```bash
node skills/danh-method/scripts/detect-stage.mjs [--spec <thư-mục-docs>] [--code <thư-mục-code>] [--feature <tên>] [--json]
```
Script sẽ quét cây thư mục, file cấu hình, trạng thái PRD, prototype HTML, REVIEW G1, task hash và báo cáo nghiệm thu để trả về đúng giai đoạn hiện tại (Stage 0, 0.5, 1–3, 4A, 4B, 4C, 5, 6, COMPLETE).

### Giao thức Đề xuất Chủ động (Proactive Proposal Protocol)
**QUY TẮC BẮT BUỘC:** Người điều phối **KHÔNG BAO GIỜ** âm thầm gọi `invoke_subagent` hay dispatch subagent khi chưa có sự xác nhận của người dùng.

1. Khi `detect-stage.mjs` phát hiện cần chạy subagent (Stage 4A, 4C, 5, 6), người điều phối phải lập tức xuất bảng đề xuất theo mẫu `references/spawn-proposal-template.md`:
   - Liệt kê các subagent cần mở, tác vụ hẹp tương ứng và glob sở hữu cô lập.
   - Luôn đề xuất mặc định **model tiết kiệm** (`flash` / `haiku` / `mini`) cho subagent để tiết kiệm chi phí và hạn mức (quota).
   - Nêu rõ lý do chọn model (nhiệm vụ bounded, có prompt contract chặt chẽ, tuân thủ template).
2. Dừng turn và chờ người dùng phản hồi 1 trong 3 phương án:
   - **[1] Đồng ý**: Chấp thuận dispatch với model tiết kiệm đã đề xuất.
   - **[2] Chọn model khác**: Người dùng yêu cầu model mạnh (`pro` / `sonnet` / `inherit`) cho task khó hoặc khi cần phân tích sâu.
   - **[3] Chạy inline**: Không mở subagent, người điều phối tự tay thực hiện tuần tự trong phiên hiện tại.
3. Chỉ sau khi người dùng phản hồi chấp thuận, người điều phối mới sinh brief và gọi `invoke_subagent` với đúng model được duyệt.
