# danh-method

How Danh Nguyen (Head of Design, Bigin) leads AI agents so **a single designer can build a complete production product end-to-end** — distilled from shipping a real-world, production-grade product. Built for both Danh and junior designers/developers building new products.

**Cadence:** (Project kickoff: approved token playground G0) → Idea → Spec (PRD / Flow / Guidance / Tasks) → Real-component HTML preview → Approval (G1) → Contract prompt (G2) → Subagent execution (Design ‖ Logic → UI) → Read-only code review → Honest acceptance testing (Stage 6) → Owner approval (G3) → Merge.

## Installation

- **Claude Code:** `/plugin marketplace add danhatbigin/danh-method` then `/plugin install danh-method@danh-method` (private repo: requires GitHub authentication with read access).
- **Cowork:** Install the packaged `.plugin` archive from this repository.
- **Codex / Antigravity / AionUI:** See `portable/README.md`.

## Quick Start

1. Install the plugin and say: *"Setup dự án mới theo danh-method"* (or *"Set up a new project with danh-method"*) → `project-setup` scaffolds the spec repository, operator profile (designer/developer), and project config, then checks for companion plugins (`Superpowers` and `ui-ux-pro-max`) and asks permission before installing if missing.
2. *"Dựng trang token"* (or *"Build the token playground"*) → `design-tokens` scans installed UI packages, asks you to choose **one** UI library (`shadcn/ui` or `HeroUI`), verifies it is installed, and scaffolds an interactive **Token Playground** (inspired by `ui.shadcn.com/create`) rendered from real components with live AA contrast checks for Gate G0 approval.
3. First feature: *"Viết PRD cho feature X"* → `feature-spec`.
4. Approve the PRD → *"Subagent nha em"* → `subagent-orchestration` dispatches parallel `design-prototyper` ‖ `logic-implementer`, followed by `ui-implementer`, `code-reviewer`, and `acceptance-tester`.

## Skills

| Skill | When to use |
|---|---|
| `danh-method` | Entry point: philosophy, lifecycle, communication rules, two-axis source of truth, companion tools |
| `project-setup` | New project or onboarding a junior: spec repo, operator profile, project config, verify-kit |
| `design-tokens` | Stage 2: choose 1 UI library (`shadcn/ui` or `HeroUI`) → verify package gate → interactive token playground from real components (live controls, AA contrast, light/dark, CSS/JSON/MD export) → Gate G0 |
| `feature-spec` | Stages 1–3: PRD / USER_FLOW / GUIDANCE / TASKS, decision log + Q list, 3-step entry/task rule, 6×6 density |
| `design-prototype` | Real-component preview + offline MD/JSON token editor + provenance hashes; coordinator captures screenshots and writes REVIEW |
| `design-review` | Stages 5–6: UX audit, acceptance testing against a cloned DB, honest ACCEPTANCE report |
| `prompt-contract` | Master contract + delta / two-turn A/B prompts, takeover protocol, completion criteria, HANDOFF |
| `execute-tasks` | TDD/verify tiers, FAIL taxonomy & retry budget, takeover base, dedicated PR timeout, safe git & demo data |
| `subagent-orchestration` | Logic–UI handshake via pushed commit hash / C0 contract / file-glob ownership, single-writer takeover, TEAM-BOARD |
| `review-report` | Mechanism-first root-cause tracing, read-only diff review, Issue → Cause → Impact → Fix table |

## Subagents

`design-prototyper` · `logic-implementer` · `ui-implementer` · `code-reviewer` (read-only) · `acceptance-tester`.

> [!IMPORTANT]
> **Khuyến cáo sống còn (Strong Recommendation): Chỉ dùng Coordinator + Subagents, KHÔNG dùng Multi-Agents độc lập.**
> Tác giả repo này đã tốn hơn \$40 tiền API token chỉ để nhận ra bài học: thả cho các agent độc lập tự giao tiếp ngang hàng (peer-to-peer multi-agents) sẽ dẫn tới vòng lặp vô tận, lệch hợp đồng dữ liệu, xung đột ghi đè code và cháy sạch quota. Hãy luôn duy trì mô hình 1 Điều phối viên chính (Coordinator) giao việc cho các Subagent phạm vi hẹp có ranh giới glob cô lập và prompt hợp đồng chặt chẽ.

## Included Tooling & Companions

