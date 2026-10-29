# danh-method

Cách Danh Nguyen (Head of Design, Bigin) dẫn dắt agent AI để **một designer tự build sản phẩm tới mức hoàn thiện** — rút từ dự án MiVida Portal (10/2026). Dùng cho chính anh và các bạn junior (designer hoặc dev) khi làm sản phẩm khác.

**Nhịp:** (đầu dự án: trang token được duyệt) → ý tưởng → tài liệu → preview HTML → duyệt → prompt hợp đồng → subagent thi hành → review chỉ đọc → nghiệm thu trung thực → merge.

## Cài

- Claude Code: `/plugin marketplace add danhatbigin/danh-method` rồi `/plugin install danh-method@danh-method` (repo private: máy cần đăng nhập GitHub có quyền đọc repo).
- Cowork: cài file `.plugin` đóng gói từ repo này.
- Codex / Antigravity / AionUI: xem `portable/README.md`.

Thư mục thêm: `research/` (khảo sát cách làm việc gốc, 22/10/2026), `examples/` (trang token MiVida mẫu).

## Bắt đầu

1. Cài plugin. Nói: *"Setup dự án mới theo danh-method"* → skill `project-setup` dựng repo spec, hồ sơ người làm (designer/dev) và config dự án; kiểm tra ui-ux-pro-max và xin phép cài nếu chưa có.
2. *"Dựng trang token"* → `design-tokens` chốt màu/font/bo góc, render trang HTML token có kiểm AA light/dark để duyệt (G0).
3. Feature đầu tiên: *"Viết PRD cho feature X"* → `feature-spec`.
4. Duyệt PRD → *"Subagent nha em"* → `subagent-orchestration` chạy design ‖ logic, rồi UI, review, nghiệm thu.

## Skills

| Skill | Dùng khi |
|---|---|
| `danh-method` | Cửa vào: triết lý, vòng đời, luật giao tiếp, nguồn sự thật, công cụ |
| `project-setup` | Dự án mới, junior mới: repo spec, operator profile, project config, verify-kit |
| `design-tokens` | Stage 2: chốt token, render trang HTML token (AA, light/dark), gate G0; dùng ui-ux-pro-max |
| `feature-spec` | Stage 1–3: PRD / USER_FLOW / GUIDANCE / TASKS, quyết định + Q, 3 bước, 6×6 |
| `design-prototype` | Stage 4: preview HTML + dev bar + ảnh 1440/768/390 sáng/tối + DESIGN-NOTES |
| `design-review` | Stage 5–6: audit UX, nghiệm thu trên DB bản sao, ACCEPTANCE trung thực |
| `prompt-contract` | Prompt hợp đồng: design / logic / UI / acceptance / fix / resume, HANDOFF |
| `execute-tasks` | Thi hành 1 task hoặc batch: TDD, verify theo tier, git an toàn, báo cáo |
| `subagent-orchestration` | Agent chính điều phối subagent theo bề mặt, reviewer chỉ đọc |
| `review-report` | Truy nguyên theo cơ chế, review diff, bảng issue → nguyên nhân → kết quả → giải pháp |

## Subagents

`design-prototyper` · `logic-implementer` · `ui-implementer` · `code-reviewer` (chỉ đọc) · `acceptance-tester`.

## Kèm theo

- **Plugin đi kèm: ui-ux-pro-max** (nextlevelbuilder, MIT). Không đóng gói sẵn; hook `check-uipro` nhắc khi máy chưa có, và skill hỏi xin phép + nêu lý do trước khi cài (Cowork: thẻ cài plugin; Claude Code: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`; Codex/Antigravity: `uipro init`).
- **Script trang token** (`skills/design-tokens/scripts/render-token-page.mjs`): CSS token → một trang HTML tự chứa.
- **Hook `guard-git`** (Claude Code): chặn `git reset --hard`, `stash`, `clean -f`, force push, `checkout --`/`.`, `restore .`, xoá nhánh. Cần Node.
- **Verify-kit v1.1** (`skills/execute-tasks/assets/verify-kit`): chạy đúng mức kiểm tra theo loại thay đổi; cài bằng `node install.mjs <project>`.
- **Script chụp ảnh** (`skills/design-prototype/scripts/capture-screens.mjs`): 1440/768/390 × light/dark + báo tràn ngang. Cần Playwright.
- **Bản portable** (`portable/`): `AGENTS.md`, `GEMINI.md` cho Codex, Antigravity, AionUI.
- Quy trình thiết kế gốc Stage 1–6: `skills/danh-method/references/design-workflow.md`.

## Ghi chú

- Nội dung skill viết tiếng Việt; mô tả skill tiếng Anh để agent nhận diện tốt.
- Stack trung lập; MiVida chỉ là ví dụ. Luật riêng của từng dự án (No Border, font, cổng…) đặt trong `process/project.md` của dự án đó.
- Phiên bản 0.2.0 · 29/10/2026 (thêm `design-tokens`, cơ chế xin phép cài ui-ux-pro-max).
