---
name: project-setup
description: Sets up a new product for the Danh Method — creates the spec repo skeleton (features/, prompts/, process/, audits/, CHANGELOG, README), a per-person operator profile (designer or developer), the project config, and local agent-rule pointer files. Use when starting a new product/client project, onboarding a junior ("setup cho đệ tử", "tạo hồ sơ"), or when no operator profile / project config exists yet.
---

# Project setup

Dựng nền để mọi skill danh-method chạy được. Làm một lần mỗi dự án, và một lần mỗi người.

## 1. Hỏi đủ, hỏi một lần

Dùng công cụ hỏi lựa chọn (AskUserQuestion nếu có). Gom thành một lượt:

- Tên sản phẩm, khách hàng, mô tả 1 câu vấn đề đang giải.
- Người làm: tên, vai (**designer** / **developer** / cả hai), ngôn ngữ trao đổi, có muốn agent tự chạy lệnh không.
- Repo code đã có chưa, nằm đâu; repo spec đặt ở đâu (mặc định cạnh repo code: `<tên>-spec`).
- Stack (framework, DB, test runner), thư viện UI mục tiêu (**chỉ chọn 1 trong 2**: `shadcn/ui` hoặc `HeroUI`, không dùng cả hai), file token.
- Owner kỹ thuật (vai trò, không cần tên), luật nhánh (mặc định: mỗi feature một nhánh từ `main`, PR draft).
- Công cụ agent đang dùng (Claude, Codex, Antigravity, AionUI…).

Thiếu câu trả lời nào ảnh hưởng cấu trúc thì ghi là *giả định* trong file, không tự quyết im lặng.

## 2. Tạo repo spec / thư mục `docs` (Tách biệt tuyệt đối Tài liệu và Source Code)

**Quy tắc cứng:** Toàn bộ tài liệu nghiên cứu (`research/`), PRD/spec (`features/`, `specs/`), nhật ký (`log/`), prompt (`prompts/`), `HANDOFF.md` bắt buộc đặt ở repo `<tên>-spec` hoặc thư mục `docs/` nằm **ngoài repo source code**. Tuyệt đối không để tài liệu nghiên cứu hay quản lý dự án lẫn trong repo source code (thêm `research/`, `docs/`, `HANDOFF*.md` vào `.gitignore` của repo code).

Theo `references/spec-repo-skeleton.md`. Kết quả tối thiểu:

```
<tên>-spec/
├── README.md            # mục lục + quy tắc repo
├── CHANGELOG.md         # mục "Chưa release"
├── process/
│   ├── project.md       # project config
│   ├── operator-<tên>.md
│   └── design-workflow.md  # chép từ danh-method/references
├── features/            # mỗi feature một thư mục
├── prompts/             # YYYY-MM-DD-<chủ-đề>.md
├── audits/
├── sources/             # chỉ đọc; bản mới thì thêm file mới có ngày
├── testing/
└── design-system/       # tokens.html (trang token đã duyệt, G0), TOKENS-NOTES.md
```

`git init` nếu chưa có; commit đầu "docs: bootstrap spec repo".

## 3. Operator profile

Viết `process/operator-<tên>.md` theo `references/operator-profile-template.md`. Chọn khối theo vai:

- **Designer:** không đưa lệnh terminal; báo theo màn hình; agent tự xử lý môi trường; gate preview bắt buộc.
- **Developer:** được nói kỹ thuật, được tự chạy lệnh; vẫn giữ gate tài liệu + preview cho việc có UI; vẫn verify theo tier.

## 4. Project config

Viết `process/project.md` theo `references/project-config-template.md`: đường dẫn repo, stack, thư viện UI mục tiêu (chỉ 1 trong 2: `shadcn/ui` hoặc `HeroUI`) + file token, lệnh kiểm tra, cổng dev được dùng / cấm đụng, luật nhánh, owner, ngôn ngữ UI, nơi để dữ liệu ngoài repo (dump, fixture).

## 5. File trỏ cục bộ trong repo code (không commit)

Trong repo code tạo 3 file trỏ về operator profile, và thêm chúng vào `.git/info/exclude`:

