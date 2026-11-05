---
name: scenario-tests
description: Danh Method scenario → locked test step. Writes approved SCENARIOS (ID/version/source, business vs technical, PO vs technical owner approval) with visual sequence-diagram reviews, has an independent test-translator agent turn approved scenarios into red-first tests, locks them with a hash manifest (spec-guard), opens Spec Issues instead of ever editing a test to match code, and works with the guard-spec-tests hook and spec-lock window. Use when someone says "viết kịch bản", "scenario", "duyệt kịch bản", "dịch test", "spec test", "khoá test", "spec issue", "SI", "BLOCKED-SPEC", or when the pipeline-nudge hook reports approved scenarios without locked tests.
---

# Kịch bản → test khoá

**Nguyên lý:** agent không bao giờ làm cho test khớp với code. Khi test và code lệch, chỉ có hai lối ra: sửa code, hoặc báo ngược để người có thẩm quyền sửa chuẩn. Test được sinh lại từ chuẩn mới.

**Vì sao:** khi chưa có ranh giới giữa test thể hiện yêu cầu sản phẩm và test kỹ thuật, agent đang code sẽ nới thước đo của chính nó (nâng trần truy vấn, viết lại assertion "cho đúng", để lại assertion luôn đúng). Test xanh khi đó không chứng minh gì. Đồng thời chuẩn cũng không luôn đúng (quyết định đổi giữa chừng), nên cần một đường chính thức để đổi chuẩn.

Áp dụng: đường **Vừa** và **Đủ** khi feature có ghi dữ liệu, AC nghiệp vụ hoặc bất biến kỹ thuật. UI thuần (đường Nhẹ) không cần test khoá, giữ rẻ.

## 1. Hai loại test

| | Test khoá (spec test) | Test kỹ thuật (dev test) |
|---|---|---|
| Nguồn | Kịch bản đã duyệt: AC của PRD, bất biến, quyết định D-xx | Agent tự viết: unit, helper |
| Nơi ở | `tests/spec/**` (có thể lồng trong package) + `tests/spec-manifest.json` | Như thường lệ |
| Ai ghi | Chỉ `test-translator`, trong cửa sổ Test | Implementer |
| Đổi khi | Kịch bản lên version, có duyệt | Tự do |

## 2. Viết kịch bản (repo spec)

`features/<f>/SCENARIOS.md` theo `references/scenarios-template.md`. Bảng đầu file là **hợp đồng máy đọc** (spec-guard và hook đọc cột ID/Duyệt/v).

- ID dạng `<FEATURE>-<nguồn>-<nn>` (ví dụ `ORD-AC09-01`, `ORD-INV-02`).
- Loại **Nghiệp vụ** → người phụ trách sản phẩm (PO) duyệt. Loại **Kỹ thuật** (bất biến) → owner kỹ thuật duyệt. PO duyệt không suy ra owner đã duyệt; còn "chờ" là chưa duyệt.
- Viết bằng ngôn ngữ nghiệp vụ: Bắt đầu → Các bước → Kết quả quan sát được (cả trường hợp bị từ chối).
- Trình PO bằng **kịch bản trực quan** (`references/scenario-visual-template.md`): mỗi màn một kịch bản, sơ đồ trình tự, câu ngắn. PO đọc kịch bản, không cần đọc code. Kết quả duyệt phải ghi lại thành file; nút bấm chưa lưu không phải phê duyệt.
- Đổi kịch bản → tăng version, ghi link quyết định, duyệt lại.

## 3. Dịch thành test (trước khi implementer làm)

