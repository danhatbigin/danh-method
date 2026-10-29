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
- Stack (framework, DB, test runner), design system (BigIn DS, NuxtUI, shadcn…, hay chưa có), file token.
- Owner kỹ thuật (vai trò, không cần tên), luật nhánh (mặc định: mỗi feature một nhánh từ `main`, PR draft).
- Công cụ agent đang dùng (Claude, Codex, Antigravity, AionUI…).

Thiếu câu trả lời nào ảnh hưởng cấu trúc thì ghi là *giả định* trong file, không tự quyết im lặng.

## 2. Tạo repo spec

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

Viết `process/project.md` theo `references/project-config-template.md`: đường dẫn repo, stack, design system + file token, lệnh kiểm tra, cổng dev được dùng / cấm đụng, luật nhánh, owner, ngôn ngữ UI, nơi để dữ liệu ngoài repo (dump, fixture).

## 5. File trỏ cục bộ trong repo code (không commit)

Trong repo code tạo 3 file trỏ về operator profile, và thêm chúng vào `.git/info/exclude`:

- `CLAUDE.local.md` (Claude Code), `AGENTS.override.md` (Codex), `GEMINI.md` (Antigravity) — nội dung: "Đọc `<đường dẫn spec>/process/operator-<tên>.md` và `process/project.md` trước mọi việc." Nếu `GEMINI.md` đã được track thì chỉ nhắc người dùng, không sửa.
- Với Codex/Antigravity/AionUI không cài được plugin: chép `portable/AGENTS.md` / `portable/GEMINI.md` của plugin vào repo spec `process/` và trỏ tới đó.

## 6. Verify-kit (khi đã có repo code)

Hỏi trước, rồi cài theo `execute-tasks/assets/verify-kit/README.md` ở mode `local` (không đụng file đang track). Chạy `node .verify/verify.mjs --doctor` và báo kết quả nguyên văn.

## 7. ui-ux-pro-max

Chạy `node <plugin>/hooks/scripts/check-uipro.mjs`. Chưa có → hỏi xin phép cài, nêu lý do, theo `design-tokens/references/install-ui-ux-pro-max.md`. Không tự cài.

## 8. Báo lại

3–5 dòng: repo spec ở đâu, hồ sơ của ai đã tạo, ui-ux-pro-max có chưa, giả định nào cần duyệt, bước tiếp theo: `design-tokens` (dựng trang token, gate G0) rồi `feature-spec` cho feature đầu tiên.