- `CLAUDE.local.md` (Claude Code), `AGENTS.override.md` (Codex), `GEMINI.md` (Antigravity) — nội dung: "Đọc `<đường dẫn spec>/process/operator-<tên>.md` và `process/project.md` trước mọi việc." Nếu `GEMINI.md` đã được track thì chỉ nhắc người dùng, không sửa.
- Với Codex/Antigravity/AionUI không cài được plugin: chép `portable/AGENTS.md` / `portable/GEMINI.md` của plugin vào repo spec `process/` và trỏ tới đó.

## 6. Verify-kit và runtime DB (khi đã có repo code)

1. Hỏi trước, rồi cài theo `execute-tasks/assets/verify-kit/README.md` ở mode `local` (không đụng file đang track). Chạy `node .verify/verify.mjs --doctor` và báo kết quả nguyên văn.
2. **Runtime DB do người dùng quyết, không đoán.** Lấy câu hỏi: `node .verify/verify-runtime.mjs --questions`. Hỏi người dùng (AskUserQuestion nếu có; designer thì nói bằng ngôn ngữ thường: "test có cần cơ sở dữ liệu thật không", "dữ liệu mẫu để ở đâu"…):
   - Test có cần DB thật không? (không → bỏ qua runtime)
   - DB chạy bằng gì: container Docker tạo/xoá mỗi lượt, DB có sẵn trên máy, hay dịch vụ từ xa?
   - Loại DB và image (nếu container).
   - Dữ liệu mẫu: file dump ngoài repo / script seed / không có — và tên biến môi trường chứa đường dẫn.
   - Tên biến môi trường chứa chuỗi kết nối (app, admin).
   - Mặc định mỗi lượt: khôi phục từ baseline (nhanh) hay archive thật (chậm, sát thực tế)?
   - File/thư mục nào đổi thì baseline phải dựng lại (migration, seed).
   - Trần thời gian cổng PR; nơi lưu profile thời gian (ngoài repo source).
3. Ghi câu trả lời ra JSON rồi `node .verify/verify-runtime.mjs --init <answers.json>` → `.verify/runtime.json`. Đồng bộ `db` trong `.verify/config.json` (`dumpEnv`, `urlEnvs`, `clientFrom`, `autoDetect`) và `timeoutSec` theo cùng câu trả lời. Ghi tóm tắt vào `process/project.md` §Kiểm tra.
4. Container cần `@testcontainers/postgresql` trong dự án: thiếu thì **xin phép** trước khi cài. Engine khác Postgres: dùng mode local/remote.
5. Thêm `.danh/` vào `.gitignore` của repo code (trạng thái spec-lock, track, nudge).

Lý do: mỗi dự án có cách dựng DB test khác nhau; đoán sai engine/nguồn dữ liệu sẽ cho ra ENV giả hoặc tệ hơn, chạy test trên dữ liệu không đúng.

## 7. Companion plugins (ui-ux-pro-max & Superpowers)

Chạy cả hai lệnh kiểm tra:
- `node <plugin>/hooks/scripts/check-uipro.mjs --json`
- `node <plugin>/hooks/scripts/check-superpowers.mjs --json`

Nếu thiếu một hoặc cả hai plugin:
- **Hỏi xin phép một lần duy nhất** (single question round, dùng AskUserQuestion nếu có). Nêu rõ lý do từng plugin:
  - `ui-ux-pro-max`: Gợi ý hệ màu/font theo loại sản phẩm, sinh token 3 lớp, soát token viết cứng, tra cứu UX (`design-tokens/references/install-ui-ux-pro-max.md`).
  - `Superpowers`: Kỷ luật thi hành (brainstorming trước spec, TDD, systematic-debugging, review và verify có bằng chứng) (`danh-method/references/install-superpowers.md`).
- Không tự ý cài khi chưa được đồng ý.
- Đồng ý: cài theo hướng dẫn từng môi trường trong file reference tương ứng, sau đó chạy lại script kiểm tra.
- Từ chối plugin nào: tiếp tục quy trình mà không có plugin đó, ghi chú vào báo cáo, không hỏi lại trong phiên.

## 8. Báo lại

3–5 dòng: repo spec ở đâu, hồ sơ của ai đã tạo, tình trạng companion plugins (ui-ux-pro-max, Superpowers), giả định nào cần duyệt, bước tiếp theo: `design-tokens` (dựng trang token, gate G0) rồi `feature-spec` cho feature đầu tiên.
