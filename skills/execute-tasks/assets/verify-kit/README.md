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

## Nó hoạt động thế nào (v1.2)

1. **Quy tắc nằm trong repo**: `.verify/POLICY.md` + khối ngắn trong `CLAUDE.local.md` / `AGENTS.override.md` / `GEMINI.md` (hoặc `AGENTS.md`/`CLAUDE.md` ở mode shared). Agent nào mở repo cũng gặp, kể cả khi prompt giao nhầm.
2. **Script quyết định**: `node .verify/verify.mjs` đọc diff, xếp tier (skip / 0 UI thuần / 1 component có hành vi / 2 logic / 3 rủi ro cao), chạy đúng lệnh của tier, tier 0/1 dừng ở lỗi đầu tiên; tier ≥2 tiếp tục lint/test. Chỉ nâng tier được.
3. **Phạm vi theo task**: `--task-start` ghi mốc; `--files a,b` / `--files-from f` / `--base <commit>` để chỉ tính file của task, không dính việc của agent khác. `--task-end` xoá mốc.
4. **Full suite chỉ ở cổng PR**: tier 3 khi phát triển chạy kiểm tra có đích; `--pr` chạy bộ đầy đủ một lần; `--batch` (build), `--release`. Kiểm tra bảo mật (secret, `.env`, audit dependency, test auth/permission nếu cấu hình) luôn chạy.
5. **Trạng thái trung thực**: `PASS` / `FAIL` / `SKIPPED` / `NOT_CONFIGURED` / `PARTIAL` / `ENV` / `BLOCKED-SPEC`. Dòng cuối: `verify: tier N · STATUS · ... · security: STATUS`. Thiếu script/công cụ là NOT_CONFIGURED, không bao giờ báo xanh. Exit code: FAIL=1, NOT_CONFIGURED=3 (1 nếu `--strict`).
6. **Guard đa agent (rào cản, không phải khoá)**: lõi `--guard --agent <tên>` + adapter theo agent: Claude Code (hook, tự cài), Codex (`.codex/hooks.json`, tự cài, cần tin cậy một lần qua `/hooks`), aionrs (`node install.mjs --print-aionrs`, chưa tự cài), agent khác chỉ dựa vào quy tắc. AionUI không có điểm chặn trung tâm cho shell của mọi agent.
7. **Không còn bypass bằng chuỗi**: `!fulltest` / `VERIFY_ALLOW` đã bỏ. Muốn chạy lệnh nặng: người dùng bấm đúp `.verify/grant-fulltest.cmd` (hoặc `node .verify/verify.mjs --grant` ở terminal thật): có hạn, có nhật ký; agent không tự cấp được. `--revoke` để thu hồi.

Kiểm tra sức khoẻ cài đặt: `node .verify/verify.mjs --doctor`. Xem thử không chạy: `--classify` hoặc `--dry`.

## Chỉnh cho project

Sửa `.verify/config.json`: `rules` (glob → tier/kind, khớp đầu tiên thắng), `logicPatterns`, `tiers` (lệnh từng tier; `scoped` theo `when`/`re`; `inherit:false`), `batch`, `pr`, `release` (mỗi nhóm có `run` và tuỳ chọn `requiresDb: true`: mọi lệnh trong nhóm qua preflight DB/dump, thiếu thì ENV; `--release` không có `run` riêng thì chạy `pr.run` rồi `batch.run`, mỗi phần giữ cờ của nhóm mình), `security`, `guard` (`prOnly`, `minTier`), `taskMaxAgeHours`, `grantMaxMinutes`, `timeoutSec` (lệnh thường) và `prTimeoutSec` (mỗi lệnh ở `--pr`/`--release`, mặc định 900s), `db` (tên biến DB, xem v1.2). File không khớp rule nào mặc định tier 2. Có ví dụ trong `examples/`.

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

## Thay đổi v1.2

- SKIPPED trong kiểm tra không phải docs-only → PARTIAL (exit 4); ENV (exit 5), BLOCKED-SPEC (exit 6) không báo xanh. FAIL=1, NOT_CONFIGURED=3, PASS/SKIPPED docs-only=0.
- `areas: [{ name, sources: [glob], tests: [glob] }]` cộng test của vùng vào test khớp tên. `maxFiles` chia lô, chạy hết; mỗi lô in kết quả. Phạm vi `scoped.tests` vẫn xác định runner/relTo.
- `requiresDb: true` ở scoped/security check và ở nhóm `pr`/`batch`/`release` (áp cho mọi lệnh trong nhóm): kiểm file dump, URL, kết nối và SELECT 1 qua client pg của repo (không sửa DB); thiếu môi trường → ENV. Tên biến và vị trí client đặt ở `db` trong config (`dumpEnv`, `urlEnvs`, `clientFrom`, `autoDetect`), do `project-setup` hỏi người dùng; `dumpEnv: null` nếu dự án không dùng dump. Không in URL/dump.
- Tier ≥2 không fail-fast sau typecheck; tier 0/1 giữ nguyên. Diff spec ở tier ≥1 chạy tools/spec-guard.mjs nếu có.
- `knownFailures: [{ command: <lệnh chính xác>, match: <regex lỗi>, reference: <bằng chứng commit main> }]` báo SKIPPED/PARTIAL, không tính lượt sửa. Không tự coi mọi lỗi giống nhau là baseline; người duyệt duy trì danh sách có bằng chứng.
- `blockedSpec: [<đường dẫn SI open>]` giữ trạng thái BLOCKED-SPEC tới khi quyết định được thực hiện; không sửa test/manifest để làm xanh.
- Selftest: `node selftest.mjs`; chỉ repo git tạm và pg client giả, không app/DB. Cài nâng cấp: `node install.mjs <repo> --update --mode local`; thêm `--config examples/monorepo-postgres.json` khi cần áp areas (update mặc định giữ config cũ).

## Lịch sử sửa

- v1.2 (11/2026): lệnh gộp kiểu `pnpm check` ở `--pr`/`--batch`/`--release` qua preflight DB khi nhóm có `requiresDb`; `--release` dùng `pr.run` thì giữ cờ của `pr`. Config mẫu monorepo đặt `pr.requiresDb`, xếp `tools/**` vào tier 1 (sửa spec-guard chạy guard và selftest), chọn test trong `tests/spec/`. Selftest 24 ca, 3 ca chạy config mẫu qua `install.mjs`.
