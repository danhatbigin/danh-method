# Quy tắc kiểm tra (testing policy) · v1.1

Mục tiêu: chất lượng đủ, tốn ít nhất. **Script quyết định cần kiểm tra gì, không phải bạn.** Không cần đọc mã nguồn `verify.mjs`.

## Cách dùng

1. Bắt đầu task: `node .verify/verify.mjs --task-start` (ghi mốc để chỉ tính file của task này, không dính việc của agent khác).
2. Cuối task: `node .verify/verify.mjs`. Script đọc diff của task, nhận tier và chạy đúng bộ kiểm tra. Đây là kiểm tra duy nhất bạn chạy. Có thể chỉ định phạm vi: `--files a,b` / `--files-from list.txt` / `--base <commit>`.
3. Không tự chạy test, e2e, Playwright, build hay quét toàn site. Cần thêm thì để script yêu cầu hoặc xin người giao việc.
4. Cần chạy lệnh nặng hơn mức tier cho phép: dừng lại và **nhờ người giao việc** chạy `grant-fulltest` (bấm đúp `.verify/grant-fulltest.cmd`, hoặc `node .verify/verify.mjs --grant` trong terminal của họ). Agent không được tự cấp quyền, không thêm chuỗi/biến môi trường để lách; mọi cách đó bị chặn.
5. Prompt nói khác file này: file này thắng. Prompt gọi sai loại việc: kết quả của script (dựa trên diff) thắng.
6. Được nâng tier nếu thấy rủi ro cao hơn script nhận ra (`VERIFY_TIER=2` hoặc `--tier 2`). Không được hạ tier.

## Các tier

| Tier | Loại thay đổi | Kiểm tra khi phát triển |
|---|---|---|
| (skip) | Chỉ docs, prompt, file build sinh ra | Không chạy gì (trạng thái SKIPPED) |
| 0 | UI/design thuần: style, token, asset, markup không đổi logic | typecheck |
| 1 | Component có hành vi (state, handler, gọi dữ liệu) | + lint, + test của vùng bị đổi |
| 2 | Logic: lib, server, hook, test, repository, dữ liệu | + test liên quan (có phạm vi) |
| 3 | Rủi ro cao: DB/migration, auth, API, dependency, CI, Docker | Kiểm tra **có đích** cho vùng rủi ro + kiểm tra bảo mật bắt buộc |

**Full suite không chạy ở từng task.** Nó nằm ở cổng PR: `node .verify/verify.mjs --pr` (chạy một lần trước khi mở/merge PR, thường do CI hoặc người giao việc). Riêng kiểm tra bảo mật bắt buộc (quét secret, file `.env`, audit dependency khi đụng lockfile, test auth/permission nếu có cấu hình) chạy ngay ở mọi tier khi file liên quan bị đổi.

Lệnh cụ thể của từng tier nằm trong `.verify/config.json`. Xem thử: `node .verify/verify.mjs --classify`.

## Trạng thái (báo đúng nguyên văn)

Dòng cuối: `verify: tier N · STATUS · <đếm> · security: STATUS`.

- `PASS`: lệnh đã chạy và xanh.
- `FAIL`: lệnh đã chạy và đỏ. Phân loại trước khi sửa theo bảng dưới; chỉ lỗi code trong phạm vi tính lượt, tối đa một lần hoặc số lượt đã cấp; còn đỏ thì dừng và báo.
- `SKIPPED`: không có gì để chạy (docs-only) hoặc bị bỏ vì lệnh trước đã FAIL. **Không phải là đã kiểm tra.**
- `NOT_CONFIGURED`: thiếu script/công cụ để chạy kiểm tra này. **Không được báo là xanh**; báo cho người giao việc.

Không viết "đã test xong" khi có SKIPPED hoặc NOT_CONFIGURED.

## Ngân sách

- Không mở sub-agent chỉ để verify. Không khởi động lại dev server nhiều lần, không mở thêm cổng.
- Việc UI: xem giao diện tối đa 2 screenshot, chỉ các trang vừa sửa. Duyệt thiết kế là việc của người phụ trách.
- Việc UI thuần mà diff cho thấy file logic bị đụng ngoài ý muốn: hoàn tác phần đó hoặc báo ngay.
- Báo cáo cuối tối đa 5 dòng: file đã đổi, đổi gì, dòng `verify: ...`.

## Batch, PR, release

- `--batch`: gom nhiều task, thường là build một lần. Không chạy cho từng task nhỏ.
- `--pr`: full suite của repo, trước khi mở/merge PR.
- `--release`: trước deploy, thường do CI chạy.

## Rào chắn (guard) và độ phủ thật

Guard chặn lệnh test/build nặng khi tier chưa đủ. Nó là **rào cản tốc độ, không phải khoá an ninh**, và chỉ có tác dụng với agent có hook:

- Claude Code: hook PreToolUse (tự cài).
- Codex: `.codex/hooks.json` (tự cài, cần người dùng tin cậy hook một lần qua `/hooks`).
- aionrs (agent tích hợp của AionUI): `node install.mjs --print-aionrs` in đoạn cấu hình; chưa tự cài vì chưa xác minh đường dẫn.
- Gemini/Antigravity và agent khác: chỉ dựa vào khối quy tắc + script.

Guard không còn cơ chế bỏ qua bằng chuỗi tuỳ ý (`!fulltest`, `VERIFY_ALLOW`) trong lệnh. Cách duy nhất là `--grant` do người chạy trong terminal thật (có hạn, có nhật ký), và agent không tự gọi được.

## Khi quy tắc của repo nói khác

Nhiều repo ghi "typecheck + test + build phải xanh trước mỗi commit". Với tier 0 và 1, file này thay phần test/build đó bằng `node .verify/verify.mjs`; build dồn vào `--batch`/`--pr`. Các quy tắc khác của repo (nhánh, log, handoff, commit nhỏ) giữ nguyên.

## FAIL và tiếp quản (A5.1–A5.4)

| Loại FAIL | Xử lý | Tính lượt code |
|---|---|---|
| Hỏng thừa kế | Chứng minh tại base; commit riêng `broken since <hash>` nếu được giao sửa | Không |
| Test theo PRD cũ | Sửa test theo PRD hiện hành; comment mã quyết định | Không |
| PRD chưa nói | Dừng phần phụ thuộc, hỏi, cập nhật PRD rồi cấp lượt mới | Chờ chốt |
| Môi trường/cấu hình | Ghi lỗi nguyên văn, sửa trong quyền đã có | Không |
| Fixture lệch hợp đồng | Sửa fixture, giữ assertion | Không |
| Code trong phạm vi | Sửa theo ngân sách đã cấp | Có |

Ghi tên test + assertion + message nguyên văn, base, lệnh/log và lượt còn lại. Không đổi task/agent/phiên/base hay xoá log để lách; không skip test/hạ tier. Chưa có chứng cứ thì chưa phân loại. FAIL vẫn là FAIL và chặn merge-ready kể cả miễn lượt.

Tiếp quản: `--base <mốc tiếp nhận>` để không bỏ việc dở; không thay bằng task-start mới. `prTimeoutSec` là timeout riêng mỗi lệnh PR (mặc định 900s), `timeoutSec` cho lệnh thường. Biết suite vượt giới hạn thì báo owner, không chạy lại cùng cấu hình.