1. Điều phối mở cửa sổ Test: `node <plugin>/skills/scenario-tests/scripts/spec-lock.mjs --unlock <feature> --reason "<ID vN đã duyệt>" --minutes 60` (chạy trong repo code). Thêm `.danh/` vào `.gitignore` của repo code.
2. Giao `test-translator` (context mới, chỉ cấp kịch bản + giao diện/bất biến cần thiết; không cấp code đang sai để suy expected). Theo `references/translation-rules.md`:
   - Dòng đầu mỗi file: `// @spec <ID> v<version>`.
   - **Đỏ trước**: đỏ trên code chưa có tính năng; với hành vi đã có thì đỏ khi bỏ phần code bảo đảm hành vi đó (biến thể cô lập, không sửa assertion).
   - Không assertion luôn đúng; không dùng chạy song song/ngủ để chứng minh có khoá; quy mô đo dòng/bind/bytes.
3. Khoá: `node <plugin>/skills/scenario-tests/scripts/spec-guard.mjs --update <ID>` từng ID (cần repo spec: biến `SPEC_REPO` hoặc `../<repo>-spec`). Commit test + manifest. Rồi `spec-lock.mjs --lock`.
4. Đặt `tools/spec-guard.mjs` vào repo code (copy từ plugin) để verify-kit tự chạy guard khi diff chạm `tests/spec/**`. Nên bật CODEOWNERS + branch protection cho `tests/spec/**`: đó mới là khoá thật.

Implementer **đọc** được test (độc lập nằm ở người đặt chuẩn, không ở việc giấu bài), nhưng không ghi được.

## 4. Spec Issue: kênh báo ngược

Agent cho rằng test khoá sai → **không sửa**, tạo `features/<f>/spec-issues/SI-<n>.md` theo `references/spec-issue-template.md`:

| Loại | Nghĩa | Ai xử lý |
|---|---|---|
| (a) | Dịch sai: test không khớp chữ của kịch bản | Điều phối trả test-translator; kịch bản giữ nguyên |
| (b) | Kịch bản mâu thuẫn PRD/kịch bản khác | PO |
| (c) | PRD sai, lỗi thời, thiếu trường hợp | PO (bất biến kỹ thuật: owner) |
| (d) | Môi trường / dữ liệu test | Điều phối / môi trường |

- Mục đó mang trạng thái **BLOCKED-SPEC** trong dòng verify (`blockedSpec` trong `.verify/config.json`) và HANDOFF; không bao giờ thành PASS. Làm tiếp mục độc lập.
- Quyết định: *chuẩn đúng* → sửa code; *đổi PRD* → D-xx, kịch bản lên version, dịch lại; *PRD chưa rõ* → bổ sung rồi như trên.
- Đóng SI phải có link quyết định + commit test/manifest mới. Đếm SI loại (c) theo nhóm để biết phần PRD nào cần viết kỹ hơn.

## 5. Hook và trigger

- `guard-spec-tests` (PreToolUse): chặn Edit/Write/Bash ghi vào `tests/spec/**` và manifest khi cửa sổ Test đóng; khi chặn sẽ chỉ đường sửa code hoặc mở SI.
- `pipeline-nudge` (SessionStart, UserPromptSubmit): báo khi có kịch bản đã duyệt chưa có test khoá, hoặc có SI đang mở.

**Giới hạn thật (ghi trong mỗi run):** `policy-only`. Hash manifest phát hiện thay đổi chuẩn nhưng không chặn agent có quyền sửa cả test lẫn manifest; hook là rào giảm tốc; agent có shell vẫn tự mở cửa sổ được (mọi lần mở ghi `.danh/spec-lock.log`). Không tuyên bố chống sửa test tuyệt đối. Codex/Antigravity/AionUI không có hook: chỉ còn luật trong AGENTS.md/GEMINI.md + spec-guard khi verify + CODEOWNERS.

## 6. Checklist

- [ ] SCENARIOS có bảng máy đọc; mỗi dòng đúng người duyệt theo loại.
- [ ] Test-translator khác implementer; cửa sổ Test có lý do ghi ID/version.
- [ ] Mỗi test có header `@spec`, đã chứng minh đỏ trước, có assertion thật.
- [ ] Manifest cập nhật đúng từng ID; spec-guard PASS; cửa sổ đã khoá lại.
- [ ] SI mở được phản ánh là BLOCKED-SPEC, không biến mất khỏi báo cáo.
