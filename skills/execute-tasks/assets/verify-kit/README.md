# bigin-verify-kit

Bộ quy tắc + công cụ để agent (Claude, Codex, Gemini/Antigravity…) **chỉ chạy đúng mức kiểm tra mà loại thay đổi cần**: sửa UI thì kiểm tra nhẹ, đụng logic/DB/auth thì kiểm tra kỹ. Tiết kiệm usage mà không bỏ rủi ro thật.

## Cài vào một project (không cần biết code)

Thả cả thư mục `bigin-verify-kit` vào project (hoặc để cạnh project), rồi nói với agent:
**"Chạy node bigin-verify-kit/install.mjs"** — hoặc bấm đúp `install.cmd` trên Windows.

Muốn chỉ định project khác: `node install.mjs D:\Projects\ten-project`.

Installer tự nhận stack (Node/pnpm/npm/yarn, Flutter, hoặc repo chỉ có docs), tạo `.verify/`, chèn khối quy tắc vào file mà từng agent đọc, và cài hook chặn lệnh test nặng (Claude Code, Codex).

| Tuỳ chọn | Ý nghĩa |
|---|---|
| `--mode local` (mặc định) | Không sửa file nào đang được git theo dõi, không đụng `package.json`; mọi thứ nằm trong `.git/info/exclude` nên `git status` vẫn sạch. Phù hợp repo của team/owner khác. |
| `--mode shared` | Chèn khối vào `AGENTS.md`/`CLAUDE.md`, thêm script `verify`, hook vào `.claude/settings.json` để cả team dùng. Không tự commit. |
| `--preset node\|flutter\|docs` | Ép preset thay vì tự nhận. |
| `--config file.json` | Cấu hình riêng (xem `examples/`), có thể `extends` một preset. |
| `--worktrees` | Cài luôn vào mọi git worktree của repo. |
| `--update` | Cập nhật `verify.mjs`/`POLICY.md`, giữ nguyên `config.json` đã chỉnh. `--reset-config` để ghi đè config. |
| `--dry` | Chỉ in việc sẽ làm. |

## Nó hoạt động thế nào (v1.1)

1. **Quy tắc nằm trong repo**: `.verify/POLICY.md` + khối ngắn trong `CLAUDE.local.md` / `AGENTS.override.md` / `GEMINI.md` (hoặc `AGENTS.md`/`CLAUDE.md` ở mode shared). Agent nào mở repo cũng gặp, kể cả khi prompt giao nhầm.
2. **Script quyết định**: `node .verify/verify.mjs` đọc diff, xếp tier (skip / 0 UI thuần / 1 component có hành vi / 2 logic / 3 rủi ro cao), chạy đúng lệnh của tier, dừng ở lỗi đầu tiên. Chỉ nâng tier được.
3. **Phạm vi theo task**: `--task-start` ghi mốc; `--files a,b` / `--files-from f` / `--base <commit>` để chỉ tính file của task, không dính việc của agent khác. `--task-end` xoá mốc.
4. **Full suite chỉ ở cổng PR**: tier 3 khi phát triển chạy kiểm tra có đích; `--pr` chạy bộ đầy đủ một lần; `--batch` (build), `--release`. Kiểm tra bảo mật (secret, `.env`, audit dependency, test auth/permission nếu cấu hình) luôn chạy.
5. **Trạng thái trung thực**: `PASS` / `FAIL` / `SKIPPED` / `NOT_CONFIGURED`. Dòng cuối: `verify: tier N · STATUS · ... · security: STATUS`. Thiếu script/công cụ là NOT_CONFIGURED, không bao giờ báo xanh. Exit code: FAIL=1, NOT_CONFIGURED=3 (1 nếu `--strict`).
6. **Guard đa agent (rào cản, không phải khoá)**: lõi `--guard --agent <tên>` + adapter theo agent: Claude Code (hook, tự cài), Codex (`.codex/hooks.json`, tự cài, cần tin cậy một lần qua `/hooks`), aionrs (`node install.mjs --print-aionrs`, chưa tự cài), agent khác chỉ dựa vào quy tắc. AionUI không có điểm chặn trung tâm cho shell của mọi agent.
7. **Không còn bypass bằng chuỗi**: `!fulltest` / `VERIFY_ALLOW` đã bỏ. Muốn chạy lệnh nặng: người dùng bấm đúp `.verify/grant-fulltest.cmd` (hoặc `node .verify/verify.mjs --grant` ở terminal thật): có hạn, có nhật ký; agent không tự cấp được. `--revoke` để thu hồi.

Kiểm tra sức khoẻ cài đặt: `node .verify/verify.mjs --doctor`. Xem thử không chạy: `--classify` hoặc `--dry`.

## Chỉnh cho project

Sửa `.verify/config.json`: `rules` (glob → tier/kind, khớp đầu tiên thắng), `logicPatterns`, `tiers` (lệnh từng tier; `scoped` theo `when`/`re`; `inherit:false`), `batch`, `pr`, `release`, `security`, `guard` (`prOnly`, `minTier`), `taskMaxAgeHours`, `grantMaxMinutes`. File không khớp rule nào mặc định tier 2. Có ví dụ trong `examples/`.

## Giới hạn cần biết

- Guard chỉ có tác dụng với agent có hook; là rào cản tốc độ, không phải khoá an ninh.
- Hook Codex chưa kiểm chứng khi chạy dưới AionUI (approval never); cần người dùng tin cậy hook.
- Đường dẫn cấu hình hook của aionrs chưa xác minh nên không tự cài.
- Hai task song song sửa cùng một file thì không tách được.
- Heuristic dò logic trong file UI thiên về thận trọng (đổi `className` trên dòng có `onClick` có thể lên tier 1, vẫn rẻ).
- Các lệnh trong config mẫu (`pnpm check`, `pnpm db:test`, test bảo mật) cần được chạy thử thật trên máy dự án.
- Cần Node ≥ 18 và git.

## Gỡ bỏ

Xoá thư mục `.verify/`, các khối giữa `<!-- BEGIN:bigin-verify -->` và `<!-- END:bigin-verify -->`, entry hook trong `.claude/settings.local.json`, và các dòng dưới `# bigin-verify (local)` trong `.git/info/exclude`.