- **Companion plugin: Superpowers** (`obra/superpowers`, MIT). `check-superpowers` hook detects it at session start and asks permission before installing (Claude Code: `/plugin marketplace add obra/superpowers-marketplace` → `/plugin install superpowers@superpowers-marketplace`; Antigravity: `agy plugin install https://github.com/obra/superpowers`). Stage-to-skill mapping in `skills/danh-method/references/install-superpowers.md`.
- **Companion plugin: ui-ux-pro-max** (`nextlevelbuilder/ui-ux-pro-max-skill`, MIT). `check-uipro` hook detects it and asks permission with clear rationale before installing (Cowork: plugin card; Claude Code: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`; Codex/Antigravity: `uipro init`).
- **Automatic Stage Detection & Budget Subagent Proposal** (`skills/danh-method/scripts/detect-stage.mjs`): Auto-detects project stage from disk (Stages 0, 0.5, 1–3, 4A, 4B, 4C, 5, 6, COMPLETE) and proactively proposes subagent assignments with economical models (`flash` / `haiku` / `mini`) for user confirmation before spawning.
- **UI Package Gate & Token Playground** (`skills/design-tokens/scripts/check-ui-packages.mjs` & `scaffold-playground.mjs`): Enforces choosing strictly one UI library (`shadcn/ui` or `HeroUI`), inspects real installed components (including HeroUI v3 compound component anatomy and `@heroui/styles` variables), and scaffolds a live playground with color pickers, radius/font/spacing controls, live WCAG AA contrast, and CSS/JSON/Markdown export/import.
- **Appendix token table script** (`skills/design-tokens/scripts/render-token-page.mjs`): Generates a static reference table from CSS variables (supplementary appendix only; does not replace the real-component G0 playground).
- **`guard-git` Hook** (Claude Code): Blocks destructive git commands (`reset --hard`, `stash`, `clean -f`, force push, `checkout --`/`.`, `restore .`, branch deletion). Requires Node.
- **Verify-kit v1.1** (`skills/execute-tasks/assets/verify-kit`): Runs change-appropriate verification tiers; install via `node install.mjs <project>`.
- **Screen capture script** (`skills/design-prototype/scripts/capture-screens.mjs`): Captures `1440 / 768 / 390` × `light / dark` viewports and flags horizontal overflow. Requires Playwright.
- **Portable rules** (`portable/`): `AGENTS.md` and `GEMINI.md` for Codex, Antigravity, and AionUI.
- **Core 6-stage design workflow:** `skills/danh-method/references/design-workflow.md`.

## Notes

- **Strict Separation of Docs & Source:** All research notes (`research/`), product specs (`specs/`), prompts (`prompts/`), work logs (`log/`), and handoffs (`HANDOFF.md`) MUST live in a dedicated documentation directory (`docs/` or `<project>-spec`) outside the source code repository. Never commit research or project-management docs into the source repo.
- Skill instructions are written in Vietnamese for the team; skill `description` frontmatter is in English for reliable agent trigger matching.
- Stack-neutral architecture. Project-specific conventions (border rules, typography, allowed ports, chosen UI library) live in the target project's `process/project.md`.
- Version `0.4.0` · 2026-10-29.

## Changelog

### v0.4.0
- **Automatic Stage Detection & Proactive Subagent Budget Model Proposal:** `skills/danh-method/scripts/detect-stage.mjs` inspects real files and git status on disk to determine the current stage (0 to 6 and COMPLETE). The coordinator proactively presents a spawn proposal table with recommended budget models (`flash` / `haiku` / `mini`) and waits for user confirmation or model override before dispatching subagents (`skills/subagent-orchestration/references/spawn-proposal-template.md`).
- **Exclusive UI Package Gate (1 of 2):** `design-tokens` runs `scripts/check-ui-packages.mjs` to inspect the project (`shadcn/ui` `.tsx` files or `HeroUI` v2/v3 compound anatomy + `@heroui/styles`), prompts the user to choose **strictly one** UI library (`--ui shadcn` or `--ui heroui`, never both), and blocks token/preview generation until the chosen package is installed (`references/install-ui-packages.md`).
- **Interactive Token Playground (Gate G0):** `scripts/scaffold-playground.mjs --ui <shadcn|heroui>` scaffolds a `ui.shadcn.com/create`-style playground inside the project: left sidebar with color pickers, 5-shade primary preview, radius, font, light/dark/side-by-side mode, and spacing/shadow controls; right canvas rendering real `shadcn/ui` or `HeroUI` compound components with live AA contrast ratios and provenance-checked CSS/JSON/Markdown round-trip export/import. Demotes `render-token-page.mjs` to an optional reference appendix.
- **Superpowers Companion Integration:** SessionStart `check-superpowers` hook, single-turn permission prompt alongside `ui-ux-pro-max`, and stage-by-stage Superpowers workflow mapping (`skills/danh-method/references/install-superpowers.md`).

### v0.3.0
- Two-axis source of truth (facts vs. decisions); structured FAIL taxonomy with retry budget; takeover base preservation; dedicated PR timeout (`prTimeoutSec`); Gate G3 separated from Stage 6 acceptance.
- Parallel Logic ‖ UI handshake per pushed task commit hash, C0 anti-duplication API contract, explicit file-glob ownership, and templates B1–B11 (takeover, review, status, TEAM-BOARD, acceptance, demo data).
- Mandatory real-component prototypes with offline token parameter editor (`skills/design-prototype/scripts/attach-token-editor.mjs`), JSON/Markdown round-trip, and SHA-256 source provenance verification (`skills/design-prototype/references/component-rendering.md`).
- Coordinator-led screenshot capture and per-round `REVIEW.md`. Automated Node test suite (`node --test tests/*.test.mjs`).
